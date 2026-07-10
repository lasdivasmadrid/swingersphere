/* ═══════════════════════════════════════════════════════════
   SWINGERSPHERE — COMMUNITY SCREEN
   Chat global + salas temáticas (máx 400 personas)
═══════════════════════════════════════════════════════════ */

import { ROOMS, CHAT_MESSAGES, USERS } from '../data/mock.js';

let activeTab = 'global';
let activeRoom = null;

export function renderCommunity(t) {
  const screen = document.getElementById('screen-community');

  screen.innerHTML = `
    <div class="topbar">
      <div class="topbar-logo">
        <div class="logo-mark">SS</div>
        <span class="logo-text">${t.community_title}</span>
      </div>
      <div class="topbar-actions">
        <button class="btn-icon btn-secondary" id="search-community" title="Search" style="font-size:1rem;">🔍</button>
      </div>
    </div>

    <!-- Tab switcher -->
    <div class="community-tabs" id="community-tabs">
      <button class="community-tab-btn active" data-tab="global">🌍 ${t.tab_global}</button>
      <button class="community-tab-btn" data-tab="rooms">🏠 ${t.tab_rooms}</button>
    </div>

    <!-- Content area -->
    <div id="community-content" style="flex:1;display:flex;flex-direction:column;overflow:hidden;">
      ${renderGlobalChat(t)}
    </div>
  `;

  // Tab switching
  screen.querySelectorAll('.community-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      screen.querySelectorAll('.community-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeTab = btn.dataset.tab;
      const content = document.getElementById('community-content');
      content.style.opacity = '0';
      setTimeout(() => {
        if (activeTab === 'global') {
          content.innerHTML = renderGlobalChat(t);
          attachChatEvents(t);
        } else {
          content.innerHTML = renderRoomsList(t);
          attachRoomsEvents(t);
        }
        content.style.opacity = '1';
        content.style.transition = 'opacity 0.2s';
      }, 150);
    });
  });

  attachChatEvents(t);
}

function renderGlobalChat(t) {
  const globalRoom = ROOMS[0];
  return `
    <div class="chat-view" id="global-chat">
      <!-- Chat header -->
      <div class="chat-header">
        <div class="room-icon" style="width:40px;height:40px;border-radius:var(--radius-md);">🌍</div>
        <div style="flex:1;">
          <div class="flex items-center gap-2">
            <span style="font-weight:600;font-size:0.9rem;">${t.room_global}</span>
            <span class="badge badge-copper" style="font-size:9px;">🤖 ${t.room_moderated}</span>
          </div>
          <div style="font-size:0.75rem;color:var(--silver-dark);">
            <span class="badge-online" style="display:inline-block;width:7px;height:7px;margin-right:4px;vertical-align:middle;"></span>
            ${globalRoom.online} ${t.room_online} · ${globalRoom.members.toLocaleString()} ${t.room_members}
          </div>
        </div>
        <span style="font-size:1.2rem;cursor:pointer;">ℹ️</span>
      </div>

      <!-- Messages -->
      <div class="chat-body" id="chat-body">
        <!-- Date divider -->
        <div class="divider-label" style="margin:0.5rem 0;">
          <span>Hoy</span>
        </div>

        ${CHAT_MESSAGES.map(msg => {
          const user = USERS.find(u => u.id === msg.userId);
          if (msg.mine) {
            return `
              <div class="chat-message" style="flex-direction:row-reverse;" data-msg="${msg.id}">
                <div>
                  <div class="chat-bubble mine">${msg.text}</div>
                  <div class="chat-time" style="text-align:right;">${msg.time}</div>
                </div>
              </div>
            `;
          } else {
            const u = user || USERS[0];
            return `
              <div class="chat-message" data-msg="${msg.id}">
                <div class="avatar-placeholder" style="
                  width:32px;height:32px;border-radius:50%;font-size:0.75rem;font-weight:700;
                  flex-shrink:0;display:flex;align-items:center;justify-content:center;
                  background:linear-gradient(135deg,${u.colorAccent}33,${u.colorAccent}66);
                  color:${u.colorAccent};
                ">${u.initials}</div>
                <div>
                  <div style="font-size:10px;color:var(--silver-dark);margin-bottom:2px;">${u.name}</div>
                  <div class="chat-bubble theirs">${msg.text}</div>
                  <div class="chat-time">${msg.time}</div>
                </div>
              </div>
            `;
          }
        }).join('')}

        <!-- AI Mod indicator -->
        <div style="text-align:center;padding:0.5rem;font-size:0.7rem;color:var(--silver-dark);">
          🤖 Moderado por IA · SwingerSphere
        </div>
      </div>

      <!-- Input -->
      <div class="chat-input-bar">
        <button class="btn-icon btn-secondary" style="font-size:1.1rem;" title="Attach">📎</button>
        <input type="text" class="chat-input" id="chat-input" placeholder="${t.chat_placeholder}">
        <button class="btn btn-primary btn-sm" id="chat-send" style="padding:0.5rem 1rem;">
          ➤
        </button>
      </div>
    </div>
  `;
}

function renderRoomsList(t) {
  return `
    <div class="scroll-content" style="padding-top:0;">
      <!-- Pinned: Global -->
      <div style="padding:0 var(--space-5) var(--space-3);">
        <div class="divider-label"><span>📌 Sala destacada</span></div>
      </div>

      <div class="rooms-list">
        ${ROOMS.map((room, i) => `
          <div class="room-card animate-in" style="animation-delay:${i*60}ms;" data-room="${room.id}">
            <div class="room-icon">${room.emoji}</div>
            <div style="flex:1;">
              <div class="flex items-center gap-2 mb-1">
                <span style="font-weight:600;font-size:0.9rem;">${room.name}</span>
                ${room.moderated ? `<span class="badge badge-copper" style="font-size:9px;">🤖 IA</span>` : ''}
                ${room.pinned ? `<span class="badge badge-copper" style="font-size:9px;">📌</span>` : ''}
              </div>
              <div style="font-size:0.75rem;color:var(--silver-dark);margin-bottom:0.25rem;">
                ${room.description}
              </div>
              <div class="flex gap-3" style="font-size:0.7rem;color:var(--silver-dark);">
                <span>👥 ${room.members.toLocaleString()} ${t.room_members}</span>
                <span class="flex items-center gap-1">
                  <span class="badge-online" style="display:inline-block;width:6px;height:6px;"></span>
                  ${room.online} ${t.room_online}
                </span>
                <span style="color:var(--copper);">⚠️ ${t.room_max}</span>
              </div>
            </div>
            <span style="color:var(--silver-dark);font-size:1.2rem;">›</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function attachChatEvents(t) {
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send');
  const chatBody = document.getElementById('chat-body');

  if (!input || !sendBtn) return;

  function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    const now = new Date();
    const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}`;

    const msgEl = document.createElement('div');
    msgEl.className = 'chat-message';
    msgEl.style.cssText = 'flex-direction:row-reverse;animation:slide-in-right 0.3s var(--ease-out);';
    msgEl.innerHTML = `
      <div>
        <div class="chat-bubble mine">${escapeHtml(text)}</div>
        <div class="chat-time" style="text-align:right;">${time}</div>
      </div>
    `;

    chatBody.appendChild(msgEl);
    chatBody.scrollTop = chatBody.scrollHeight;
    input.value = '';

    // Simulated AI moderation feedback
    setTimeout(() => {
      const aiEl = document.createElement('div');
      aiEl.style.cssText = 'text-align:center;padding:0.25rem;font-size:0.7rem;color:var(--copper);';
      aiEl.textContent = '🤖 Mensaje verificado · Sin infracciones detectadas';
      chatBody.appendChild(aiEl);
      chatBody.scrollTop = chatBody.scrollHeight;
      setTimeout(() => aiEl.style.display = 'none', 3000);
    }, 800);
  }

  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });

  // Scroll to bottom
  if (chatBody) chatBody.scrollTop = chatBody.scrollHeight;
}

function attachRoomsEvents(t) {
  document.querySelectorAll('.room-card').forEach(card => {
    card.addEventListener('click', () => {
      const roomId = card.dataset.room;
      const room = ROOMS.find(r => r.id === roomId);
      if (!room) return;

      // Show consent vault before joining private room
      if (room.id !== 'r1') {
        window.showConsentVault(`unirte a la sala "${room.name}"`, () => {
          openRoom(room, t);
        }, t);
      } else {
        openRoom(room, t);
      }
    });
  });
}

function openRoom(room, t) {
  const content = document.getElementById('community-content');
  content.innerHTML = `
    <div class="chat-view" id="room-chat">
      <div class="chat-header">
        <button onclick="renderBackToRooms()" style="font-size:1.2rem;color:var(--silver);margin-right:0.5rem;cursor:pointer;">‹</button>
        <div class="room-icon" style="width:40px;height:40px;border-radius:var(--radius-md);">${room.emoji}</div>
        <div style="flex:1;">
          <div class="flex items-center gap-2">
            <span style="font-weight:600;font-size:0.9rem;">${room.name}</span>
            ${room.moderated ? `<span class="badge badge-copper" style="font-size:9px;">🤖 ${t.room_moderated}</span>` : ''}
          </div>
          <div style="font-size:0.75rem;color:var(--silver-dark);">
            ${room.online} ${t.room_online} · ⚠️ ${t.room_max}
          </div>
        </div>
      </div>

      <div class="chat-body" id="room-chat-body" style="justify-content:center;align-items:center;display:flex;flex-direction:column;gap:0.5rem;color:var(--silver-dark);font-size:0.875rem;">
        <span style="font-size:2rem;">${room.emoji}</span>
        <span>Acabas de unirte a <strong style="color:var(--white);">${room.name}</strong></span>
        <span>Escribe tu primer mensaje</span>
      </div>

      <div class="chat-input-bar">
        <button class="btn-icon btn-secondary" style="font-size:1.1rem;">📎</button>
        <input type="text" class="chat-input" id="room-chat-input" placeholder="${t.chat_placeholder}">
        <button class="btn btn-primary btn-sm" id="room-chat-send" style="padding:0.5rem 1rem;">➤</button>
      </div>
    </div>
  `;

  // Make back button work
  window.renderBackToRooms = () => {
    content.innerHTML = renderRoomsList(t);
    attachRoomsEvents(t);
  };

  // Attach send
  const input = document.getElementById('room-chat-input');
  const sendBtn = document.getElementById('room-chat-send');
  const chatBody = document.getElementById('room-chat-body');

  function sendMsg() {
    const text = input?.value.trim();
    if (!text) return;
    chatBody.style.justifyContent = 'flex-start';
    chatBody.style.alignItems = 'stretch';
    const now = new Date();
    const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}`;
    const msgEl = document.createElement('div');
    msgEl.className = 'chat-message';
    msgEl.style.flexDirection = 'row-reverse';
    msgEl.innerHTML = `<div><div class="chat-bubble mine">${escapeHtml(text)}</div><div class="chat-time" style="text-align:right;">${time}</div></div>`;
    chatBody.appendChild(msgEl);
    chatBody.scrollTop = chatBody.scrollHeight;
    if (input) input.value = '';
  }

  sendBtn?.addEventListener('click', sendMsg);
  input?.addEventListener('keydown', e => { if (e.key === 'Enter') sendMsg(); });
}

function escapeHtml(text) {
  return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
