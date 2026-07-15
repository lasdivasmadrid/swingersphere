/* ═══════════════════════════════════════════════════════════════════
   SWINGERSPHERE — CERTIFICATION SYSTEM v1.0
   Sellos de verificacion para negocios, clubs, eventos y organizadores
   El "blue check" del lifestyle · Confianza garantizada
   ═══════════════════════════════════════════════════════════════════ */

'use strict';

// ── Badge Types ──────────────────────────────────────────────────
var CERT_BADGES = [
  {id:'club',      icon:'\u{1F3DB}\uFE0F', name:'Club Verificado',       price:149, period:'ano', color:'#ffd700', desc:'Badge dorado en directorio, prioridad en busquedas, Shadow recomienda tu club',
    features:['Badge dorado visible en directorio','Prioridad en resultados de busqueda','Shadow recomienda tu club activamente','Sello de confianza para visitantes','Acceso a estadisticas de perfil']},
  {id:'event',     icon:'\u{1F389}',       name:'Evento Verificado',     price:99,  period:'ano', color:'#30d158', desc:'Sello en agenda de eventos, push a usuarios cercanos, analytics de asistencia',
    features:['Sello verificado en agenda de eventos','Push automatico a usuarios cercanos','Analytics detallados de asistencia','Prioridad en calendario lifestyle','Badge verde en todas las publicaciones']},
  {id:'organizer', icon:'\u{1F464}',       name:'Organizador Verificado', price:99,  period:'ano', color:'#0a84ff', desc:'Perfil destacado, historial publico de eventos, TrustScore +15 boost',
    features:['Perfil destacado con badge azul','Historial publico de eventos organizados','TrustScore +15 puntos de boost','Mayor visibilidad en comunidad','Recomendaciones prioritarias de Shadow']},
  {id:'business',  icon:'\u{1F3E2}',       name:'Negocio Verificado',    price:199, period:'ano', color:'#c4813a', desc:'Marketplace prioritario, landing en app, Shadow promociona tu servicio',
    features:['Posicion prioritaria en marketplace','Landing page dedicada en la app','Shadow promociona tu servicio','Badge cobre premium exclusivo','Estadisticas avanzadas de interaccion','Soporte prioritario dedicado']},
];

// ── Demo Certified Businesses ────────────────────────────────────
var CERTIFIED_DEMO = [
  {type:'club',      name:'Privee Club Madrid',       city:'Madrid',    since:'2024-01-15', expires:'2025-01-15'},
  {type:'club',      name:'Oasis Barcelona',          city:'Barcelona', since:'2024-03-01', expires:'2025-03-01'},
  {type:'event',     name:'Fiesta VIP Sabados',       org:'EventosMad', since:'2024-06-01', expires:'2025-06-01'},
  {type:'organizer', name:'Carlos & Ana Events',      city:'Valencia',  since:'2024-02-10', expires:'2025-02-10'},
  {type:'business',  name:'Studio Maia Photography',  city:'Madrid',    since:'2024-04-20', expires:'2025-04-20'},
];

// ── Helper: find badge config ────────────────────────────────────
function _certFindBadge(type) {
  for (var i = 0; i < CERT_BADGES.length; i++) {
    if (CERT_BADGES[i].id === type) return CERT_BADGES[i];
  }
  return null;
}

// ── Helper: inject keyframe animation once ───────────────────────
var _certGlowInjected = false;
function _certInjectGlow() {
  if (_certGlowInjected) return;
  var style = document.createElement('style');
  style.textContent =
    '@keyframes certGlow{0%,100%{box-shadow:0 0 4px rgba(255,215,0,0.3),0 0 8px rgba(255,215,0,0.1);}50%{box-shadow:0 0 8px rgba(255,215,0,0.5),0 0 16px rgba(255,215,0,0.2);}}' +
    '@keyframes certPulse{0%,100%{opacity:0.8;}50%{opacity:1;}}';
  document.head.appendChild(style);
  _certGlowInjected = true;
}

// ── Helper: shared input field creator ───────────────────────────
function _certMakeField(id, label, placeholder, type, required) {
  var wrap = document.createElement('div');
  var lbl = document.createElement('div');
  lbl.style.cssText = 'font-size:0.65rem;color:var(--silver-dark,#aeaeb2);margin-bottom:0.2rem;';
  lbl.textContent = label + (required ? ' *' : '');
  var inp = document.createElement('input');
  inp.id = id;
  inp.type = type || 'text';
  inp.placeholder = placeholder || '';
  inp.style.cssText = 'width:100%;box-sizing:border-box;background:var(--bg-elevated,#1c1c1e);border:1px solid var(--border,#2c2c2e);border-radius:10px;padding:0.55rem 0.75rem;font-size:0.8rem;color:var(--fg-primary,#f2f2f7);';
  wrap.appendChild(lbl);
  wrap.appendChild(inp);
  return wrap;
}

// ── Helper: shared close button creator ──────────────────────────
function _certCloseBtn(onClick) {
  var btn = document.createElement('button');
  btn.style.cssText = 'position:absolute;top:1rem;right:1rem;background:none;border:none;color:#aeaeb2;font-size:1.1rem;cursor:pointer;padding:4px;z-index:5;';
  btn.textContent = '\u2715';
  btn.onclick = onClick;
  return btn;
}

// ══════════════════════════════════════════════════════════════════
// 1. BADGE RENDERER — window.renderCertBadge(type, size)
// ══════════════════════════════════════════════════════════════════
window.renderCertBadge = function(type, size) {
  var badge = _certFindBadge(type);
  if (!badge) return '<span style="color:#636366;">[?]</span>';

  _certInjectGlow();

  var sizes = {
    sm: {font:'0.65rem', icon:'14px', pad:'1px 6px', radius:'6px',  gap:'2px',  glowSize:'2px 4px'},
    md: {font:'0.72rem', icon:'20px', pad:'3px 10px', radius:'10px', gap:'4px',  glowSize:'4px 8px'},
    lg: {font:'0.85rem', icon:'32px', pad:'6px 16px', radius:'14px', gap:'6px',  glowSize:'6px 12px'},
  };
  var s = sizes[size] || sizes.md;

  return '<span style="display:inline-flex;align-items:center;gap:' + s.gap + ';' +
    'background:rgba(' + _certHexToRgb(badge.color) + ',0.1);' +
    'border:1px solid rgba(' + _certHexToRgb(badge.color) + ',0.4);' +
    'border-radius:' + s.radius + ';padding:' + s.pad + ';' +
    'font-size:' + s.font + ';color:' + badge.color + ';font-weight:700;' +
    'animation:certGlow 3s ease-in-out infinite;' +
    'box-shadow:0 0 ' + s.glowSize + ' rgba(' + _certHexToRgb(badge.color) + ',0.3);' +
    '">' +
    '<span style="font-size:' + s.icon + ';line-height:1;">' + badge.icon + '</span>' +
    '<span style="animation:certPulse 3s ease-in-out infinite;">Verificado</span>' +
    '</span>';
};

// hex to rgb helper for badge colors
function _certHexToRgb(hex) {
  var r = parseInt(hex.slice(1,3),16);
  var g = parseInt(hex.slice(3,5),16);
  var b = parseInt(hex.slice(5,7),16);
  return r + ',' + g + ',' + b;
}

// ══════════════════════════════════════════════════════════════════
// 2. PRICING MODAL — window.showCertificationPricing()
// ══════════════════════════════════════════════════════════════════
window.showCertificationPricing = function() {
  var existingOv = document.getElementById('cert-pricing-ov');
  if (existingOv) existingOv.remove();

  var ov = document.createElement('div');
  ov.id = 'cert-pricing-ov';
  ov.className = 'overlay center';
  ov.style.cssText = 'z-index:77777;';

  var modal = document.createElement('div');
  modal.style.cssText = 'background:linear-gradient(135deg,#111318,#0d1520);border:1px solid rgba(196,129,58,0.3);border-radius:24px;padding:0;overflow:hidden;max-width:440px;width:100%;max-height:90vh;overflow-y:auto;position:relative;';

  // ── Header ──
  var hdr = document.createElement('div');
  hdr.style.cssText = 'background:linear-gradient(135deg,rgba(255,215,0,0.08),rgba(196,129,58,0.04));border-bottom:1px solid rgba(255,215,0,0.15);padding:1.5rem 1.25rem;text-align:center;position:sticky;top:0;z-index:2;backdrop-filter:blur(10px);';

  var hdrIcon = document.createElement('div');
  hdrIcon.style.cssText = 'font-size:2rem;margin-bottom:0.4rem;';
  hdrIcon.textContent = '\u{1F6E1}\uFE0F';
  hdr.appendChild(hdrIcon);

  var hdrTitle = document.createElement('h2');
  hdrTitle.style.cssText = 'font-size:1.15rem;font-weight:800;background:linear-gradient(135deg,#ffd700,#c4813a);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin:0 0 0.3rem;';
  hdrTitle.textContent = 'Certificacion Oficial SwingerSphere';
  hdr.appendChild(hdrTitle);

  var hdrSub = document.createElement('p');
  hdrSub.style.cssText = 'font-size:0.72rem;color:#aeaeb2;margin:0;';
  hdrSub.textContent = 'El sello de confianza del lifestyle';
  hdr.appendChild(hdrSub);

  hdr.appendChild(_certCloseBtn(function() { ov.remove(); }));
  modal.appendChild(hdr);

  // ── Badge Cards ──
  var cardsWrap = document.createElement('div');
  cardsWrap.style.cssText = 'padding:1rem;display:flex;flex-direction:column;gap:0.85rem;';

  for (var bi = 0; bi < CERT_BADGES.length; bi++) {
    (function(badge) {
      var isBusiness = badge.id === 'business';

      var card = document.createElement('div');
      card.style.cssText = 'border:' + (isBusiness ? '2px' : '1px') + ' solid rgba(' + _certHexToRgb(badge.color) + ',' + (isBusiness ? '0.5' : '0.2') + ');border-radius:16px;padding:1.1rem;position:relative;background:rgba(' + _certHexToRgb(badge.color) + ',0.03);transition:border-color 0.3s;';

      // ── Badge preview ──
      var previewWrap = document.createElement('div');
      previewWrap.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:0.75rem;';

      var nameBlock = document.createElement('div');
      nameBlock.style.cssText = 'display:flex;align-items:center;gap:0.5rem;';

      var iconEl = document.createElement('div');
      iconEl.style.cssText = 'font-size:1.6rem;';
      iconEl.textContent = badge.icon;
      nameBlock.appendChild(iconEl);

      var nameInfo = document.createElement('div');
      var nameText = document.createElement('div');
      nameText.style.cssText = 'font-weight:700;font-size:0.92rem;color:' + badge.color + ';';
      nameText.textContent = badge.name;
      nameInfo.appendChild(nameText);

      var descText = document.createElement('div');
      descText.style.cssText = 'font-size:0.62rem;color:#636366;max-width:180px;line-height:1.3;';
      descText.textContent = badge.desc;
      nameInfo.appendChild(descText);
      nameBlock.appendChild(nameInfo);
      previewWrap.appendChild(nameBlock);

      var priceBlock = document.createElement('div');
      priceBlock.style.cssText = 'text-align:right;flex-shrink:0;';
      var priceNum = document.createElement('div');
      priceNum.style.cssText = 'font-size:1.3rem;font-weight:800;color:#f2f2f7;';
      priceNum.textContent = badge.price + '\u20AC';
      priceBlock.appendChild(priceNum);
      var pricePer = document.createElement('div');
      pricePer.style.cssText = 'font-size:0.6rem;color:#aeaeb2;';
      pricePer.textContent = '/' + badge.period;
      priceBlock.appendChild(pricePer);
      previewWrap.appendChild(priceBlock);
      card.appendChild(previewWrap);

      // ── Badge visual preview ──
      var badgePreview = document.createElement('div');
      badgePreview.style.cssText = 'background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:0.6rem;margin-bottom:0.75rem;text-align:center;';
      var previewLabel = document.createElement('div');
      previewLabel.style.cssText = 'font-size:0.58rem;color:#636366;margin-bottom:0.35rem;';
      previewLabel.textContent = 'Vista previa del badge:';
      badgePreview.appendChild(previewLabel);
      var previewBadge = document.createElement('div');
      previewBadge.innerHTML = window.renderCertBadge(badge.id, 'md');
      badgePreview.appendChild(previewBadge);
      card.appendChild(badgePreview);

      // ── Features list ──
      var featList = document.createElement('div');
      featList.style.cssText = 'display:flex;flex-direction:column;gap:0.25rem;margin-bottom:0.85rem;';
      for (var fi = 0; fi < badge.features.length; fi++) {
        var row = document.createElement('div');
        row.style.cssText = 'font-size:0.7rem;color:#aeaeb2;display:flex;align-items:flex-start;gap:0.35rem;';
        var check = document.createElement('span');
        check.style.cssText = 'color:' + badge.color + ';flex-shrink:0;';
        check.textContent = '\u2713';
        row.appendChild(check);
        var feat = document.createElement('span');
        feat.textContent = badge.features[fi];
        row.appendChild(feat);
        featList.appendChild(row);
      }
      card.appendChild(featList);

      // ── Per-month cost ──
      var perMonth = document.createElement('div');
      perMonth.style.cssText = 'font-size:0.62rem;color:#636366;text-align:center;margin-bottom:0.5rem;';
      perMonth.textContent = 'Solo ' + (badge.price / 12).toFixed(2) + ' EUR/mes';
      card.appendChild(perMonth);

      // ── CTA Button ──
      var cta = document.createElement('button');
      cta.style.cssText = 'width:100%;padding:0.65rem;border-radius:10px;font-size:0.8rem;font-weight:700;cursor:pointer;border:none;background:linear-gradient(135deg,' + badge.color + ',' + _certLighten(badge.color) + ');color:' + (badge.id === 'club' ? '#1c1c1e' : '#fff') + ';transition:opacity 0.2s;';
      cta.textContent = 'Solicitar ' + badge.name;
      cta.onclick = function() { window.showCertificationForm(badge.id); };
      card.appendChild(cta);

      cardsWrap.appendChild(card);
    })(CERT_BADGES[bi]);
  }

  modal.appendChild(cardsWrap);

  // ── Footer ──
  var footer = document.createElement('div');
  footer.style.cssText = 'padding:1rem 1.25rem;border-top:1px solid rgba(255,255,255,0.06);text-align:center;';

  var footerLink = document.createElement('button');
  footerLink.style.cssText = 'background:none;border:none;color:var(--copper,#c4813a);font-size:0.72rem;cursor:pointer;text-decoration:underline;padding:0.5rem;';
  footerLink.textContent = 'Ya tienes certificacion? Comprueba tu estado';
  footerLink.onclick = function() { ov.remove(); window.showCertificationStatus(); };
  footer.appendChild(footerLink);

  var footerNote = document.createElement('p');
  footerNote.style.cssText = 'font-size:0.58rem;color:#48484a;margin:0.5rem 0 0;';
  footerNote.textContent = 'Proceso de verificacion: 24-72h · certificacion@swingersphere.com';
  footer.appendChild(footerNote);

  modal.appendChild(footer);

  ov.appendChild(modal);
  ov.onclick = function(e) { if (e.target === ov) ov.remove(); };
  document.body.appendChild(ov);

  if (window.SecurityLog) SecurityLog.write('CERT_PRICING_VIEWED', {ts: new Date().toISOString()});
};

// lighten a hex color helper
function _certLighten(hex) {
  var r = Math.min(255, parseInt(hex.slice(1,3),16) + 40);
  var g = Math.min(255, parseInt(hex.slice(3,5),16) + 40);
  var b = Math.min(255, parseInt(hex.slice(5,7),16) + 40);
  return '#' + r.toString(16).padStart(2,'0') + g.toString(16).padStart(2,'0') + b.toString(16).padStart(2,'0');
}


// ══════════════════════════════════════════════════════════════════
// 3. APPLICATION FORM — window.showCertificationForm(badgeType)
// ══════════════════════════════════════════════════════════════════
window.showCertificationForm = function(badgeType) {
  var badge = _certFindBadge(badgeType);
  if (!badge) { if (typeof showToast === 'function') showToast('Tipo de badge no valido','error'); return; }

  var existingOv = document.getElementById('cert-form-ov');
  if (existingOv) existingOv.remove();

  var ov = document.createElement('div');
  ov.id = 'cert-form-ov';
  ov.className = 'overlay center';
  ov.style.cssText = 'z-index:88888;';

  var modal = document.createElement('div');
  modal.className = 'modal center-modal';
  modal.style.cssText = 'padding:0;max-width:400px;overflow:hidden;max-height:90vh;overflow-y:auto;position:relative;';

  // ── Header ──
  var hdr = document.createElement('div');
  hdr.style.cssText = 'background:linear-gradient(135deg,rgba(' + _certHexToRgb(badge.color) + ',0.1),rgba(' + _certHexToRgb(badge.color) + ',0.03));border-bottom:1px solid rgba(' + _certHexToRgb(badge.color) + ',0.2);padding:1.25rem;text-align:center;position:relative;';

  var hdrIcon = document.createElement('div');
  hdrIcon.style.cssText = 'font-size:1.8rem;margin-bottom:0.3rem;';
  hdrIcon.textContent = badge.icon;
  hdr.appendChild(hdrIcon);

  var hdrTitle = document.createElement('h3');
  hdrTitle.style.cssText = 'font-weight:700;font-size:1rem;color:' + badge.color + ';margin:0 0 0.2rem;';
  hdrTitle.textContent = badge.name;
  hdr.appendChild(hdrTitle);

  var hdrPrice = document.createElement('p');
  hdrPrice.style.cssText = 'font-size:0.75rem;color:#aeaeb2;margin:0;';
  hdrPrice.textContent = badge.price + ' EUR/' + badge.period + ' · Proceso de verificacion';
  hdr.appendChild(hdrPrice);

  hdr.appendChild(_certCloseBtn(function() { ov.remove(); }));
  modal.appendChild(hdr);

  // ── Form ──
  var form = document.createElement('div');
  form.style.cssText = 'padding:1.25rem;display:flex;flex-direction:column;gap:0.65rem;';

  form.appendChild(_certMakeField('cert-biz-name', 'Nombre del negocio', 'Ej: Club Paradise Madrid', 'text', true));
  form.appendChild(_certMakeField('cert-city', 'Ciudad', 'Ej: Madrid, Barcelona...', 'text', true));
  form.appendChild(_certMakeField('cert-email', 'Email de contacto', 'tu@email.com', 'email', true));
  form.appendChild(_certMakeField('cert-cif', 'CIF / NIF', 'Ej: B12345678', 'text', false));
  form.appendChild(_certMakeField('cert-web', 'Web / Instagram', 'https://... o @usuario', 'text', false));

  // Description textarea
  var descWrap = document.createElement('div');
  var descLbl = document.createElement('div');
  descLbl.style.cssText = 'font-size:0.65rem;color:var(--silver-dark,#aeaeb2);margin-bottom:0.2rem;';
  descLbl.textContent = 'Descripcion del negocio';
  var descArea = document.createElement('textarea');
  descArea.id = 'cert-desc';
  descArea.placeholder = 'Describe tu negocio, servicios, experiencia en el lifestyle...';
  descArea.style.cssText = 'width:100%;box-sizing:border-box;background:var(--bg-elevated,#1c1c1e);border:1px solid var(--border,#2c2c2e);border-radius:10px;padding:0.55rem 0.75rem;font-size:0.8rem;color:var(--fg-primary,#f2f2f7);min-height:70px;resize:vertical;font-family:inherit;';
  descWrap.appendChild(descLbl);
  descWrap.appendChild(descArea);
  form.appendChild(descWrap);

  // Document upload placeholder (URL input)
  var docWrap = document.createElement('div');
  var docLbl = document.createElement('div');
  docLbl.style.cssText = 'font-size:0.65rem;color:var(--silver-dark,#aeaeb2);margin-bottom:0.2rem;';
  docLbl.textContent = 'Documento acreditativo (URL)';
  var docHelp = document.createElement('div');
  docHelp.style.cssText = 'font-size:0.58rem;color:#636366;margin-bottom:0.3rem;';
  docHelp.textContent = 'Sube tu documento a Drive/Dropbox y pega el enlace aqui';
  var docInput = document.createElement('input');
  docInput.id = 'cert-doc';
  docInput.type = 'url';
  docInput.placeholder = 'https://drive.google.com/...';
  docInput.style.cssText = 'width:100%;box-sizing:border-box;background:var(--bg-elevated,#1c1c1e);border:1px solid var(--border,#2c2c2e);border-radius:10px;padding:0.55rem 0.75rem;font-size:0.8rem;color:var(--fg-primary,#f2f2f7);';
  docWrap.appendChild(docLbl);
  docWrap.appendChild(docHelp);
  docWrap.appendChild(docInput);
  form.appendChild(docWrap);

  // Terms checkbox
  var termsWrap = document.createElement('div');
  termsWrap.style.cssText = 'display:flex;align-items:flex-start;gap:0.5rem;margin-top:0.25rem;';
  var termsCheck = document.createElement('input');
  termsCheck.type = 'checkbox';
  termsCheck.id = 'cert-terms';
  termsCheck.style.cssText = 'margin-top:2px;accent-color:var(--copper,#c4813a);flex-shrink:0;';
  var termsLabel = document.createElement('label');
  termsLabel.htmlFor = 'cert-terms';
  termsLabel.style.cssText = 'font-size:0.65rem;color:#aeaeb2;cursor:pointer;line-height:1.4;';
  termsLabel.textContent = 'Acepto los terminos de verificacion y confirmo que la informacion proporcionada es veridica';
  termsWrap.appendChild(termsCheck);
  termsWrap.appendChild(termsLabel);
  form.appendChild(termsWrap);

  // Submit button
  var submitBtn = document.createElement('button');
  submitBtn.className = 'btn btn-primary w-full';
  submitBtn.style.cssText = 'margin-top:0.5rem;padding:0.7rem;font-size:0.82rem;';
  submitBtn.textContent = '\u{1F6E1}\uFE0F Enviar solicitud de certificacion';
  submitBtn.onclick = function() {
    var nameVal = document.getElementById('cert-biz-name') ? document.getElementById('cert-biz-name').value.trim() : '';
    var cityVal = document.getElementById('cert-city') ? document.getElementById('cert-city').value.trim() : '';
    var emailVal = document.getElementById('cert-email') ? document.getElementById('cert-email').value.trim() : '';
    var termsVal = document.getElementById('cert-terms') ? document.getElementById('cert-terms').checked : false;

    if (!nameVal || !cityVal || !emailVal) {
      if (typeof showToast === 'function') showToast('Completa los campos obligatorios (nombre, ciudad, email)', 'error');
      return;
    }
    if (!termsVal) {
      if (typeof showToast === 'function') showToast('Debes aceptar los terminos de verificacion', 'error');
      return;
    }

    var request = {
      id: 'CERT-' + Date.now().toString(36).toUpperCase(),
      badgeType: badge.id,
      badgeName: badge.name,
      price: badge.price,
      name: nameVal,
      city: cityVal,
      email: emailVal,
      cif: document.getElementById('cert-cif') ? document.getElementById('cert-cif').value.trim() : '',
      web: document.getElementById('cert-web') ? document.getElementById('cert-web').value.trim() : '',
      desc: document.getElementById('cert-desc') ? document.getElementById('cert-desc').value.trim() : '',
      docUrl: document.getElementById('cert-doc') ? document.getElementById('cert-doc').value.trim() : '',
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };

    // Save to localStorage
    try {
      var requests = JSON.parse(localStorage.getItem('ss_cert_requests') || '[]');
      requests.unshift(request);
      localStorage.setItem('ss_cert_requests', JSON.stringify(requests.slice(0, 100)));
    } catch(e) {
      console.warn('[Certification] Error saving request:', e);
    }

    if (window.SecurityLog) SecurityLog.write('CERT_REQUEST_SUBMITTED', {id: request.id, type: badge.id, name: nameVal});

    ov.remove();

    // Show success confirmation
    _certShowConfirmation(request);
  };
  form.appendChild(submitBtn);

  // Cancel button
  var cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn btn-secondary w-full';
  cancelBtn.style.fontSize = '0.76rem';
  cancelBtn.textContent = 'Cancelar';
  cancelBtn.onclick = function() { ov.remove(); };
  form.appendChild(cancelBtn);

  modal.appendChild(form);
  ov.appendChild(modal);
  ov.onclick = function(e) { if (e.target === ov) ov.remove(); };
  document.body.appendChild(ov);
};

// ── Confirmation overlay after successful submission ─────────────
function _certShowConfirmation(request) {
  if (typeof showToast === 'function') showToast('\u{1F6E1}\uFE0F Solicitud enviada correctamente!', 'copper');

  var ov = document.createElement('div');
  ov.className = 'overlay center';
  ov.style.cssText = 'z-index:99999;';

  var modal = document.createElement('div');
  modal.className = 'modal center-modal';
  modal.style.cssText = 'padding:2rem 1.5rem;max-width:360px;text-align:center;';

  var iconEl = document.createElement('div');
  iconEl.style.cssText = 'font-size:3rem;margin-bottom:0.75rem;';
  iconEl.textContent = '\u2705';
  modal.appendChild(iconEl);

  var title = document.createElement('h3');
  title.style.cssText = 'font-weight:700;font-size:1rem;color:#f2f2f7;margin:0 0 0.5rem;';
  title.textContent = 'Solicitud recibida!';
  modal.appendChild(title);

  var refEl = document.createElement('div');
  refEl.style.cssText = 'background:rgba(196,129,58,0.1);border:1px solid rgba(196,129,58,0.2);border-radius:10px;padding:0.6rem;margin-bottom:0.75rem;';
  var refLabel = document.createElement('div');
  refLabel.style.cssText = 'font-size:0.6rem;color:#aeaeb2;margin-bottom:0.2rem;';
  refLabel.textContent = 'Tu referencia:';
  refEl.appendChild(refLabel);
  var refCode = document.createElement('div');
  refCode.style.cssText = 'font-size:0.9rem;font-weight:700;color:var(--copper,#c4813a);font-family:monospace;';
  refCode.textContent = request.id;
  refEl.appendChild(refCode);
  modal.appendChild(refEl);

  var steps = [
    'Nuestro equipo revisara tu solicitud',
    'Verificaremos la documentacion en 24-72h',
    'Recibiras confirmacion por email a ' + request.email,
    'Una vez aprobado, tu badge se activara automaticamente',
  ];
  var stepsList = document.createElement('div');
  stepsList.style.cssText = 'text-align:left;margin-bottom:1rem;';
  for (var si = 0; si < steps.length; si++) {
    var step = document.createElement('div');
    step.style.cssText = 'font-size:0.68rem;color:#aeaeb2;display:flex;align-items:flex-start;gap:0.35rem;margin-bottom:0.25rem;';
    var num = document.createElement('span');
    num.style.cssText = 'color:var(--copper,#c4813a);font-weight:700;flex-shrink:0;';
    num.textContent = (si + 1) + '.';
    step.appendChild(num);
    var txt = document.createElement('span');
    txt.textContent = steps[si];
    step.appendChild(txt);
    stepsList.appendChild(step);
  }
  modal.appendChild(stepsList);

  var closeBtn = document.createElement('button');
  closeBtn.className = 'btn btn-primary w-full';
  closeBtn.textContent = 'Entendido';
  closeBtn.onclick = function() { ov.remove(); };
  modal.appendChild(closeBtn);

  ov.appendChild(modal);
  ov.onclick = function(e) { if (e.target === ov) ov.remove(); };
  document.body.appendChild(ov);
}


// ══════════════════════════════════════════════════════════════════
// 4. STATUS CHECKER — window.showCertificationStatus()
// ══════════════════════════════════════════════════════════════════
window.showCertificationStatus = function() {
  var existingOv = document.getElementById('cert-status-ov');
  if (existingOv) existingOv.remove();

  var ov = document.createElement('div');
  ov.id = 'cert-status-ov';
  ov.className = 'overlay center';
  ov.style.cssText = 'z-index:77777;';

  var modal = document.createElement('div');
  modal.className = 'modal center-modal';
  modal.style.cssText = 'padding:0;max-width:400px;overflow:hidden;max-height:85vh;overflow-y:auto;position:relative;';

  // Header
  var hdr = document.createElement('div');
  hdr.style.cssText = 'background:linear-gradient(135deg,rgba(255,215,0,0.06),rgba(196,129,58,0.03));border-bottom:1px solid rgba(255,215,0,0.1);padding:1.25rem;text-align:center;position:relative;';

  var hdrIcon = document.createElement('div');
  hdrIcon.style.cssText = 'font-size:1.5rem;margin-bottom:0.3rem;';
  hdrIcon.textContent = '\u{1F50D}';
  hdr.appendChild(hdrIcon);

  var hdrTitle = document.createElement('h3');
  hdrTitle.style.cssText = 'font-weight:700;font-size:1rem;color:#f2f2f7;margin:0 0 0.2rem;';
  hdrTitle.textContent = 'Estado de certificacion';
  hdr.appendChild(hdrTitle);

  var hdrSub = document.createElement('p');
  hdrSub.style.cssText = 'font-size:0.68rem;color:#aeaeb2;margin:0;';
  hdrSub.textContent = 'Consulta el estado de tu solicitud';
  hdr.appendChild(hdrSub);

  hdr.appendChild(_certCloseBtn(function() { ov.remove(); }));
  modal.appendChild(hdr);

  // Search area
  var searchWrap = document.createElement('div');
  searchWrap.style.cssText = 'padding:1rem 1.25rem;';

  var searchRow = document.createElement('div');
  searchRow.style.cssText = 'display:flex;gap:0.5rem;';

  var searchInput = document.createElement('input');
  searchInput.id = 'cert-status-query';
  searchInput.type = 'text';
  searchInput.placeholder = 'Email o nombre del negocio';
  searchInput.style.cssText = 'flex:1;box-sizing:border-box;background:var(--bg-elevated,#1c1c1e);border:1px solid var(--border,#2c2c2e);border-radius:10px;padding:0.55rem 0.75rem;font-size:0.8rem;color:var(--fg-primary,#f2f2f7);';
  searchRow.appendChild(searchInput);

  var searchBtn = document.createElement('button');
  searchBtn.className = 'btn btn-primary';
  searchBtn.style.cssText = 'padding:0.55rem 1rem;font-size:0.78rem;white-space:nowrap;';
  searchBtn.textContent = 'Buscar';

  var resultsContainer = document.createElement('div');
  resultsContainer.id = 'cert-status-results';
  resultsContainer.style.cssText = 'padding:0 1.25rem 1.25rem;';

  searchBtn.onclick = function() {
    var query = (document.getElementById('cert-status-query') ? document.getElementById('cert-status-query').value.trim() : '').toLowerCase();
    if (!query) {
      if (typeof showToast === 'function') showToast('Introduce un email o nombre para buscar', 'error');
      return;
    }
    _certRenderStatusResults(resultsContainer, query);
  };
  searchRow.appendChild(searchBtn);
  searchWrap.appendChild(searchRow);
  modal.appendChild(searchWrap);

  // Results container
  modal.appendChild(resultsContainer);

  ov.appendChild(modal);
  ov.onclick = function(e) { if (e.target === ov) ov.remove(); };
  document.body.appendChild(ov);

  // Allow Enter key search
  searchInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') searchBtn.click();
  });
};

function _certRenderStatusResults(container, query) {
  container.innerHTML = '';

  // Check demo certified businesses
  var demoResults = [];
  for (var di = 0; di < CERTIFIED_DEMO.length; di++) {
    var demo = CERTIFIED_DEMO[di];
    if (demo.name.toLowerCase().indexOf(query) !== -1 ||
        (demo.city && demo.city.toLowerCase().indexOf(query) !== -1) ||
        (demo.org && demo.org.toLowerCase().indexOf(query) !== -1)) {
      demoResults.push(demo);
    }
  }

  // Check localStorage requests
  var pendingResults = [];
  try {
    var stored = JSON.parse(localStorage.getItem('ss_cert_requests') || '[]');
    for (var si = 0; si < stored.length; si++) {
      var req = stored[si];
      if ((req.name && req.name.toLowerCase().indexOf(query) !== -1) ||
          (req.email && req.email.toLowerCase().indexOf(query) !== -1)) {
        pendingResults.push(req);
      }
    }
  } catch(e) {}

  if (demoResults.length === 0 && pendingResults.length === 0) {
    var empty = document.createElement('div');
    empty.style.cssText = 'text-align:center;padding:1.5rem 0;';
    var emptyIcon = document.createElement('div');
    emptyIcon.style.cssText = 'font-size:2rem;margin-bottom:0.5rem;opacity:0.5;';
    emptyIcon.textContent = '\u{1F50E}';
    empty.appendChild(emptyIcon);
    var emptyText = document.createElement('p');
    emptyText.style.cssText = 'font-size:0.75rem;color:#636366;margin:0;';
    emptyText.textContent = 'No se encontraron resultados para "' + query + '"';
    empty.appendChild(emptyText);
    container.appendChild(empty);
    return;
  }

  // Render certified results
  if (demoResults.length > 0) {
    var certHeader = document.createElement('div');
    certHeader.style.cssText = 'font-size:0.72rem;font-weight:700;color:#30d158;margin-bottom:0.5rem;';
    certHeader.textContent = '\u2705 Certificaciones activas';
    container.appendChild(certHeader);

    for (var ci = 0; ci < demoResults.length; ci++) {
      var item = demoResults[ci];
      var badge = _certFindBadge(item.type);
      var card = document.createElement('div');
      card.style.cssText = 'background:rgba(48,209,88,0.05);border:1px solid rgba(48,209,88,0.2);border-radius:12px;padding:0.85rem;margin-bottom:0.5rem;';

      var cardTop = document.createElement('div');
      cardTop.style.cssText = 'display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem;';
      var badgeHtml = document.createElement('span');
      badgeHtml.innerHTML = window.renderCertBadge(item.type, 'sm');
      cardTop.appendChild(badgeHtml);
      var cardName = document.createElement('span');
      cardName.style.cssText = 'font-weight:700;font-size:0.82rem;color:#f2f2f7;';
      cardName.textContent = item.name;
      cardTop.appendChild(cardName);
      card.appendChild(cardTop);

      var details = document.createElement('div');
      details.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:0.3rem;';
      var detailItems = [
        {label:'Tipo', value: badge ? badge.name : item.type},
        {label:'Ciudad', value: item.city || item.org || '-'},
        {label:'Certificado desde', value: item.since},
        {label:'Valido hasta', value: item.expires},
      ];
      for (var ddi = 0; ddi < detailItems.length; ddi++) {
        var dd = document.createElement('div');
        var ddLabel = document.createElement('div');
        ddLabel.style.cssText = 'font-size:0.58rem;color:#636366;';
        ddLabel.textContent = detailItems[ddi].label;
        dd.appendChild(ddLabel);
        var ddVal = document.createElement('div');
        ddVal.style.cssText = 'font-size:0.72rem;color:#aeaeb2;font-weight:600;';
        ddVal.textContent = detailItems[ddi].value;
        dd.appendChild(ddVal);
        details.appendChild(dd);
      }
      card.appendChild(details);
      container.appendChild(card);
    }
  }

  // Render pending results
  if (pendingResults.length > 0) {
    var pendHeader = document.createElement('div');
    pendHeader.style.cssText = 'font-size:0.72rem;font-weight:700;color:#ff9f0a;margin:0.75rem 0 0.5rem;';
    pendHeader.textContent = '\u23F3 Solicitudes pendientes';
    container.appendChild(pendHeader);

    for (var pi = 0; pi < pendingResults.length; pi++) {
      var pReq = pendingResults[pi];
      var pCard = document.createElement('div');
      pCard.style.cssText = 'background:rgba(255,159,10,0.05);border:1px solid rgba(255,159,10,0.2);border-radius:12px;padding:0.85rem;margin-bottom:0.5rem;';

      var pTop = document.createElement('div');
      pTop.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:0.4rem;';
      var pName = document.createElement('div');
      pName.style.cssText = 'font-weight:700;font-size:0.82rem;color:#f2f2f7;';
      pName.textContent = pReq.name || 'Sin nombre';
      pTop.appendChild(pName);
      var pStatus = document.createElement('span');
      pStatus.style.cssText = 'font-size:0.6rem;font-weight:700;color:#ff9f0a;background:rgba(255,159,10,0.12);padding:2px 8px;border-radius:6px;';
      pStatus.textContent = 'Pendiente de revision';
      pTop.appendChild(pStatus);
      pCard.appendChild(pTop);

      var pInfo = document.createElement('div');
      pInfo.style.cssText = 'font-size:0.65rem;color:#aeaeb2;';
      pInfo.textContent = (pReq.badgeName || pReq.badgeType) + ' · Ref: ' + (pReq.id || '-') + ' · ' + (pReq.submittedAt ? pReq.submittedAt.split('T')[0] : '');
      pCard.appendChild(pInfo);
      container.appendChild(pCard);
    }
  }
}


// ══════════════════════════════════════════════════════════════════
// 5. ADMIN VIEW — window.showCertAdmin()
// ══════════════════════════════════════════════════════════════════
window.showCertAdmin = function() {
  console.log('%c\u{1F6E1}\uFE0F SwingerSphere Certification Admin', 'color:#ffd700;font-weight:bold;font-size:14px;');

  // Demo certified
  console.log('%c--- Negocios certificados (demo) ---', 'color:#30d158;font-weight:bold;');
  console.table(CERTIFIED_DEMO);

  // Pending requests from localStorage
  try {
    var requests = JSON.parse(localStorage.getItem('ss_cert_requests') || '[]');
    if (requests.length > 0) {
      console.log('%c--- Solicitudes pendientes (' + requests.length + ') ---', 'color:#ff9f0a;font-weight:bold;');
      console.table(requests);
    } else {
      console.log('%c--- No hay solicitudes pendientes ---', 'color:#636366;');
    }
  } catch(e) {
    console.warn('[Certification] Error reading requests:', e);
  }

  // Badge types
  console.log('%c--- Tipos de badge ---', 'color:#c4813a;font-weight:bold;');
  var badgeSummary = [];
  for (var i = 0; i < CERT_BADGES.length; i++) {
    badgeSummary.push({
      id: CERT_BADGES[i].id,
      name: CERT_BADGES[i].name,
      price: CERT_BADGES[i].price + ' EUR/' + CERT_BADGES[i].period,
      color: CERT_BADGES[i].color,
    });
  }
  console.table(badgeSummary);
};


// ══════════════════════════════════════════════════════════════════
// 6. INTEGRATION HELPERS
// ══════════════════════════════════════════════════════════════════

// getCertBadgeHTML(type) — returns badge HTML for embedding
window.getCertBadgeHTML = function(type) {
  return window.renderCertBadge(type, 'sm');
};

// isCertified(type, name) — checks if a name has certification
window.isCertified = function(type, name) {
  if (!name) return false;
  var lowerName = name.toLowerCase();

  // Check demo data
  for (var i = 0; i < CERTIFIED_DEMO.length; i++) {
    var entry = CERTIFIED_DEMO[i];
    if (entry.type === type && entry.name.toLowerCase() === lowerName) {
      // Check expiry
      var expiryDate = new Date(entry.expires);
      if (expiryDate > new Date()) return true;
    }
  }

  // Check localStorage for approved requests (future-proofing)
  try {
    var requests = JSON.parse(localStorage.getItem('ss_cert_requests') || '[]');
    for (var r = 0; r < requests.length; r++) {
      if (requests[r].badgeType === type &&
          requests[r].name && requests[r].name.toLowerCase() === lowerName &&
          requests[r].status === 'approved') {
        return true;
      }
    }
  } catch(e) {}

  return false;
};


// ══════════════════════════════════════════════════════════════════
// BOOT LOG
// ══════════════════════════════════════════════════════════════════
console.log('\u{1F6E1}\uFE0F SwingerSphere Certification v1.0 | Badges: ' + CERT_BADGES.length + ' tipos | Demo: ' + CERTIFIED_DEMO.length + ' certificados');
