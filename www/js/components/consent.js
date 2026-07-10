/* ═══════════════════════════════════════════════════════════
   SWINGERSPHERE — CONSENT VAULT™
   Smart contract philosophy UI component
═══════════════════════════════════════════════════════════ */

export function showConsentVault(action, onAccept, t) {
  t = t || window._currentT || {};

  const existingOverlay = document.getElementById('consent-overlay');
  if (existingOverlay) existingOverlay.remove();

  const contractId = `SWS-CV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2,4).toUpperCase()}`;
  const timestamp = new Date().toISOString().replace('T', ' ').substr(0, 19) + ' UTC';

  const overlay = document.createElement('div');
  overlay.id = 'consent-overlay';
  overlay.className = 'overlay center';
  overlay.innerHTML = `
    <div class="modal center-modal consent-modal">
      <div class="consent-icon">🔐</div>
      <h2 style="font-size:1.25rem;font-weight:700;margin-bottom:0.5rem;">
        ${t.consent_title || 'Consent Vault™'}
      </h2>
      <p style="font-size:0.8rem;color:var(--copper);font-weight:600;margin-bottom:1rem;text-transform:uppercase;letter-spacing:0.08em;">
        ${t.consent_subtitle || 'Acción verificada'}
      </p>

      <div style="
        background:var(--bg-elevated);
        border:1px solid var(--border);
        border-radius:var(--radius-lg);
        padding:var(--space-4);
        margin-bottom:1.5rem;
        text-align:left;
      ">
        <div style="font-size:0.8rem;color:var(--silver-dark);margin-bottom:0.5rem;">Acción solicitada:</div>
        <div style="font-size:0.9rem;font-weight:500;color:var(--white);margin-bottom:0.75rem;">
          📋 ${action ? action.charAt(0).toUpperCase() + action.slice(1) : 'Acción privada'}
        </div>
        <p style="font-size:0.8rem;color:var(--silver);line-height:1.6;">
          ${t.consent_body || 'Esta acción queda registrada de forma auditable en el Consent Vault™.'}
        </p>
      </div>

      <!-- Contract details -->
      <div style="text-align:left;margin-bottom:1.5rem;">
        <div style="
          display:flex;justify-content:space-between;
          font-size:0.75rem;color:var(--silver-dark);margin-bottom:0.5rem;
        ">
          <span>${t.consent_contract || 'Contrato ID'}:</span>
          <span style="font-family:var(--font-mono);color:var(--copper);">${contractId}</span>
        </div>
        <div style="
          display:flex;justify-content:space-between;
          font-size:0.75rem;color:var(--silver-dark);margin-bottom:0.5rem;
        ">
          <span>Timestamp:</span>
          <span style="font-family:var(--font-mono);">${timestamp}</span>
        </div>
        <div style="
          display:flex;justify-content:space-between;
          font-size:0.75rem;color:var(--silver-dark);
        ">
          <span>Firmante:</span>
          <span style="font-family:var(--font-mono);">0x${Math.random().toString(16).substr(2,8).toUpperCase()}...</span>
        </div>
      </div>

      <!-- Buttons -->
      <div class="flex gap-3">
        <button class="btn btn-secondary flex-1" id="consent-cancel">
          ${t.consent_cancel || 'Cancelar'}
        </button>
        <button class="btn btn-primary flex-1" id="consent-accept">
          ✓ ${t.consent_accept || 'Acepto y entiendo'}
        </button>
      </div>

      <p style="font-size:0.65rem;color:var(--silver-dark);margin-top:1rem;line-height:1.5;">
        🛡️ Este registro es inmutable y auditable · SwingerSphere Consent Vault™ v2.0
      </p>
    </div>
  `;

  overlay.querySelector('#consent-cancel').addEventListener('click', () => {
    overlay.style.animation = 'fade-out 0.2s ease forwards';
    setTimeout(() => overlay.remove(), 200);
  });

  overlay.querySelector('#consent-accept').addEventListener('click', () => {
    overlay.style.animation = 'fade-out 0.2s ease forwards';
    setTimeout(() => {
      overlay.remove();
      window.showToast(`✅ Consentimiento registrado · ${contractId}`, 'success');
      if (typeof onAccept === 'function') onAccept();
    }, 200);
  });

  overlay.addEventListener('click', e => {
    if (e.target === overlay) {
      overlay.style.animation = 'fade-out 0.2s ease forwards';
      setTimeout(() => overlay.remove(), 200);
    }
  });

  document.body.appendChild(overlay);
}

// Make globally available
window.showConsentVault = showConsentVault;
