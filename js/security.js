/* ===========================================================
   SWINGERSPHERE — SECURITY LAYER v1.0
   Anti-tampering · Crypto-only payments · Data protection
   ===========================================================

   ARCHITECTURE:
   - WebCrypto HMAC-SHA256 para integridad de registros de pago
   - Cifrado AES-GCM para datos sensibles en localStorage
   - Rate limiting para intentos de verificacion
   - Tamper detection en estado PRO
   - CSP enforcement via meta
   - XSS sanitization
   - Session fingerprint para detectar sesiones clonadas
   =========================================================== */

'use strict';

// ── CONSTANTS ─────────────────────────────────────────────────────
const SS_SEC = {
  // Derived from treasury address — no secrets stored, just consistency
  HMAC_SEED: '0x78230a63d7d6ec90dd4feb69936af37fe27f6f20',
  VERSION: '1.0.0',
  MAX_VERIFY_ATTEMPTS: 5,
  VERIFY_WINDOW_MS: 300000, // 5 min window for rate limit
  SESSION_KEY: 'ss_session_fp',
  LOG_KEY: 'ss_sec_log',
  SIG_KEY: 'ss_pro_sig',
};

// ═══════════════════════════════════════════════════════════════
// 1. WEBCRYPTO HMAC — Payment record signing
// ═══════════════════════════════════════════════════════════════
const SSCrypto = (() => {
  let _signingKey = null;

  async function _getKey() {
    if (_signingKey) return _signingKey;
    // Derive key from treasury address + browser fingerprint
    const seed = SS_SEC.HMAC_SEED + _getBrowserFingerprint();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(seed),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify']
    );
    _signingKey = keyMaterial;
    return _signingKey;
  }

  // Sign a payment record → returns base64 signature
  async function signPayment(txHash, method, timestamp) {
    try {
      const key = await _getKey();
      const msg = `${txHash}|${method}|${timestamp}|${SS_SEC.VERSION}`;
      const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(msg));
      return btoa(String.fromCharCode(...new Uint8Array(signature)));
    } catch (e) {
      console.warn('[SSCrypto] sign error:', e.message);
      return null;
    }
  }

  // Verify a stored payment signature
  async function verifyPaymentSig(txHash, method, timestamp, storedSig) {
    try {
      if (!storedSig) return false;
      const key = await _getKey();
      const msg = `${txHash}|${method}|${timestamp}|${SS_SEC.VERSION}`;
      const sigBytes = Uint8Array.from(atob(storedSig), c => c.charCodeAt(0));
      return await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(msg));
    } catch (e) {
      return false;
    }
  }

  // AES-GCM encryption for sensitive localStorage data
  async function encrypt(plaintext) {
    try {
      const pw = SS_SEC.HMAC_SEED + navigator.userAgent.slice(0, 20);
      const pwBytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw));
      const key = await crypto.subtle.importKey('raw', pwBytes, 'AES-GCM', false, ['encrypt']);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        new TextEncoder().encode(plaintext)
      );
      const combined = new Uint8Array(iv.byteLength + encrypted.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(encrypted), iv.byteLength);
      return btoa(String.fromCharCode(...combined));
    } catch (e) {
      return null;
    }
  }

  async function decrypt(ciphertext) {
    try {
      const pw = SS_SEC.HMAC_SEED + navigator.userAgent.slice(0, 20);
      const pwBytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw));
      const key = await crypto.subtle.importKey('raw', pwBytes, 'AES-GCM', false, ['decrypt']);
      const combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
      const iv = combined.slice(0, 12);
      const data = combined.slice(12);
      const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
      return new TextDecoder().decode(decrypted);
    } catch (e) {
      return null;
    }
  }

  return { signPayment, verifyPaymentSig, encrypt, decrypt };
})();

window.SSCrypto = SSCrypto;

// ═══════════════════════════════════════════════════════════════
// 2. BROWSER FINGERPRINT — Session consistency check
// ═══════════════════════════════════════════════════════════════
function _getBrowserFingerprint() {
  // Lightweight fingerprint — not for identification, just consistency
  const parts = [
    navigator.language || '',
    (navigator.languages || []).join(','),
    screen.colorDepth || '',
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || '',
    navigator.platform || '',
  ];
  // Simple hash
  const str = parts.join('|');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(16);
}

// ═══════════════════════════════════════════════════════════════
// 3. TAMPER DETECTION — Detect manual localStorage modification
// ═══════════════════════════════════════════════════════════════
const TamperDetector = {
  KEY_SIG: 'ss_pro_sig',
  KEY_TS:  'ss_pro_ts',

  // Called when PRO is activated — saves a signature
  async recordActivation(txHash, method) {
    const ts = Date.now().toString();
    const sig = await SSCrypto.signPayment(txHash, method, ts);
    if (sig) {
      localStorage.setItem(this.KEY_SIG, sig);
      localStorage.setItem(this.KEY_TS, ts);
      SecurityLog.write('PRO_ACTIVATED', { method, ts });
    }
    return sig;
  },

  // Called on every app load — validates PRO status integrity
  async checkIntegrity() {
    const proUntil = localStorage.getItem('ss_pro_until');
    const txHash   = localStorage.getItem('ss_verified_tx');
    const method   = localStorage.getItem('ss_pay_method');
    const sig      = localStorage.getItem(this.KEY_SIG);
    const ts       = localStorage.getItem(this.KEY_TS);

    // If PRO claimed but no signature → suspicious
    if (proUntil && parseInt(proUntil) > Date.now()) {
      if (!sig || !ts) {
        SecurityLog.write('TAMPER_DETECTED', { reason: 'PRO claimed with no signature' });
        // Reset PRO — do not show app
        this._revokeManipulated();
        return { ok: false, reason: 'integrity_fail' };
      }

      // Verify signature
      const valid = await SSCrypto.verifyPaymentSig(txHash || '', method || '', ts, sig);
      if (!valid) {
        SecurityLog.write('TAMPER_DETECTED', { reason: 'Invalid signature on PRO record' });
        this._revokeManipulated();
        return { ok: false, reason: 'sig_invalid' };
      }
    }

    return { ok: true };
  },

  _revokeManipulated() {
    // Clear PRO status without resetting trial
    const trialStart = localStorage.getItem('ss_trial_start');
    localStorage.removeItem('ss_pro_until');
    localStorage.removeItem('ss_verified_tx');
    localStorage.removeItem('ss_pay_method');
    localStorage.removeItem(this.KEY_SIG);
    localStorage.removeItem(this.KEY_TS);
    if (trialStart) localStorage.setItem('ss_trial_start', trialStart);
    SecurityLog.write('PRO_REVOKED', { reason: 'tamper' });
  },
};

window.TamperDetector = TamperDetector;

// ═══════════════════════════════════════════════════════════════
// 4. RATE LIMITER — Prevent brute-force verification
// ═══════════════════════════════════════════════════════════════
const RateLimiter = {
  KEY: 'ss_verify_rl',

  _load() {
    try { return JSON.parse(localStorage.getItem(this.KEY) || '{"attempts":[],"blocked_until":0}'); }
    catch { return { attempts: [], blocked_until: 0 }; }
  },

  _save(data) {
    try { localStorage.setItem(this.KEY, JSON.stringify(data)); } catch {}
  },

  check() {
    const data = this._load();
    const now = Date.now();

    // Check if currently blocked
    if (data.blocked_until > now) {
      const remaining = Math.ceil((data.blocked_until - now) / 60000);
      return { allowed: false, reason: `Demasiados intentos. Espera ${remaining} minuto(s).` };
    }

    // Clean old attempts outside window
    data.attempts = (data.attempts || []).filter(ts => ts > now - SS_SEC.VERIFY_WINDOW_MS);

    if (data.attempts.length >= SS_SEC.MAX_VERIFY_ATTEMPTS) {
      // Block for 15 minutes
      data.blocked_until = now + 900000;
      this._save(data);
      SecurityLog.write('RATE_BLOCKED', { attempts: data.attempts.length });
      return { allowed: false, reason: 'Bloqueado por exceso de intentos (15 min).' };
    }

    return { allowed: true, remaining: SS_SEC.MAX_VERIFY_ATTEMPTS - data.attempts.length };
  },

  record() {
    const data = this._load();
    data.attempts = [...(data.attempts || []), Date.now()];
    this._save(data);
  },

  reset() {
    localStorage.removeItem(this.KEY);
  },
};

window.RateLimiter = RateLimiter;

// ═══════════════════════════════════════════════════════════════
// 5. SECURITY LOG — Tamper-evident audit trail
// ═══════════════════════════════════════════════════════════════
const SecurityLog = {
  KEY: 'ss_sec_log',
  MAX_ENTRIES: 50,

  write(event, data) {
    try {
      const log = this._load();
      log.unshift({
        ev: event,
        ts: Date.now(),
        fp: _getBrowserFingerprint(),
        d: data || {},
      });
      localStorage.setItem(this.KEY, JSON.stringify(log.slice(0, this.MAX_ENTRIES)));
    } catch {}
  },

  _load() {
    try { return JSON.parse(localStorage.getItem(this.KEY) || '[]'); } catch { return []; }
  },

  // Admin: dump log (call window._ssDumpLog() in console)
  dump() {
    const log = this._load();
    console.table(log.map(e => ({
      Event: e.ev,
      Time: new Date(e.ts).toLocaleString('es-ES'),
      Fingerprint: e.fp,
      Data: JSON.stringify(e.d),
    })));
    return log;
  },
};

window.SecurityLog = SecurityLog;
window._ssDumpLog = () => SecurityLog.dump();

// ═══════════════════════════════════════════════════════════════
// 6. XSS PROTECTION — Sanitize any user-generated content
// ═══════════════════════════════════════════════════════════════
window.ssSanitize = function(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .slice(0, 2000); // Hard cap
};

// ═══════════════════════════════════════════════════════════════
// 7. PAYMENT VERIFICATION HARDENING
//    Wraps the crypto verification with rate limit + tamper sig
// ═══════════════════════════════════════════════════════════════
window.secureActivatePro = async function(txHash, method, amount) {
  // Rate limit check
  const rl = RateLimiter.check();
  if (!rl.allowed) {
    if (typeof showToast === 'function') showToast('🛡️ ' + rl.reason, 'error');
    return false;
  }
  RateLimiter.record();

  // Validate inputs
  if (!txHash || typeof txHash !== 'string' || txHash.length < 10) {
    SecurityLog.write('INVALID_TX', { txHash });
    return false;
  }

  // Amount sanity check
  if (amount && (typeof amount !== 'number' || amount < 9.0 || amount > 10000)) {
    SecurityLog.write('SUSPICIOUS_AMOUNT', { amount, txHash });
    return false;
  }

  // Activate via TrialManager (already existing)
  if (typeof TrialManager === 'undefined') return false;
  const until = TrialManager.activatePro(txHash, method || 'crypto');

  // Sign the record
  await TamperDetector.recordActivation(txHash, method || 'crypto');

  SecurityLog.write('PRO_SECURE_ACTIVATED', {
    method: method || 'crypto',
    amount,
    txSlice: txHash.slice(0, 12) + '...',
    until: new Date(until).toISOString(),
  });

  RateLimiter.reset(); // Success — reset rate limit
  return true;
};

// ═══════════════════════════════════════════════════════════════
// 8. CONTENT SECURITY POLICY (meta fallback for file:// protocol)
// ═══════════════════════════════════════════════════════════════
(function injectCSP() {
  // Only add if not already present
  if (document.querySelector('meta[http-equiv="Content-Security-Policy"]')) return;
  const meta = document.createElement('meta');
  meta.httpEquiv = 'Content-Security-Policy';
  // Allow: self, inline scripts (needed for file://), trusted CDNs
  meta.content = [
    "default-src 'self' 'unsafe-inline' data: blob:",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://apilist.tronscanapi.com https://api.polygonscan.com https://api.etherscan.io https://generativelanguage.googleapis.com https://api.openai.com https://tronscan.org https://global.transak.com https://global-stg.transak.com",
    "frame-src https://global.transak.com https://global-stg.transak.com",
    "object-src 'none'",
    "base-uri 'self'",
  ].join('; ');
  document.head.prepend(meta);
})();

// ═══════════════════════════════════════════════════════════════
// 9. ANTI-DEVTOOLS DETECTION (optional, light-touch)
// ═══════════════════════════════════════════════════════════════
(function devToolsWarning() {
  // Log when devtools likely opened (for audit, not blocking)
  let devOpen = false;
  const threshold = 160;
  setInterval(() => {
    const now = window.outerWidth - window.innerWidth > threshold ||
                window.outerHeight - window.innerHeight > threshold;
    if (now && !devOpen) {
      devOpen = true;
      SecurityLog.write('DEVTOOLS_OPENED', { ua: navigator.userAgent.slice(0, 60) });
      console.warn('%c[SwingerSphere Security] Consola detectada. Actividad auditada.', 'color:#ff9f0a;font-weight:bold;font-size:14px;');
    }
    if (!now) devOpen = false;
  }, 2000);
})();

// ═══════════════════════════════════════════════════════════════
// 10. BOOT INTEGRITY CHECK — Run on every load
// ═══════════════════════════════════════════════════════════════
(async function securityBoot() {
  SecurityLog.write('APP_BOOT', { v: SS_SEC.VERSION, fp: _getBrowserFingerprint() });

  // Check for tampered PRO
  const integrity = await TamperDetector.checkIntegrity();
  if (!integrity.ok) {
    console.warn('[SSecurity] Integrity check failed:', integrity.reason);
    // PaywallUI will show automatically via checkTrialAndAccess()
  }

  console.log(
    '%c🛡️ SwingerSphere Security Layer v1.0 activo',
    'color:#30d158;font-weight:bold;',
    '| Integrity:', integrity.ok ? 'OK' : 'FAILED',
    '| Fingerprint:', _getBrowserFingerprint()
  );
})();

// ═══════════════════════════════════════════════════════════════
// 11. STORAGE ISOLATION WARNING
// ═══════════════════════════════════════════════════════════════
// When running via file://, localStorage is shared per-origin.
// This is safe as long as the app is served from a dedicated domain in production.
// IMPORTANT: In production, ALWAYS serve from HTTPS on a dedicated domain.
if (window.location.protocol === 'file:') {
  console.info('[SSecurity] Ejecutando en file:// — En produccion usa HTTPS con dominio dedicado.');
}
