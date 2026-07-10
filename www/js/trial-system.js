/* ═══════════════════════════════════════════════════════════════════
   SWINGERSPHERE — TRIAL & PAYMENT SYSTEM v5.0
   TRANSAK fiat→crypto bridge + direct crypto
   ═══════════════════════════════════════════════════════════════════
   El usuario paga con tarjeta via Transak → Transak convierte a
   USDT/USDC y lo envia directamente a nuestra wallet.
   TODO llega en crypto. El usuario no necesita saber nada de crypto.
   ═══════════════════════════════════════════════════════════════════ */

'use strict';

var TRIAL_CONFIG = {
  TRIAL_DAYS: 7,
  PRICE_EUR: 10,
  PRICE_CRYPTO: 10,
  SUBSCRIPTION_DAYS: 30,

  // ═══ TRANSAK CONFIG ═══
  // Registrate gratis en transak.com/dashboard → copia tu API key
  TRANSAK_API_KEY: 'YOUR_TRANSAK_API_KEY',
  TRANSAK_ENV: 'PRODUCTION', // 'STAGING' para pruebas

  // ═══ CRYPTO WALLETS ═══
  TREASURY_EVM:  '0x78230a63d7d6ec90dd4feb69936af37fe27f6f20',
  TREASURY_TRON: 'TRTrwHewJbj3sm28hL4ita29HT43AEWAfC',
  USDC_POLYGON:  '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
  USDC_ERC20:    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  MIN_AMOUNT: 9.5,
  POLL_MS: 15000,
};

// ── TRIAL MANAGER ────────────────────────────────────────────────
var TrialManager = {
  KEY_START:'ss_trial_start', KEY_PRO:'ss_pro_until', KEY_REF:'ss_pay_ref',
  KEY_TX:'ss_verified_tx', KEY_METHOD:'ss_pay_method',

  getTrialRemaining: function() {
    var s = parseInt(localStorage.getItem(this.KEY_START)||'0');
    return s ? (s + TRIAL_CONFIG.TRIAL_DAYS*86400000) - Date.now() : null;
  },
  getProRemaining: function() { return Math.max(0, parseInt(localStorage.getItem(this.KEY_PRO)||'0') - Date.now()); },
  getStatus: function() {
    if (this.getProRemaining() > 0) return {type:'pro',ok:true};
    var tr = this.getTrialRemaining();
    if (tr === null) return {type:'new',ok:true};
    if (tr > 0) return {type:'trial',ok:true,remaining:tr};
    return {type:'expired',ok:false};
  },
  initTrial: function() { if (!localStorage.getItem(this.KEY_START)) localStorage.setItem(this.KEY_START, Date.now().toString()); },
  activatePro: function(ref, method) {
    var until = Date.now() + TRIAL_CONFIG.SUBSCRIPTION_DAYS*86400000;
    localStorage.setItem(this.KEY_PRO, until.toString());
    localStorage.setItem(this.KEY_TX, ref||'manual');
    localStorage.setItem(this.KEY_METHOD, method||'unknown');
    return until;
  },
  getPayRef: function() {
    var ref = localStorage.getItem(this.KEY_REF);
    if (!ref) { var c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; ref='SWS-'; for(var i=0;i<6;i++) ref+=c[Math.floor(Math.random()*c.length)]; localStorage.setItem(this.KEY_REF, ref); }
    return ref;
  },
};

// ── TRANSAK INTEGRATION ──────────────────────────────────────────
var TransakBridge = {

  // Opens Transak widget — user pays with card, Transak sends crypto to our wallet
  openWidget: function(network) {
    network = network || 'tron';
    var base = TRIAL_CONFIG.TRANSAK_ENV === 'STAGING'
      ? 'https://global-stg.transak.com'
      : 'https://global.transak.com';

    var params = {
      apiKey: TRIAL_CONFIG.TRANSAK_API_KEY,
      defaultFiatAmount: TRIAL_CONFIG.PRICE_EUR,
      fiatCurrency: 'EUR',
      disableWalletAddressForm: true,
      hideMenu: true,
      themeColor: 'c4813a',
      exchangeScreenTitle: 'SwingerSphere PRO',
    };

    // Configure per network
    if (network === 'tron') {
      params.cryptoCurrencyCode = 'USDC';
      params.network = 'tron';
      params.walletAddress = TRIAL_CONFIG.TREASURY_TRON;
    } else if (network === 'polygon') {
      params.cryptoCurrencyCode = 'USDC';
      params.network = 'polygon';
      params.walletAddress = TRIAL_CONFIG.TREASURY_EVM;
    } else {
      params.cryptoCurrencyCode = 'USDC';
      params.network = 'ethereum';
      params.walletAddress = TRIAL_CONFIG.TREASURY_EVM;
    }

    // Build URL
    var url = base + '/?';
    var parts = [];
    for (var k in params) { parts.push(k + '=' + encodeURIComponent(params[k])); }
    url += parts.join('&');

    // Open in popup or modal
    var w = Math.min(450, window.innerWidth - 40);
    var h = Math.min(700, window.innerHeight - 60);
    var left = (window.innerWidth - w) / 2;
    var top = (window.innerHeight - h) / 2;

    var popup = window.open(url, 'transak', 'width='+w+',height='+h+',left='+left+',top='+top+',toolbar=no,menubar=no');

    if (!popup || popup.closed) {
      // Popup blocked — show inline
      TransakBridge.showInlineWidget(url);
    } else {
      // Start polling blockchain after opening Transak
      startPaywallPolling();
      showToast('Completa el pago en la ventana de Transak', 'copper');
    }
  },

  showInlineWidget: function(url) {
    document.getElementById('transak-inline-ov')?.remove();
    var ov = document.createElement('div');
    ov.id = 'transak-inline-ov';
    ov.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(6,6,8,0.95);display:flex;align-items:center;justify-content:center;padding:1rem;';

    var wrap = document.createElement('div');
    wrap.style.cssText = 'background:#111318;border:1px solid rgba(196,129,58,0.3);border-radius:20px;overflow:hidden;width:100%;max-width:420px;height:85vh;display:flex;flex-direction:column;';

    var hdr = document.createElement('div');
    hdr.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:0.75rem 1rem;border-bottom:1px solid rgba(255,255,255,0.08);';
    hdr.innerHTML = '<span style="font-weight:700;font-size:0.85rem;">💳 Pagar con tarjeta via Transak</span>';
    var closeBtn = document.createElement('button');
    closeBtn.style.cssText = 'background:none;border:none;color:#aeaeb2;cursor:pointer;font-size:1.1rem;padding:4px;';
    closeBtn.textContent = '\u2715';
    closeBtn.onclick = function(){ ov.remove(); };
    hdr.appendChild(closeBtn);

    var iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.style.cssText = 'flex:1;border:none;width:100%;';
    iframe.allow = 'camera;microphone;payment';

    wrap.appendChild(hdr);
    wrap.appendChild(iframe);
    ov.appendChild(wrap);
    ov.onclick = function(e){ if(e.target===ov) ov.remove(); };
    document.body.appendChild(ov);

    // Start polling
    startPaywallPolling();
  },
};

// ── BLOCKCHAIN VERIFIER ──────────────────────────────────────────
var PaymentVerifier = {
  _polling: null,

  checkTron: async function() {
    try {
      var r = await fetch('https://apilist.tronscanapi.com/api/token_trc20/transfers?toAddress='+TRIAL_CONFIG.TREASURY_TRON+'&limit=20&start=0', {signal:AbortSignal.timeout(8000)});
      var d = await r.json();
      var cut = Date.now() - 3600000;
      var txs = d.token_transfers || [];
      for (var i=0; i<txs.length; i++) {
        var tx = txs[i];
        var a = parseFloat(tx.quant||0)/1e6;
        if ((tx.block_ts||0) > cut && a >= TRIAL_CONFIG.MIN_AMOUNT)
          return {hash:tx.transaction_id, amount:a, chain:'Tron USDT'};
      }
    } catch(e) {}
    return null;
  },

  checkEVM: async function(chain) {
    try {
      var ct = chain==='polygon' ? TRIAL_CONFIG.USDC_POLYGON : TRIAL_CONFIG.USDC_ERC20;
      var base = chain==='polygon' ? 'https://api.polygonscan.com' : 'https://api.etherscan.io';
      var api = base+'/api?module=account&action=tokentx&address='+TRIAL_CONFIG.TREASURY_EVM+'&contractaddress='+ct+'&sort=desc&apikey=YourApiKeyToken';
      var r = await fetch(api, {signal:AbortSignal.timeout(8000)});
      var d = await r.json();
      if (d.status !== '1') return null;
      var cut = Math.floor((Date.now()-3600000)/1000);
      var txs = d.result || [];
      for (var i=0; i<txs.length; i++) {
        var tx = txs[i];
        var a = parseFloat(tx.value||0) / Math.pow(10, parseInt(tx.tokenDecimal||6));
        if (parseInt(tx.timeStamp||0) > cut && a >= TRIAL_CONFIG.MIN_AMOUNT)
          return {hash:tx.hash, amount:a, chain: chain==='polygon' ? 'Polygon USDC' : 'Ethereum USDC'};
      }
    } catch(e) {}
    return null;
  },

  verifyTxHash: async function(txHash) {
    txHash = (txHash||'').trim();
    if (!txHash) return {ok:false, error:'Introduce el hash de la transaccion'};
    if (window.RateLimiter) { var rl = RateLimiter.check(); if (!rl.allowed) return {ok:false, error:rl.reason}; RateLimiter.record(); }

    if (/^[0-9a-fA-F]{64}$/.test(txHash)) {
      try {
        var r = await fetch('https://apilist.tronscanapi.com/api/transaction-info?hash='+txHash, {signal:AbortSignal.timeout(10000)});
        var d = await r.json();
        if (d && d.contractRet === 'SUCCESS') {
          var det = (d.trc20TransferInfo||[])[0];
          var amt = det ? parseFloat(det.amount_str||'0')/1e6 : 0;
          if (det && (det.to_address||'').toLowerCase() === TRIAL_CONFIG.TREASURY_TRON.toLowerCase() && amt >= TRIAL_CONFIG.MIN_AMOUNT)
            return {ok:true, hash:txHash, amount:amt, chain:'Tron USDT'};
          return {ok:false, error:'Importe ('+amt+') o destino no coincide.'};
        }
      } catch(e) {}
      return {ok:false, error:'No verificado en TronScan.'};
    }

    if (/^0x[0-9a-fA-F]{64}$/.test(txHash)) {
      var chains = ['polygon','eth'];
      for (var ci=0; ci<chains.length; ci++) {
        var ch = chains[ci];
        try {
          var base2 = ch==='polygon' ? 'https://api.polygonscan.com' : 'https://api.etherscan.io';
          var api2 = base2+'/api?module=proxy&action=eth_getTransactionByHash&txhash='+txHash+'&apikey=YourApiKeyToken';
          var r2 = await fetch(api2, {signal:AbortSignal.timeout(8000)});
          var d2 = await r2.json();
          if (d2.result && d2.result.to && d2.result.to.toLowerCase() === TRIAL_CONFIG.TREASURY_EVM.toLowerCase())
            return {ok:true, hash:txHash, amount:TRIAL_CONFIG.PRICE_CRYPTO, chain: ch==='polygon' ? 'Polygon USDC' : 'Ethereum USDC'};
        } catch(e) {}
      }
      return {ok:false, error:'TX no encontrado en Polygon ni Ethereum.'};
    }
    return {ok:false, error:'Formato no reconocido.'};
  },

  startPolling: function(onSuccess, onProgress) {
    this.stopPolling();
    var self = this;
    var poll = async function() {
      if (onProgress) onProgress('Verificando blockchain...');
      var results = await Promise.allSettled([self.checkTron(), self.checkEVM('polygon'), self.checkEVM('eth')]);
      for (var i=0; i<results.length; i++) {
        if (results[i].status === 'fulfilled' && results[i].value) { self.stopPolling(); if (onSuccess) onSuccess(results[i].value); return; }
      }
      if (onProgress) onProgress('Esperando confirmacion... (cada 15s)');
    };
    poll();
    this._polling = setInterval(poll, TRIAL_CONFIG.POLL_MS);
  },

  stopPolling: function() { if (this._polling) { clearInterval(this._polling); this._polling = null; } },
};

// ── PAYWALL UI v5 — Transak + Crypto ─────────────────────────────
var PaywallUI = {
  _el: null,

  show: function(status) {
    this.hide();
    TrialManager.initTrial();
    var ref = TrialManager.getPayRef();
    var expired = (status||{}).type === 'expired';

    var ov = document.createElement('div');
    ov.id = 'ss-paywall';
    ov.style.cssText = 'position:fixed;inset:0;z-index:88888;background:rgba(6,6,8,0.97);backdrop-filter:blur(24px);display:flex;align-items:flex-start;justify-content:center;padding:1rem;overflow-y:auto;';
    var w = document.createElement('div');
    w.style.cssText = 'background:linear-gradient(135deg,#111318,#0d1520);border:1px solid rgba(196,129,58,0.3);border-radius:24px;padding:1.5rem;max-width:420px;width:100%;margin:auto;box-shadow:0 0 80px rgba(196,129,58,0.08);';
    w.innerHTML = this._buildHTML(expired, ref);
    ov.appendChild(w);
    document.body.appendChild(ov);
    this._el = ov;
  },

  hide: function() { PaymentVerifier.stopPolling(); if(this._el){this._el.remove();this._el=null;} var old=document.getElementById('ss-paywall'); if(old) old.remove(); },

  _buildHTML: function(expired, ref) {
    var freeCount = parseInt(localStorage.getItem('ss_free_count') || '487');
    var promoHTML = freeCount < 500 ? 
      '<div style="background:linear-gradient(135deg,rgba(196,129,58,0.2),rgba(196,129,58,0.05));border:1px solid var(--copper-border);border-radius:14px;padding:0.875rem;text-align:center;box-shadow:0 0 10px rgba(196,129,58,0.15);margin-bottom:1rem;">' +
        '<div style="font-size:0.58rem;color:var(--copper);font-weight:800;text-transform:uppercase;letter-spacing:1px;margin-bottom:0.15rem;">🎁 Promoción de Lanzamiento</div>' +
        '<div style="font-size:0.75rem;font-weight:700;color:#fff;margin-bottom:0.35rem;">¡Gratis de por vida para los primeros 500 socios!</div>' +
        '<div style="display:flex;justify-content:space-between;font-size:0.58rem;color:#aeaeb2;margin-bottom:0.2rem;">' +
          '<span>Plazas reservadas: <strong>' + freeCount + ' / 500</strong></span>' +
          '<span style="color:#ff9f0a;font-weight:700;">¡Quedan ' + (500 - freeCount) + ' plazas!</span>' +
        '</div>' +
        '<div style="width:100%;height:6px;background:rgba(255,255,255,0.08);border-radius:9999px;overflow:hidden;margin-bottom:0.75rem;border:1px solid rgba(255,255,255,0.04);">' +
          '<div style="width:' + ((freeCount/500)*100) + '%;height:100%;background:linear-gradient(90deg,var(--copper),#ff9f0a);border-radius:9999px;"></div>' +
        '</div>' +
        '<button onclick="activateFreeProFromPaywall()" style="width:100%;padding:0.65rem;font-size:0.78rem;font-weight:700;background:linear-gradient(135deg,var(--copper),#d4974a);border:none;border-radius:9px;color:#fff;cursor:pointer;box-shadow:0 2px 8px rgba(196,129,58,0.2);">🎁 Activar mi cuenta PRO gratis</button>' +
      '</div>' : '';

    return '' +
    // Header Banner
    '<div style="position:relative;width:100%;height:140px;border-radius:18px;overflow:hidden;margin-bottom:1.25rem;border:1px solid rgba(255,255,255,0.06);box-shadow:0 8px 32px rgba(0,0,0,0.4);">' +
      '<img src="img/payment_hero.png" style="width:100%;height:100%;object-fit:cover;filter:brightness(0.6) saturate(1.1);">' +
      '<div style="position:absolute;inset:0;background:linear-gradient(0deg,rgba(17,21,28,0.95) 0%,rgba(17,21,28,0.1) 100%);"></div>' +
      '<div style="position:absolute;bottom:0.75rem;left:50%;transform:translateX(-50%);text-align:center;width:100%;padding:0 1rem;">' +
        '<div style="font-size:0.58rem;color:var(--copper);font-weight:800;text-transform:uppercase;letter-spacing:2px;margin-bottom:0.15rem;">💎 MEMBRESÍA PREMIUM</div>' +
        '<h2 style="font-size:1.15rem;font-weight:900;color:#fff;margin:0 0 0.15rem;text-shadow:0 2px 4px rgba(0,0,0,0.5);">' +
          (expired ? 'Tu prueba ha finalizado' : 'SwingerSphere PRO') +
        '</h2>' +
        '<p style="font-size:0.7rem;color:#aeaeb2;margin:0;">Acceso ilimitado por solo <strong style="color:#fff;">9,99 EUR/mes</strong></p>' +
      '</div>' +
    '</div>' +

    // Benefits
    '<div style="display:flex;gap:0.4rem;flex-wrap:wrap;margin-bottom:1.25rem;justify-content:center;">' +
      ['💬 Chat E2E','📅 Eventos','🏛️ Clubs VIP','✈️ Passport','🍋 IA ilimitada','🔒 Privacidad total'].map(function(f){return '<div style="font-size:0.66rem;background:rgba(196,129,58,0.08);border:1px solid rgba(196,129,58,0.2);border-radius:7px;padding:2px 7px;color:#f2f2f7;">'+f+'</div>';}).join('') +
    '</div>' +

    promoHTML +

    // ═══ MAIN CTA: PAY WITH CARD (via Transak) ═══
    '<div style="border:2px solid rgba(99,91,255,0.4);border-radius:16px;padding:1.125rem;margin-bottom:0.875rem;background:linear-gradient(135deg,rgba(99,91,255,0.06),rgba(99,91,255,0.02));">' +
      '<div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.75rem;">' +
        '<div style="font-size:1.5rem;">💳</div>' +
        '<div style="flex:1;">' +
          '<div style="font-weight:700;font-size:0.88rem;">Pagar con tarjeta</div>' +
          '<div style="font-size:0.65rem;color:#aeaeb2;">Visa · Mastercard · Transferencia · Apple Pay</div>' +
        '</div>' +
        '<div style="font-size:0.6rem;background:#635bff22;color:#635bff;border:1px solid #635bff44;border-radius:6px;padding:2px 6px;font-weight:700;">FACIL</div>' +
      '</div>' +
      '<button onclick="TransakBridge.openWidget(\'tron\')" style="width:100%;padding:0.8rem;background:linear-gradient(135deg,#635bff,#7c3aed);border:none;border-radius:12px;font-size:0.88rem;font-weight:700;color:#fff;cursor:pointer;margin-bottom:0.5rem;">Pagar 9,99 EUR con tarjeta →</button>' +
      '<div style="font-size:0.62rem;color:#636366;text-align:center;line-height:1.4;">' +
        '🔒 Procesado por <strong style="color:#aeaeb2;">Transak</strong> (regulado FCA/UE)<br>' +
        'Tu tarjeta nunca toca nuestros servidores — pago 100% seguro' +
      '</div>' +
    '</div>' +

    // How it works (mini)
    '<div style="display:flex;gap:0.35rem;margin-bottom:1rem;">' +
      '<div style="flex:1;text-align:center;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:0.5rem 0.3rem;">' +
        '<div style="font-size:1rem;">💳</div><div style="font-size:0.58rem;color:#aeaeb2;margin-top:0.15rem;">1. Pagas con tarjeta</div>' +
      '</div>' +
      '<div style="flex:0 0 20px;display:flex;align-items:center;justify-content:center;color:#636366;">→</div>' +
      '<div style="flex:1;text-align:center;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:0.5rem 0.3rem;">' +
        '<div style="font-size:1rem;">🔄</div><div style="font-size:0.58rem;color:#aeaeb2;margin-top:0.15rem;">2. Transak convierte</div>' +
      '</div>' +
      '<div style="flex:0 0 20px;display:flex;align-items:center;justify-content:center;color:#636366;">→</div>' +
      '<div style="flex:1;text-align:center;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:0.5rem 0.3rem;">' +
        '<div style="font-size:1rem;">✅</div><div style="font-size:0.58rem;color:#aeaeb2;margin-top:0.15rem;">3. PRO activado</div>' +
      '</div>' +
    '</div>' +

    // Separator
    '<div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1rem;">' +
      '<div style="flex:1;height:1px;background:rgba(255,255,255,0.08);"></div>' +
      '<span style="font-size:0.65rem;color:#636366;">Ya tienes crypto?</span>' +
      '<div style="flex:1;height:1px;background:rgba(255,255,255,0.08);"></div>' +
    '</div>' +

    // ═══ DIRECT CRYPTO (collapsible) ═══
    '<details style="margin-bottom:1rem;">' +
      '<summary style="font-size:0.78rem;color:var(--copper);cursor:pointer;font-weight:600;padding:0.4rem 0;">🔐 Pagar directamente con crypto</summary>' +
      '<div style="margin-top:0.625rem;">' +

        // Ref
        '<div style="background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:10px;padding:0.5rem 0.75rem;margin-bottom:0.625rem;">' +
          '<div style="font-size:0.6rem;color:var(--silver-dark);margin-bottom:0.15rem;">Referencia (incluye en memo)</div>' +
          '<div style="display:flex;align-items:center;gap:0.4rem;"><span style="font-size:0.82rem;font-weight:700;font-family:monospace;color:var(--copper);">' + ref + '</span>' +
          '<button onclick="navigator.clipboard?.writeText(\'' + ref + '\');showToast(\'Copiado\',\'copper\')" style="font-size:0.58rem;background:rgba(196,129,58,0.1);border:1px solid rgba(196,129,58,0.3);border-radius:5px;padding:2px 6px;color:var(--copper);cursor:pointer;">Copiar</button></div>' +
        '</div>' +

        // Network tabs
        '<div style="display:flex;gap:0.3rem;margin-bottom:0.5rem;">' +
          '<button class="pay-tab" data-tab="tron" onclick="switchPayTab(\'tron\',this)" style="flex:1;padding:0.35rem;border-radius:7px;font-size:0.65rem;font-weight:600;background:transparent;border:1px solid var(--border);color:var(--silver);cursor:pointer;">🔴 Tron</button>' +
          '<button class="pay-tab active" data-tab="polygon" onclick="switchPayTab(\'polygon\',this)" style="flex:1;padding:0.35rem;border-radius:7px;font-size:0.65rem;font-weight:600;background:rgba(196,129,58,0.15);border:1px solid rgba(196,129,58,0.4);color:var(--copper);cursor:pointer;">🟣 Polygon</button>' +
          '<button class="pay-tab" data-tab="eth" onclick="switchPayTab(\'eth\',this)" style="flex:1;padding:0.35rem;border-radius:7px;font-size:0.65rem;font-weight:600;background:transparent;border:1px solid var(--border);color:var(--silver);cursor:pointer;">🔷 ETH</button>' +
        '</div>' +

        // Tron
        '<div id="pay-tab-tron" class="pay-tab-content" style="display:none;"><div style="background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:9px;padding:0.625rem;margin-bottom:0.5rem;">' +
          '<div style="font-size:0.6rem;color:var(--silver-dark);margin-bottom:0.2rem;">USDC TRC-20 · 10 USDC · Fee ~0.5</div>' +
          '<div style="font-size:0.65rem;font-family:monospace;word-break:break-all;color:#f2f2f7;background:rgba(255,255,255,0.04);padding:0.35rem;border-radius:5px;margin-bottom:0.35rem;">TRTrwHewJbj3sm28hL4ita29HT43AEWAfC</div>' +
          '<button onclick="navigator.clipboard?.writeText(\'TRTrwHewJbj3sm28hL4ita29HT43AEWAfC\');showToast(\'Copiado\',\'copper\')" style="width:100%;font-size:0.68rem;background:rgba(196,129,58,0.1);border:1px solid rgba(196,129,58,0.3);border-radius:7px;padding:4px;color:var(--copper);cursor:pointer;">📋 Copiar direccion</button>' +
        '</div></div>' +

        // Polygon
        '<div id="pay-tab-polygon" class="pay-tab-content"><div style="background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:9px;padding:0.625rem;margin-bottom:0.5rem;">' +
          '<div style="font-size:0.6rem;color:var(--silver-dark);margin-bottom:0.2rem;">USDC Polygon · 10 USDC · Fee ~0.01</div>' +
          '<div style="font-size:0.65rem;font-family:monospace;word-break:break-all;color:#f2f2f7;background:rgba(255,255,255,0.04);padding:0.35rem;border-radius:5px;margin-bottom:0.35rem;">0x78230a63d7d6ec90dd4feb69936af37fe27f6f20</div>' +
          '<button onclick="navigator.clipboard?.writeText(\'0x78230a63d7d6ec90dd4feb69936af37fe27f6f20\');showToast(\'Copiado\',\'copper\')" style="width:100%;font-size:0.68rem;background:rgba(196,129,58,0.1);border:1px solid rgba(196,129,58,0.3);border-radius:7px;padding:4px;color:var(--copper);cursor:pointer;">📋 Copiar direccion</button>' +
        '</div></div>' +

        // ETH
        '<div id="pay-tab-eth" class="pay-tab-content" style="display:none;"><div style="background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:9px;padding:0.625rem;margin-bottom:0.5rem;">' +
          '<div style="font-size:0.6rem;color:var(--silver-dark);margin-bottom:0.2rem;">USDC ERC-20 · 10 USDC · Fee ~2-5</div>' +
          '<div style="font-size:0.65rem;font-family:monospace;word-break:break-all;color:#f2f2f7;background:rgba(255,255,255,0.04);padding:0.35rem;border-radius:5px;margin-bottom:0.35rem;">0x78230a63d7d6ec90dd4feb69936af37fe27f6f20</div>' +
          '<button onclick="navigator.clipboard?.writeText(\'0x78230a63d7d6ec90dd4feb69936af37fe27f6f20\');showToast(\'Copiado\',\'copper\')" style="width:100%;font-size:0.68rem;background:rgba(196,129,58,0.1);border:1px solid rgba(196,129,58,0.3);border-radius:7px;padding:4px;color:var(--copper);cursor:pointer;">📋 Copiar direccion</button>' +
        '</div></div>' +

        // Verify status
        '<div id="verify-status" style="background:rgba(48,209,88,0.06);border:1px solid rgba(48,209,88,0.2);border-radius:9px;padding:0.4rem;text-align:center;margin-bottom:0.5rem;">' +
          '<div class="typing-indicator" style="justify-content:center;margin-bottom:0.1rem;"><span></span><span></span><span></span></div>' +
          '<div id="verify-msg" style="font-size:0.65rem;color:#30d158;">Escaneando blockchain...</div>' +
        '</div>' +

        // Manual hash input
        '<div style="margin-bottom:0.5rem;">' +
          '<div style="font-size:0.58rem;color:var(--silver-dark);margin-bottom:0.15rem;">Pega el hash de transaccion:</div>' +
          '<div style="display:flex;gap:0.3rem;">' +
            '<input id="tx-hash-input" placeholder="0x... o hash Tron" style="flex:1;background:var(--bg-elevated);border:1px solid var(--border);border-radius:7px;padding:0.35rem 0.4rem;font-size:0.68rem;font-family:monospace;color:var(--fg-primary);">' +
            '<button onclick="manualVerifyTx()" style="background:linear-gradient(135deg,#c4813a,#e09455);border:none;border-radius:7px;padding:0.35rem 0.6rem;font-size:0.68rem;font-weight:700;color:#fff;cursor:pointer;">Verificar</button>' +
          '</div>' +
        '</div>' +

      '</div>' +
    '</details>' +

    // Limoncito mini-help
    '<div style="background:rgba(196,129,58,0.04);border:1px solid rgba(196,129,58,0.12);border-radius:12px;padding:0.75rem;margin-bottom:0.75rem;">' +
      '<div style="display:flex;align-items:center;gap:0.4rem;margin-bottom:0.35rem;">' +
        '<img src="limoncito.png" style="width:20px;height:20px;border-radius:50%;object-fit:cover;" onerror="this.style.display=\'none\'">' +
        '<span style="font-size:0.72rem;font-weight:700;">Limoncito</span>' +
        '<span style="font-size:0.55rem;color:#30d158;margin-left:auto;">● online</span>' +
      '</div>' +
      '<div id="lim-pay-msgs" style="font-size:0.72rem;color:#aeaeb2;line-height:1.45;min-height:26px;white-space:pre-line;">Toca "Pagar con tarjeta" — Transak te permite pagar con Visa, Mastercard o transferencia bancaria. El proceso tarda 2 minutos y tu PRO se activa al instante.</div>' +
      '<div style="display:flex;gap:0.3rem;flex-wrap:wrap;margin-top:0.35rem;">' +
        '<button class="chip" style="font-size:0.6rem;" onclick="limPayAsk(\'transak\')">💳 Como funciona?</button>' +
        '<button class="chip" style="font-size:0.6rem;" onclick="limPayAsk(\'seguro\')">🔒 Seguro?</button>' +
        '<button class="chip" style="font-size:0.6rem;" onclick="limPayAsk(\'tarjeta\')">💸 Que acepta?</button>' +
        '<button class="chip" style="font-size:0.6rem;" onclick="limPayAsk(\'tiempo\')">⏱ Cuanto tarda?</button>' +
      '</div>' +
    '</div>' +

    // Footer
    '<p style="font-size:0.56rem;color:#48484a;text-align:center;line-height:1.5;">' +
      '🛡️ Transak regulado FCA/FinCEN · AES-256 · HMAC-SHA256<br>' +
      '⚖️ GDPR · LOPD · MiCA · Verificacion blockchain automatica' +
    '</p>';
  },
};

// ── LIMONCITO PAY RESPONSES ──────────────────────────────────────
var PAY_GUIDE = {
  transak: '💳 Asi funciona:\n\n1. Tocas "Pagar con tarjeta"\n2. Se abre Transak (regulado en Europa)\n3. Introduces tu tarjeta Visa/Mastercard\n4. Transak convierte 9,99 EUR a crypto\n5. La crypto llega a nuestra wallet\n6. PRO se activa automaticamente!\n\nTu NO necesitas saber nada de crypto. Es como comprar en Amazon.',
  seguro: '🔒 Transak esta regulado por la FCA (Reino Unido) y cumple normativa europea. Tiene licencia de operador financiero en mas de 50 paises. Tu tarjeta va directamente a Transak con SSL — nosotros nunca la vemos. Es el mismo proveedor que usan MetaMask, Coinbase Wallet y Aave.',
  tarjeta: '💳 Transak acepta:\n\n• Visa y Mastercard (debito y credito)\n• Apple Pay y Google Pay\n• Transferencia bancaria SEPA\n• iDEAL (Holanda)\n• Bancontact (Belgica)\n\nLa mayoria de tarjetas europeas funcionan sin problema.',
  tiempo: '⏱ Tiempos estimados:\n\n• Tarjeta: 2-5 minutos\n• Apple/Google Pay: 1-3 minutos\n• Transferencia SEPA: 1-2 dias laborables\n\nEn cuanto Transak envia la crypto, nuestro sistema la detecta automaticamente y activa tu PRO al instante.',
};

// ── GLOBAL FUNCTIONS ─────────────────────────────────────────────
window.switchPayTab = function(tab, btn) {
  document.querySelectorAll('.pay-tab-content').forEach(function(el){el.style.display='none';});
  document.querySelectorAll('.pay-tab').forEach(function(el){el.style.background='transparent';el.style.borderColor='var(--border)';el.style.color='var(--silver)';});
  var el = document.getElementById('pay-tab-'+tab); if(el) el.style.display='block';
  if(btn){btn.style.background='rgba(196,129,58,0.15)';btn.style.borderColor='rgba(196,129,58,0.4)';btn.style.color='var(--copper)';}
  // Start polling when crypto section opened
  startPaywallPolling();
};

window.startPaywallPolling = function() {
  var msgEl = document.getElementById('verify-msg');
  PaymentVerifier.startPolling(
    async function(tx) {
      if (window.secureActivatePro) await secureActivatePro(tx.hash, tx.chain, tx.amount);
      else TrialManager.activatePro(tx.hash, tx.chain);
      var until = parseInt(localStorage.getItem('ss_pro_until')||0);
      PaywallUI.hide();
      showProBanner(tx, new Date(until).toLocaleDateString('es-ES'));
      setTimeout(function(){try{renderNav();navigateTo('home');}catch(e){}},500);
    },
    function(msg){ if(msgEl) msgEl.textContent = '🔍 ' + msg; }
  );
};

window.manualVerifyTx = async function() {
  var input = document.getElementById('tx-hash-input');
  var hash = input ? input.value.trim() : '';
  if (!hash) { showToast('Introduce el hash','error'); return; }
  var btn = input.nextElementSibling;
  if(btn){btn.textContent='⏳';btn.disabled=true;}
  var result = await PaymentVerifier.verifyTxHash(hash);
  if(btn){btn.textContent='Verificar';btn.disabled=false;}
  if (result.ok) {
    if(window.secureActivatePro) await secureActivatePro(result.hash, result.chain, result.amount);
    else TrialManager.activatePro(result.hash, result.chain);
    var until = parseInt(localStorage.getItem('ss_pro_until')||0);
    PaywallUI.hide();
    showProBanner(result, new Date(until).toLocaleDateString('es-ES'));
    setTimeout(function(){try{renderNav();navigateTo('home');}catch(e){}},500);
  } else {
    showToast('❌ '+result.error,'error');
  }
};

window.limPayAsk = function(key) {
  var m = document.getElementById('lim-pay-msgs');
  if (!m) return;
  m.style.color='#f2f2f7'; m.textContent='...';
  setTimeout(function(){ m.style.color='#aeaeb2'; m.textContent = PAY_GUIDE[key] || PAY_GUIDE.transak; }, 400);
};

function showProBanner(tx, expiry) {
  var b = document.createElement('div');
  b.style.cssText='position:fixed;top:1rem;left:50%;transform:translateX(-50%);z-index:99999;background:linear-gradient(135deg,#1a2e1a,#0d1a0d);border:1px solid rgba(48,209,88,0.4);border-radius:16px;padding:1rem 1.5rem;text-align:center;max-width:320px;width:90%;box-shadow:0 0 40px rgba(48,209,88,0.15);';
  b.innerHTML='<div style="font-size:1.5rem;">🎉</div><div style="font-weight:700;font-size:0.88rem;color:#30d158;">PRO activado!</div><div style="font-size:0.72rem;color:#aeaeb2;">Acceso hasta <strong style="color:#f2f2f7;">'+expiry+'</strong></div><div style="font-size:0.6rem;color:#636366;margin-top:0.15rem;">'+(tx.chain||'')+'</div>';
  document.body.appendChild(b);
  setTimeout(function(){b.style.transition='opacity 0.5s';b.style.opacity='0';setTimeout(function(){b.remove();},500);},5000);
}

function showTrialBadge(remaining) {
  document.getElementById('ss-trial-badge')?.remove();
  var days = Math.ceil(remaining/86400000);
  var badge = document.createElement('div'); badge.id='ss-trial-badge';
  badge.style.cssText='position:fixed;bottom:80px;right:1rem;z-index:9999;background:rgba(17,19,24,0.95);border:1px solid rgba(196,129,58,0.35);border-radius:12px;padding:0.5rem 0.875rem;font-size:0.68rem;color:var(--copper);cursor:pointer;backdrop-filter:blur(10px);';
  badge.innerHTML='⏱ Prueba: <strong>'+days+' dia'+(days!==1?'s':'')+'</strong> · <span style="text-decoration:underline;color:#f2f2f7;">Activar PRO</span>';
  badge.onclick = function(){ PaywallUI.show({type:'upgrade'}); };
  document.body.appendChild(badge);
}

window.checkTrialAndAccess = function() {
  TrialManager.initTrial();
  var st = TrialManager.getStatus();
  if (st.ok) { if(st.type==='trial') setTimeout(function(){showTrialBadge(st.remaining);},2000); return true; }
  PaywallUI.show(st);
  return false;
};

// Dev tools
window._ssTrialReset = function(){ ['ss_trial_start','ss_pro_until','ss_pay_ref','ss_pay_method','ss_verified_tx','ss_pro_sig','ss_pro_ts','ss_verify_rl'].forEach(function(k){localStorage.removeItem(k);}); location.reload(); };
window._ssSimulatePay = async function(){ if(window.secureActivatePro) await secureActivatePro('SIM_'+Date.now(),'test',10); else TrialManager.activatePro('SIM_'+Date.now(),'test'); location.reload(); };
window._ssExpireTrial = function(){ localStorage.setItem('ss_trial_start',(Date.now()-8*86400000).toString()); location.reload(); };

console.log('💳 SwingerSphere Payment v5.0 [TRANSAK + CRYPTO] | Status:', TrialManager.getStatus().type);

window.activateFreeProFromPaywall = function() {
  var freeCount = parseInt(localStorage.getItem('ss_free_count') || '487');
  if (freeCount >= 500) {
    showToast('❌ Lo sentimos, la promoción ha finalizado.', 'error');
    return;
  }
  localStorage.setItem('ss_free_count', (freeCount + 1).toString());
  localStorage.setItem('ss_pro', '1');
  
  var until = Date.now() + 30 * 86400000;
  localStorage.setItem('ss_pro_until', until.toString());
  localStorage.setItem('ss_verified_tx', 'free_promo_' + Date.now());
  localStorage.setItem('ss_pay_method', 'free_promo');
  
  showToast('🎉 ¡Membresía PRO gratis activada de por vida!', 'success');
  
  if (window.PaywallUI) {
    PaywallUI.hide();
  }
  document.getElementById('ss-trial-badge')?.remove();
  
  setTimeout(function() {
    try {
      if (window.renderNav) renderNav();
      if (window.navigateTo) navigateTo('home');
    } catch (e) {}
  }, 1000);
};
