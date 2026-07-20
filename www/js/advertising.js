/* ═══════════════════════════════════════════════════════════════════
   SWINGERSPHERE — ADVERTISING & VENUES SYSTEM v1.1
   Precios de publicidad para locales, clubs y negocios
   Planes por 45 dias · Precios competitivos
   ═══════════════════════════════════════════════════════════════════ */

'use strict';

var AD_PLANS = [
  {
    id: 'basic',
    name: 'Basico',
    icon: '🏷️',
    price: 40,
    period: '45 dias',
    color: '#aeaeb2',
    features: [
      'Ficha del local en directorio',
      'Nombre + direccion + horario',
      'Contacto visible para usuarios PRO',
      'Badge "Verificado" en directorio',
    ],
    limits: { photos:3, events:1, featured:false, analytics:false, banner:false, landing:false },
  },
  {
    id: 'premium',
    name: 'Premium',
    icon: '⭐',
    price: 100,
    period: '45 dias',
    color: '#c4813a',
    popular: true,
    features: [
      'Todo lo del plan Basico',
      'Hasta 10 fotos del local',
      'Hasta 4 eventos publicados (45 dias)',
      'Aparicion en "Destacados" de tu ciudad',
      'Estadisticas basicas (visitas, clicks)',
      'Badge "Premium ⭐" destacado',
      'Enlace directo a reservas/web',
    ],
    limits: { photos:10, events:4, featured:true, analytics:true, banner:false, landing:false },
  },
  {
    id: 'elite',
    name: 'Elite',
    icon: '💎',
    price: 200,
    period: '45 dias',
    color: '#635bff',
    features: [
      'Todo lo del plan Premium',
      'Fotos ilimitadas + video promo',
      'Eventos ilimitados',
      'Banner publicitario en pantalla Home (1 semana incluida)',
      'Posicion #1 en busquedas de tu ciudad',
      'Estadisticas avanzadas (demograficas, horarios)',
      'Shadow recomienda tu local en consultas',
      'Landing page personalizada dentro de la app',
      'Descuentos automaticos para usuarios PRO',
      'Soporte prioritario + account manager',
    ],
    limits: { photos:999, events:999, featured:true, analytics:true, banner:true, landing:true },
  },
];

var AD_EXTRAS = [
  { id:'banner_home',    name:'Banner en Home',          price:10,  period:'semana', icon:'📢', desc:'Banner visual en la pantalla principal de todos los usuarios' },
  { id:'push_event',     name:'Push de evento',          price:15,  period:'evento', icon:'🔔', desc:'Notificacion push a usuarios de tu ciudad cuando publicas evento' },
  { id:'featured_week',  name:'Destacado de la semana',  price:25,  period:'semana', icon:'🌟', desc:'Tu local aparece primero en la ciudad durante 7 dias' },
  { id:'limoncito_rec',  name:'Recomendacion Shadow', price:20,  period:'45 dias', icon:'👤', desc:'Shadow recomienda tu local cuando le preguntan por tu ciudad' },
  { id:'landing_custom', name:'Landing en la app',       price:199, period:'unico',  icon:'🎨', desc:'Pagina dedicada dentro de la app con galeria, resenas, mapa y reservas' },
  { id:'analytics_pro',  name:'Analytics Pro',           price:25,  period:'45 dias', icon:'📊', desc:'Datos demograficos, horarios pico, comparativa con competencia' },
];

// ── UI: Modal de precios para locales ────────────────────────────
window.showVenuePricing = function() {
  document.getElementById('venue-pricing-ov')?.remove();

  var ov = document.createElement('div');
  ov.id = 'venue-pricing-ov';
  ov.className = 'overlay center';
  ov.style.cssText = 'z-index:77777;';

  var modal = document.createElement('div');
  modal.style.cssText = 'background:linear-gradient(135deg,#111318,#0d1520);border:1px solid rgba(196,129,58,0.3);border-radius:24px;padding:0;overflow:hidden;max-width:440px;width:100%;max-height:90vh;overflow-y:auto;';

  // Header
  var hdr = document.createElement('div');
  hdr.style.cssText = 'background:linear-gradient(135deg,rgba(196,129,58,0.12),rgba(196,129,58,0.04));border-bottom:1px solid rgba(196,129,58,0.2);padding:1.25rem;text-align:center;position:sticky;top:0;z-index:2;backdrop-filter:blur(10px);';
  hdr.innerHTML = '<div style="font-size:1.5rem;margin-bottom:0.3rem;">🏛️</div>' +
    '<h2 style="font-size:1.1rem;font-weight:800;background:linear-gradient(135deg,#f2f2f7,#c4813a);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:0.25rem;">Publicidad para locales</h2>' +
    '<p style="font-size:0.72rem;color:#aeaeb2;">Llega a miles de usuarios lifestyle verificados · Planes de 45 dias</p>';

  var closeBtn = document.createElement('button');
  closeBtn.style.cssText = 'position:absolute;top:1rem;right:1rem;background:none;border:none;color:#aeaeb2;font-size:1.1rem;cursor:pointer;padding:4px;';
  closeBtn.textContent = '\u2715';
  closeBtn.onclick = function(){ ov.remove(); };
  hdr.appendChild(closeBtn);
  modal.appendChild(hdr);

  // Plans
  var plansWrap = document.createElement('div');
  plansWrap.style.cssText = 'padding:1rem;display:flex;flex-direction:column;gap:0.75rem;';

  for (var pi = 0; pi < AD_PLANS.length; pi++) {
    (function(plan) {
      var card = document.createElement('div');
      card.style.cssText = 'border:' + (plan.popular ? '2px' : '1px') + ' solid ' + (plan.popular ? 'rgba(196,129,58,0.5)' : 'rgba(255,255,255,0.08)') + ';border-radius:16px;padding:1rem;position:relative;' + (plan.popular ? 'background:rgba(196,129,58,0.04);' : '');

      if (plan.popular) {
        var badge = document.createElement('div');
        badge.style.cssText = 'position:absolute;top:-8px;right:12px;background:linear-gradient(135deg,#c4813a,#e09455);color:#fff;font-size:0.58rem;font-weight:700;padding:2px 8px;border-radius:6px;';
        badge.textContent = 'MAS POPULAR';
        card.appendChild(badge);
      }

      var planHdr = document.createElement('div');
      planHdr.style.cssText = 'display:flex;align-items:center;gap:0.5rem;margin-bottom:0.625rem;';
      planHdr.innerHTML = '<div style="font-size:1.3rem;">' + plan.icon + '</div>' +
        '<div style="flex:1;"><div style="font-weight:700;font-size:0.9rem;color:' + plan.color + ';">' + plan.name + '</div></div>' +
        '<div style="text-align:right;"><div style="font-size:1.1rem;font-weight:800;color:#f2f2f7;">' + plan.price + ' EUR</div><div style="font-size:0.58rem;color:#aeaeb2;">/' + plan.period + '</div></div>';
      card.appendChild(planHdr);

      var featList = document.createElement('div');
      featList.style.cssText = 'display:flex;flex-direction:column;gap:0.25rem;margin-bottom:0.75rem;';
      for (var fi = 0; fi < plan.features.length; fi++) {
        var row = document.createElement('div');
        row.style.cssText = 'font-size:0.7rem;color:#aeaeb2;display:flex;align-items:flex-start;gap:0.35rem;';
        row.innerHTML = '<span style="color:#30d158;flex-shrink:0;">\u2713</span><span>' + plan.features[fi] + '</span>';
        featList.appendChild(row);
      }
      card.appendChild(featList);

      // Price per day calculation
      var perDay = document.createElement('div');
      perDay.style.cssText = 'font-size:0.62rem;color:#636366;text-align:center;margin-bottom:0.5rem;';
      perDay.textContent = 'Solo ' + (plan.price / 45).toFixed(2) + ' EUR/dia';
      card.appendChild(perDay);

      var cta = document.createElement('button');
      cta.style.cssText = 'width:100%;padding:0.6rem;border-radius:10px;font-size:0.78rem;font-weight:700;cursor:pointer;border:none;' +
        (plan.popular ? 'background:linear-gradient(135deg,#c4813a,#e09455);color:#fff;' : 'background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:#f2f2f7;');
      cta.textContent = 'Solicitar plan ' + plan.name;
      cta.onclick = function(){ showVenueContactForm(plan); };
      card.appendChild(cta);

      plansWrap.appendChild(card);
    })(AD_PLANS[pi]);
  }

  modal.appendChild(plansWrap);

  // Extras section
  var extrasHdr = document.createElement('div');
  extrasHdr.style.cssText = 'padding:0 1rem;margin-bottom:0.5rem;';
  extrasHdr.innerHTML = '<div style="font-size:0.82rem;font-weight:700;color:var(--copper);margin-bottom:0.15rem;">Opciones a la carta</div>' +
    '<div style="font-size:0.65rem;color:#aeaeb2;">Combina con cualquier plan</div>';
  modal.appendChild(extrasHdr);

  var extrasGrid = document.createElement('div');
  extrasGrid.style.cssText = 'padding:0 1rem 1rem;display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;';

  for (var ei = 0; ei < AD_EXTRAS.length; ei++) {
    var extra = AD_EXTRAS[ei];
    var eCard = document.createElement('div');
    eCard.style.cssText = 'background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:0.75rem;';
    eCard.innerHTML = '<div style="font-size:1.1rem;margin-bottom:0.25rem;">' + extra.icon + '</div>' +
      '<div style="font-size:0.72rem;font-weight:700;color:#f2f2f7;margin-bottom:0.15rem;">' + extra.name + '</div>' +
      '<div style="font-size:0.62rem;color:#aeaeb2;margin-bottom:0.35rem;line-height:1.3;">' + extra.desc + '</div>' +
      '<div style="font-size:0.78rem;font-weight:700;color:var(--copper);">' + extra.price + ' EUR<span style="font-size:0.58rem;color:#aeaeb2;font-weight:400;">/' + extra.period + '</span></div>';
    extrasGrid.appendChild(eCard);
  }
  modal.appendChild(extrasGrid);

  // Footer
  var footer = document.createElement('div');
  footer.style.cssText = 'padding:1rem;border-top:1px solid rgba(255,255,255,0.06);text-align:center;';
  footer.innerHTML = '<p style="font-size:0.7rem;color:#aeaeb2;margin-bottom:0.5rem;">Dudas? Contacta con nuestro equipo comercial</p>' +
    '<button onclick="showVenueContactForm()" style="background:linear-gradient(135deg,#c4813a,#e09455);border:none;border-radius:10px;padding:0.6rem 1.5rem;font-size:0.78rem;font-weight:700;color:#fff;cursor:pointer;">📞 Contactar equipo comercial</button>' +
    '<p style="font-size:0.58rem;color:#48484a;margin-top:0.5rem;">comercial@swingersphere.com</p>';
  modal.appendChild(footer);

  ov.appendChild(modal);
  ov.onclick = function(e){ if(e.target===ov) ov.remove(); };
  document.body.appendChild(ov);
};

// ── VENUE CONTACT FORM ───────────────────────────────────────────
window.showVenueContactForm = function(plan) {
  document.getElementById('venue-contact-ov')?.remove();

  var ov = document.createElement('div');
  ov.id = 'venue-contact-ov';
  ov.className = 'overlay center';
  ov.style.zIndex = '88888';

  var modal = document.createElement('div');
  modal.className = 'modal center-modal';
  modal.style.cssText = 'padding:1.5rem;max-width:360px;';

  modal.innerHTML = '<div style="text-align:center;margin-bottom:1rem;">' +
    '<div style="font-size:1.5rem;margin-bottom:0.3rem;">🏛️</div>' +
    '<h3 style="font-weight:700;font-size:0.95rem;margin-bottom:0.2rem;">Solicitud de publicidad</h3>' +
    (plan ? '<p style="font-size:0.72rem;color:var(--copper);">Plan ' + plan.name + ' · ' + plan.price + ' EUR/' + plan.period + '</p>' : '<p style="font-size:0.72rem;color:#aeaeb2;">Cuentanos sobre tu local</p>') +
  '</div>';

  var fields = [
    { id:'vc-name',    label:'Nombre del local *',  placeholder:'Ej: Club Paradise Madrid',  type:'text'  },
    { id:'vc-city',    label:'Ciudad *',             placeholder:'Ej: Madrid, Barcelona...',  type:'text'  },
    { id:'vc-contact', label:'Email de contacto *',  placeholder:'tu@email.com',              type:'email' },
    { id:'vc-phone',   label:'Telefono',             placeholder:'+34 600 000 000',           type:'tel'   },
    { id:'vc-web',     label:'Web / Instagram',      placeholder:'https://...',               type:'url'   },
  ];

  var form = document.createElement('div');
  form.style.cssText = 'display:flex;flex-direction:column;gap:0.625rem;';

  for (var i = 0; i < fields.length; i++) {
    var f = fields[i];
    var wrap = document.createElement('div');
    var lbl = document.createElement('div');
    lbl.style.cssText = 'font-size:0.65rem;color:var(--silver-dark);margin-bottom:0.2rem;';
    lbl.textContent = f.label;
    var inp = document.createElement('input');
    inp.id = f.id; inp.type = f.type; inp.placeholder = f.placeholder;
    inp.style.cssText = 'width:100%;box-sizing:border-box;background:var(--bg-elevated);border:1px solid var(--border);border-radius:10px;padding:0.55rem 0.75rem;font-size:0.8rem;color:var(--fg-primary);';
    wrap.appendChild(lbl); wrap.appendChild(inp);
    form.appendChild(wrap);
  }

  var msgWrap = document.createElement('div');
  var msgLbl = document.createElement('div');
  msgLbl.style.cssText = 'font-size:0.65rem;color:var(--silver-dark);margin-bottom:0.2rem;';
  msgLbl.textContent = 'Mensaje (opcional)';
  var msgArea = document.createElement('textarea');
  msgArea.id = 'vc-msg'; msgArea.placeholder = 'Cuentanos mas sobre tu local, aforo, tipo de evento...';
  msgArea.style.cssText = 'width:100%;box-sizing:border-box;background:var(--bg-elevated);border:1px solid var(--border);border-radius:10px;padding:0.55rem 0.75rem;font-size:0.8rem;color:var(--fg-primary);min-height:60px;resize:vertical;font-family:inherit;';
  msgWrap.appendChild(msgLbl); msgWrap.appendChild(msgArea);
  form.appendChild(msgWrap);

  var submitBtn = document.createElement('button');
  submitBtn.className = 'btn btn-primary w-full';
  submitBtn.textContent = '📨 Enviar solicitud';
  submitBtn.onclick = function() {
    var name = document.getElementById('vc-name') ? document.getElementById('vc-name').value.trim() : '';
    var email = document.getElementById('vc-contact') ? document.getElementById('vc-contact').value.trim() : '';
    if (!name || !email) { showToast('Completa nombre y email','error'); return; }
    var data = {
      plan: plan ? plan.id : 'custom', name: name,
      city: document.getElementById('vc-city') ? document.getElementById('vc-city').value.trim() : '',
      email: email,
      phone: document.getElementById('vc-phone') ? document.getElementById('vc-phone').value.trim() : '',
      web: document.getElementById('vc-web') ? document.getElementById('vc-web').value.trim() : '',
      msg: document.getElementById('vc-msg') ? document.getElementById('vc-msg').value.trim() : '',
      ts: new Date().toISOString(),
    };
    if (window.SecurityLog) SecurityLog.write('VENUE_REQUEST', data);
    if (window.Analytics) window.Analytics.trackEvent('venue_ad_requested', { venueName: data.name, plan: data.plan, contact: data.email || data.phone });
    try { var reqs = JSON.parse(localStorage.getItem('ss_venue_requests')||'[]'); reqs.unshift(data); localStorage.setItem('ss_venue_requests', JSON.stringify(reqs.slice(0,50))); } catch(e){}
    ov.remove();
    showToast('📨 Solicitud enviada! Te contactamos en 24-48h.','copper');
  };
  form.appendChild(submitBtn);

  var cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn btn-secondary w-full';
  cancelBtn.style.fontSize = '0.76rem'; cancelBtn.textContent = 'Cancelar';
  cancelBtn.onclick = function(){ ov.remove(); };
  form.appendChild(cancelBtn);

  modal.appendChild(form);
  ov.appendChild(modal);
  ov.onclick = function(e){ if(e.target===ov) ov.remove(); };
  document.body.appendChild(ov);
};

console.log('📢 SwingerSphere Advertising v1.1 | Plans: 40/100/200 EUR per 45 days');
