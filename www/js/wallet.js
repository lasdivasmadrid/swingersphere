/* ═══════════════════════════════════════════════════════════════════
   SWINGERSPHERE — WALLET & PAYMENT GATEWAY v2.0
   Billetera USDC · On-Ramp (Fiat→USDC) · Off-Ramp (USDC→Fiat)
   Flujo transparente: el usuario paga en EUR y recibe en EUR
   ═══════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  var BALANCE_KEY = 'ss_wallet_balance';
  var HISTORY_KEY = 'ss_wallet_history';
  var BANK_KEY    = 'ss_wallet_bank';

  // ── Core Balance Functions ──────────────────────────────────────
  function getBalance(){
    return parseFloat(localStorage.getItem(BALANCE_KEY) || '0');
  }

  function setBalance(v){
    localStorage.setItem(BALANCE_KEY, Math.max(0, v).toString());
    updateBalanceBadge();
  }

  function addBalance(amount, description){
    var newBal = Math.max(0, getBalance() + amount);
    setBalance(newBal);
    var history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    var isPayment = amount < 0;
    history.unshift({
      date: new Date().toISOString(),
      amount: amount,
      type: isPayment ? 'payment' : 'deposit',
      desc: description || (isPayment ? 'Pago de reserva' : 'Recarga de saldo')
    });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 200)));
    if (!isPayment && window.showToast) {
      showToast('✅ +' + amount.toFixed(2) + ' USDC acreditados en tu wallet', 'success');
    }
  }

  function getHistory(){
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); }
    catch(e){ return []; }
  }

  function updateBalanceBadge(){
    var btn = document.getElementById('wallet-btn');
    if (btn) {
      btn.title = 'Balance: ' + getBalance().toFixed(2) + ' USDC';
    }
  }

  // ── Saved Bank Account ──────────────────────────────────────────
  function getSavedBank(){
    try { return JSON.parse(localStorage.getItem(BANK_KEY) || 'null'); }
    catch(e){ return null; }
  }
  function saveBank(data){
    localStorage.setItem(BANK_KEY, JSON.stringify(data));
  }

  // ══════════════════════════════════════════════════════════════════
  //  WALLET OVERLAY (Mi Billetera)
  // ══════════════════════════════════════════════════════════════════
  function showWalletOverlay(){
    // Remove existing
    var existing = document.getElementById('ss-wallet-ov');
    if (existing) existing.remove();

    var ov = document.createElement('div');
    ov.id = 'ss-wallet-ov';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;z-index:85000;';

    var modal = document.createElement('div');
    modal.style.cssText = 'background:linear-gradient(135deg,#111318,#0d1520);border:1px solid rgba(196,129,58,0.35);border-radius:24px;padding:0;overflow:hidden;max-width:380px;width:92%;max-height:85vh;overflow-y:auto;box-shadow:0 8px 40px rgba(0,0,0,0.5),0 0 20px rgba(196,129,58,0.1);';

    // ── Header ───────────────────────────────────────────────────
    var hdr = document.createElement('div');
    hdr.style.cssText = 'background:linear-gradient(135deg,rgba(196,129,58,0.12),rgba(196,129,58,0.04));border-bottom:1px solid rgba(196,129,58,0.2);padding:1.25rem;text-align:center;position:relative;';

    hdr.innerHTML =
      '<div style="font-size:1.8rem;margin-bottom:0.3rem;">💰</div>' +
      '<h3 style="margin:0;font-size:1rem;font-weight:800;color:var(--fg-primary,#f2f2f7);">Mi Billetera</h3>' +
      '<div style="font-size:0.6rem;color:#636366;margin-top:0.15rem;">Powered by USDC · Circle</div>';

    var closeBtn = document.createElement('button');
    closeBtn.style.cssText = 'position:absolute;top:1rem;right:1rem;background:none;border:none;color:#aeaeb2;font-size:1.1rem;cursor:pointer;padding:4px;';
    closeBtn.textContent = '\u2715';
    closeBtn.onclick = function(){ ov.remove(); };
    hdr.appendChild(closeBtn);
    modal.appendChild(hdr);

    // ── Balance Card ─────────────────────────────────────────────
    var body = document.createElement('div');
    body.style.cssText = 'padding:1.25rem;';

    var balCard = document.createElement('div');
    balCard.style.cssText = 'background:linear-gradient(135deg,rgba(196,129,58,0.1),rgba(196,129,58,0.03));border:1px solid rgba(196,129,58,0.25);border-radius:18px;padding:1.25rem;text-align:center;margin-bottom:1rem;';

    var balLabel = document.createElement('div');
    balLabel.style.cssText = 'font-size:0.65rem;color:#aeaeb2;text-transform:uppercase;letter-spacing:1px;margin-bottom:0.3rem;';
    balLabel.textContent = 'Saldo disponible';
    balCard.appendChild(balLabel);

    var balAmount = document.createElement('div');
    balAmount.style.cssText = 'font-size:2rem;font-weight:800;background:linear-gradient(135deg,#f2f2f7,#c4813a);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:0.15rem;';
    balAmount.textContent = getBalance().toFixed(2) + ' USDC';
    balCard.appendChild(balAmount);

    var balEur = document.createElement('div');
    balEur.style.cssText = 'font-size:0.72rem;color:#aeaeb2;';
    balEur.textContent = '≈ ' + getBalance().toFixed(2) + ' EUR';
    balCard.appendChild(balEur);

    body.appendChild(balCard);

    // ── Action Buttons ───────────────────────────────────────────
    var actionsRow = document.createElement('div');
    actionsRow.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-bottom:1.25rem;';

    // Deposit button
    var depositBtn = document.createElement('button');
    depositBtn.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:0.3rem;padding:0.75rem;border-radius:14px;border:1px solid rgba(52,199,89,0.3);background:rgba(52,199,89,0.08);color:#34c759;cursor:pointer;font-size:0.72rem;font-weight:600;';
    depositBtn.innerHTML = '<span style="font-size:1.2rem;">💳</span>Depositar EUR';
    depositBtn.onclick = function(){ ov.remove(); showOnRamp(); };
    actionsRow.appendChild(depositBtn);

    // Withdraw button
    var withdrawBtn = document.createElement('button');
    withdrawBtn.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:0.3rem;padding:0.75rem;border-radius:14px;border:1px solid rgba(255,107,107,0.3);background:rgba(255,107,107,0.08);color:#ff6b6b;cursor:pointer;font-size:0.72rem;font-weight:600;';
    withdrawBtn.innerHTML = '<span style="font-size:1.2rem;">🏦</span>Retirar a banco';
    withdrawBtn.onclick = function(){ ov.remove(); showOffRamp(); };
    actionsRow.appendChild(withdrawBtn);

    body.appendChild(actionsRow);

    // ── Transaction History ──────────────────────────────────────
    var histTitle = document.createElement('div');
    histTitle.style.cssText = 'font-size:0.78rem;font-weight:700;color:var(--fg-primary,#f2f2f7);margin-bottom:0.6rem;';
    histTitle.textContent = '📊 Historial de transacciones';
    body.appendChild(histTitle);

    var histWrap = document.createElement('div');
    histWrap.style.cssText = 'max-height:200px;overflow-y:auto;';

    var history = getHistory();
    if (history.length === 0) {
      histWrap.innerHTML = '<div style="text-align:center;padding:1.5rem;color:#636366;font-size:0.72rem;">Sin transacciones aún<br><span style="font-size:0.62rem;">Haz tu primer depósito para comenzar</span></div>';
    } else {
      var histHTML = '';
      for (var i = 0; i < Math.min(history.length, 20); i++) {
        var item = history[i];
        var isDeposit = item.amount > 0;
        var color = isDeposit ? '#34c759' : '#ff6b6b';
        var icon = isDeposit ? '↗' : '↙';
        var label = item.desc || (isDeposit ? 'Recarga' : 'Pago');
        histHTML += '<div style="display:flex;justify-content:space-between;align-items:center;padding:0.45rem 0;border-bottom:1px solid rgba(255,255,255,0.04);">' +
          '<div style="display:flex;align-items:center;gap:0.5rem;">' +
            '<span style="font-size:0.9rem;width:24px;height:24px;display:flex;align-items:center;justify-content:center;border-radius:8px;background:' + (isDeposit ? 'rgba(52,199,89,0.1)' : 'rgba(255,107,107,0.1)') + ';">' + icon + '</span>' +
            '<div><div style="font-size:0.7rem;color:var(--fg-primary,#f2f2f7);font-weight:500;">' + label + '</div>' +
            '<div style="font-size:0.58rem;color:#636366;">' + new Date(item.date).toLocaleString() + '</div></div>' +
          '</div>' +
          '<span style="font-size:0.78rem;font-weight:700;color:' + color + ';">' + (isDeposit ? '+' : '') + item.amount.toFixed(2) + '</span>' +
        '</div>';
      }
      histWrap.innerHTML = histHTML;
    }
    body.appendChild(histWrap);
    modal.appendChild(body);

    ov.appendChild(modal);
    ov.onclick = function(e){ if (e.target === ov) ov.remove(); };
    document.body.appendChild(ov);
  }

  // ══════════════════════════════════════════════════════════════════
  //  ON-RAMP: Fiat (EUR) → USDC   (Depositar dinero)
  // ══════════════════════════════════════════════════════════════════
  function showOnRamp(prefillAmount){
    var existing = document.getElementById('ss-onramp-ov');
    if (existing) existing.remove();

    var ov = document.createElement('div');
    ov.id = 'ss-onramp-ov';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;z-index:86000;';

    var modal = document.createElement('div');
    modal.style.cssText = 'background:linear-gradient(135deg,#111318,#0d1520);border:1px solid rgba(196,129,58,0.35);border-radius:24px;padding:0;overflow:hidden;max-width:380px;width:92%;box-shadow:0 8px 40px rgba(0,0,0,0.5);';

    // Header
    var hdr = document.createElement('div');
    hdr.style.cssText = 'background:linear-gradient(135deg,rgba(52,199,89,0.1),rgba(52,199,89,0.03));border-bottom:1px solid rgba(52,199,89,0.2);padding:1.25rem;text-align:center;position:relative;';
    hdr.innerHTML =
      '<div style="font-size:1.5rem;margin-bottom:0.25rem;">💳</div>' +
      '<h3 style="margin:0;font-size:1rem;font-weight:800;color:var(--fg-primary,#f2f2f7);">Depositar fondos</h3>' +
      '<div style="font-size:0.6rem;color:#aeaeb2;margin-top:0.15rem;">EUR → USDC · Conversión instantánea</div>';

    var closeBtn = document.createElement('button');
    closeBtn.style.cssText = 'position:absolute;top:1rem;right:1rem;background:none;border:none;color:#aeaeb2;font-size:1.1rem;cursor:pointer;';
    closeBtn.textContent = '\u2715';
    closeBtn.onclick = function(){ ov.remove(); };
    hdr.appendChild(closeBtn);
    modal.appendChild(hdr);

    // Body
    var body = document.createElement('div');
    body.style.cssText = 'padding:1.25rem;';

    // Amount input
    var amountLabel = document.createElement('div');
    amountLabel.style.cssText = 'font-size:0.72rem;color:#aeaeb2;margin-bottom:0.4rem;font-weight:600;';
    amountLabel.textContent = 'Cantidad a depositar (EUR)';
    body.appendChild(amountLabel);

    var amountWrap = document.createElement('div');
    amountWrap.style.cssText = 'position:relative;margin-bottom:0.75rem;';

    var amountInput = document.createElement('input');
    amountInput.type = 'number';
    amountInput.min = '5';
    amountInput.max = '10000';
    amountInput.step = '5';
    amountInput.value = prefillAmount ? String(Math.ceil(prefillAmount)) : '50';
    amountInput.style.cssText = 'width:100%;box-sizing:border-box;background:rgba(255,255,255,0.04);border:1px solid var(--border,rgba(255,255,255,0.1));border-radius:12px;padding:0.75rem 3rem 0.75rem 0.75rem;font-size:1.1rem;font-weight:700;color:var(--fg-primary,#f2f2f7);text-align:center;';
    amountWrap.appendChild(amountInput);

    var eurLabel = document.createElement('span');
    eurLabel.style.cssText = 'position:absolute;right:0.75rem;top:50%;transform:translateY(-50%);font-size:0.82rem;color:#aeaeb2;font-weight:600;';
    eurLabel.textContent = 'EUR';
    amountWrap.appendChild(eurLabel);
    body.appendChild(amountWrap);

    // Quick amount buttons
    var quickRow = document.createElement('div');
    quickRow.style.cssText = 'display:flex;gap:0.4rem;margin-bottom:1rem;';
    var quickAmounts = [25, 50, 100, 250, 500];
    for (var qi = 0; qi < quickAmounts.length; qi++) {
      (function(amt){
        var qBtn = document.createElement('button');
        qBtn.style.cssText = 'flex:1;padding:0.4rem;border-radius:10px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03);color:#aeaeb2;font-size:0.68rem;cursor:pointer;font-weight:600;';
        qBtn.textContent = amt + '€';
        qBtn.onclick = function(){
          amountInput.value = String(amt);
          receiveEl.textContent = amt.toFixed(2) + ' USDC';
        };
        quickRow.appendChild(qBtn);
      })(quickAmounts[qi]);
    }
    body.appendChild(quickRow);

    // Conversion preview
    var convBox = document.createElement('div');
    convBox.style.cssText = 'background:rgba(255,255,255,0.03);border:1px solid var(--border,rgba(255,255,255,0.1));border-radius:14px;padding:0.75rem;margin-bottom:1rem;';

    convBox.innerHTML =
      '<div style="display:flex;justify-content:space-between;font-size:0.68rem;color:#aeaeb2;margin-bottom:0.3rem;">' +
        '<span>Tasa de cambio</span><span style="color:var(--fg-primary,#f2f2f7);font-weight:600;">1 EUR = 1.00 USDC</span>' +
      '</div>' +
      '<div style="display:flex;justify-content:space-between;font-size:0.68rem;color:#aeaeb2;margin-bottom:0.3rem;">' +
        '<span>Comisión</span><span style="color:#34c759;font-weight:600;">0.00 EUR (demo)</span>' +
      '</div>' +
      '<div style="display:flex;justify-content:space-between;font-size:0.78rem;border-top:1px solid rgba(255,255,255,0.06);padding-top:0.4rem;margin-top:0.2rem;">' +
        '<span style="color:#aeaeb2;">Recibirás</span><span id="onramp-receive" style="color:var(--copper,#c4813a);font-weight:800;"></span>' +
      '</div>';

    body.appendChild(convBox);
    var receiveEl = convBox.querySelector('#onramp-receive');
    receiveEl.textContent = (parseFloat(amountInput.value) || 50).toFixed(2) + ' USDC';

    amountInput.oninput = function(){
      var v = parseFloat(amountInput.value) || 0;
      receiveEl.textContent = v.toFixed(2) + ' USDC';
    };

    // Payment method selector
    var methodLabel = document.createElement('div');
    methodLabel.style.cssText = 'font-size:0.72rem;color:#aeaeb2;margin-bottom:0.4rem;font-weight:600;';
    methodLabel.textContent = 'Método de pago';
    body.appendChild(methodLabel);

    var methods = [
      {id:'card', icon:'💳', name:'Tarjeta de crédito/débito', sub:'Visa, Mastercard, Amex'},
      {id:'apple', icon:'', name:'Apple Pay', sub:'Pago instantáneo'},
      {id:'google', icon:'🅶', name:'Google Pay', sub:'Pago instantáneo'},
      {id:'transfer', icon:'🏦', name:'Transferencia bancaria', sub:'SEPA · 1-2 días hábiles'},
    ];

    var selectedMethod = 'card';
    var methodsWrap = document.createElement('div');
    methodsWrap.style.cssText = 'display:flex;flex-direction:column;gap:0.35rem;margin-bottom:1rem;';

    for (var mi = 0; mi < methods.length; mi++) {
      (function(m){
        var mBtn = document.createElement('button');
        mBtn.dataset.method = m.id;
        mBtn.style.cssText = 'display:flex;align-items:center;gap:0.6rem;padding:0.6rem 0.75rem;border-radius:12px;border:1px solid ' +
          (m.id === selectedMethod ? 'rgba(196,129,58,0.5)' : 'rgba(255,255,255,0.08)') + ';background:' +
          (m.id === selectedMethod ? 'rgba(196,129,58,0.08)' : 'rgba(255,255,255,0.02)') + ';cursor:pointer;text-align:left;width:100%;';
        mBtn.innerHTML =
          '<span style="font-size:1.1rem;width:28px;text-align:center;">' + m.icon + '</span>' +
          '<div style="flex:1;">' +
            '<div style="font-size:0.74rem;font-weight:600;color:' + (m.id === selectedMethod ? '#c4813a' : 'var(--fg-primary,#f2f2f7)') + ';">' + m.name + '</div>' +
            '<div style="font-size:0.58rem;color:#636366;">' + m.sub + '</div>' +
          '</div>' +
          '<div style="width:16px;height:16px;border-radius:50%;border:2px solid ' + (m.id === selectedMethod ? '#c4813a' : '#636366') + ';display:flex;align-items:center;justify-content:center;">' +
            (m.id === selectedMethod ? '<div style="width:8px;height:8px;border-radius:50%;background:#c4813a;"></div>' : '') +
          '</div>';
        mBtn.onclick = function(){
          selectedMethod = m.id;
          // Re-render all method buttons
          var allBtns = methodsWrap.children;
          for (var b = 0; b < allBtns.length; b++) {
            var bid = allBtns[b].dataset.method;
            var isActive = bid === selectedMethod;
            allBtns[b].style.borderColor = isActive ? 'rgba(196,129,58,0.5)' : 'rgba(255,255,255,0.08)';
            allBtns[b].style.background = isActive ? 'rgba(196,129,58,0.08)' : 'rgba(255,255,255,0.02)';
          }
        };
        methodsWrap.appendChild(mBtn);
      })(methods[mi]);
    }
    body.appendChild(methodsWrap);

    // CTA
    var ctaBtn = document.createElement('button');
    ctaBtn.style.cssText = 'width:100%;padding:0.75rem;border-radius:14px;border:none;background:linear-gradient(135deg,#c4813a,#d4974a);color:#fff;font-size:0.88rem;font-weight:700;cursor:pointer;margin-bottom:0.5rem;';
    ctaBtn.textContent = 'Depositar ahora';
    ctaBtn.onclick = function(){
      var amt = parseFloat(amountInput.value);
      if (!amt || amt < 1) {
        if (typeof showToast === 'function') showToast('Introduce una cantidad válida', 'error');
        return;
      }
      // Show processing
      ctaBtn.disabled = true;
      ctaBtn.textContent = '⏳ Procesando pago...';
      ctaBtn.style.opacity = '0.6';

      setTimeout(function(){
        ctaBtn.textContent = '🔐 Verificando transacción...';
      }, 800);

      setTimeout(function(){
        addBalance(amt, 'Depósito via ' + selectedMethod.toUpperCase());
        ov.remove();
      }, 2000);
    };
    body.appendChild(ctaBtn);

    // Security note
    var secNote = document.createElement('div');
    secNote.style.cssText = 'text-align:center;font-size:0.58rem;color:#636366;';
    secNote.textContent = '🔒 Conexión segura · Cifrado SSL · PCI DSS Compliant';
    body.appendChild(secNote);

    modal.appendChild(body);
    ov.appendChild(modal);
    ov.onclick = function(e){ if (e.target === ov) ov.remove(); };
    document.body.appendChild(ov);
  }

  // ══════════════════════════════════════════════════════════════════
  //  OFF-RAMP: USDC → Fiat (EUR)   (Retirar a cuenta bancaria)
  // ══════════════════════════════════════════════════════════════════
  function showOffRamp(){
    var existing = document.getElementById('ss-offramp-ov');
    if (existing) existing.remove();

    var bal = getBalance();

    var ov = document.createElement('div');
    ov.id = 'ss-offramp-ov';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;z-index:86000;';

    var modal = document.createElement('div');
    modal.style.cssText = 'background:linear-gradient(135deg,#111318,#0d1520);border:1px solid rgba(196,129,58,0.35);border-radius:24px;padding:0;overflow:hidden;max-width:380px;width:92%;box-shadow:0 8px 40px rgba(0,0,0,0.5);';

    // Header
    var hdr = document.createElement('div');
    hdr.style.cssText = 'background:linear-gradient(135deg,rgba(255,107,107,0.08),rgba(255,107,107,0.02));border-bottom:1px solid rgba(255,107,107,0.15);padding:1.25rem;text-align:center;position:relative;';
    hdr.innerHTML =
      '<div style="font-size:1.5rem;margin-bottom:0.25rem;">🏦</div>' +
      '<h3 style="margin:0;font-size:1rem;font-weight:800;color:var(--fg-primary,#f2f2f7);">Retirar a banco</h3>' +
      '<div style="font-size:0.6rem;color:#aeaeb2;margin-top:0.15rem;">USDC → EUR · Transferencia SEPA</div>';

    var closeBtn2 = document.createElement('button');
    closeBtn2.style.cssText = 'position:absolute;top:1rem;right:1rem;background:none;border:none;color:#aeaeb2;font-size:1.1rem;cursor:pointer;';
    closeBtn2.textContent = '\u2715';
    closeBtn2.onclick = function(){ ov.remove(); };
    hdr.appendChild(closeBtn2);
    modal.appendChild(hdr);

    // Body
    var body = document.createElement('div');
    body.style.cssText = 'padding:1.25rem;';

    // Available balance
    var balBox = document.createElement('div');
    balBox.style.cssText = 'text-align:center;margin-bottom:1rem;padding:0.75rem;background:rgba(255,255,255,0.03);border-radius:12px;border:1px solid var(--border,rgba(255,255,255,0.1));';
    balBox.innerHTML =
      '<div style="font-size:0.62rem;color:#aeaeb2;">Disponible para retirar</div>' +
      '<div style="font-size:1.4rem;font-weight:800;color:var(--copper,#c4813a);">' + bal.toFixed(2) + ' USDC</div>' +
      '<div style="font-size:0.62rem;color:#aeaeb2;">≈ ' + bal.toFixed(2) + ' EUR</div>';
    body.appendChild(balBox);

    if (bal < 10) {
      body.innerHTML += '<div style="text-align:center;padding:1rem;color:#ff6b6b;font-size:0.76rem;font-weight:600;">⚠ Saldo mínimo para retirar: 10 USDC</div>';
      modal.appendChild(body);
      ov.appendChild(modal);
      ov.onclick = function(e){ if (e.target === ov) ov.remove(); };
      document.body.appendChild(ov);
      return;
    }

    // Amount
    var amtLabel = document.createElement('div');
    amtLabel.style.cssText = 'font-size:0.72rem;color:#aeaeb2;margin-bottom:0.4rem;font-weight:600;';
    amtLabel.textContent = 'Cantidad a retirar';
    body.appendChild(amtLabel);

    var amtInput = document.createElement('input');
    amtInput.type = 'number';
    amtInput.min = '10';
    amtInput.max = String(Math.floor(bal));
    amtInput.value = String(Math.floor(bal));
    amtInput.style.cssText = 'width:100%;box-sizing:border-box;background:rgba(255,255,255,0.04);border:1px solid var(--border,rgba(255,255,255,0.1));border-radius:12px;padding:0.75rem;font-size:1.1rem;font-weight:700;color:var(--fg-primary,#f2f2f7);text-align:center;margin-bottom:0.75rem;';
    body.appendChild(amtInput);

    // Bank details
    var bankLabel = document.createElement('div');
    bankLabel.style.cssText = 'font-size:0.72rem;color:#aeaeb2;margin-bottom:0.4rem;font-weight:600;';
    bankLabel.textContent = '🏦 Datos bancarios (IBAN)';
    body.appendChild(bankLabel);

    var saved = getSavedBank();

    var ibanInput = document.createElement('input');
    ibanInput.type = 'text';
    ibanInput.placeholder = 'ES00 0000 0000 0000 0000 0000';
    ibanInput.value = saved ? saved.iban : '';
    ibanInput.style.cssText = 'width:100%;box-sizing:border-box;background:rgba(255,255,255,0.04);border:1px solid var(--border,rgba(255,255,255,0.1));border-radius:12px;padding:0.65rem;font-size:0.82rem;color:var(--fg-primary,#f2f2f7);margin-bottom:0.5rem;font-family:monospace;letter-spacing:1px;';
    body.appendChild(ibanInput);

    var nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.placeholder = 'Nombre del titular';
    nameInput.value = saved ? saved.name : '';
    nameInput.style.cssText = 'width:100%;box-sizing:border-box;background:rgba(255,255,255,0.04);border:1px solid var(--border,rgba(255,255,255,0.1));border-radius:12px;padding:0.65rem;font-size:0.82rem;color:var(--fg-primary,#f2f2f7);margin-bottom:1rem;';
    body.appendChild(nameInput);

    // Conversion preview
    var convBox2 = document.createElement('div');
    convBox2.style.cssText = 'background:rgba(255,255,255,0.03);border:1px solid var(--border,rgba(255,255,255,0.1));border-radius:14px;padding:0.75rem;margin-bottom:1rem;';
    convBox2.innerHTML =
      '<div style="display:flex;justify-content:space-between;font-size:0.68rem;color:#aeaeb2;margin-bottom:0.3rem;">' +
        '<span>Tasa</span><span style="font-weight:600;color:var(--fg-primary,#f2f2f7);">1 USDC = 1.00 EUR</span>' +
      '</div>' +
      '<div style="display:flex;justify-content:space-between;font-size:0.68rem;color:#aeaeb2;margin-bottom:0.3rem;">' +
        '<span>Comisión</span><span style="font-weight:600;color:#34c759;">0.00 EUR (demo)</span>' +
      '</div>' +
      '<div style="display:flex;justify-content:space-between;font-size:0.68rem;color:#aeaeb2;">' +
        '<span>Tiempo estimado</span><span style="font-weight:600;color:var(--fg-primary,#f2f2f7);">1-2 días hábiles</span>' +
      '</div>';
    body.appendChild(convBox2);

    // CTA
    var withdrawCta = document.createElement('button');
    withdrawCta.style.cssText = 'width:100%;padding:0.75rem;border-radius:14px;border:none;background:linear-gradient(135deg,#c4813a,#d4974a);color:#fff;font-size:0.88rem;font-weight:700;cursor:pointer;margin-bottom:0.5rem;';
    withdrawCta.textContent = 'Retirar ahora';
    withdrawCta.onclick = function(){
      var amt = parseFloat(amtInput.value);
      var iban = ibanInput.value.replace(/\s/g, '');
      var holderName = nameInput.value.trim();

      if (!amt || amt < 10) {
        if (typeof showToast === 'function') showToast('Mínimo 10 USDC para retirar', 'error');
        return;
      }
      if (amt > bal) {
        if (typeof showToast === 'function') showToast('Saldo insuficiente', 'error');
        return;
      }
      if (iban.length < 15) {
        if (typeof showToast === 'function') showToast('Introduce un IBAN válido', 'error');
        return;
      }
      if (!holderName) {
        if (typeof showToast === 'function') showToast('Introduce el nombre del titular', 'error');
        return;
      }

      // Save bank details
      saveBank({iban: iban, name: holderName});

      withdrawCta.disabled = true;
      withdrawCta.textContent = '⏳ Procesando retiro...';
      withdrawCta.style.opacity = '0.6';

      setTimeout(function(){
        withdrawCta.textContent = '🔐 Verificando cuenta...';
      }, 800);

      setTimeout(function(){
        withdrawCta.textContent = '📤 Enviando transferencia...';
      }, 1600);

      setTimeout(function(){
        addBalance(-amt, 'Retiro a banco ****' + iban.slice(-4));
        ov.remove();
        if (typeof showToast === 'function') showToast('✅ Retiro de ' + amt.toFixed(2) + ' EUR enviado a tu banco', 'success');
      }, 2500);
    };
    body.appendChild(withdrawCta);

    var secNote = document.createElement('div');
    secNote.style.cssText = 'text-align:center;font-size:0.58rem;color:#636366;';
    secNote.textContent = '🔒 Conexión segura · Datos bancarios cifrados';
    body.appendChild(secNote);

    modal.appendChild(body);
    ov.appendChild(modal);
    ov.onclick = function(e){ if (e.target === ov) ov.remove(); };
    document.body.appendChild(ov);
  }

  // ── Expose API ─────────────────────────────────────────────────
  window.wallet = {
    getBalance: getBalance,
    addBalance: addBalance,
    showOverlay: showWalletOverlay,
    showOnRamp: showOnRamp,
    showOffRamp: showOffRamp
  };

  // Legacy support for TransakBridge
  window.TransakBridge = {
    openWidget: function(){ showOnRamp(50); }
  };

  document.addEventListener('DOMContentLoaded', updateBalanceBadge);
})();
