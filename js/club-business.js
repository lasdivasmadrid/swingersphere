/* ============================================================
   SwingerSphere — Club Business CRM Module v1.0.0
   Gestion integral de club: socios, reservas, ticketing,
   estadisticas e IA comercial.
   ============================================================ */

(function() {

  // ── SAMPLE DATA ──────────────────────────────────────────────

  var CLUB_SAMPLE_MEMBERS = [
    {id:1,name:'Laura & Marco',type:'vip',visits:24,lastVisit:'2026-06-14',joinDate:'2024-03-10',email:'laura@email.com',notes:'Pareja habitual viernes'},
    {id:2,name:'Sofia & David',type:'regular',visits:12,lastVisit:'2026-06-10',joinDate:'2024-08-22',email:'sofia@email.com',notes:'Prefieren sala privada'},
    {id:3,name:'Andrea (single)',type:'vip',visits:18,lastVisit:'2026-06-15',joinDate:'2024-05-15',email:'andrea@email.com',notes:'Unicornio VIP'},
    {id:4,name:'Carmen & Javi',type:'regular',visits:8,lastVisit:'2026-06-08',joinDate:'2025-01-10',email:'carmen@email.com',notes:''},
    {id:5,name:'Elena & Pedro',type:'new',visits:2,lastVisit:'2026-06-12',joinDate:'2026-06-01',email:'elena@email.com',notes:'Primera vez en club'},
    {id:6,name:'Marta & Alex',type:'vip',visits:32,lastVisit:'2026-06-16',joinDate:'2023-11-20',email:'marta@email.com',notes:'Organizadores de eventos'},
    {id:7,name:'Lucia & Ivan',type:'regular',visits:6,lastVisit:'2026-05-28',joinDate:'2025-04-05',email:'lucia@email.com',notes:''},
    {id:8,name:'Raquel & Tomas',type:'new',visits:1,lastVisit:'2026-06-16',joinDate:'2026-06-16',email:'raquel@email.com',notes:'Referidos por Laura'}
  ];

  var CLUB_SAMPLE_RESERVATIONS = [
    {id:1,date:'2026-06-17',time:'22:00',name:'Laura & Marco',people:2,status:'confirmed',notes:'Mesa VIP'},
    {id:2,date:'2026-06-17',time:'23:00',name:'Grupo Carlos',people:6,status:'pending',notes:'Cumpleanos'},
    {id:3,date:'2026-06-17',time:'22:30',name:'Sofia & David',people:2,status:'confirmed',notes:''},
    {id:4,date:'2026-06-18',time:'22:00',name:'Marta & Alex',people:4,status:'confirmed',notes:'Traen invitados'},
    {id:5,date:'2026-06-18',time:'23:30',name:'Elena & Pedro',people:2,status:'pending',notes:'Segunda visita'}
  ];

  var CLUB_SAMPLE_EVENTS = [
    {id:1,name:'Noche Tematica Mascaras',date:'2026-06-21',price:30,capacity:60,sold:42},
    {id:2,name:'Singles Friday',date:'2026-06-20',price:20,capacity:40,sold:28},
    {id:3,name:'Pool Party VIP',date:'2026-06-22',price:45,capacity:80,sold:55}
  ];

  var CLUB_MONTHLY_REVENUE = [
    {month:'Ene',revenue:4200},{month:'Feb',revenue:3800},{month:'Mar',revenue:5100},
    {month:'Abr',revenue:4600},{month:'May',revenue:5800},{month:'Jun',revenue:6200}
  ];

  // ── INTERNAL STATE ───────────────────────────────────────────

  var _members = JSON.parse(JSON.stringify(CLUB_SAMPLE_MEMBERS));
  var _reservations = JSON.parse(JSON.stringify(CLUB_SAMPLE_RESERVATIONS));
  var _nextMemberId = 9;
  var _nextReservationId = 6;

  // ── HELPERS ──────────────────────────────────────────────────

  function _secLog(evt, data) {
    if (window.SecurityLog) { SecurityLog.write(evt, data); }
  }

  function _toast(msg, type) {
    if (typeof showToast === 'function') { showToast(msg, type || 'copper'); }
  }

  function _today() {
    var d = new Date();
    var mm = ('0' + (d.getMonth() + 1)).slice(-2);
    var dd = ('0' + d.getDate()).slice(-2);
    return d.getFullYear() + '-' + mm + '-' + dd;
  }

  function _tomorrow() {
    var d = new Date();
    d.setDate(d.getDate() + 1);
    var mm = ('0' + (d.getMonth() + 1)).slice(-2);
    var dd = ('0' + d.getDate()).slice(-2);
    return d.getFullYear() + '-' + mm + '-' + dd;
  }

  function _weekDates() {
    var dates = [];
    var d = new Date();
    var day = d.getDay();
    var start = new Date(d);
    start.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    for (var i = 0; i < 7; i++) {
      var cur = new Date(start);
      cur.setDate(start.getDate() + i);
      var mm = ('0' + (cur.getMonth() + 1)).slice(-2);
      var dd = ('0' + cur.getDate()).slice(-2);
      dates.push(cur.getFullYear() + '-' + mm + '-' + dd);
    }
    return dates;
  }

  function _el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function(k) {
        if (k === 'style' && typeof attrs[k] === 'object') {
          Object.keys(attrs[k]).forEach(function(sk) { node.style[sk] = attrs[k][sk]; });
        } else if (k === 'className') {
          node.className = attrs[k];
        } else if (k.indexOf('on') === 0) {
          node.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
        } else {
          node.setAttribute(k, attrs[k]);
        }
      });
    }
    if (children) {
      if (!Array.isArray(children)) { children = [children]; }
      children.forEach(function(c) {
        if (typeof c === 'string') { node.appendChild(document.createTextNode(c)); }
        else if (c) { node.appendChild(c); }
      });
    }
    return node;
  }

  function _removeOverlay(ov) {
    if (ov && ov.parentNode) { ov.parentNode.removeChild(ov); }
  }

  function _createOverlay() {
    var ov = _el('div', {
      className: 'overlay',
      style: {
        position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
        background: 'rgba(0,0,0,0.85)', zIndex: '9000', overflowY: 'auto',
        display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
        padding: '24px 8px'
      }
    });
    return ov;
  }

  function _createModal(title, onClose) {
    var modal = _el('div', {
      className: 'modal',
      style: {
        background: 'var(--bg-elevated, #1a1a2e)',
        borderRadius: 'var(--radius-lg, 16px)',
        border: '1px solid var(--copper-border, #c4813a)',
        width: '100%', maxWidth: '520px',
        padding: '0', marginTop: '16px',
        maxHeight: '90vh', overflowY: 'auto',
        color: 'var(--fg-primary, #e0e0e0)'
      }
    });

    var header = _el('div', {
      style: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 20px', borderBottom: '1px solid var(--border, #333)',
        position: 'sticky', top: '0', background: 'var(--bg-elevated, #1a1a2e)',
        zIndex: '2', borderRadius: 'var(--radius-lg, 16px) var(--radius-lg, 16px) 0 0'
      }
    });

    var titleEl = _el('h3', {
      style: { margin: '0', fontSize: '18px', color: 'var(--copper, #c4813a)', fontWeight: '700' }
    }, [title]);

    var closeBtn = _el('button', {
      style: {
        background: 'none', border: 'none', color: 'var(--fg-primary, #e0e0e0)',
        fontSize: '22px', cursor: 'pointer', padding: '4px 8px', lineHeight: '1'
      },
      onClick: onClose
    }, ['\u2715']);

    header.appendChild(titleEl);
    header.appendChild(closeBtn);
    modal.appendChild(header);

    var body = _el('div', { style: { padding: '16px 20px' } });
    modal.appendChild(body);
    modal._body = body;
    return modal;
  }

  function _badge(text, color) {
    return _el('span', {
      style: {
        display: 'inline-block', padding: '2px 10px', borderRadius: '12px',
        fontSize: '11px', fontWeight: '700', textTransform: 'uppercase',
        background: color, color: '#000', marginLeft: '6px'
      }
    }, [text]);
  }

  function _typeBadge(type) {
    if (type === 'vip') return _badge('VIP', '#ffd700');
    if (type === 'regular') return _badge('Regular', 'var(--silver, #aaa)');
    return _badge('Nuevo', '#4caf50');
  }

  function _statusBadge(st) {
    if (st === 'confirmed') return _badge('Confirmada', '#4caf50');
    if (st === 'pending') return _badge('Pendiente', '#ffb300');
    return _badge('Cancelada', 'var(--danger, #e53935)');
  }

  function _inputField(label, type, placeholder, id) {
    var wrap = _el('div', { style: { marginBottom: '12px' } });
    var lbl = _el('label', {
      style: { display: 'block', fontSize: '12px', color: 'var(--silver-dark, #888)', marginBottom: '4px' }
    }, [label]);
    var inp = _el('input', {
      type: type || 'text',
      placeholder: placeholder || '',
      id: id || '',
      style: {
        width: '100%', padding: '10px 12px', borderRadius: '10px',
        border: '1px solid var(--border, #333)', background: 'var(--bg-card, #111)',
        color: 'var(--fg-primary, #e0e0e0)', fontSize: '14px', boxSizing: 'border-box'
      }
    });
    wrap.appendChild(lbl);
    wrap.appendChild(inp);
    wrap._input = inp;
    return wrap;
  }

  function _selectField(label, options, id) {
    var wrap = _el('div', { style: { marginBottom: '12px' } });
    var lbl = _el('label', {
      style: { display: 'block', fontSize: '12px', color: 'var(--silver-dark, #888)', marginBottom: '4px' }
    }, [label]);
    var sel = _el('select', {
      id: id || '',
      style: {
        width: '100%', padding: '10px 12px', borderRadius: '10px',
        border: '1px solid var(--border, #333)', background: 'var(--bg-card, #111)',
        color: 'var(--fg-primary, #e0e0e0)', fontSize: '14px', boxSizing: 'border-box'
      }
    });
    options.forEach(function(o) {
      var opt = _el('option', { value: o.value }, [o.label]);
      sel.appendChild(opt);
    });
    wrap.appendChild(lbl);
    wrap.appendChild(sel);
    wrap._select = sel;
    return wrap;
  }

  function _actionBtn(text, onClick, primary) {
    return _el('button', {
      className: primary ? 'btn btn-primary w-full' : 'btn btn-secondary w-full',
      style: {
        padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: '700',
        cursor: 'pointer', marginTop: '8px', border: primary ? 'none' : '1px solid var(--border, #333)',
        background: primary ? 'var(--copper, #c4813a)' : 'transparent',
        color: primary ? '#000' : 'var(--fg-primary, #e0e0e0)', width: '100%'
      },
      onClick: onClick
    }, [text]);
  }

  // ── DASHBOARD ────────────────────────────────────────────────

  window.renderClubDashboard = function(container) {
    if (!container) return;
    container.innerHTML = '';

    _secLog('club_dashboard_open', { timestamp: new Date().toISOString() });

    // header
    var header = _el('div', {
      style: { textAlign: 'center', marginBottom: '20px' }
    });
    var headerTitle = _el('h2', {
      style: {
        color: 'var(--copper, #c4813a)', margin: '0 0 4px 0', fontSize: '22px',
        cursor: 'pointer'
      },
      title: 'Haz clic para editar',
      contentEditable: 'true'
    }, ['\uD83C\uDFDB\uFE0F Tu Club Dashboard']);
    var headerSub = _el('p', {
      style: { margin: '0', fontSize: '13px', color: 'var(--silver-dark, #888)' }
    }, ['Panel de gestion empresarial']);
    header.appendChild(headerTitle);
    header.appendChild(headerSub);
    container.appendChild(header);

    // metrics
    var todayStr = _today();
    var totalMembers = _members.length;
    var todayReservations = _reservations.filter(function(r) { return r.date === todayStr; }).length;
    var currentRevenue = CLUB_MONTHLY_REVENUE[CLUB_MONTHLY_REVENUE.length - 1].revenue;
    var occupancy = Math.round((todayReservations / 10) * 100);
    if (occupancy > 100) occupancy = 100;

    var metrics = [
      { icon: '\uD83D\uDC65', label: 'Socios activos', value: totalMembers, gradient: 'linear-gradient(135deg, #1b5e20, #2e7d32)' },
      { icon: '\uD83D\uDCC5', label: 'Reservas hoy', value: todayReservations, gradient: 'linear-gradient(135deg, #0d47a1, #1565c0)' },
      { icon: '\uD83D\uDCB0', label: 'Ingresos mes', value: currentRevenue + '\u20AC', gradient: 'linear-gradient(135deg, #8b5a2b, #c4813a)' },
      { icon: '\uD83D\uDCCA', label: 'Ocupacion', value: occupancy + '%', gradient: 'linear-gradient(135deg, #4a148c, #7b1fa2)' }
    ];

    var metricsGrid = _el('div', {
      style: {
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px'
      }
    });
    metrics.forEach(function(m) {
      var card = _el('div', {
        style: {
          background: m.gradient, borderRadius: 'var(--radius-lg, 16px)',
          padding: '16px', textAlign: 'center'
        }
      });
      var icon = _el('div', { style: { fontSize: '28px', marginBottom: '4px' } }, [m.icon]);
      var val = _el('div', { style: { fontSize: '24px', fontWeight: '800', color: '#fff' } }, [String(m.value)]);
      var lbl = _el('div', { style: { fontSize: '11px', color: 'rgba(255,255,255,0.8)', marginTop: '2px' } }, [m.label]);
      card.appendChild(icon);
      card.appendChild(val);
      card.appendChild(lbl);
      metricsGrid.appendChild(card);
    });
    container.appendChild(metricsGrid);

    // divider: Acciones rapidas
    var divider1 = _el('div', {
      style: {
        fontSize: '13px', fontWeight: '700', color: 'var(--silver-dark, #888)',
        textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px',
        paddingBottom: '6px', borderBottom: '1px solid var(--border, #333)'
      }
    }, ['Acciones rapidas']);
    container.appendChild(divider1);

    // action buttons
    var actions = [
      { label: '\uD83D\uDC65 Socios', fn: function() { window.showClubMembers(); } },
      { label: '\uD83D\uDCC5 Reservas', fn: function() { window.showClubReservations(); } },
      { label: '\uD83C\uDFAB Ticketing', fn: function() { window.showClubTicketing(); } },
      { label: '\uD83D\uDCCA Estadisticas', fn: function() { window.showClubStats(); } },
      { label: '\uD83E\uDD16 IA Comercial', fn: function() { window.showClubAI(); } },
      { label: '\uD83C\uDFA8 Landing & Banners', fn: function() { window.showClubLandingAndBannersForm(); } }
    ];

    var actionsGrid = _el('div', {
      style: {
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '24px'
      }
    });
    actions.forEach(function(a) {
      var btn = _el('button', {
        style: {
          background: 'var(--bg-card, #1a1a2e)', border: '1px solid var(--border, #333)',
          borderRadius: 'var(--radius-lg, 16px)', padding: '14px 8px',
          color: 'var(--fg-primary, #e0e0e0)', fontSize: '13px', fontWeight: '600',
          cursor: 'pointer', textAlign: 'center', transition: 'border-color 0.2s'
        },
        onClick: a.fn
      }, [a.label]);
      btn.addEventListener('mouseenter', function() { btn.style.borderColor = 'var(--copper, #c4813a)'; });
      btn.addEventListener('mouseleave', function() { btn.style.borderColor = 'var(--border, #333)'; });
      actionsGrid.appendChild(btn);
    });
    container.appendChild(actionsGrid);

    // divider: Actividad reciente
    var divider2 = _el('div', {
      style: {
        fontSize: '13px', fontWeight: '700', color: 'var(--silver-dark, #888)',
        textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px',
        paddingBottom: '6px', borderBottom: '1px solid var(--border, #333)'
      }
    }, ['Actividad reciente']);
    container.appendChild(divider2);

    // recent activity
    var recentItems = [
      { icon: '\uD83D\uDCC5', text: 'Laura & Marco hicieron reserva para esta noche', time: 'Hace 15 min' },
      { icon: '\u2728', text: 'Nuevo socio: Raquel & Tomas', time: 'Hace 1 hora' },
      { icon: '\uD83C\uDFAB', text: '3 entradas vendidas para Pool Party VIP', time: 'Hace 2 horas' },
      { icon: '\u2705', text: 'Reserva confirmada: Sofia & David', time: 'Hace 3 horas' },
      { icon: '\uD83D\uDCB0', text: 'Ingreso registrado: 450 EUR (viernes noche)', time: 'Ayer' }
    ];

    var activityList = _el('div', { style: { marginBottom: '16px' } });
    recentItems.forEach(function(item) {
      var row = _el('div', {
        style: {
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '10px 12px', borderRadius: '12px',
          background: 'var(--bg-card, #111)', marginBottom: '6px',
          border: '1px solid var(--border, #222)'
        }
      });
      var ico = _el('span', { style: { fontSize: '18px', flexShrink: '0' } }, [item.icon]);
      var mid = _el('div', { style: { flex: '1', minWidth: '0' } });
      var txt = _el('div', { style: { fontSize: '13px', color: 'var(--fg-primary, #e0e0e0)' } }, [item.text]);
      var tm = _el('div', { style: { fontSize: '11px', color: 'var(--silver-dark, #888)', marginTop: '2px' } }, [item.time]);
      mid.appendChild(txt);
      mid.appendChild(tm);
      row.appendChild(ico);
      row.appendChild(mid);
      activityList.appendChild(row);
    });
    container.appendChild(activityList);
  };

  // ── CLUB MEMBERS ─────────────────────────────────────────────

  window.showClubMembers = function() {
    _secLog('club_members_open', {});
    var ov = _createOverlay();
    var modal = _createModal('Gestion de Socios', function() { _removeOverlay(ov); });
    var body = modal._body;

    // search
    var searchWrap = _el('div', { style: { marginBottom: '14px' } });
    var searchInput = _el('input', {
      type: 'text',
      placeholder: 'Buscar socio...',
      style: {
        width: '100%', padding: '10px 14px', borderRadius: '12px',
        border: '1px solid var(--border, #333)', background: 'var(--bg-card, #111)',
        color: 'var(--fg-primary, #e0e0e0)', fontSize: '14px', boxSizing: 'border-box'
      }
    });
    searchWrap.appendChild(searchInput);
    body.appendChild(searchWrap);

    var listContainer = _el('div', {});

    function renderMemberList(filter) {
      listContainer.innerHTML = '';
      var filtered = _members.filter(function(m) {
        if (!filter) return true;
        return m.name.toLowerCase().indexOf(filter.toLowerCase()) !== -1;
      });

      if (filtered.length === 0) {
        listContainer.appendChild(_el('p', {
          style: { textAlign: 'center', color: 'var(--silver-dark, #888)', padding: '20px' }
        }, ['No se encontraron socios']));
        return;
      }

      filtered.forEach(function(m) {
        var row = _el('div', {
          style: {
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px', borderRadius: '12px', background: 'var(--bg-card, #111)',
            marginBottom: '8px', border: '1px solid var(--border, #222)'
          }
        });

        var left = _el('div', {});
        var nameRow = _el('div', { style: { display: 'flex', alignItems: 'center', gap: '6px' } });
        nameRow.appendChild(_el('span', { style: { fontWeight: '600', fontSize: '14px' } }, [m.name]));
        nameRow.appendChild(_typeBadge(m.type));
        left.appendChild(nameRow);

        var info = _el('div', {
          style: { fontSize: '12px', color: 'var(--silver-dark, #888)', marginTop: '4px' }
        }, [m.visits + ' visitas \u00B7 Ultima: ' + m.lastVisit]);
        left.appendChild(info);

        if (m.notes) {
          var note = _el('div', {
            style: { fontSize: '11px', color: 'var(--silver-dark, #666)', marginTop: '2px', fontStyle: 'italic' }
          }, [m.notes]);
          left.appendChild(note);
        }

        row.appendChild(left);
        listContainer.appendChild(row);
      });
    }

    searchInput.addEventListener('input', function() {
      renderMemberList(searchInput.value);
    });

    renderMemberList('');
    body.appendChild(listContainer);

    // add member button
    body.appendChild(_actionBtn('\u2795 Anadir socio', function() {
      _showAddMemberForm(ov, function() {
        renderMemberList(searchInput.value);
      });
    }, true));

    ov.appendChild(modal);
    document.body.appendChild(ov);
  };

  window.showClubLandingAndBannersForm = function() {
    var ov = _createOverlay();
    var modal = _createModal('Configuracion: Landing & Anuncios', function() { _removeOverlay(ov); });
    var body = modal._body;

    var profileData = {};
    try {
      profileData = JSON.parse(localStorage.getItem('ss_club_profile') || '{}');
    } catch(e) {}
    
    var bannerData = {};
    try {
      bannerData = JSON.parse(localStorage.getItem('ss_club_custom_banner') || '{}');
    } catch(e) {}

    var section1Title = _el('h4', {
      style: { fontSize: '14px', fontWeight: '700', color: 'var(--copper, #c4813a)', margin: '0 0 12px 0', textTransform: 'uppercase', borderBottom: '1px solid var(--border, #333)', paddingBottom: '4px' }
    }, ['1. Ficha del Club (Landing Page)']);
    body.appendChild(section1Title);

    var nameField = _inputField('Nombre del Club *', 'text', 'Privee Club Madrid', 'crm-land-name');
    nameField._input.value = profileData.name || 'Privee Club Madrid';
    body.appendChild(nameField);

    var cityField = _inputField('Ciudad *', 'text', 'Madrid', 'crm-land-city');
    cityField._input.value = profileData.city || 'Madrid';
    body.appendChild(cityField);

    var addrField = _inputField('Direccion completa *', 'text', 'Calle del Deseo, 24, Madrid', 'crm-land-addr');
    addrField._input.value = profileData.address || 'Calle del Deseo, 24, Madrid';
    body.appendChild(addrField);

    var phoneField = _inputField('Telefono de contacto *', 'text', '+34 600 111 222', 'crm-land-phone');
    phoneField._input.value = profileData.phone || '+34 600 111 222';
    body.appendChild(phoneField);

    var capField = _inputField('Aforo maximo *', 'text', '150 personas', 'crm-land-cap');
    capField._input.value = profileData.capacity || '150 personas';
    body.appendChild(capField);

    var iconField = _inputField('Icono / Emoji de Portada *', 'text', '🏛️', 'crm-land-icon');
    iconField._input.value = profileData.icon || '🏛️';
    body.appendChild(iconField);

    var schedField = _inputField('Horario de apertura *', 'text', 'Viernes y Sabados: 23:00 - 06:00', 'crm-land-sched');
    schedField._input.value = profileData.schedule || 'Viernes y Sabados: 23:00 - 06:00';
    body.appendChild(schedField);

    var amField = _inputField('Comodidades (Separadas por comas) *', 'text', 'Salas de juego privadas, Jacuzzi, Barra libre, Camerinos', 'crm-land-am');
    amField._input.value = profileData.amenities || 'Salas de juego privadas, Jacuzzi climatizado, Barra libre premium, Zonas oscuras (Playrooms), Pista de baile sensual, Camerinos con taquillas';
    body.appendChild(amField);

    var descLabel = _el('label', {
      style: { display: 'block', fontSize: '12px', color: 'var(--silver-dark, #888)', marginBottom: '4px' }
    }, ['Descripcion del local *']);
    var descInput = _el('textarea', {
      id: 'crm-land-desc',
      placeholder: 'Describe el ambiente de tu local...',
      style: {
        width: '100%', height: '80px', padding: '10px 12px', borderRadius: '10px',
        border: '1px solid var(--border, #333)', background: 'var(--bg-card, #111)',
        color: 'var(--fg-primary, #e0e0e0)', fontSize: '14px', boxSizing: 'border-box',
        resize: 'vertical', marginBottom: '16px', fontFamily: 'Inter, sans-serif'
      }
    });
    descInput.value = profileData.description || 'El club swinger y lifestyle mas exclusivo de la capital. Ambiente distinguido para parejas curiosas y experimentadas.';
    body.appendChild(descLabel);
    body.appendChild(descInput);

    var previewLandBtn = _el('button', {
      style: {
        width: '100%', padding: '10px', borderRadius: '10px', background: 'rgba(196,129,58,0.12)',
        border: '1px solid rgba(196,129,58,0.3)', color: 'var(--copper, #c4813a)',
        fontWeight: '700', cursor: 'pointer', fontSize: '13px', marginBottom: '24px'
      },
      onClick: function() {
        var tempProfile = {
          name: nameField._input.value,
          city: cityField._input.value,
          address: addrField._input.value,
          phone: phoneField._input.value,
          capacity: capField._input.value,
          icon: iconField._input.value,
          schedule: schedField._input.value,
          amenities: amField._input.value,
          description: descInput.value
        };
        localStorage.setItem('ss_club_profile', JSON.stringify(tempProfile));
        if (window.showClubLanding) {
          window.showClubLanding('custom');
        } else {
          _toast('Cargando visor de landing...', 'copper');
        }
      }
    }, ['👁️ Previsualizar Ficha / Landing Page']);
    body.appendChild(previewLandBtn);

    var section2Title = _el('h4', {
      style: { fontSize: '14px', fontWeight: '700', color: 'var(--copper, #c4813a)', margin: '0 0 12px 0', textTransform: 'uppercase', borderBottom: '1px solid var(--border, #333)', paddingBottom: '4px' }
    }, ['2. Anuncio en Home (Banner Rotativo)']);
    body.appendChild(section2Title);

    var bTitleField = _inputField('Titular del Banner *', 'text', 'Privee Club Madrid', 'crm-ban-title');
    bTitleField._input.value = bannerData.title || 'Privee Club Madrid';
    body.appendChild(bTitleField);

    var bSubField = _inputField('Subtitulo del Banner (ej: Madrid · TS 98) *', 'text', 'Club Verificado · TS 98', 'crm-ban-sub');
    bSubField._input.value = bannerData.sub || 'Club Verificado · TS 98';
    body.appendChild(bSubField);

    var bDescField = _inputField('Texto descriptivo (breve) *', 'text', 'Fiestas VIP todos los viernes. Reserva mesa exclusiva.', 'crm-ban-desc');
    bDescField._input.value = bannerData.desc || 'Fiestas VIP todos los viernes. Reserva mesa exclusiva.';
    body.appendChild(bDescField);

    var bIconField = _inputField('Icono / Emoji del Banner *', 'text', '🏛️', 'crm-ban-icon');
    bIconField._input.value = bannerData.icon || '🏛️';
    body.appendChild(bIconField);

    var bCtaField = _inputField('Texto del Boton (ej: Ver Landing, Entradas) *', 'text', 'Ver Landing', 'crm-ban-cta');
    bCtaField._input.value = bannerData.cta || 'Ver Landing';
    body.appendChild(bCtaField);

    var previewBanBtn = _el('button', {
      style: {
        width: '100%', padding: '10px', borderRadius: '10px', background: 'rgba(48,209,88,0.1)',
        border: '1px solid rgba(48,209,88,0.25)', color: '#30d158',
        fontWeight: '700', cursor: 'pointer', fontSize: '13px', marginBottom: '16px'
      },
      onClick: function() {
        _toast('Previsualizacion: [' + bIconField._input.value + '] ' + bTitleField._input.value + ' - "' + bDescField._input.value + '"', 'success');
      }
    }, ['👁️ Previsualizar Banner en Home']);
    body.appendChild(previewBanBtn);

    var pubLink = _el('div', {
      style: { textAlign: 'center', fontSize: '12px', marginBottom: '24px' }
    }, [
      _el('span', { style: { color: 'var(--silver-dark, #888)' } }, ['¿Quieres contratar más alcance? ']),
      _el('a', {
        href: '#',
        style: { color: 'var(--copper, #c4813a)', fontWeight: '700', textDecoration: 'underline' },
        onClick: function(e) {
          e.preventDefault();
          if (typeof window.showVenuePricing === 'function') {
            window.showVenuePricing();
          }
        }
      }, ['Ver planes de publicidad'])
    ]);
    body.appendChild(pubLink);

    var saveBtn = _el('button', {
      className: 'btn btn-primary w-full',
      style: { padding: '12px', fontWeight: '700', fontSize: '14px', borderRadius: '12px' },
      onClick: function() {
        if (!nameField._input.value.trim() || !cityField._input.value.trim() || !bTitleField._input.value.trim()) {
          _toast('Por favor, rellena los campos obligatorios (*)', 'error');
          return;
        }

        var profile = {
          name: nameField._input.value,
          city: cityField._input.value,
          address: addrField._input.value,
          phone: phoneField._input.value,
          capacity: capField._input.value,
          icon: iconField._input.value,
          schedule: schedField._input.value,
          amenities: amField._input.value,
          description: descInput.value
        };

        var banner = {
          title: bTitleField._input.value,
          sub: bSubField._input.value,
          desc: bDescField._input.value,
          icon: bIconField._input.value,
          cta: bCtaField._input.value,
          onclick: "showClubLanding('custom')"
        };

        localStorage.setItem('ss_club_profile', JSON.stringify(profile));
        localStorage.setItem('ss_club_custom_banner', JSON.stringify(banner));
        
        _secLog('CRM_PROFILE_UPDATE', { name: profile.name });
        _toast('✅ Configuración de Landing y Banners guardada y publicada.', 'success');
        
        if (typeof window.renderHome === 'function') {
          try {
            var homeEl = document.getElementById('screen-home');
            if (homeEl && homeEl.classList.contains('active')) {
              window.renderHome();
            }
          } catch(e) {}
        }
        
        _removeOverlay(ov);
      }
    }, ['Guardar y Publicar']);
    body.appendChild(saveBtn);

    ov.appendChild(modal);
    document.body.appendChild(ov);
  };

  function _showAddMemberForm(parentOv, onDone) {
    var formOv = _createOverlay();
    formOv.style.zIndex = '9100';
    var formModal = _createModal('Nuevo Socio', function() { _removeOverlay(formOv); });
    var fb = formModal._body;

    var nameField = _inputField('Nombre', 'text', 'Ej: Ana & Luis');
    var emailField = _inputField('Email', 'email', 'correo@email.com');
    var typeField = _selectField('Tipo', [
      { value: 'new', label: 'Nuevo' },
      { value: 'regular', label: 'Regular' },
      { value: 'vip', label: 'VIP' }
    ]);
    var notesField = _inputField('Notas', 'text', 'Notas opcionales...');

    fb.appendChild(nameField);
    fb.appendChild(emailField);
    fb.appendChild(typeField);
    fb.appendChild(notesField);
    fb.appendChild(_actionBtn('\uD83D\uDCBE Guardar socio', function() {
      var n = nameField._input.value.trim();
      var e = emailField._input.value.trim();
      if (!n) { _toast('El nombre es obligatorio', 'error'); return; }

      var newMember = {
        id: _nextMemberId++,
        name: n,
        type: typeField._select.value,
        visits: 0,
        lastVisit: _today(),
        joinDate: _today(),
        email: e,
        notes: notesField._input.value.trim()
      };
      _members.push(newMember);
      _secLog('club_member_added', { name: n });
      _toast('Socio anadido: ' + n, 'success');
      _removeOverlay(formOv);
      if (onDone) onDone();
    }, true));

    formOv.appendChild(formModal);
    document.body.appendChild(formOv);
  }

  // ── CLUB RESERVATIONS ────────────────────────────────────────

  window.showClubReservations = function() {
    _secLog('club_reservations_open', {});
    var ov = _createOverlay();
    var modal = _createModal('Reservas', function() { _removeOverlay(ov); });
    var body = modal._body;

    var activeFilter = 'today';

    // filter row
    var filterRow = _el('div', {
      style: { display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }
    });
    var filters = [
      { key: 'today', label: 'Hoy' },
      { key: 'tomorrow', label: 'Manana' },
      { key: 'week', label: 'Esta semana' }
    ];

    var filterBtns = [];
    filters.forEach(function(f) {
      var btn = _el('button', {
        className: 'chip',
        style: {
          padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
          cursor: 'pointer', border: '1px solid var(--copper-border, #c4813a)',
          background: f.key === activeFilter ? 'var(--copper, #c4813a)' : 'transparent',
          color: f.key === activeFilter ? '#000' : 'var(--fg-primary, #e0e0e0)',
          transition: 'all 0.2s'
        },
        onClick: function() {
          activeFilter = f.key;
          filterBtns.forEach(function(b, idx) {
            b.style.background = filters[idx].key === activeFilter ? 'var(--copper, #c4813a)' : 'transparent';
            b.style.color = filters[idx].key === activeFilter ? '#000' : 'var(--fg-primary, #e0e0e0)';
          });
          renderResList();
        }
      }, [f.label]);
      filterBtns.push(btn);
      filterRow.appendChild(btn);
    });
    body.appendChild(filterRow);

    var listContainer = _el('div', {});

    function renderResList() {
      listContainer.innerHTML = '';
      var todayStr = _today();
      var tomorrowStr = _tomorrow();
      var weekDates = _weekDates();

      var filtered = _reservations.filter(function(r) {
        if (activeFilter === 'today') return r.date === todayStr;
        if (activeFilter === 'tomorrow') return r.date === tomorrowStr;
        return weekDates.indexOf(r.date) !== -1;
      });

      if (filtered.length === 0) {
        listContainer.appendChild(_el('p', {
          style: { textAlign: 'center', color: 'var(--silver-dark, #888)', padding: '20px' }
        }, ['No hay reservas para este periodo']));
        return;
      }

      filtered.forEach(function(r) {
        var row = _el('div', {
          style: {
            padding: '12px', borderRadius: '12px', background: 'var(--bg-card, #111)',
            marginBottom: '8px', border: '1px solid var(--border, #222)'
          }
        });

        var top = _el('div', {
          style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }
        });
        var left = _el('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } });
        left.appendChild(_el('span', { style: { fontWeight: '700', fontSize: '16px', color: 'var(--copper, #c4813a)' } }, [r.time]));
        left.appendChild(_el('span', { style: { fontWeight: '600', fontSize: '14px' } }, [r.name]));
        top.appendChild(left);
        top.appendChild(_statusBadge(r.status));
        row.appendChild(top);

        var details = _el('div', {
          style: { fontSize: '12px', color: 'var(--silver-dark, #888)', marginBottom: '8px' }
        }, [r.people + ' personas' + (r.notes ? ' \u00B7 ' + r.notes : '') + ' \u00B7 ' + r.date]);
        row.appendChild(details);

        if (r.status !== 'cancelled') {
          var btnRow = _el('div', { style: { display: 'flex', gap: '8px' } });
          if (r.status === 'pending') {
            var confirmBtn = _el('button', {
              className: 'btn btn-sm',
              style: {
                padding: '4px 14px', borderRadius: '8px', fontSize: '11px',
                background: '#4caf50', color: '#000', border: 'none', cursor: 'pointer', fontWeight: '600'
              },
              onClick: (function(res) {
                return function() {
                  res.status = 'confirmed';
                  _secLog('reservation_confirmed', { id: res.id });
                  _toast('Reserva confirmada: ' + res.name, 'success');
                  renderResList();
                };
              })(r)
            }, ['\u2705 Confirmar']);
            btnRow.appendChild(confirmBtn);
          }
          var cancelBtn = _el('button', {
            className: 'btn btn-sm',
            style: {
              padding: '4px 14px', borderRadius: '8px', fontSize: '11px',
              background: 'var(--danger, #e53935)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '600'
            },
            onClick: (function(res) {
              return function() {
                res.status = 'cancelled';
                _secLog('reservation_cancelled', { id: res.id });
                _toast('Reserva cancelada: ' + res.name, 'error');
                renderResList();
              };
            })(r)
          }, ['\u274C Cancelar']);
          btnRow.appendChild(cancelBtn);
          row.appendChild(btnRow);
        }

        listContainer.appendChild(row);
      });
    }

    renderResList();
    body.appendChild(listContainer);

    // new reservation
    body.appendChild(_actionBtn('\u2795 Nueva reserva', function() {
      _showAddReservationForm(ov, function() { renderResList(); });
    }, true));

    ov.appendChild(modal);
    document.body.appendChild(ov);
  };

  function _showAddReservationForm(parentOv, onDone) {
    var formOv = _createOverlay();
    formOv.style.zIndex = '9100';
    var formModal = _createModal('Nueva Reserva', function() { _removeOverlay(formOv); });
    var fb = formModal._body;

    var dateField = _inputField('Fecha', 'date', '');
    dateField._input.value = _today();
    var timeField = _inputField('Hora', 'time', '');
    timeField._input.value = '22:00';
    var nameField = _inputField('Nombre', 'text', 'Ej: Ana & Luis');
    var peopleField = _inputField('Personas', 'number', '2');
    peopleField._input.value = '2';
    var notesField = _inputField('Notas', 'text', 'Notas opcionales...');

    fb.appendChild(dateField);
    fb.appendChild(timeField);
    fb.appendChild(nameField);
    fb.appendChild(peopleField);
    fb.appendChild(notesField);

    fb.appendChild(_actionBtn('\uD83D\uDCBE Guardar reserva', function() {
      var n = nameField._input.value.trim();
      if (!n) { _toast('El nombre es obligatorio', 'error'); return; }

      var newRes = {
        id: _nextReservationId++,
        date: dateField._input.value,
        time: timeField._input.value,
        name: n,
        people: parseInt(peopleField._input.value) || 2,
        status: 'pending',
        notes: notesField._input.value.trim()
      };
      _reservations.push(newRes);
      _secLog('reservation_added', { name: n });
      _toast('Reserva creada: ' + n, 'success');
      _removeOverlay(formOv);
      if (onDone) onDone();
    }, true));

    formOv.appendChild(formModal);
    document.body.appendChild(formOv);
  }

  // ── CLUB TICKETING ───────────────────────────────────────────

  window.showClubTicketing = function() {
    _secLog('club_ticketing_open', {});
    var ov = _createOverlay();
    var modal = _createModal('Ticketing', function() { _removeOverlay(ov); });
    var body = modal._body;

    // event list
    CLUB_SAMPLE_EVENTS.forEach(function(ev) {
      var card = _el('div', {
        style: {
          padding: '14px', borderRadius: '12px', background: 'var(--bg-card, #111)',
          marginBottom: '10px', border: '1px solid var(--border, #222)'
        }
      });

      var top = _el('div', {
        style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }
      });
      top.appendChild(_el('div', { style: { fontWeight: '700', fontSize: '14px' } }, [ev.name]));
      top.appendChild(_el('div', { style: { color: 'var(--copper, #c4813a)', fontWeight: '700', fontSize: '14px' } }, [ev.price + '\u20AC']));
      card.appendChild(top);

      var dateInfo = _el('div', {
        style: { fontSize: '12px', color: 'var(--silver-dark, #888)', marginBottom: '8px' }
      }, ['\uD83D\uDCC5 ' + ev.date]);
      card.appendChild(dateInfo);

      // capacity bar
      var pct = Math.round((ev.sold / ev.capacity) * 100);
      var barOuter = _el('div', {
        style: {
          width: '100%', height: '8px', borderRadius: '4px',
          background: 'var(--border, #333)', overflow: 'hidden', marginBottom: '4px'
        }
      });
      var barInner = _el('div', {
        style: {
          width: pct + '%', height: '100%', borderRadius: '4px',
          background: pct > 80 ? 'var(--danger, #e53935)' : 'var(--copper, #c4813a)',
          transition: 'width 0.5s'
        }
      });
      barOuter.appendChild(barInner);
      card.appendChild(barOuter);

      var capText = _el('div', {
        style: { fontSize: '11px', color: 'var(--silver-dark, #888)', textAlign: 'right' }
      }, [ev.sold + '/' + ev.capacity + ' vendidas (' + pct + '%)']);
      card.appendChild(capText);

      body.appendChild(card);
    });

    // generate ticket
    body.appendChild(_actionBtn('\uD83C\uDFAB Generar entrada', function() {
      _showGenerateTicketForm(ov);
    }, true));

    ov.appendChild(modal);
    document.body.appendChild(ov);
  };

  function _showGenerateTicketForm(parentOv) {
    var formOv = _createOverlay();
    formOv.style.zIndex = '9100';
    var formModal = _createModal('Generar Entrada', function() { _removeOverlay(formOv); });
    var fb = formModal._body;

    var eventOptions = CLUB_SAMPLE_EVENTS.map(function(ev) {
      return { value: String(ev.id), label: ev.name + ' (' + ev.price + '\u20AC)' };
    });
    var eventField = _selectField('Evento', eventOptions);
    var buyerField = _inputField('Nombre comprador', 'text', 'Nombre...');
    var qtyField = _inputField('Cantidad', 'number', '1');
    qtyField._input.value = '1';

    fb.appendChild(eventField);
    fb.appendChild(buyerField);
    fb.appendChild(qtyField);

    var ticketContainer = _el('div', {});
    fb.appendChild(ticketContainer);

    fb.appendChild(_actionBtn('\uD83C\uDFAB Generar', function() {
      var buyer = buyerField._input.value.trim();
      if (!buyer) { _toast('Nombre del comprador obligatorio', 'error'); return; }

      var evId = parseInt(eventField._select.value);
      var ev = CLUB_SAMPLE_EVENTS.filter(function(e) { return e.id === evId; })[0];
      var qty = parseInt(qtyField._input.value) || 1;

      _secLog('ticket_generated', { event: ev.name, buyer: buyer, qty: qty });

      ticketContainer.innerHTML = '';

      // ticket visual
      var ticket = _el('div', {
        style: {
          background: '#fff', borderRadius: '16px', padding: '20px',
          textAlign: 'center', marginTop: '16px', color: '#000',
          border: '3px dashed var(--copper, #c4813a)', position: 'relative'
        }
      });

      ticket.appendChild(_el('div', {
        style: { fontSize: '18px', fontWeight: '800', color: '#c4813a', marginBottom: '4px' }
      }, ['SwingerSphere']));
      ticket.appendChild(_el('div', {
        style: { fontSize: '14px', fontWeight: '700', marginBottom: '8px' }
      }, [ev.name]));
      ticket.appendChild(_el('div', {
        style: { fontSize: '12px', color: '#555', marginBottom: '4px' }
      }, ['\uD83D\uDCC5 ' + ev.date + '  \u00B7  ' + qty + ' entrada(s)']));
      ticket.appendChild(_el('div', {
        style: { fontSize: '12px', color: '#555', marginBottom: '12px' }
      }, ['\uD83D\uDC64 ' + buyer]));

      // QR grid 11x11
      var qrWrap = _el('div', {
        style: {
          display: 'inline-grid', gridTemplateColumns: 'repeat(11, 8px)',
          gap: '1px', margin: '0 auto 12px auto'
        }
      });
      for (var i = 0; i < 121; i++) {
        var isBlack = Math.random() > 0.45;
        var cell = _el('div', {
          style: {
            width: '8px', height: '8px',
            background: isBlack ? '#000' : '#fff',
            border: '1px solid #ccc'
          }
        });
        qrWrap.appendChild(cell);
      }
      ticket.appendChild(qrWrap);

      var code = 'SS-' + ev.id + '-' + Date.now().toString(36).toUpperCase();
      ticket.appendChild(_el('div', {
        style: { fontSize: '10px', color: '#888', fontFamily: 'monospace' }
      }, [code]));

      ticketContainer.appendChild(ticket);
      _toast('Entrada generada para ' + buyer, 'success');
    }, true));

    formOv.appendChild(formModal);
    document.body.appendChild(formOv);
  }

  // ── CLUB STATS ───────────────────────────────────────────────

  window.showClubStats = function() {
    _secLog('club_stats_open', {});
    var ov = _createOverlay();
    var modal = _createModal('Estadisticas', function() { _removeOverlay(ov); });
    var body = modal._body;

    // Revenue chart
    body.appendChild(_el('div', {
      style: { fontSize: '13px', fontWeight: '700', color: 'var(--silver-dark, #888)', marginBottom: '8px', textTransform: 'uppercase' }
    }, ['Ingresos mensuales (\u20AC)']));

    var maxRev = 0;
    CLUB_MONTHLY_REVENUE.forEach(function(m) { if (m.revenue > maxRev) maxRev = m.revenue; });

    var chartWrap = _el('div', {
      style: {
        display: 'flex', alignItems: 'flex-end', gap: '8px',
        height: '140px', padding: '8px 0', marginBottom: '20px',
        borderBottom: '1px solid var(--border, #333)'
      }
    });

    CLUB_MONTHLY_REVENUE.forEach(function(m) {
      var h = Math.round((m.revenue / maxRev) * 120);
      var barCol = _el('div', { style: { flex: '1', textAlign: 'center' } });

      var valLabel = _el('div', {
        style: { fontSize: '10px', color: 'var(--silver-dark, #888)', marginBottom: '4px' }
      }, [String(m.revenue)]);
      barCol.appendChild(valLabel);

      var bar = _el('div', {
        style: {
          height: h + 'px', background: 'linear-gradient(180deg, #c4813a, #8b5a2b)',
          borderRadius: '6px 6px 0 0', minWidth: '24px', margin: '0 auto',
          transition: 'height 0.4s'
        }
      });
      barCol.appendChild(bar);

      var label = _el('div', {
        style: { fontSize: '10px', color: 'var(--fg-primary, #e0e0e0)', marginTop: '4px' }
      }, [m.month]);
      barCol.appendChild(label);

      chartWrap.appendChild(barCol);
    });
    body.appendChild(chartWrap);

    // Best days chart
    body.appendChild(_el('div', {
      style: { fontSize: '13px', fontWeight: '700', color: 'var(--silver-dark, #888)', marginBottom: '8px', textTransform: 'uppercase' }
    }, ['Mejores dias de la semana']));

    var dayData = [
      { day: 'Lun', val: 20 }, { day: 'Mar', val: 15 }, { day: 'Mie', val: 25 },
      { day: 'Jue', val: 35 }, { day: 'Vie', val: 90 }, { day: 'Sab', val: 100 }, { day: 'Dom', val: 45 }
    ];

    var daysChart = _el('div', {
      style: {
        display: 'flex', alignItems: 'flex-end', gap: '6px',
        height: '100px', padding: '8px 0', marginBottom: '20px',
        borderBottom: '1px solid var(--border, #333)'
      }
    });

    dayData.forEach(function(d) {
      var h = Math.round((d.val / 100) * 80);
      var col = _el('div', { style: { flex: '1', textAlign: 'center' } });
      var bar = _el('div', {
        style: {
          height: h + 'px',
          background: d.val > 70 ? 'var(--copper, #c4813a)' : 'var(--silver-dark, #666)',
          borderRadius: '4px 4px 0 0', minWidth: '18px', margin: '0 auto'
        }
      });
      col.appendChild(bar);
      col.appendChild(_el('div', {
        style: { fontSize: '10px', color: 'var(--fg-primary, #e0e0e0)', marginTop: '4px' }
      }, [d.day]));
      daysChart.appendChild(col);
    });
    body.appendChild(daysChart);

    // Key metrics
    body.appendChild(_el('div', {
      style: { fontSize: '13px', fontWeight: '700', color: 'var(--silver-dark, #888)', marginBottom: '10px', textTransform: 'uppercase' }
    }, ['Metricas clave']));

    var totalRevenue = 0;
    CLUB_MONTHLY_REVENUE.forEach(function(m) { totalRevenue += m.revenue; });
    var avgPerMember = Math.round(totalRevenue / _members.length);

    var keyMetrics = [
      { label: 'Total socios', value: String(_members.length) },
      { label: 'Reservas este mes', value: String(_reservations.length) },
      { label: 'Ingreso medio/socio', value: avgPerMember + '\u20AC' },
      { label: 'Retencion', value: '78%' }
    ];

    var metricsGrid = _el('div', {
      style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }
    });
    keyMetrics.forEach(function(km) {
      var card = _el('div', {
        style: {
          background: 'var(--bg-card, #111)', borderRadius: '12px',
          padding: '14px', textAlign: 'center', border: '1px solid var(--border, #222)'
        }
      });
      card.appendChild(_el('div', {
        style: { fontSize: '20px', fontWeight: '800', color: 'var(--copper, #c4813a)' }
      }, [km.value]));
      card.appendChild(_el('div', {
        style: { fontSize: '11px', color: 'var(--silver-dark, #888)', marginTop: '4px' }
      }, [km.label]));
      metricsGrid.appendChild(card);
    });
    body.appendChild(metricsGrid);

    ov.appendChild(modal);
    document.body.appendChild(ov);
  };

  // ── CLUB AI ──────────────────────────────────────────────────

  window.showClubAI = function() {
    _secLog('club_ai_open', {});
    var ov = _createOverlay();
    var modal = _createModal('\uD83C\uDF4B Limoncito IA Comercial', function() { _removeOverlay(ov); });
    var body = modal._body;

    var aiResponses = {
      'noche': '\uD83C\uDF19 Segun tus datos, los viernes tienen un 35% mas de ocupacion que el resto de dias. Los sabados son el segundo mejor dia con un 28% mas. Te recomiendo concentrar eventos especiales en viernes y sabados para maximizar ingresos.',
      'precio': '\uD83D\uDCB0 El precio medio de eventos similares en tu zona es 25-35 EUR/pareja. Tus eventos estan bien posicionados. Para noches tematicas premium podrías subir hasta 40-50 EUR sin perder asistencia, especialmente en Pool Party.',
      'comparar': '\uD83D\uDCCA Tu club tiene un 15% mas de socios VIP que la media del sector. Tu tasa de retencion (78%) esta 12 puntos por encima de la media. Area de mejora: la captacion de nuevos socios esta un 5% por debajo.',
      'tendencias': '\uD83D\uDCC8 Las noches tematicas generan un 40% mas de ingresos que las noches regulares. Las fiestas en piscina son tendencia este verano (+60% demanda). Los eventos para singles estan creciendo un 25% interanual.'
    };

    var chatContainer = _el('div', {
      style: {
        minHeight: '200px', maxHeight: '320px', overflowY: 'auto',
        marginBottom: '14px', padding: '8px'
      }
    });

    // welcome message
    var welcomeMsg = _el('div', {
      style: {
        background: 'var(--bg-card, #111)', borderRadius: '12px',
        padding: '12px', marginBottom: '10px', border: '1px solid var(--border, #222)'
      }
    });
    welcomeMsg.appendChild(_el('div', {
      style: { fontSize: '13px', color: 'var(--fg-primary, #e0e0e0)' }
    }, ['\uD83C\uDF4B Hola! Soy Limoncito, tu asistente de IA comercial. Puedo ayudarte con analisis de negocio, precios, tendencias y mas. Selecciona un tema o escribe tu pregunta.']));
    chatContainer.appendChild(welcomeMsg);
    body.appendChild(chatContainer);

    // chip buttons
    var chipsRow = _el('div', {
      style: { display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }
    });

    var chips = [
      { label: '\uD83C\uDF19 Mejor noche?', key: 'noche' },
      { label: '\uD83D\uDCB0 Precio evento?', key: 'precio' },
      { label: '\uD83D\uDCCA Comparar clubs', key: 'comparar' },
      { label: '\uD83D\uDCC8 Tendencias', key: 'tendencias' }
    ];

    function addAIResponse(key) {
      var response = aiResponses[key] || '\uD83E\uDD14 Dejame analizar tus datos... Basandome en la informacion disponible, te recomiendo revisar las estadisticas de tu club para obtener insights mas detallados.';

      var msgBubble = _el('div', {
        style: {
          background: 'var(--bg-card, #111)', borderRadius: '12px',
          padding: '12px', marginBottom: '10px',
          border: '1px solid var(--copper-border, #c4813a)',
          animation: 'fadeIn 0.3s ease'
        }
      });
      msgBubble.appendChild(_el('div', {
        style: { fontSize: '13px', color: 'var(--fg-primary, #e0e0e0)', lineHeight: '1.5' }
      }, [response]));
      chatContainer.appendChild(msgBubble);
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function addUserMessage(text) {
      var userBubble = _el('div', {
        style: {
          background: 'var(--copper, #c4813a)', borderRadius: '12px',
          padding: '10px 14px', marginBottom: '8px', marginLeft: '40px',
          color: '#000', fontSize: '13px', fontWeight: '600', textAlign: 'right'
        }
      }, [text]);
      chatContainer.appendChild(userBubble);
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    chips.forEach(function(c) {
      var chip = _el('button', {
        className: 'chip',
        style: {
          padding: '6px 14px', borderRadius: '20px', fontSize: '12px',
          cursor: 'pointer', border: '1px solid var(--copper-border, #c4813a)',
          background: 'transparent', color: 'var(--fg-primary, #e0e0e0)',
          fontWeight: '600', transition: 'all 0.2s'
        },
        onClick: function() {
          addUserMessage(c.label);
          setTimeout(function() { addAIResponse(c.key); }, 400);
        }
      }, [c.label]);
      chip.addEventListener('mouseenter', function() { chip.style.background = 'var(--copper, #c4813a)'; chip.style.color = '#000'; });
      chip.addEventListener('mouseleave', function() { chip.style.background = 'transparent'; chip.style.color = 'var(--fg-primary, #e0e0e0)'; });
      chipsRow.appendChild(chip);
    });
    body.appendChild(chipsRow);

    // text input
    var inputRow = _el('div', {
      style: { display: 'flex', gap: '8px' }
    });
    var textInput = _el('input', {
      type: 'text',
      placeholder: 'Escribe tu pregunta...',
      style: {
        flex: '1', padding: '10px 14px', borderRadius: '12px',
        border: '1px solid var(--border, #333)', background: 'var(--bg-card, #111)',
        color: 'var(--fg-primary, #e0e0e0)', fontSize: '14px'
      }
    });
    var sendBtn = _el('button', {
      style: {
        padding: '10px 16px', borderRadius: '12px',
        background: 'var(--copper, #c4813a)', border: 'none',
        color: '#000', fontWeight: '700', cursor: 'pointer', fontSize: '16px'
      },
      onClick: function() {
        var q = textInput.value.trim();
        if (!q) return;
        addUserMessage(q);
        textInput.value = '';
        setTimeout(function() { addAIResponse('generic'); }, 500);
      }
    }, ['\u27A4']);

    textInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') { sendBtn.click(); }
    });

    inputRow.appendChild(textInput);
    inputRow.appendChild(sendBtn);
    body.appendChild(inputRow);

    ov.appendChild(modal);
    document.body.appendChild(ov);
  };

  // ── INJECT ANIMATION KEYFRAMES ──────────────────────────────

  var styleTag = document.createElement('style');
  styleTag.textContent = '@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}';
  document.head.appendChild(styleTag);

  // ── BOOT LOG ─────────────────────────────────────────────────

  console.log('%c\uD83C\uDFDB\uFE0F SwingerSphere Club Business CRM v1.0.0 cargado', 'color:#c4813a;font-weight:bold;');

})();
