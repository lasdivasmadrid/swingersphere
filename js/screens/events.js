/* ═══════════════════════════════════════════════════════════
   SWINGERSPHERE — EVENTS SCREEN
   Calendar · Map (Leaflet) · List views + Radar widget
═══════════════════════════════════════════════════════════ */

import { EVENTS } from '../data/mock.js';

let currentView = 'list';
let leafletMap = null;

export function renderEvents(t) {
  const screen = document.getElementById('screen-events');

  screen.innerHTML = `
    <div class="topbar">
      <div class="topbar-logo">
        <div class="logo-mark">SS</div>
        <span class="logo-text">${t.events_title}</span>
      </div>
      <div class="topbar-actions">
        <button class="btn-icon btn-secondary" id="events-search" style="font-size:1rem;">🔍</button>
      </div>
    </div>

    <div class="scroll-content" style="gap:var(--space-4);">
      <!-- Radar Widget -->
      <div class="radar-widget animate-in">
        <div class="radar-icon">📡</div>
        <div>
          <div style="font-weight:600;font-size:0.9rem;">${t.radar_title}</div>
          <div style="font-size:0.8rem;color:var(--silver-dark);">${t.radar_sub}</div>
          <div class="flex gap-2 mt-2">
            <span class="badge badge-copper">🎉 3 ${t.events_title}</span>
            <span class="badge badge-silver">📍 < 50km</span>
          </div>
        </div>
      </div>

      <!-- View Toggle -->
      <div class="flex items-center justify-between">
        <div class="events-view-toggle">
          <button class="view-toggle-btn active" data-view="list">📋 ${t.view_list}</button>
          <button class="view-toggle-btn" data-view="map">🗺️ ${t.view_map}</button>
          <button class="view-toggle-btn" data-view="calendar">📅 ${t.view_calendar}</button>
        </div>
        <button class="btn btn-primary btn-sm" style="gap:0.25rem;">
          + Crear
        </button>
      </div>

      <!-- Content area -->
      <div id="events-content">
        ${renderEventsList(t)}
      </div>
    </div>

    <!-- Event Detail Modal (hidden) -->
    <div class="overlay" id="event-overlay" style="display:none;"></div>
  `;

  // View toggle
  screen.querySelectorAll('.view-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      screen.querySelectorAll('.view-toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentView = btn.dataset.view;
      switchView(t);
    });
  });

  attachEventCardEvents(t);
}

function switchView(t) {
  const content = document.getElementById('events-content');
  content.style.opacity = '0';
  setTimeout(() => {
    if (currentView === 'list')     content.innerHTML = renderEventsList(t);
    if (currentView === 'map')      content.innerHTML = renderEventsMap(t);
    if (currentView === 'calendar') content.innerHTML = renderCalendar(t);
    content.style.opacity = '1';
    content.style.transition = 'opacity 0.2s';

    if (currentView === 'map') initLeafletMap(t);
    if (currentView !== 'map' && leafletMap) { leafletMap.remove(); leafletMap = null; }
    attachEventCardEvents(t);
  }, 150);
}

function renderEventsList(t) {
  return `
    <div class="flex flex-col gap-3 stagger">
      ${EVENTS.map((ev, i) => `
        <div class="event-card animate-in" style="animation-delay:${i*80}ms;" data-event="${ev.id}">
          <div class="event-cover" style="background:${ev.color};">
            <div class="event-cover-art">${ev.emoji}</div>
            ${ev.clubVerified ? `
              <div style="position:absolute;top:0.75rem;left:0.75rem;">
                <span class="badge badge-verified">✓ ${t.event_verified}</span>
              </div>
            ` : ''}
            <div style="position:absolute;top:0.75rem;right:0.75rem;">
              ${ev.anonymous
                ? '<span class="badge badge-silver">👥 Anónimo</span>'
                : '<span class="badge badge-copper">👁 Lista visible</span>'}
            </div>
          </div>
          <div class="event-info">
            <div class="event-title">${ev.title}</div>
            <div class="event-meta-row">
              <span>📅 ${ev.date}</span>
              <span>🕐 ${ev.time}</span>
            </div>
            <div class="event-meta-row">
              <span>📍 ${ev.location}</span>
              <span>👥 ${ev.attendees}/${ev.maxAttendees} ${t.attendees}</span>
            </div>
            <div class="flex items-center justify-between mt-3">
              <div class="flex gap-2">
                ${ev.tags.map(tag => `<span class="chip">${tag}</span>`).join('')}
              </div>
              <div style="font-size:0.8rem;font-weight:600;color:var(--copper);">${ev.price}</div>
            </div>
            <div class="progress-bar mt-3">
              <div class="progress-fill" style="width:${Math.round(ev.attendees/ev.maxAttendees*100)}%"></div>
            </div>
            <div style="font-size:0.7rem;color:var(--silver-dark);margin-top:4px;">
              ${Math.round(ev.attendees/ev.maxAttendees*100)}% de capacidad
            </div>
            <button class="btn btn-primary w-full mt-3 rsvp-btn" data-event="${ev.id}" data-title="${ev.title}">
              🎟️ ${t.rsvp}
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderEventsMap(t) {
  return `
    <div>
      <div id="events-map"></div>
      <div class="flex flex-col gap-3 mt-4">
        ${EVENTS.slice(0,3).map(ev => `
          <div class="flex items-center gap-3 event-card" data-event="${ev.id}" style="padding:var(--space-3) var(--space-4);">
            <div style="font-size:1.75rem;width:44px;text-align:center;">${ev.emoji}</div>
            <div style="flex:1;">
              <div style="font-weight:600;font-size:0.875rem;">${ev.title}</div>
              <div style="font-size:0.75rem;color:var(--silver-dark);">📍 ${ev.location} · 📅 ${ev.date}</div>
            </div>
            <span style="color:var(--silver-dark);">›</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderCalendar(t) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = now.getDate();

  // Events on which days
  const eventDays = new Set([6, 15, 20]);

  const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const dayNames = ['D','L','M','X','J','V','S'];

  let calHtml = `
    <div>
      <div class="flex items-center justify-between" style="padding:0 var(--space-5) var(--space-3);">
        <button class="btn-icon btn-secondary">‹</button>
        <span style="font-weight:600;">${monthNames[month]} ${year}</span>
        <button class="btn-icon btn-secondary">›</button>
      </div>
      <div class="calendar-grid">
        ${dayNames.map(d => `<div class="cal-day-header">${d}</div>`).join('')}
        ${Array(firstDay === 0 ? 6 : firstDay - 1).fill('').map(() => `<div class="cal-day other-month"></div>`).join('')}
        ${Array.from({length: daysInMonth}, (_, i) => i + 1).map(day => `
          <div class="cal-day ${day === today ? 'today' : ''} ${eventDays.has(day) ? 'has-event' : ''}">
            ${day}
          </div>
        `).join('')}
      </div>
      <div style="padding:0 var(--space-5);margin-top:var(--space-4);">
        <div class="divider-label"><span>Próximos en este mes</span></div>
        <div class="flex flex-col gap-3 mt-4">
          ${EVENTS.slice(0,3).map(ev => `
            <div class="flex items-center gap-3 event-card" data-event="${ev.id}" style="padding:var(--space-3) var(--space-4);">
              <div style="
                min-width:40px;text-align:center;
                background:var(--copper-glow);border:1px solid var(--copper-border);
                border-radius:var(--radius-md);padding:0.25rem;
              ">
                <div style="font-size:1.25rem;">${ev.emoji}</div>
              </div>
              <div style="flex:1;">
                <div style="font-weight:600;font-size:0.875rem;">${ev.title}</div>
                <div style="font-size:0.75rem;color:var(--silver-dark);">📅 ${ev.date}</div>
              </div>
              <button class="btn btn-secondary btn-sm rsvp-btn" data-event="${ev.id}" data-title="${ev.title}">
                ${t.rsvp}
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
  return calHtml;
}

function initLeafletMap(t) {
  if (!window.L) {
    // Leaflet not loaded yet
    const mapEl = document.getElementById('events-map');
    if (mapEl) {
      mapEl.innerHTML = `<div style="height:100%;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:0.5rem;color:var(--silver-dark);">
        <div class="spinner"></div>
        <span>Cargando mapa...</span>
      </div>`;
    }
    return;
  }

  const mapEl = document.getElementById('events-map');
  if (!mapEl || leafletMap) return;

  try {
    leafletMap = L.map('events-map', {
      center: [41.0, 2.0],
      zoom: 5,
      zoomControl: true,
      attributionControl: false,
    });

    // Dark tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(leafletMap);

    // Custom copper marker icon
    function createMarkerIcon(emoji) {
      return L.divIcon({
        className: '',
        html: `
          <div style="
            background:linear-gradient(135deg,#c4813a,#e09455);
            width:40px;height:40px;
            border-radius:50% 50% 50% 0;
            transform:rotate(-45deg);
            border:2px solid rgba(255,255,255,0.3);
            box-shadow:0 4px 12px rgba(196,129,58,0.5);
            display:flex;align-items:center;justify-content:center;
          ">
            <span style="transform:rotate(45deg);font-size:1.1rem;">${emoji}</span>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -44],
      });
    }

    // Add markers for each event
    EVENTS.forEach(ev => {
      const marker = L.marker([ev.lat, ev.lng], {
        icon: createMarkerIcon(ev.emoji),
        title: ev.title,
      }).addTo(leafletMap);

      marker.bindPopup(`
        <div style="min-width:200px;font-family:Inter,sans-serif;">
          <div style="font-weight:700;font-size:0.875rem;margin-bottom:0.25rem;color:#f2f2f7;">${ev.title}</div>
          <div style="font-size:0.75rem;color:#a0a0b0;margin-bottom:0.5rem;">📍 ${ev.location} · 📅 ${ev.date}</div>
          <div style="font-size:0.75rem;color:#a0a0b0;">👥 ${ev.attendees}/${ev.maxAttendees}</div>
          <div style="margin-top:0.5rem;font-size:0.75rem;font-weight:600;color:#c4813a;">${ev.price}</div>
          <button onclick="document.getElementById('event-overlay').style.display='flex';window.openEventDetail('${ev.id}')"
            style="
              margin-top:0.5rem;width:100%;padding:0.4rem;
              background:linear-gradient(135deg,#c4813a,#e09455);
              border:none;border-radius:8px;color:white;
              font-size:0.75rem;font-weight:600;cursor:pointer;
            ">🎟️ ${t.rsvp}</button>
        </div>
      `);
    });

    // Fit bounds to all markers
    const bounds = EVENTS.map(ev => [ev.lat, ev.lng]);
    leafletMap.fitBounds(bounds, { padding: [40, 40] });
  } catch (e) {
    console.warn('Leaflet map error:', e);
  }
}

function attachEventCardEvents(t) {
  document.querySelectorAll('.rsvp-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const title = btn.dataset.title;
      window.showConsentVault(`reservar entrada para "${title}"`, () => {
        showQRTicket(title, t);
      }, t);
    });
  });

  document.querySelectorAll('.event-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.rsvp-btn')) return;
      const evId = card.dataset.event;
      if (evId) {
        window.openEventDetail(evId, t);
      }
    });
  });
}

window.openEventDetail = function(evId, t) {
  const ev = EVENTS.find(e => e.id === evId);
  if (!ev) return;

  t = t || window._currentT || {};

  const overlay = document.getElementById('event-overlay');
  if (!overlay) return;
  overlay.style.display = 'flex';

  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-handle"></div>
      <div class="event-cover" style="background:${ev.color};border-radius:var(--radius-xl);margin-bottom:1rem;">
        <div class="event-cover-art">${ev.emoji}</div>
      </div>
      <h2 style="font-size:1.35rem;font-weight:700;margin-bottom:0.5rem;">${ev.title}</h2>
      <div style="display:flex;flex-wrap:wrap;gap:0.5rem;margin-bottom:1rem;">
        ${ev.tags.map(tag => `<span class="chip active">${tag}</span>`).join('')}
      </div>
      <div style="color:var(--silver);font-size:0.875rem;line-height:1.7;margin-bottom:1rem;">
        <div>📅 ${ev.date} · 🕐 ${ev.time}</div>
        <div>📍 ${ev.location}</div>
        <div>👥 ${ev.attendees}/${ev.maxAttendees} asistentes · ${ev.anonymous ? '🔒 Anónimo' : '👁 Lista visible'}</div>
        <div style="color:var(--copper);font-weight:600;margin-top:0.5rem;">💰 ${ev.price}</div>
      </div>
      <div class="progress-bar mb-2">
        <div class="progress-fill" style="width:${Math.round(ev.attendees/ev.maxAttendees*100)}%"></div>
      </div>
      <div style="font-size:0.75rem;color:var(--silver-dark);margin-bottom:1rem;">
        ${Math.round(ev.attendees/ev.maxAttendees*100)}% de capacidad
      </div>
      <div class="flex gap-3">
        <button class="btn btn-secondary flex-1" onclick="document.getElementById('event-overlay').style.display='none'">Cerrar</button>
        <button class="btn btn-primary flex-1" onclick="document.getElementById('event-overlay').style.display='none';window.showConsentVault('reservar entrada para \\'${ev.title}\\'',()=>window.showQRTicket('${ev.title}'),window._currentT||{})">
          🎟️ ${t.rsvp || 'Reservar'}
        </button>
      </div>
    </div>
  `;

  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.style.display = 'none'; });
};

function showQRTicket(title, t) {
  const modal = document.createElement('div');
  modal.className = 'overlay';
  modal.innerHTML = `
    <div class="modal center-modal" style="text-align:center;padding:2rem;">
      <div style="font-size:2rem;margin-bottom:1rem;">🎟️</div>
      <h3 style="font-weight:700;margin-bottom:0.5rem;">${title}</h3>
      <p style="font-size:0.8rem;color:var(--silver-dark);margin-bottom:1.5rem;">Entrada confirmada</p>
      <!-- QR Code simulation -->
      <div style="
        width:160px;height:160px;margin:0 auto 1.5rem;
        background:white;border-radius:var(--radius-md);
        display:flex;align-items:center;justify-content:center;
        font-size:0.7rem;color:#333;
        padding:0.5rem;
        box-shadow:var(--shadow-md);
      ">
        ${generateQRPattern()}
      </div>
      <div style="
        font-family:var(--font-mono);font-size:0.75rem;
        color:var(--silver-dark);background:var(--bg-elevated);
        padding:0.5rem 1rem;border-radius:var(--radius-md);
        border:1px solid var(--border);margin-bottom:1rem;
      ">SS-${Math.random().toString(36).substr(2,8).toUpperCase()}</div>
      <p style="font-size:0.75rem;color:var(--copper);">🛡️ Protegido por SwingerSphere · Passport Lifestyle™ ganado</p>
      <button class="btn btn-primary w-full mt-4" onclick="this.closest('.overlay').remove();window.showToast('🏆 Passport Lifestyle™ stamp añadido: ${title.split(' ')[0]}','copper')">
        ¡Perfecto!
      </button>
    </div>
  `;
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);
}

window.showQRTicket = showQRTicket;

function generateQRPattern() {
  // Simulate QR grid visual
  let html = '<div style="display:grid;grid-template-columns:repeat(10,1fr);gap:1px;width:140px;">';
  for (let i = 0; i < 100; i++) {
    const filled = Math.random() > 0.5;
    html += `<div style="width:13px;height:13px;background:${filled ? '#000' : '#fff'};"></div>`;
  }
  html += '</div>';
  return html;
}
