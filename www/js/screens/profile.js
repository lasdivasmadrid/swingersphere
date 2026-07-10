/* ═══════════════════════════════════════════════════════════
   SWINGERSPHERE — PROFILE SCREEN
   TrustScore™ · Passport Lifestyle™ · Álbumes por capas
═══════════════════════════════════════════════════════════ */

import { MY_PROFILE, PASSPORT_STAMPS, VERIFICATION_LABELS, PRIVACY_LABELS } from '../data/mock.js';
import { MARKET_CATEGORIES } from '../data/mock.js';

export function renderProfile(t) {
  const user = MY_PROFILE;
  const verify = VERIFICATION_LABELS[user.verifyLevel];

  const screen = document.getElementById('screen-profile');
  screen.innerHTML = `
    <!-- Cover -->
    <div class="profile-cover" style="background:${user.coverGradient};">
      <div class="profile-cover-overlay"></div>
      <div class="profile-avatar-wrap">
        <div class="avatar-placeholder avatar-2xl" style="
          background:linear-gradient(135deg,${user.colorAccent}33,${user.colorAccent}77);
          border:3px solid ${user.colorAccent}88;
          box-shadow:0 0 24px ${user.colorAccent}44;
        ">
          <span style="font-size:2.5rem;font-weight:800;color:${user.colorAccent};">${user.initials}</span>
        </div>
      </div>
      <!-- Cover actions -->
      <div style="position:absolute;top:1rem;right:1rem;display:flex;gap:0.5rem;">
        <button class="btn-icon btn-secondary glass-panel" id="profile-settings" style="font-size:1rem;">⚙️</button>
        <button class="btn-icon btn-secondary glass-panel" id="profile-qr" style="font-size:1rem;">📱</button>
      </div>
    </div>

    <div class="profile-body">
      <!-- Identity -->
      <div class="profile-identity">
        <div>
          <div class="profile-name">${user.name}</div>
          <div class="profile-username">${user.username}</div>
          <div class="profile-badges">
            <span class="verify-badge ${verify.color}">${verify.icon} ${verify.label}</span>
            ${user.online ? '<span class="badge-online" style="display:inline-block;"></span>' : ''}
            <span class="badge badge-silver">📍 ${user.locationApprox}</span>
            <span class="badge badge-silver">🌐 ${user.languages.join(' · ').toUpperCase()}</span>
          </div>
        </div>
        <button class="btn btn-secondary btn-sm" id="edit-profile-btn">✏️ ${t.profile_edit}</button>
      </div>

      <!-- Bio -->
      <p class="profile-bio">${user.bio}</p>

      <!-- Interests -->
      <div class="flex flex-wrap gap-2">
        ${user.interests.map(i => `<span class="chip active">🏷 ${i}</span>`).join('')}
      </div>

      <!-- Stats -->
      <div class="profile-stats-row">
        <div class="profile-stat">
          <div class="profile-stat-value">${user.eventsAttended}</div>
          <div class="profile-stat-label">${t.profile_events_att}</div>
        </div>
        <div class="profile-stat">
          <div class="profile-stat-value">${user.communities}</div>
          <div class="profile-stat-label">${t.profile_communities}</div>
        </div>
        <div class="profile-stat">
          <div class="profile-stat-value">${user.followers}</div>
          <div class="profile-stat-label">${t.profile_followers}</div>
        </div>
      </div>

      <!-- TrustScore™ -->
      <div class="trust-section" id="trust-section">
        <div class="trust-gauge-wrap">
          <div class="trust-gauge" id="trust-gauge">
            <svg viewBox="0 0 120 120" width="120" height="120">
              <!-- Background track -->
              <circle
                cx="60" cy="60" r="50"
                fill="none"
                stroke="var(--graphite-dark)"
                stroke-width="8"
                stroke-dasharray="251.2 251.2"
                stroke-linecap="round"
              />
              <!-- Animated score arc -->
              <circle
                id="trust-arc"
                cx="60" cy="60" r="50"
                fill="none"
                stroke="url(#trustGradient)"
                stroke-width="8"
                stroke-dasharray="0 251.2"
                stroke-linecap="round"
                style="transition: stroke-dasharray 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);"
              />
              <defs>
                <linearGradient id="trustGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#c4813a"/>
                  <stop offset="100%" stop-color="#30d158"/>
                </linearGradient>
              </defs>
            </svg>
            <div class="trust-gauge-label">
              <span class="trust-score-number" id="trust-number" style="color:var(--copper);">0</span>
              <span class="trust-score-tag">${t.profile_trust}</span>
            </div>
          </div>
          <div class="badge badge-copper" style="font-size:11px;">ÉLITE</div>
        </div>

        <div class="trust-breakdown">
          ${Object.entries(user.trustBreakdown).map(([key, val]) => {
            const labelKey = `trust_${key}`;
            const label = t[labelKey] || key;
            return `
              <div class="trust-bar-item">
                <div class="trust-bar-label">
                  <span>${label}</span>
                  <span style="color:var(--copper);font-weight:600;">${val}%</span>
                </div>
                <div class="progress-bar" style="height:3px;">
                  <div class="progress-fill trust-bar-fill" style="width:0%;transition:width 1s ease;" data-target="${val}"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Verification Levels -->
      <div>
        <div class="section-header">
          <div class="section-title">🛡️ ${t.profile_verify}</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;">
          ${[0,1,2,3,4].map(level => {
            const v = VERIFICATION_LABELS[level];
            const completed = level <= user.verifyLevel;
            return `
              <div style="
                background:${completed ? 'var(--copper-glow)' : 'var(--bg-elevated)'};
                border:1px solid ${completed ? 'var(--copper-border)' : 'var(--border)'};
                border-radius:var(--radius-lg);
                padding:var(--space-3);
                display:flex;align-items:center;gap:var(--space-3);
                ${level === 4 ? 'grid-column:span 2;' : ''}
              ">
                <span style="font-size:1.25rem;opacity:${completed ? 1 : 0.4};">${v.icon}</span>
                <div>
                  <div style="font-size:0.75rem;font-weight:600;color:${completed ? 'var(--white)' : 'var(--silver-dark)'};">Nivel ${level}</div>
                  <div style="font-size:0.7rem;color:${completed ? 'var(--copper)' : 'var(--silver-dark)'};">${v.label}</div>
                </div>
                ${completed ? `<span style="margin-left:auto;color:var(--verified);">✓</span>` : `<button style="margin-left:auto;font-size:0.7rem;color:var(--copper);cursor:pointer;background:none;border:none;" class="verify-cta" data-level="${level}">Verificar ›</button>`}
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Passport Lifestyle™ -->
      <div>
        <div class="section-header">
          <div class="section-title">✈️ ${t.profile_passport}</div>
          <span class="badge badge-copper">${user.passportStamps.length} sellos</span>
        </div>
        <div class="passport-wall">
          ${PASSPORT_STAMPS.map(stamp => `
            <div class="passport-stamp" title="${stamp.label}">
              <div class="stamp-hex ${stamp.earned ? 'earned' : 'locked'}">
                ${stamp.emoji}
              </div>
              <div class="stamp-label">${stamp.label}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Albums -->
      <div>
        <div class="section-header">
          <div class="section-title">📷 ${t.profile_albums}</div>
          <button class="btn btn-ghost btn-sm" id="add-photo-btn">+ Añadir</button>
        </div>

        <!-- Privacy legend -->
        <div class="flex flex-wrap gap-2 mb-3">
          ${Object.entries(PRIVACY_LABELS).map(([k,v]) => `
            <span class="privacy-lock ${v.css}">${v.icon} ${v.label}</span>
          `).join('')}
        </div>

        <div class="album-grid">
          ${user.albumItems.map(item => {
            const priv = PRIVACY_LABELS[item.privacy];
            const isRestricted = !['public'].includes(item.privacy);
            return `
              <div class="album-item" title="${priv.label}">
                <div style="font-size:2rem;">${item.emoji}</div>
                ${isRestricted ? `
                  <div class="album-privacy-overlay">
                    <span title="${priv.label}" style="font-size:1.25rem;">${priv.icon}</span>
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Ghost Mode -->
      <div class="card-glass p-5" style="padding:var(--space-5);">
        <div class="flex items-center justify-between">
          <div>
            <div style="font-weight:600;margin-bottom:0.25rem;">👻 Modo Fantasma</div>
            <div style="font-size:0.8rem;color:var(--silver-dark);">Nadie te encontrará en búsquedas</div>
          </div>
          <label class="toggle">
            <input type="checkbox" id="ghost-mode">
            <div class="toggle-track"></div>
          </label>
        </div>
      </div>

      <!-- Spacer -->
      <div style="height:2rem;"></div>
    </div>
  `;

  // Animate TrustScore
  requestAnimationFrame(() => {
    setTimeout(() => animateTrustScore(user.trustScore), 400);
  });

  // Attach events
  screen.querySelector('#edit-profile-btn')?.addEventListener('click', () => {
    window.showToast('✏️ Edición de perfil próximamente', 'copper');
  });

  screen.querySelector('#profile-settings')?.addEventListener('click', () => {
    showSettingsModal(t);
  });

  screen.querySelector('#profile-qr')?.addEventListener('click', () => {
    showProfileQR(user, t);
  });

  screen.querySelector('#add-photo-btn')?.addEventListener('click', () => {
    window.showConsentVault('subir contenido multimedia', null, t);
  });

  screen.querySelector('#ghost-mode')?.addEventListener('change', (e) => {
    window.showToast(e.target.checked ? '👻 Modo Fantasma activado' : '👁️ Visible en la comunidad', 'copper');
  });

  screen.querySelectorAll('.verify-cta').forEach(btn => {
    btn.addEventListener('click', () => {
      const level = btn.dataset.level;
      window.showConsentVault(`verificación nivel ${level}`, null, t);
    });
  });
}

function animateTrustScore(score) {
  const arc = document.getElementById('trust-arc');
  const numberEl = document.getElementById('trust-number');
  const bars = document.querySelectorAll('.trust-bar-fill');

  if (!arc || !numberEl) return;

  const circumference = 2 * Math.PI * 50; // r=50
  const dashValue = (score / 100) * circumference;

  arc.style.strokeDasharray = `${dashValue} ${circumference}`;

  // Color based on score
  let color = '#ff453a';
  if (score >= 80) color = '#30d158';
  else if (score >= 60) color = '#c4813a';
  else if (score >= 40) color = '#ff9f0a';
  numberEl.style.color = color;

  // Animate number count-up
  let current = 0;
  const step = score / 60;
  const interval = setInterval(() => {
    current = Math.min(current + step, score);
    numberEl.textContent = Math.round(current);
    if (current >= score) clearInterval(interval);
  }, 16);

  // Animate trust bars
  bars.forEach(bar => {
    setTimeout(() => {
      bar.style.width = bar.dataset.target + '%';
    }, 200);
  });
}

function showSettingsModal(t) {
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-handle"></div>
      <div class="modal-header">
        <span style="font-weight:700;font-size:1.1rem;">⚙️ ${t.settings || 'Ajustes'}</span>
        <button onclick="this.closest('.overlay').remove()" class="btn-icon btn-secondary">✕</button>
      </div>

      ${[
        { icon:'🌐', label: t.language || 'Idioma', action: 'language' },
        { icon:'🔔', label: 'Notificaciones', action: 'notif' },
        { icon:'🔒', label: 'Privacidad avanzada', action: 'privacy' },
        { icon:'💳', label: 'Suscripción PRO', action: 'pro' },
        { icon:'🛡️', label: 'Consent Vault™ historial', action: 'consent' },
        { icon:'📊', label: 'Mis estadísticas', action: 'stats' },
        { icon:'🚪', label: 'Cerrar sesión', action: 'logout', danger: true },
      ].map(item => `
        <div class="room-card setting-item" data-action="${item.action}" style="margin-bottom:0.5rem;">
          <span style="font-size:1.25rem;">${item.icon}</span>
          <span style="flex:1;font-size:0.9rem;${item.danger ? 'color:var(--danger)' : ''}">${item.label}</span>
          <span style="color:var(--silver-dark);">›</span>
        </div>
      `).join('')}
    </div>
  `;

  overlay.querySelectorAll('.setting-item').forEach(item => {
    item.addEventListener('click', () => {
      const action = item.dataset.action;
      if (action === 'language') {
        overlay.remove();
        window.showLanguagePicker();
      } else if (action === 'logout') {
        overlay.remove();
        window.location.href = 'index.html';
      } else if (action === 'consent') {
        overlay.remove();
        window.showConsentVault('ver historial de consentimientos', null, t);
      } else {
        window.showToast(`⚙️ ${item.querySelector('span:nth-child(2)').textContent} — Próximamente`, 'copper');
      }
    });
  });

  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

function showProfileQR(user, t) {
  const overlay = document.createElement('div');
  overlay.className = 'overlay center';
  overlay.innerHTML = `
    <div class="modal center-modal" style="text-align:center;padding:2rem;">
      <h3 style="font-weight:700;margin-bottom:0.5rem;">Mi perfil QR</h3>
      <p style="font-size:0.8rem;color:var(--silver-dark);margin-bottom:1.5rem;">${user.name}</p>
      <div style="
        width:180px;height:180px;margin:0 auto 1rem;
        background:white;border-radius:var(--radius-lg);
        display:flex;align-items:center;justify-content:center;
        padding:0.75rem;
      ">
        <div style="display:grid;grid-template-columns:repeat(12,1fr);gap:1px;width:160px;">
          ${Array.from({length:144},()=>`<div style="width:12px;height:12px;background:${Math.random()>0.5?'#000':'#fff'};"></div>`).join('')}
        </div>
      </div>
      <p style="font-size:0.75rem;color:var(--copper);">🛡️ TrustScore™ ${user.trustScore}/100</p>
      <button class="btn btn-secondary w-full mt-4" onclick="this.closest('.overlay').remove()">Cerrar</button>
    </div>
  `;
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}
