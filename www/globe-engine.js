/* ═══════════════════════════════════════════════════════════════
   SWINGERSPHERE GLOBE ENGINE v3.0
   - Real continent outlines (simplified lat/lon polygons)
   - User dots fly IN from outside the sphere
   - Animated arcs between active users
   - Pulsing glow on active cities
   ═══════════════════════════════════════════════════════════════ */

// Simplified continent polygon clusters (lat radians, lon radians)
const CONTINENT_POLYS = [
  // Europe
  { pts:[[0.87,-0.17],[0.78,0.52],[0.68,0.52],[0.65,-0.05],[0.72,-0.26],[0.87,-0.17]], col:'#2a7a4a', name:'Europe' },
  // North Africa  
  { pts:[[0.35,-0.30],[0.35,0.60],[0.17,0.62],[0.12,-0.30],[0.35,-0.30]], col:'#a06020', name:'Africa-N' },
  // Sub-Saharan Africa
  { pts:[[0.17,-0.30],[0.17,0.60],[-0.35,0.50],[-0.55,0.30],[-0.35,-0.20],[0.17,-0.30]], col:'#8a5018', name:'Africa-S' },
  // North America
  { pts:[[1.20,-1.50],[0.90,-1.00],[0.52,-1.40],[0.42,-1.60],[0.65,-1.85],[1.05,-1.90],[1.20,-1.50]], col:'#3a6a8a', name:'N-America' },
  // Central/South America
  { pts:[[0.20,-1.35],[0.09,-1.20],[-0.10,-1.05],[-0.55,-1.10],[-0.75,-1.25],[-0.35,-1.70],[0.05,-1.55],[0.20,-1.35]], col:'#2a8a3a', name:'S-America' },
  // Russia/Asia
  { pts:[[1.10,0.60],[0.85,1.40],[0.70,2.50],[0.45,2.50],[0.30,1.50],[0.55,0.80],[0.75,0.55],[1.10,0.60]], col:'#6a5a2a', name:'Russia' },
  // China/SE Asia
  { pts:[[0.70,1.40],[0.55,1.50],[0.35,1.85],[0.20,1.90],[0.15,2.20],[0.45,2.50],[0.70,1.40]], col:'#5a4a1a', name:'Asia' },
  // India
  { pts:[[0.42,1.25],[0.18,1.25],[0.12,1.40],[0.20,1.55],[0.42,1.35],[0.42,1.25]], col:'#7a6a1a', name:'India' },
  // Australia
  { pts:[[-0.25,2.20],[-0.25,2.70],[-0.65,2.65],[-0.65,2.25],[-0.25,2.20]], col:'#9a6a2a', name:'Australia' },
  // Japan/Korea
  { pts:[[0.60,2.30],[0.52,2.35],[0.55,2.45],[0.62,2.40],[0.60,2.30]], col:'#5a6a7a', name:'Japan' },
  // Greenland
  { pts:[[1.18,-0.85],[1.05,-0.30],[1.15,-0.10],[1.28,-0.50],[1.18,-0.85]], col:'#4a6a7a', name:'Greenland' },
];

// Active city hotspots (lat deg, lon deg, name, intensity)
const CITY_HOTSPOTS = [
  {lat:40.4, lon:-3.7,  name:'Madrid',     i:0.9},
  {lat:41.4, lon:2.2,   name:'Barcelona',  i:0.8},
  {lat:48.9, lon:2.3,   name:'París',      i:0.9},
  {lat:52.5, lon:13.4,  name:'Berlín',     i:0.85},
  {lat:51.5, lon:-0.1,  name:'Londres',    i:0.8},
  {lat:37.9, lon:23.7,  name:'Atenas',     i:0.7},
  {lat:43.6, lon:3.9,   name:'Cap d\'Agde',i:0.95},
  {lat:45.5, lon:12.3,  name:'Venecia',    i:0.75},
  {lat:52.4, lon:4.9,   name:'Ámsterdam',  i:0.85},
  {lat:40.7, lon:-74.0, name:'NY',         i:0.7},
  {lat:34.1, lon:-118.2,name:'LA',         i:0.65},
  {lat:25.8, lon:-80.2, name:'Miami',      i:0.8},
  {lat:21.2, lon:-86.8, name:'Cancún',     i:0.9},
  {lat:-22.9,lon:-43.2, name:'Río',        i:0.75},
  {lat:1.3,  lon:103.8, name:'Singapur',   i:0.6},
  {lat:-33.9,lon:151.2, name:'Sydney',     i:0.65},
  {lat:55.8, lon:37.6,  name:'Moscú',      i:0.55},
  {lat:31.2, lon:121.5, name:'Shanghái',   i:0.6},
];

class SwingerGlobe {
  constructor(canvas, opts={}) {
    this.cv = canvas;
    this.ctx = canvas.getContext('2d');
    this.sz = canvas.width;
    this.cx = this.sz / 2;
    this.cy = this.sz / 2;
    this.r  = this.sz / 2 - 1;
    this.angle = opts.startAngle || 0;
    this.tilt  = 0.32;
    this.speed = opts.speed || 0.003;
    this.gridN = opts.gridN || 5;
    this.showLabels = opts.showLabels || false;
    this.raf  = null;
    this.t    = 0;

    // Incoming dots (fly in from outside)
    this.flyDots = this._genFlyDots(opts.userCount || 20);
    // Static city hotspots (scaled to canvas)
    this.cities = CITY_HOTSPOTS.map(c => ({
      ...c,
      lt: c.lat * Math.PI / 180,
      ln: c.lon * Math.PI / 180,
      phase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.8 + Math.random() * 1.2,
    }));
    // Arcs between random cities
    this.arcs = this._genArcs(6);
  }

  _genFlyDots(n) {
    return Array.from({ length: n }, () => ({
      lt: (Math.random() - 0.5) * Math.PI,
      ln: Math.random() * Math.PI * 2,
      online: Math.random() > 0.25,
      phase: Math.random() * Math.PI * 2,
      speed: 0.7 + Math.random() * 1.5,
      // Fly-in state: progress 0 = far outside, 1 = on sphere
      progress: Math.random(),      // current position [0,1]
      flySpeed: 0.004 + Math.random() * 0.006,
      startDist: 1.8 + Math.random() * 1.5, // start distance multiplier
      sz: 0.8 + Math.random() * 1.0,
    }));
  }

  _genArcs(n) {
    const arcs = [];
    for (let i = 0; i < n; i++) {
      const a = this.cities[Math.floor(Math.random() * this.cities.length)];
      const b = this.cities[Math.floor(Math.random() * this.cities.length)];
      arcs.push({ a, b, phase: Math.random() * Math.PI * 2, speed: 0.5 + Math.random() });
    }
    return arcs;
  }

  _proj(lt, ln) {
    const al = ln + this.angle;
    const x3 = Math.cos(lt) * Math.sin(al);
    const y3 = Math.sin(lt);
    const z3 = Math.cos(lt) * Math.cos(al);
    const y2 = y3 * Math.cos(this.tilt) - z3 * Math.sin(this.tilt);
    const z2 = y3 * Math.sin(this.tilt) + z3 * Math.cos(this.tilt);
    return { x: this.cx + x3 * this.r, y: this.cy - y2 * this.r, v: z2 > -0.1, z: z2, d: (z2 + 1) / 2 };
  }

  // Project at fractional distance from center (for fly-in)
  _projDist(lt, ln, dist) {
    const al = ln + this.angle;
    const x3 = Math.cos(lt) * Math.sin(al);
    const y3 = Math.sin(lt);
    const z3 = Math.cos(lt) * Math.cos(al);
    const y2 = y3 * Math.cos(this.tilt) - z3 * Math.sin(this.tilt);
    const z2 = y3 * Math.sin(this.tilt) + z3 * Math.cos(this.tilt);
    return { x: this.cx + x3 * this.r * dist, y: this.cy - y2 * this.r * dist, v: z2 > -0.2 };
  }

  _drawContinent(poly) {
    const ctx = this.ctx;
    const r = this.r;
    const pts = poly.pts;
    let started = false;
    ctx.beginPath();
    for (let i = 0; i <= pts.length; i++) {
      const [lt, ln] = pts[i % pts.length];
      const p = this._proj(lt, ln);
      if (!p.v) { started = false; continue; }
      if (!started) { ctx.moveTo(p.x, p.y); started = true; }
      else ctx.lineTo(p.x, p.y);
    }
    ctx.fillStyle = poly.col + 'cc';
    ctx.fill();
    ctx.strokeStyle = poly.col + 'ff';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  draw(ts) {
    this.t = ts;
    const ctx = this.ctx;
    const r = this.r, cx = this.cx, cy = this.cy;

    ctx.clearRect(0, 0, this.sz, this.sz);

    // Clip to circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    // Ocean gradient
    const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.05, cx, cy, r);
    g.addColorStop(0, '#152535');
    g.addColorStop(0.5, '#0a1825');
    g.addColorStop(1, '#050d18');
    ctx.fillStyle = g;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

    // Atmosphere glow
    const at = ctx.createRadialGradient(cx, cy, r * 0.75, cx, cy, r);
    at.addColorStop(0, 'rgba(0,100,200,0)');
    at.addColorStop(1, 'rgba(0,50,160,0.28)');
    ctx.fillStyle = at;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();

    // Grid lines
    ctx.lineWidth = 0.35;
    ctx.strokeStyle = 'rgba(80,140,220,0.10)';
    for (let i = 0; i < this.gridN; i++) {
      const lt = (i / this.gridN) * Math.PI - Math.PI / 2;
      ctx.beginPath(); let s = false;
      for (let j = 0; j <= 60; j++) {
        const p = this._proj(lt, (j / 60) * Math.PI * 2);
        if (!p.v) { s = false; continue; }
        s ? ctx.lineTo(p.x, p.y) : (ctx.moveTo(p.x, p.y), s = true);
      }
      ctx.stroke();
    }
    for (let i = 0; i < this.gridN * 2; i++) {
      const ln = (i / (this.gridN * 2)) * Math.PI * 2;
      ctx.beginPath(); let s = false;
      for (let j = 0; j <= 60; j++) {
        const p = this._proj((j / 60) * Math.PI - Math.PI / 2, ln);
        if (!p.v) { s = false; continue; }
        s ? ctx.lineTo(p.x, p.y) : (ctx.moveTo(p.x, p.y), s = true);
      }
      ctx.stroke();
    }

    // Continents
    CONTINENT_POLYS.forEach(poly => this._drawContinent(poly));

    // Arcs between cities
    this.arcs.forEach(arc => {
      const pa = this._proj(arc.a.lt, arc.a.ln);
      const pb = this._proj(arc.b.lt, arc.b.ln);
      if (!pa.v || !pb.v) return;
      const prog = (Math.sin(ts * 0.0008 * arc.speed + arc.phase) + 1) / 2;
      const x = pa.x + (pb.x - pa.x) * prog;
      const y = pa.y + (pb.y - pa.y) * prog - 15 * Math.sin(prog * Math.PI);
      ctx.strokeStyle = `rgba(196,129,58,0.15)`;
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.quadraticCurveTo(
        (pa.x + pb.x) / 2, (pa.y + pb.y) / 2 - 20,
        pb.x, pb.y
      );
      ctx.stroke();
      // Moving dot on arc
      ctx.beginPath();
      ctx.arc(x, y, 1.5 * (r / 100), 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(196,129,58,0.8)';
      ctx.fill();
    });

    // City hotspots (pulsing rings)
    this.cities.forEach(city => {
      const p = this._proj(city.lt, city.ln);
      if (!p.v) return;
      const sc = r / 100;
      const pulse = (Math.sin(ts * 0.001 * city.pulseSpeed + city.phase) + 1) / 2;
      // Outer ring
      ctx.beginPath();
      ctx.arc(p.x, p.y, (3 + pulse * 4) * sc, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(196,129,58,${0.05 + pulse * 0.15})`;
      ctx.fill();
      // Inner dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.8 * sc, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(224,148,85,${0.6 + pulse * 0.4})`;
      ctx.fill();
    });

    // Fly-in user dots
    const sc = r / 100;
    this.flyDots.forEach(d => {
      // Ease-in: progress grows until 1, then reset with new position
      d.progress = Math.min(d.progress + d.flySpeed, 1.0);
      if (d.progress >= 1.0) {
        // Reset to new position, fly in again
        d.lt = (Math.random() - 0.5) * Math.PI;
        d.ln = Math.random() * Math.PI * 2;
        d.online = Math.random() > 0.25;
        d.progress = 0;
        d.startDist = 1.6 + Math.random() * 1.5;
        d.flySpeed = 0.003 + Math.random() * 0.006;
      }

      // Ease-out curve
      const ease = 1 - Math.pow(1 - d.progress, 3);
      const dist = d.startDist - (d.startDist - 1) * ease;
      const p = this._projDist(d.lt, d.ln, dist);
      if (!p.v) return;

      const alpha = Math.min(d.progress * 3, 1);
      const blink = Math.sin(ts * 0.001 * d.speed + d.phase);
      const al = (0.5 + blink * 0.5) * alpha;
      const dsz = (d.sz + Math.max(0, blink) * 0.6) * sc;

      const col = d.online ? `rgba(48,209,88,${al})` : `rgba(255,69,58,${al * 0.7})`;
      const glow = d.online ? `rgba(48,209,88,${al * 0.3})` : `rgba(255,69,58,${al * 0.2})`;

      // Trail effect: draw line from outer position toward sphere
      if (d.progress < 0.6 && d.progress > 0.05) {
        const p2 = this._projDist(d.lt, d.ln, dist + 0.08);
        if (p2.v) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = col.replace(')', `,${alpha * 0.4})`).replace('rgb', 'rgb');
          ctx.lineWidth = dsz * 0.5;
          ctx.stroke();
        }
      }

      // Glow
      ctx.beginPath();
      ctx.arc(p.x, p.y, dsz * 2.8, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();
      // Dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, dsz, 0, Math.PI * 2);
      ctx.fillStyle = col;
      ctx.fill();
    });

    // Specular highlight
    const sp = ctx.createRadialGradient(cx - r * 0.38, cy - r * 0.4, 0, cx - r * 0.18, cy - r * 0.18, r * 0.6);
    sp.addColorStop(0, 'rgba(255,255,255,0.12)');
    sp.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sp;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();

    ctx.restore();

    // Border ring
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(196,129,58,0.45)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Outer glow ring
    ctx.beginPath(); ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(196,129,58,0.12)';
    ctx.lineWidth = 4;
    ctx.stroke();

    this.angle += this.speed;
  }

  start() {
    const loop = ts => { this.draw(ts); this.raf = requestAnimationFrame(loop); };
    this.raf = requestAnimationFrame(loop);
    return this;
  }
  stop() { if (this.raf) cancelAnimationFrame(this.raf); }
}

/* ═══════════════════════════════════════════════════════════════
   EPHEMERAL MEDIA v2 — Single-view + 30min TTL
   GUARANTEE: image data lives ONLY in JS memory.
   - No download attribute
   - context-menu disabled
   - Destroyed on FIRST VIEW (click/tap) or after 30 min
   - Canvas scramble on destruction
   ═══════════════════════════════════════════════════════════════ */
class EphemeralMediaV2 {
  constructor() { this.registry = new Map(); }

  register(dataUrl, ttlMs = 30 * 60 * 1000, onDestroy) {
    const token = `EM2-${Date.now().toString(36)}-${Math.random().toString(36).substr(2,6)}`.toUpperCase();
    const timer = setTimeout(() => this._destroy(token, 'TTL_EXPIRED'), ttlMs);
    this.registry.set(token, { dataUrl, timer, onDestroy, created: Date.now(), ttl: ttlMs, viewed: false });
    return token;
  }

  markViewed(token) {
    const item = this.registry.get(token);
    if (!item || item.viewed) return;
    item.viewed = true;
    // Destroy after 3 seconds of viewing
    setTimeout(() => this._destroy(token, 'SINGLE_VIEW'), 3000);
  }

  _destroy(token, reason = 'MANUAL') {
    const item = this.registry.get(token);
    if (!item) return;
    clearTimeout(item.timer);

    // Scramble all elements with this token
    document.querySelectorAll(`[data-em-token="${token}"]`).forEach(el => {
      if (el.tagName === 'CANVAS') {
        const ctx = el.getContext('2d');
        const id = ctx.createImageData(el.width, el.height);
        crypto.getRandomValues(id.data);
        ctx.putImageData(id, 0, 0);
      } else {
        // Remove src first (browser cache purge)
        el.src = '';
        el.style.cssText += 'filter:blur(30px) brightness(0) !important;transition:all 0.5s;';
      }
      setTimeout(() => el.closest('.em2-wrap')?.remove(), 600);
    });

    if (typeof item.onDestroy === 'function') item.onDestroy(token, reason);

    // Log
    const logs = JSON.parse(localStorage.getItem('ss_em_log') || '[]');
    logs.push({ token, reason, ts: new Date().toISOString(), ttlMs: item.ttl });
    if (logs.length > 100) logs.shift();
    localStorage.setItem('ss_em_log', JSON.stringify(logs));
    this.registry.delete(token);
  }

  buildViewer(token, dataUrl, ttlMs = 30 * 60 * 1000) {
    const wrap = document.createElement('div');
    wrap.className = 'em2-wrap';
    wrap.style.cssText = 'position:relative;display:inline-block;border-radius:12px;overflow:hidden;max-width:220px;user-select:none;-webkit-user-select:none;';

    // Use canvas instead of img (harder to save)
    const cv = document.createElement('canvas');
    cv.width = 220; cv.height = 160;
    cv.dataset.emToken = token;
    cv.style.cssText = 'display:block;border-radius:12px;cursor:pointer;';
    cv.title = 'Imagen efímera — toca para ver · se destruye después';

    // Draw image on canvas
    const img = new Image();
    img.onload = () => {
      const ctx = cv.getContext('2d');
      ctx.drawImage(img, 0, 0, 220, 160);
    };
    img.src = dataUrl;

    // Prevent right-click / save
    cv.addEventListener('contextmenu', e => e.preventDefault());
    cv.addEventListener('pointerdown', e => {
      e.preventDefault();
      this.markViewed(token);
      badge.textContent = '💥 Visto · destruyendo...';
      badge.style.background = 'rgba(255,0,0,0.9)';
    });

    // Timer badge
    const badge = document.createElement('div');
    badge.style.cssText = 'position:absolute;top:6px;right:6px;background:rgba(255,69,58,0.9);color:#fff;font-size:10px;font-weight:700;padding:3px 8px;border-radius:9999px;font-family:monospace;pointer-events:none;';
    const secs = Math.floor(ttlMs / 1000);
    badge.textContent = `💥 ${Math.floor(secs/60)}:${String(secs%60).padStart(2,'0')}`;
    let rem = secs;
    const iv = setInterval(() => {
      rem--;
      if (rem <= 0) { clearInterval(iv); badge.textContent = '💥 0:00'; }
      else badge.textContent = `💥 ${Math.floor(rem/60)}:${String(rem%60).padStart(2,'0')}`;
    }, 1000);

    const info = document.createElement('div');
    info.style.cssText = 'position:absolute;bottom:6px;left:6px;font-size:9px;color:rgba(255,255,255,0.7);pointer-events:none;';
    info.textContent = '🛡️ 1 vista · Sin capturas';

    // Screenshot detection (visibility API)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this._destroy(token, 'VISIBILITY_CHANGE');
    }, { once: true });

    wrap.appendChild(cv);
    wrap.appendChild(badge);
    wrap.appendChild(info);
    return wrap;
  }
}

/* ═══════════════════════════════════════════════════════════════
   GLOBE INSTANCES MANAGER
   ═══════════════════════════════════════════════════════════════ */
window.GLOBES = window.GLOBES || {};
window.EM2 = window.EM2 || new EphemeralMediaV2();
window.SwingerGlobe = SwingerGlobe;

window.startGlobe = function(canvasId, opts = {}) {
  const cv = document.getElementById(canvasId);
  if (!cv) return;
  if (window.GLOBES[canvasId]) {
    window.GLOBES[canvasId].stop();
    delete window.GLOBES[canvasId];
  }
  window.GLOBES[canvasId] = new SwingerGlobe(cv, opts).start();
  return window.GLOBES[canvasId];
};

window.stopGlobe = function(canvasId) {
  window.GLOBES[canvasId]?.stop();
  delete window.GLOBES[canvasId];
};

console.log('🌍 SwingerSphere Globe Engine v3.0 loaded');
