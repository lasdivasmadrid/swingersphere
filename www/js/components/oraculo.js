/* ═══════════════════════════════════════════════════════════
   SWINGERSPHERE — AI ORÁCULO WIDGET
   Floating assistant with multi-language responses
═══════════════════════════════════════════════════════════ */

import { ORACULO_RESPONSES } from '../data/mock.js';

let oraculoOpen = false;

export function initOraculo(t) {
  // Remove existing if any
  document.getElementById('oraculo-btn')?.remove();
  document.getElementById('oraculo-panel')?.remove();

  const btn = document.createElement('button');
  btn.id = 'oraculo-btn';
  btn.className = 'oraculo-btn';
  btn.title = 'IA Oráculo';
  btn.innerHTML = '🔮';
  btn.setAttribute('aria-label', 'Abrir asistente IA Oráculo');

  const panel = document.createElement('div');
  panel.id = 'oraculo-panel';
  panel.className = 'oraculo-panel';
  panel.style.display = 'none';
  panel.innerHTML = `
    <div style="
      background:var(--copper-glow);
      border-bottom:1px solid var(--copper-border);
      padding:0.75rem 1rem;
      display:flex;align-items:center;justify-content:space-between;
    ">
      <div class="flex items-center gap-2">
        <span style="font-size:1.1rem;">🔮</span>
        <div>
          <div style="font-weight:700;font-size:0.825rem;">IA Oráculo</div>
          <div style="font-size:0.65rem;color:var(--copper);">● Online · Powered by SwingerSphere AI</div>
        </div>
      </div>
      <button id="oraculo-close" style="color:var(--silver-dark);font-size:1rem;cursor:pointer;background:none;border:none;">✕</button>
    </div>

    <div class="oraculo-messages" id="oraculo-msgs">
      <div class="typing-indicator">
        <span></span><span></span><span></span>
      </div>
    </div>

    <div class="oraculo-input-row">
      <input type="text" class="oraculo-input" id="oraculo-input"
        placeholder="Pregunta al Oráculo...">
      <button class="btn btn-primary btn-sm" id="oraculo-send">➤</button>
    </div>

    <!-- Quick questions -->
    <div style="padding:0.5rem 1rem;border-top:1px solid var(--border);display:flex;flex-wrap:wrap;gap:0.375rem;">
      <button class="chip quick-q" data-q="eventos">📅 Eventos</button>
      <button class="chip quick-q" data-q="trust">⭐ TrustScore</button>
      <button class="chip quick-q" data-q="privacy">🔒 Privacidad</button>
    </div>
  `;

  document.body.appendChild(btn);
  document.body.appendChild(panel);

  // Show greeting after 1 second
  setTimeout(() => {
    const greeting = ORACULO_RESPONSES.greeting[Math.floor(Math.random() * ORACULO_RESPONSES.greeting.length)];
    addOraculoMessage(greeting, 'ai');

    // Remove typing indicator
    const typing = panel.querySelector('.typing-indicator');
    if (typing) typing.remove();
  }, 1000);

  // Toggle panel
  btn.addEventListener('click', () => {
    oraculoOpen = !oraculoOpen;
    panel.style.display = oraculoOpen ? 'block' : 'none';
    if (oraculoOpen) {
      panel.style.animation = 'slide-up-small 0.3s var(--ease-spring)';
    }
  });

  document.getElementById('oraculo-close')?.addEventListener('click', () => {
    oraculoOpen = false;
    panel.style.display = 'none';
  });

  // Send message
  function sendOraculoMessage() {
    const input = document.getElementById('oraculo-input');
    const text = input?.value.trim();
    if (!text) return;

    addOraculoMessage(text, 'user');
    if (input) input.value = '';

    // Typing indicator
    const typing = document.createElement('div');
    typing.className = 'typing-indicator oraculo-msg ai';
    typing.innerHTML = '<span></span><span></span><span></span>';
    document.getElementById('oraculo-msgs')?.appendChild(typing);
    scrollOraculoToBottom();

    // Determine response category
    setTimeout(() => {
      typing.remove();
      const lowerText = text.toLowerCase();
      let responses;
      if (lowerText.includes('event')) responses = ORACULO_RESPONSES.events;
      else if (lowerText.includes('trust') || lowerText.includes('score')) responses = ORACULO_RESPONSES.trust;
      else if (lowerText.includes('privacidad') || lowerText.includes('foto') || lowerText.includes('privacy')) responses = ORACULO_RESPONSES.privacy;
      else responses = ORACULO_RESPONSES.default;

      const response = responses[Math.floor(Math.random() * responses.length)];
      addOraculoMessage(response, 'ai');
    }, 800 + Math.random() * 600);
  }

  document.getElementById('oraculo-send')?.addEventListener('click', sendOraculoMessage);
  document.getElementById('oraculo-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') sendOraculoMessage();
  });

  // Quick questions
  panel.querySelectorAll('.quick-q').forEach(btn => {
    btn.addEventListener('click', () => {
      const q = btn.dataset.q;
      let responses;
      if (q === 'eventos') responses = ORACULO_RESPONSES.events;
      else if (q === 'trust') responses = ORACULO_RESPONSES.trust;
      else responses = ORACULO_RESPONSES.privacy;

      addOraculoMessage(`¿Qué me dices sobre ${btn.textContent.trim()}?`, 'user');

      setTimeout(() => {
        addOraculoMessage(responses[Math.floor(Math.random() * responses.length)], 'ai');
      }, 600);
    });
  });
}

function addOraculoMessage(text, type) {
  const msgs = document.getElementById('oraculo-msgs');
  if (!msgs) return;

  const msg = document.createElement('div');
  msg.className = `oraculo-msg ${type}`;
  msg.textContent = text;
  msg.style.animation = 'slide-in-left 0.3s var(--ease-out)';

  msgs.appendChild(msg);
  scrollOraculoToBottom();
}

function scrollOraculoToBottom() {
  const msgs = document.getElementById('oraculo-msgs');
  if (msgs) msgs.scrollTop = msgs.scrollHeight;
}
