/* ═══════════════════════════════════════════════════════════
   SWINGERSPHERE — HOME SCREEN
═══════════════════════════════════════════════════════════ */

import { DAILY_QUOTES, POSTS, USERS, PRIVACY_LABELS, VERIFICATION_LABELS } from '../data/mock.js';
import { showConsentVault } from '../components/consent.js';

let currentFilter = 'near';

export function renderHome(t) {
  const quote = DAILY_QUOTES[Math.floor(Date.now() / 86400000) % DAILY_QUOTES.length];
  const screen = document.getElementById('screen-home');

  screen.innerHTML = `
    <div class="topbar">
      <div class="topbar-logo">
        <div class="logo-mark">SS</div>
        <span class="logo-text">SwingerSphere</span>
      </div>
      <div class="topbar-actions">
        <button class="btn-icon btn-secondary" id="home-notifications" title="Notifications" style="font-size:1.1rem;">🔔</button>
        <button class="btn-icon btn-secondary" id="home-messages" title="Messages" style="font-size:1.1rem;">💬</button>
      </div>
    </div>

    <div class="scroll-content" id="home-scroll">
      <!-- Daily Quote -->
      <div class="daily-quote-banner animate-in">
        <div class="quote-label">${t.daily_quote_label}</div>
        <p class="quote-text">"${quote.text}"</p>
        <p class="quote-author">— ${quote.author}</p>
      </div>

      <!-- Feed Filters -->
      <div class="feed-filters">
        <div class="tabs" id="feed-tabs">
          <button class="tab active" data-filter="near">${t.filter_near}</button>
          <button class="tab" data-filter="global">${t.filter_global}</button>
          <button class="tab" data-filter="couples">${t.filter_couples}</button>
          <button class="tab" data-filter="singles">${t.filter_singles}</button>
          <button class="tab" data-filter="events">${t.filter_events}</button>
        </div>
      </div>

      <!-- Feed -->
      <div class="feed-list stagger" id="feed-list">
        ${renderFeedPosts(t)}
      </div>
    </div>
  `;

  // Filter tabs
  screen.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      screen.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.filter;
      shuffleFeed(t);
    });
  });

  // Notification bell
  screen.querySelector('#home-notifications').addEventListener('click', () => {
    window.showToast('🔔 3 nuevas notificaciones pendientes', 'copper');
  });

  // Messages
  screen.querySelector('#home-messages').addEventListener('click', () => {
    window.showConsentVault('mensaje', null, t);
  });

  // Like buttons
  attachFeedEvents(screen, t);
}

function renderFeedPosts(t) {
  return POSTS.map((post, i) => {
    const user = USERS.find(u => u.id === post.userId) || USERS[0];
    const privacy = PRIVACY_LABELS[post.privacy];
    const verify = VERIFICATION_LABELS[user.verifyLevel];

    return `
      <article class="post-card animate-in" style="animation-delay:${i * 80}ms" data-post="${post.id}">
        <div class="post-header">
          <div class="avatar-placeholder avatar-md" style="background:linear-gradient(135deg,${user.colorAccent}33,${user.colorAccent}88)">
            <span style="font-size:0.875rem;font-weight:700;color:${user.colorAccent}">${user.initials}</span>
          </div>
          <div class="post-meta">
            <div class="flex items-center gap-2">
              <span class="post-name">${user.name}</span>
              <span class="verify-badge ${verify.color}">${verify.icon}</span>
            </div>
            <div class="flex items-center gap-2 mt-1">
              <span class="post-time">${post.time}</span>
              <span class="privacy-lock ${privacy.css}">${privacy.icon} ${privacy.label}</span>
            </div>
          </div>
          <div class="text-2xl" style="line-height:1;">${post.emoji}</div>
        </div>

        <div class="post-content">${post.content}</div>

        <div class="post-actions">
          <button class="post-action-btn like-btn ${post.liked ? 'liked' : ''}" data-post="${post.id}">
            <span class="like-icon">${post.liked ? '❤️' : '🤍'}</span>
            <span class="like-count">${post.likes}</span>
          </button>
          <button class="post-action-btn comment-btn">
            💬 <span>${post.comments}</span>
          </button>
          <button class="post-action-btn share-btn">
            🔗
          </button>
          <div style="flex:1"></div>
          <span class="badge badge-copper" style="font-size:10px;">
            TS ${user.trustScore}
          </span>
        </div>
      </article>
    `;
  }).join('');
}

function shuffleFeed(t) {
  const list = document.getElementById('feed-list');
  if (!list) return;
  list.style.opacity = '0';
  list.style.transform = 'translateY(8px)';
  setTimeout(() => {
    list.innerHTML = renderFeedPosts(t);
    list.style.transition = 'opacity 0.3s, transform 0.3s';
    list.style.opacity = '1';
    list.style.transform = 'translateY(0)';
    attachFeedEvents(document.getElementById('screen-home'), t);
  }, 200);
}

function attachFeedEvents(screen, t) {
  screen.querySelectorAll('.like-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const icon = btn.querySelector('.like-icon');
      const count = btn.querySelector('.like-count');
      const liked = btn.classList.contains('liked');
      if (liked) {
        btn.classList.remove('liked');
        icon.textContent = '🤍';
        count.textContent = parseInt(count.textContent) - 1;
      } else {
        btn.classList.add('liked');
        icon.textContent = '❤️';
        count.textContent = parseInt(count.textContent) + 1;
        // Micro-animation
        icon.style.transform = 'scale(1.4)';
        setTimeout(() => icon.style.transform = 'scale(1)', 200);
      }
    });
  });

  screen.querySelectorAll('.share-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      window.showConsentVault('compartir contenido', null, t);
    });
  });
}
