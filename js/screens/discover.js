/* ═══════════════════════════════════════════════════════════
   SWINGERSPHERE — DISCOVER SCREEN
   Tinder-style card stack with touch/mouse swipe gestures
═══════════════════════════════════════════════════════════ */

import { USERS, VERIFICATION_LABELS, USER_TYPES } from '../data/mock.js';

let cardIndex = 0;
let isDragging = false;
let startX = 0, startY = 0, currentX = 0;
let currentCard = null;
let profiles = [...USERS];
let matchedUser = null;

export function renderDiscover(t) {
  cardIndex = 0;
  profiles = [...USERS];
  const screen = document.getElementById('screen-discover');

  screen.innerHTML = `
    <div class="topbar">
      <div class="topbar-logo">
        <div class="logo-mark">SS</div>
        <span class="logo-text">${t.discover_title}</span>
      </div>
      <div class="topbar-actions">
        <button class="btn btn-secondary btn-sm" id="open-filters">
          ⚙️ ${t.discover_filter}
        </button>
      </div>
    </div>

    <!-- Card Stack -->
    <div class="discover-area" id="discover-area">
      <div class="card-stack" id="card-stack">
        ${renderCardStack(t)}
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="discover-actions">
      <button class="discover-action-btn nope" id="btn-nope" title="No me interesa">✕</button>
      <button class="discover-action-btn super" id="btn-info" title="Ver perfil">⭐</button>
      <button class="discover-action-btn like" id="btn-like" title="Me interesa">♥</button>
    </div>

    <!-- Filter Drawer (hidden) -->
    <div class="overlay" id="filter-overlay" style="display:none;">
      <div class="filter-drawer">
        <div class="modal-handle"></div>
        <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:1.5rem;">${t.discover_filter}</h3>

        <div class="filter-section">
          <div class="filter-label">Tipo de perfil</div>
          <div class="filter-chips" id="type-chips">
            ${Object.entries(USER_TYPES).map(([k,v]) => `
              <button class="chip ${k === 'couple_hm' ? 'active' : ''}" data-type="${k}">
                ${v.emoji} ${v.label}
              </button>
            `).join('')}
          </div>
        </div>

        <div class="filter-section">
          <div class="filter-label">Distancia: <span id="dist-val">500</span> km</div>
          <input type="range" class="range-slider" min="10" max="2000" value="500"
            id="dist-range" style="--val:25%">
        </div>

        <div class="filter-section">
          <div class="filter-label">Solo verificados</div>
          <div class="flex items-center gap-3">
            <label class="toggle">
              <input type="checkbox" id="verified-only">
              <div class="toggle-track"></div>
            </label>
            <span class="text-silver text-sm">Verificación nivel 2+</span>
          </div>
        </div>

        <div class="filter-section">
          <div class="filter-label">Modo viaje 🌍</div>
          <div class="flex items-center gap-3">
            <label class="toggle">
              <input type="checkbox" id="travel-mode">
              <div class="toggle-track"></div>
            </label>
            <span class="text-silver text-sm">Buscar globalmente</span>
          </div>
        </div>

        <button class="btn btn-primary w-full mt-4" id="apply-filters">
          Aplicar filtros
        </button>
      </div>
    </div>

    <!-- Match Screen (hidden) -->
    <div class="match-screen" id="match-screen" style="display:none;">
      <div class="match-title animate-in" id="match-title">${t.match_title}</div>
      <p class="text-silver animate-in" style="animation-delay:0.1s" id="match-sub">${t.match_sub}</p>
      <div class="match-avatars animate-in" style="animation-delay:0.2s" id="match-avatars"></div>
      <div class="flex gap-4 animate-in" style="animation-delay:0.3s">
        <button class="btn btn-primary btn-lg" id="match-message">${t.match_message}</button>
        <button class="btn btn-secondary btn-lg" id="match-keep">${t.match_keep}</button>
      </div>
    </div>
  `;

  initSwipeGestures(t);

  // Buttons
  document.getElementById('btn-like').addEventListener('click', () => swipeCard('right', t));
  document.getElementById('btn-nope').addEventListener('click', () => swipeCard('left', t));
  document.getElementById('btn-info').addEventListener('click', () => {
    if (profiles[cardIndex]) showProfileSnap(profiles[cardIndex], t);
  });

  // Filters
  document.getElementById('open-filters').addEventListener('click', () => {
    document.getElementById('filter-overlay').style.display = 'flex';
  });
  document.getElementById('filter-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) e.currentTarget.style.display = 'none';
  });
  document.getElementById('apply-filters').addEventListener('click', () => {
    document.getElementById('filter-overlay').style.display = 'none';
    window.showToast('✅ Filtros aplicados', 'success');
  });

  // Range slider
  const distRange = document.getElementById('dist-range');
  distRange?.addEventListener('input', () => {
    document.getElementById('dist-val').textContent = distRange.value;
    const pct = ((distRange.value - 10) / (2000 - 10) * 100).toFixed(0);
    distRange.style.setProperty('--val', `${pct}%`);
  });

  // Type chips
  document.querySelectorAll('#type-chips .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#type-chips .chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
    });
  });

  // Match buttons
  document.getElementById('match-message')?.addEventListener('click', () => {
    document.getElementById('match-screen').style.display = 'none';
    window.showToast('💬 Solicitud de conversación enviada', 'copper');
  });
  document.getElementById('match-keep')?.addEventListener('click', () => {
    document.getElementById('match-screen').style.display = 'none';
  });
}

function renderCardStack(t) {
  if (profiles.length === 0) {
    return `<div class="flex flex-col items-center justify-center" style="height:100%;gap:1rem;padding:2rem;text-align:center;">
      <div style="font-size:3rem;">🎉</div>
      <p class="text-silver">${t.no_more_profiles}</p>
    </div>`;
  }

  return profiles.slice(cardIndex, cardIndex + 3).map((user, i) => {
    const verify = VERIFICATION_LABELS[user.verifyLevel];
    const typeInfo = USER_TYPES[user.type];
    return `
      <div class="discover-card" data-card="${i}" style="z-index:${3-i};">
        <div class="discover-card-bg" style="background:${user.coverGradient};display:flex;align-items:center;justify-content:center;">
          <div style="font-size:5rem;opacity:0.3;">${typeInfo.emoji}</div>
          <div class="avatar-placeholder" style="
            position:absolute;
            width:140px;height:140px;border-radius:50%;
            background:linear-gradient(135deg,${user.colorAccent}44,${user.colorAccent}88);
            border:3px solid ${user.colorAccent}66;
            display:flex;align-items:center;justify-content:center;
            font-size:3rem;font-weight:800;color:${user.colorAccent};
          ">${user.initials}</div>
        </div>
        <div class="discover-card-overlay"></div>
        <div class="swipe-like" id="swipe-like-${i}">✓ ${t.swipe_like}</div>
        <div class="swipe-nope" id="swipe-nope-${i}">${t.swipe_nope} ✕</div>
        <div class="discover-card-info">
          <div class="flex items-center gap-2 mb-1">
            <span class="discover-card-name">${user.name}</span>
            ${user.online ? '<span class="badge-online"></span>' : ''}
          </div>
          <div class="flex items-center gap-2">
            <span class="verify-badge ${verify.color}">${verify.icon} ${verify.label}</span>
            <span class="badge badge-copper">TS ${user.trustScore}</span>
            <span class="badge badge-silver">📍 ${user.distance} ${t.discover_km}</span>
          </div>
          <div class="discover-card-tags">
            <span class="chip active">${typeInfo.emoji} ${typeInfo.label}</span>
            ${user.interests.slice(0,3).map(i => `<span class="chip">${i}</span>`).join('')}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function initSwipeGestures(t) {
  const stack = document.getElementById('card-stack');
  if (!stack) return;

  function getTopCard() {
    return stack.querySelector('.discover-card[data-card="0"]');
  }

  function onStart(e) {
    currentCard = getTopCard();
    if (!currentCard) return;
    isDragging = true;
    const point = e.touches ? e.touches[0] : e;
    startX = point.clientX;
    startY = point.clientY;
    currentX = 0;
    currentCard.style.transition = 'none';
  }

  function onMove(e) {
    if (!isDragging || !currentCard) return;
    e.preventDefault();
    const point = e.touches ? e.touches[0] : e;
    currentX = point.clientX - startX;
    const currentY = point.clientY - startY;
    const rotate = currentX * 0.08;

    currentCard.style.transform = `translateX(${currentX}px) translateY(${currentY * 0.2}px) rotate(${rotate}deg)`;

    // Show swipe indicators
    const likeEl = currentCard.querySelector('.swipe-like');
    const nopeEl = currentCard.querySelector('.swipe-nope');
    if (likeEl) likeEl.style.opacity = Math.max(0, currentX / 80);
    if (nopeEl) nopeEl.style.opacity = Math.max(0, -currentX / 80);
  }

  function onEnd() {
    if (!isDragging || !currentCard) return;
    isDragging = false;

    const threshold = 80;
    if (currentX > threshold) {
      swipeCard('right', t);
    } else if (currentX < -threshold) {
      swipeCard('left', t);
    } else {
      // Restore
      currentCard.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
      currentCard.style.transform = '';
      const likeEl = currentCard.querySelector('.swipe-like');
      const nopeEl = currentCard.querySelector('.swipe-nope');
      if (likeEl) likeEl.style.opacity = 0;
      if (nopeEl) nopeEl.style.opacity = 0;
    }

    currentCard = null;
    currentX = 0;
  }

  stack.addEventListener('mousedown', onStart);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onEnd);
  stack.addEventListener('touchstart', onStart, { passive: true });
  window.addEventListener('touchmove', onMove, { passive: false });
  window.addEventListener('touchend', onEnd);
}

function swipeCard(direction, t) {
  const stack = document.getElementById('card-stack');
  const topCard = stack?.querySelector('.discover-card[data-card="0"]');
  if (!topCard) return;

  const exitX = direction === 'right' ? '130%' : '-130%';
  const exitRot = direction === 'right' ? '25deg' : '-25deg';

  // Show final indicator
  const likeEl = topCard.querySelector('.swipe-like');
  const nopeEl = topCard.querySelector('.swipe-nope');
  if (direction === 'right' && likeEl) likeEl.style.opacity = 1;
  if (direction === 'left' && nopeEl) nopeEl.style.opacity = 1;

  topCard.style.transition = 'transform 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97), opacity 0.45s';
  topCard.style.transform = `translateX(${exitX}) rotate(${exitRot})`;
  topCard.style.opacity = '0';

  setTimeout(() => {
    const likedUser = profiles[cardIndex];
    cardIndex++;

    if (direction === 'right' && Math.random() < 0.4) {
      // Simulate a match
      setTimeout(() => showMatch(likedUser, t), 300);
    } else {
      rebuildStack(t);
    }
  }, 420);
}

function rebuildStack(t) {
  const stack = document.getElementById('card-stack');
  if (!stack) return;
  if (cardIndex >= profiles.length) {
    stack.innerHTML = `
      <div class="flex flex-col items-center justify-center" style="height:100%;gap:1rem;padding:2rem;text-align:center;">
        <div style="font-size:3rem;">🎉</div>
        <p class="text-silver" style="font-size:0.9rem;">${t.no_more_profiles}</p>
        <button class="btn btn-secondary" onclick="window.dispatchEvent(new CustomEvent('resetProfiles'))">
          Reiniciar
        </button>
      </div>
    `;
    return;
  }

  // Re-render remaining cards
  const remaining = profiles.slice(cardIndex, cardIndex + 3);
  stack.innerHTML = remaining.map((user, i) => {
    const verify = VERIFICATION_LABELS[user.verifyLevel];
    const typeInfo = USER_TYPES[user.type];
    return `
      <div class="discover-card" data-card="${i}" style="z-index:${3-i};transform:${i > 0 ? `scale(${1 - i * 0.05}) translateY(${i * 12}px)` : ''};">
        <div class="discover-card-bg" style="background:${user.coverGradient};display:flex;align-items:center;justify-content:center;">
          <div style="font-size:5rem;opacity:0.3;">${typeInfo.emoji}</div>
          <div style="
            position:absolute;width:140px;height:140px;border-radius:50%;
            background:linear-gradient(135deg,${user.colorAccent}44,${user.colorAccent}88);
            border:3px solid ${user.colorAccent}66;
            display:flex;align-items:center;justify-content:center;
            font-size:3rem;font-weight:800;color:${user.colorAccent};
          ">${user.initials}</div>
        </div>
        <div class="discover-card-overlay"></div>
        <div class="swipe-like">✓ ${t.swipe_like}</div>
        <div class="swipe-nope">${t.swipe_nope} ✕</div>
        <div class="discover-card-info">
          <div class="flex items-center gap-2 mb-1">
            <span class="discover-card-name">${user.name}</span>
            ${user.online ? '<span class="badge-online"></span>' : ''}
          </div>
          <div class="flex items-center gap-2">
            <span class="verify-badge ${verify.color}">${verify.icon} ${verify.label}</span>
            <span class="badge badge-copper">TS ${user.trustScore}</span>
            <span class="badge badge-silver">📍 ${user.distance} ${t.discover_km}</span>
          </div>
          <div class="discover-card-tags">
            <span class="chip active">${typeInfo.emoji} ${typeInfo.label}</span>
            ${user.interests.slice(0,3).map(int => `<span class="chip">${int}</span>`).join('')}
          </div>
        </div>
      </div>
    `;
  }).join('');

  initSwipeGestures(t);
  attachActionButtons(t);
}

function attachActionButtons(t) {
  document.getElementById('btn-like')?.addEventListener('click', () => swipeCard('right', t));
  document.getElementById('btn-nope')?.addEventListener('click', () => swipeCard('left', t));
}

function showMatch(user, t) {
  matchedUser = user;
  const matchScreen = document.getElementById('match-screen');
  if (!matchScreen) return;

  const avatars = matchScreen.querySelector('#match-avatars');
  avatars.innerHTML = `
    <div style="
      width:96px;height:96px;border-radius:50%;
      background:linear-gradient(135deg,#c4813a44,#c4813a88);
      border:3px solid #c4813a66;
      display:flex;align-items:center;justify-content:center;
      font-size:2rem;font-weight:800;color:#c4813a;
    ">AS</div>
    <span class="match-heart">💛</span>
    <div style="
      width:96px;height:96px;border-radius:50%;
      background:linear-gradient(135deg,${user.colorAccent}44,${user.colorAccent}88);
      border:3px solid ${user.colorAccent}66;
      display:flex;align-items:center;justify-content:center;
      font-size:2rem;font-weight:800;color:${user.colorAccent};
    ">${user.initials}</div>
  `;

  matchScreen.style.display = 'flex';

  // Confetti-like particles
  spawnMatchParticles();
}

function spawnMatchParticles() {
  const colors = ['#c4813a', '#e09455', '#f0b878', '#ffffff', '#30d158'];
  for (let i = 0; i < 30; i++) {
    setTimeout(() => {
      const p = document.createElement('div');
      p.style.cssText = `
        position:fixed;
        left:${Math.random() * 100}%;
        top:-10px;
        width:${4 + Math.random() * 6}px;
        height:${4 + Math.random() * 6}px;
        background:${colors[Math.floor(Math.random() * colors.length)]};
        border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
        z-index:250;
        animation:confetti-fall ${1.5 + Math.random()}s ease-in forwards;
        pointer-events:none;
      `;
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 2500);
    }, i * 60);
  }
}

function showProfileSnap(user, t) {
  const verify = VERIFICATION_LABELS[user.verifyLevel];
  const typeInfo = USER_TYPES[user.type];
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-handle"></div>
      <div class="flex items-center gap-4 mb-4">
        <div style="
          width:72px;height:72px;border-radius:50%;
          background:linear-gradient(135deg,${user.colorAccent}44,${user.colorAccent}88);
          border:2px solid ${user.colorAccent}66;
          display:flex;align-items:center;justify-content:center;
          font-size:1.75rem;font-weight:800;color:${user.colorAccent};
        ">${user.initials}</div>
        <div>
          <div class="profile-name" style="font-size:1.25rem;">${user.name}</div>
          <div class="text-silver text-sm">${user.username}</div>
          <div class="flex gap-2 mt-1">
            <span class="verify-badge ${verify.color}">${verify.icon} ${verify.label}</span>
            <span class="badge badge-copper">TS ${user.trustScore}</span>
          </div>
        </div>
      </div>
      <p class="text-silver text-sm" style="line-height:1.7;margin-bottom:1rem;">${user.bio}</p>
      <div class="flex flex-wrap gap-2 mb-4">
        ${user.interests.map(i => `<span class="chip active">${i}</span>`).join('')}
      </div>
      <div class="flex gap-2 mb-2" style="font-size:0.8rem;color:var(--silver-dark);">
        <span>📍 ${user.locationApprox}</span>
        <span>🌐 ${user.languages.join(', ')}</span>
      </div>
      <div class="flex gap-3 mt-4">
        <button class="btn btn-danger flex-1" onclick="this.closest('.overlay').remove()">✕ Cerrar</button>
        <button class="btn btn-primary flex-1" onclick="this.closest('.overlay').remove();window.swipeRight()">♥ Me interesa</button>
      </div>
    </div>
  `;
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
  window.swipeRight = () => swipeCard('right', t);
}
