/* ═══════════════════════════════════════════════════════════
   SWINGERSPHERE — APP ROUTER & STATE MANAGER
   Hash-based routing · i18n · Toast system · Language picker
═══════════════════════════════════════════════════════════ */

import { TRANSLATIONS, LANG_FLAGS, LANG_NAMES } from './data/i18n.js';
import { renderHome }      from './screens/home.js';
import { renderDiscover }  from './screens/discover.js';
import { renderCommunity } from './screens/community.js';
import { renderEvents }    from './screens/events.js';
import { renderProfile }   from './screens/profile.js';
import { initOraculo }     from './components/oraculo.js';
import { showConsentVault } from './components/consent.js';

// ── STATE ────────────────────────────────────────────────
const state = {
  lang: localStorage.getItem('ss_lang') || detectBrowserLang(),
  currentScreen: 'home',
};

function detectBrowserLang() {
  const bl = navigator.language.split('-')[0];
  return ['es','en','fr','de','it','pt'].includes(bl) ? bl : 'es';
}

function t(key) {
  const translations = TRANSLATIONS[state.lang] || TRANSLATIONS.es;
  return translations[key] || TRANSLATIONS.es[key] || key;
}

function getT() {
  return new Proxy({}, {
    get: (_, key) => t(key),
  });
}

// Store t globally for convenience
window._currentT = getT();

// ── SCREENS MAP ──────────────────────────────────────────
const SCREENS = {
  home:      { render: (t) => renderHome(t),      navLabel: 'nav_home',      icon: '🏠' },
  discover:  { render: (t) => renderDiscover(t),  navLabel: 'nav_discover',  icon: '🔭' },
  community: { render: (t) => renderCommunity(t), navLabel: 'nav_community', icon: '💬' },
  events:    { render: (t) => renderEvents(t),     navLabel: 'nav_events',   icon: '🎉' },
  profile:   { render: (t) => renderProfile(t),   navLabel: 'nav_profile',   icon: '👤' },
};

// ── NAVIGATION ───────────────────────────────────────────
function renderNavbar() {
  const existing = document.getElementById('bottom-nav');
  if (existing) existing.remove();

  const nav = document.createElement('nav');
  nav.id = 'bottom-nav';
  nav.className = 'bottom-nav';
  nav.setAttribute('aria-label', 'Main navigation');

  nav.innerHTML = Object.entries(SCREENS).map(([key, screen]) => `
    <button
      class="nav-item ${state.currentScreen === key ? 'active' : ''}"
      data-screen="${key}"
      aria-label="${t(screen.navLabel)}"
      id="nav-${key}"
    >
      <span class="nav-icon">${screen.icon}</span>
      <span class="nav-label">${t(screen.navLabel)}</span>
    </button>
  `).join('');

  nav.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => navigateTo(item.dataset.screen));
  });

  document.getElementById('app').appendChild(nav);
}

function renderFAB() {
  const existing = document.getElementById('main-fab');
  if (existing) existing.remove();

  const fab = document.createElement('button');
  fab.id = 'main-fab';
  fab.className = 'fab';
  fab.title = 'Crear publicación';
  fab.innerHTML = '✦';
  fab.setAttribute('aria-label', 'Crear publicación');

  fab.addEventListener('click', () => {
    window.showConsentVault('crear y publicar contenido', () => {
      window.showToast('✦ Editor de publicación próximamente', 'copper');
    }, getT());
  });

  document.getElementById('app').appendChild(fab);
}

// ── ROUTING ──────────────────────────────────────────────
function navigateTo(screenId) {
  if (!SCREENS[screenId]) return;

  // Update hash
  history.pushState({screen: screenId}, '', `#${screenId}`);

  // Update state
  state.currentScreen = screenId;

  // Hide all screens
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
    s.style.animation = '';
  });

  // Show target screen
  const targetScreen = document.getElementById(`screen-${screenId}`);
  if (targetScreen) {
    targetScreen.classList.add('active');
  }

  // Re-render content
  const tProxy = getT();
  window._currentT = tProxy;
  SCREENS[screenId].render(tProxy);

  // Update nav
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.screen === screenId);
  });

  // Scroll to top
  targetScreen?.querySelector('.scroll-content')?.scrollTo(0, 0);
}

// ── TOAST SYSTEM ─────────────────────────────────────────
function initToasts() {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
}

window.showToast = function(message, type = 'default', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = {
    success: '✅',
    error: '❌',
    copper: '✦',
    default: 'ℹ️',
  };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.default}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toast-out 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
};

// ── LANGUAGE PICKER ──────────────────────────────────────
window.showLanguagePicker = function() {
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-handle"></div>
      <div class="modal-header">
        <span style="font-weight:700;font-size:1.1rem;">🌐 ${t('language')}</span>
        <button onclick="this.closest('.overlay').remove()" class="btn-icon btn-secondary">✕</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:0.5rem;">
        ${Object.entries(LANG_NAMES).map(([code, name]) => `
          <button class="room-card lang-option" data-lang="${code}" style="border:1px solid ${state.lang === code ? 'var(--copper-border)' : 'var(--border)'};">
            <span style="font-size:1.5rem;">${LANG_FLAGS[code]}</span>
            <span style="flex:1;font-weight:${state.lang === code ? 600 : 400};">${name}</span>
            ${state.lang === code ? '<span style="color:var(--copper);">✓</span>' : ''}
          </button>
        `).join('')}
      </div>
    </div>
  `;

  overlay.querySelectorAll('.lang-option').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang;
      state.lang = lang;
      localStorage.setItem('ss_lang', lang);
      window._currentT = getT();
      overlay.remove();
      // Re-render current screen
      navigateTo(state.currentScreen);
      renderNavbar();
      window.showToast(`🌐 Idioma: ${LANG_NAMES[lang]}`, 'copper');
    });
  });

  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
};

// ── INIT ─────────────────────────────────────────────────
export function initApp() {
  // Create screen containers
  const app = document.getElementById('app');
  Object.keys(SCREENS).forEach(key => {
    if (!document.getElementById(`screen-${key}`)) {
      const screen = document.createElement('div');
      screen.id = `screen-${key}`;
      screen.className = 'screen';
      app.appendChild(screen);
    }
  });

  // Init systems
  initToasts();
  renderNavbar();
  renderFAB();
  initOraculo(getT());

  // Handle hash routing
  const hash = window.location.hash.replace('#', '');
  const initialScreen = SCREENS[hash] ? hash : 'home';
  navigateTo(initialScreen);

  // Back/forward navigation
  window.addEventListener('popstate', (e) => {
    const screen = e.state?.screen || 'home';
    navigateTo(screen);
  });

  // Language picker button (global topbar)
  document.addEventListener('click', (e) => {
    if (e.target.closest('.lang-picker-btn')) {
      window.showLanguagePicker();
    }
  });

  // Reset profiles event (discover screen)
  window.addEventListener('resetProfiles', () => {
    navigateTo('discover');
  });

  console.log('🔮 SwingerSphere initialized · Lang:', state.lang);
}
