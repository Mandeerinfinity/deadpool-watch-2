/* Deadpool Watch 2 — visual effects (v1 + confetti, shockwaves, streak sparks, baby legs, disco ball): embers, glass shatter, claw slashes, katana blade, unicorn, dogpool. */
window.DP = window.DP || {};
(function () {
  const FX = {};
  const rand = (a, b) => a + Math.random() * (b - a);
  const DPR = Math.min(2, window.devicePixelRatio || 1);
  let W = innerWidth, H = innerHeight;

  // ---------- sprite cache for glowing particles ----------
  const sprites = {};
  function sprite(color) {
    if (sprites[color]) return sprites[color];
    const c = document.createElement("canvas"); c.width = c.height = 64;
    const g = c.getContext("2d"), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, "#fff"); gr.addColorStop(0.18, color); gr.addColorStop(0.5, color + "55"); gr.addColorStop(1, color + "00");
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    return (sprites[color] = c);
  }
  const PALETTES = {
    dp: ["#ff2a36", "#ff5a1f", "#ff8a3d", "#ff2a36", "#ffffff"],
    wolverine: ["#ffc814", "#ffe36b", "#2f7bff", "#ffc814", "#ffffff"],
    unicorn: ["#ff4d6d", "#ffb13d", "#ffe94d", "#4dff88", "#4dc3ff", "#b44dff"]
  };
  FX.mode = "dp";

  // ---------- background embers ----------
  const bg = document.getElementById("fxBg"), bgx = bg.getContext("2d");
  const top = document.getElementById("fxTop"), tx = top.getContext("2d");
  let embers = [];
  function resize() {
    W = innerWidth; H = innerHeight;
    [bg, top].forEach(c => { c.width = Math.round(W * DPR); c.height = Math.round(H * DPR); c.style.width = W + "px"; c.style.height = H + "px"; });
    bgx.setTransform(DPR, 0, 0, DPR, 0, 0); tx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  resize(); addEventListener("resize", resize);
  function newEmber(anyY) {
    const pal = PALETTES[FX.mode] || PALETTES.dp;
    return { x: rand(0, W), y: anyY ? rand(0, H) : H + 10, vx: rand(-0.15, 0.15), vy: rand(-0.25, -0.8), r: rand(3, 11), a: rand(0.25, 0.8), ph: rand(0, 6.28), c: pal[Math.floor(Math.random() * pal.length)] };
  }
  FX.setEmbers = function (on) { embers = on ? Array.from({ length: 34 }, () => newEmber(true)) : []; if (!on) bgx.clearRect(0, 0, W, H); };
  FX.recolor = function () { embers.forEach(e => { const p = PALETTES[FX.mode] || PALETTES.dp; e.c = p[Math.floor(Math.random() * p.length)]; }); };

  // ---------- top layer: bursts, cracks, slashes ----------
  const bursts = [];
  FX.burst = function (x, y, n = 18, pal) {
    const p = pal || PALETTES[FX.mode] || PALETTES.dp;
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2), sp = rand(1.5, 6);
      bursts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1.5, life: 1, decay: rand(0.012, 0.03), r: rand(4, 12), c: p[Math.floor(Math.random() * p.length)] });
    }
  };
  let cracks = null;
  FX.shatter = function (x, y) {
    const rays = [], n = Math.floor(rand(13, 18)), maxR = Math.hypot(W, H);
    for (let i = 0; i < n; i++) {
      const base = (i / n) * Math.PI * 2 + rand(-0.15, 0.15);
      const pts = [[x, y]]; let r = 0, a = base;
      while (r < maxR) { r += rand(30, 90); a += rand(-0.12, 0.12); pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); }
      rays.push({ pts, base });
    }
    const rings = [];
    [rand(28, 40), rand(80, 110), rand(160, 210), rand(280, 340)].forEach(R => {
      for (let i = 0; i < n; i++) {
        if (Math.random() < 0.25) continue;
        const r1 = rays[i], r2 = rays[(i + 1) % n];
        const p1 = pointAt(r1.pts, R + rand(-10, 10)), p2 = pointAt(r2.pts, R + rand(-10, 10));
        const mx = (p1[0] + p2[0]) / 2 + rand(-8, 8), my = (p1[1] + p2[1]) / 2 + rand(-8, 8);
        rings.push({ p1, p2, m: [mx, my], R });
      }
    });
    const shards = [];
    for (let i = 0; i < 26; i++) {
      const a = rand(0, Math.PI * 2), R = rand(40, 260), cx = x + Math.cos(a) * R, cy = y + Math.sin(a) * R, s = rand(14, 44);
      const poly = Array.from({ length: 3 + Math.floor(rand(0, 3)) }, (_, k, arr) => { const t = (k / 3.6) * Math.PI * 2 + rand(-.4, .4); return [Math.cos(t) * s * rand(.6, 1.2), Math.sin(t) * s * rand(.6, 1.2)]; });
      shards.push({ x: cx, y: cy, vx: rand(-1.5, 1.5) + Math.cos(a) * 1.2, vy: rand(-3, 0), rot: 0, vr: rand(-0.12, 0.12), poly, delay: rand(900, 1500) });
    }
    cracks = { x, y, rays, rings, shards, t0: performance.now(), maxR };
  };
  function pointAt(pts, R) {
    for (let i = 1; i < pts.length; i++) {
      const d = Math.hypot(pts[i][0] - pts[0][0], pts[i][1] - pts[0][1]);
      if (d >= R) {
        const dp = Math.hypot(pts[i - 1][0] - pts[0][0], pts[i - 1][1] - pts[0][1]), t = (R - dp) / Math.max(1, d - dp);
        return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t];
      }
    }
    return pts[pts.length - 1];
  }
  function drawCracks(now) {
    const c = cracks, age = now - c.t0;
    if (age > 3200) { cracks = null; return; }
    const grow = Math.min(1, age / 140), R = grow * c.maxR;
    const fade = age < 1700 ? 1 : Math.max(0, 1 - (age - 1700) / 1300);
    // impact flash
    if (age < 220) { tx.fillStyle = `rgba(255,255,255,${0.55 * (1 - age / 220)})`; tx.fillRect(0, 0, W, H); }
    tx.save(); tx.globalAlpha = fade; tx.lineJoin = "round"; tx.lineCap = "round";
    const pass = (style, w) => {
      tx.strokeStyle = style; tx.lineWidth = w; tx.beginPath();
      c.rays.forEach(r => {
        tx.moveTo(r.pts[0][0], r.pts[0][1]);
        for (let i = 1; i < r.pts.length; i++) {
          const d = Math.hypot(r.pts[i][0] - c.x, r.pts[i][1] - c.y);
          if (d > R) { const p = pointAt(r.pts, R); tx.lineTo(p[0], p[1]); break; }
          tx.lineTo(r.pts[i][0], r.pts[i][1]);
        }
      });
      c.rings.forEach(g => { if (g.R < R) { tx.moveTo(g.p1[0], g.p1[1]); tx.quadraticCurveTo(g.m[0], g.m[1], g.p2[0], g.p2[1]); } });
      tx.stroke();
    };
    pass("rgba(0,0,0,.45)", 3.2); pass("rgba(255,255,255,.95)", 1.3);
    // crushed center
    const cg = tx.createRadialGradient(c.x, c.y, 0, c.x, c.y, 34);
    cg.addColorStop(0, "rgba(255,255,255,.9)"); cg.addColorStop(0.4, "rgba(255,255,255,.35)"); cg.addColorStop(1, "rgba(255,255,255,0)");
    tx.fillStyle = cg; tx.beginPath(); tx.arc(c.x, c.y, 34, 0, 7); tx.fill();
    // glints along rays
    tx.fillStyle = "rgba(255,255,255,.12)";
    c.rays.forEach((r, i) => { if (i % 2) return; const p = pointAt(r.pts, 90), q = pointAt(c.rays[(i + 1) % c.rays.length].pts, 90); tx.beginPath(); tx.moveTo(c.x, c.y); tx.lineTo(p[0], p[1]); tx.lineTo(q[0], q[1]); tx.closePath(); tx.fill(); });
    tx.restore();
    // falling shards
    c.shards.forEach(s => {
      if (age < s.delay) return;
      s.vy += 0.45; s.x += s.vx; s.y += s.vy; s.rot += s.vr;
      tx.save(); tx.translate(s.x, s.y); tx.rotate(s.rot);
      tx.beginPath(); s.poly.forEach((p, i) => i ? tx.lineTo(p[0], p[1]) : tx.moveTo(p[0], p[1])); tx.closePath();
      const lg = tx.createLinearGradient(-20, -20, 20, 20); lg.addColorStop(0, "rgba(255,255,255,.35)"); lg.addColorStop(1, "rgba(180,220,255,.08)");
      tx.fillStyle = lg; tx.fill(); tx.strokeStyle = "rgba(255,255,255,.8)"; tx.lineWidth = 1; tx.stroke();
      tx.restore();
    });
  }
  let slashes = null;
  FX.claws = function () {
    const lines = [];
    const ang = rand(-1.05, -0.8), cx = W / 2, cy = H / 2, len = Math.hypot(W, H) * 0.75;
    for (let k = -1; k <= 1; k++) {
      const off = k * 46, nx = -Math.sin(ang) * off, ny = Math.cos(ang) * off;
      lines.push({ x1: cx + nx - Math.cos(ang) * len / 2, y1: cy + ny - Math.sin(ang) * len / 2, x2: cx + nx + Math.cos(ang) * len / 2, y2: cy + ny + Math.sin(ang) * len / 2, d: (k + 1) * 40 });
    }
    slashes = { lines, t0: performance.now() };
  };
  function drawSlashes(now) {
    const age = now - slashes.t0;
    if (age > 1300) { slashes = null; return; }
    const fade = age < 600 ? 1 : 1 - (age - 600) / 700;
    slashes.lines.forEach(l => {
      const g = Math.min(1, Math.max(0, (age - l.d) / 150)); if (!g) return;
      const ex = l.x1 + (l.x2 - l.x1) * g, ey = l.y1 + (l.y2 - l.y1) * g;
      const nx = -(l.y2 - l.y1), ny = l.x2 - l.x1, nl = Math.hypot(nx, ny), ux = nx / nl, uy = ny / nl;
      const mx = (l.x1 + ex) / 2, my = (l.y1 + ey) / 2;
      tx.save(); tx.globalAlpha = fade;
      [[16, "rgba(255,200,20,.35)"], [8, "rgba(0,0,0,.9)"], [3.5, "rgba(210,10,20,1)"]].forEach(([w, col]) => {
        tx.fillStyle = col; tx.beginPath(); tx.moveTo(l.x1, l.y1);
        tx.quadraticCurveTo(mx + ux * w, my + uy * w, ex, ey);
        tx.quadraticCurveTo(mx - ux * w * 0.3, my - uy * w * 0.3, l.x1, l.y1); tx.fill();
      });
      tx.restore();
    });
  }


  // ---------- v2: shockwave rings, streak sparks, confetti ----------
  const rings = [], streaks = [], confetti = [];
  FX.shock = function (x, y, color, max = 160) { rings.push({ x, y, r: 6, max, life: 1, c: color || (FX.mode === "wolverine" ? "#ffc814" : "#ff2a36") }); };
  FX.boom = function (x, y, n = 22, pal) {
    FX.burst(x, y, n, pal); FX.shock(x, y); FX.shock(x, y, "#ffffff", 90);
    const p = pal || PALETTES[FX.mode] || PALETTES.dp;
    for (let i = 0; i < n; i++) { const a = rand(0, 6.283), sp = rand(4, 11); streaks.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, c: p[i % p.length] }); }
    if (DP.gl && DP.gl.boom) DP.gl.boom(0.6);
  };
  FX.confetti = function (n = 120, pal) {
    const p = pal || ["#ff2a36", "#ffc814", "#2f7bff", "#ffffff", "#4dff88", "#ff4dcf"];
    for (let i = 0; i < n; i++) confetti.push({ x: rand(0, W), y: rand(-H * 0.6, -10), vx: rand(-1.2, 1.2), vy: rand(1.5, 4), rot: rand(0, 6.28), vr: rand(-0.2, 0.2), w: rand(6, 12), h: rand(3, 7), c: p[Math.floor(Math.random() * p.length)], ph: rand(0, 6.28), life: 1 });
  };
  function drawV2(dt) {
    for (let i = rings.length - 1; i >= 0; i--) {
      const r = rings[i]; r.r += (r.max - r.r) * 0.12 * dt; r.life -= 0.035 * dt;
      if (r.life <= 0) { rings.splice(i, 1); continue; }
      tx.globalAlpha = r.life; tx.strokeStyle = r.c; tx.lineWidth = 2 + r.life * 7;
      tx.beginPath(); tx.arc(r.x, r.y, r.r, 0, 6.2832); tx.stroke();
    }
    tx.globalCompositeOperation = "lighter"; tx.lineCap = "round";
    for (let i = streaks.length - 1; i >= 0; i--) {
      const s = streaks[i]; s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= 0.93; s.vy = s.vy * 0.93 + 0.18 * dt; s.life -= 0.03 * dt;
      if (s.life <= 0) { streaks.splice(i, 1); continue; }
      tx.globalAlpha = s.life; tx.strokeStyle = s.c; tx.lineWidth = 2.4;
      tx.beginPath(); tx.moveTo(s.x, s.y); tx.lineTo(s.x - s.vx * 3, s.y - s.vy * 3); tx.stroke();
    }
    tx.globalCompositeOperation = "source-over";
    for (let i = confetti.length - 1; i >= 0; i--) {
      const c = confetti[i]; c.ph += 0.1 * dt; c.x += (c.vx + Math.sin(c.ph) * 0.8) * dt; c.y += c.vy * dt; c.rot += c.vr * dt;
      if (c.y > H + 20) { confetti.splice(i, 1); continue; }
      tx.globalAlpha = 1; tx.save(); tx.translate(c.x, c.y); tx.rotate(c.rot); tx.scale(1, Math.cos(c.ph * 1.3));
      tx.fillStyle = c.c; tx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h); tx.restore();
    }
    tx.globalAlpha = 1;
    return rings.length || streaks.length || confetti.length;
  }

  // ---------- frame ----------
  let lastT = performance.now(), topDirty = false;
  FX.frame = function (now) {
    const dt = Math.min(3, (now - lastT) / 16.67); lastT = now;
    if (embers.length) {
      bgx.clearRect(0, 0, W, H);
      bgx.globalCompositeOperation = "lighter";
      for (let i = 0; i < embers.length; i++) {
        const e = embers[i];
        e.ph += 0.02 * dt; e.x += (e.vx + Math.sin(e.ph) * 0.25) * dt; e.y += e.vy * dt;
        if (e.y < -20) embers[i] = newEmber(false);
        const fl = 0.75 + Math.sin(e.ph * 3) * 0.25;
        bgx.globalAlpha = e.a * fl * Math.min(1, (H - e.y) / 120 + 0.2);
        bgx.drawImage(sprite(e.c), e.x - e.r, e.y - e.r, e.r * 2, e.r * 2);
      }
      bgx.globalAlpha = 1; bgx.globalCompositeOperation = "source-over";
    }
    if (bursts.length || cracks || slashes || topDirty || rings.length || streaks.length || confetti.length) {
      tx.clearRect(0, 0, W, H); topDirty = false;
      if (cracks) { drawCracks(now); topDirty = true; }
      if (slashes) { drawSlashes(now); topDirty = true; }
      if (bursts.length) {
        tx.globalCompositeOperation = "lighter";
        for (let i = bursts.length - 1; i >= 0; i--) {
          const b = bursts[i];
          b.vy += 0.12 * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.vx *= 0.985; b.life -= b.decay * dt;
          if (b.life <= 0) { bursts.splice(i, 1); continue; }
          tx.globalAlpha = b.life; const r = b.r * (0.5 + b.life * 0.5);
          tx.drawImage(sprite(b.c), b.x - r, b.y - r, r * 2, r * 2);
        }
        tx.globalAlpha = 1; tx.globalCompositeOperation = "source-over"; topDirty = true;
      }
      if (drawV2(dt)) topDirty = true;
    }
  };

  // ---------- katana blade transition ----------
  const blade = document.getElementById("blade");
  FX.blade = function (dur) {
    const diag = Math.hypot(W, H), a = Math.atan2(-H, W);
    blade.style.width = diag * 1.3 + "px";
    blade.style.left = -diag * 0.65 + "px";
    blade.style.display = "block";
    const anim = blade.animate([
      { transform: `translate(0px,0px) rotate(${a}rad)`, opacity: 1 },
      { transform: `translate(${W}px,${H}px) rotate(${a}rad)`, opacity: 1 }
    ], { duration: dur, easing: "cubic-bezier(.7,0,.25,1)" });
    anim.onfinish = () => { blade.style.display = "none"; };
  };

  // ---------- unicorn & dogpool overlays ----------
  const overlay = document.getElementById("overlayFx");
  const UNICORN = `<svg viewBox="0 -24 210 170" class="unicorn-svg">
    <g class="u-tail"><path d="M42 62 C18 58 8 78 4 100" stroke="#ff4d6d" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M42 66 C22 66 14 86 12 106" stroke="#ffb13d" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M42 70 C28 74 22 92 22 110" stroke="#4dc3ff" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M42 74 C34 80 32 96 34 112" stroke="#b44dff" stroke-width="7" fill="none" stroke-linecap="round"/></g>
    <g class="u-leg u-back"><rect x="58" y="84" width="11" height="38" rx="5" fill="#fff" stroke="#222" stroke-width="3"/><rect x="58" y="114" width="11" height="9" rx="3" fill="#ffc814" stroke="#222" stroke-width="2.5"/></g>
    <g class="u-leg u-front"><rect x="112" y="84" width="11" height="38" rx="5" fill="#fff" stroke="#222" stroke-width="3"/><rect x="112" y="114" width="11" height="9" rx="3" fill="#ffc814" stroke="#222" stroke-width="2.5"/></g>
    <ellipse cx="92" cy="70" rx="52" ry="29" fill="#fff" stroke="#222" stroke-width="3.5"/>
    <g class="u-leg u-front2"><rect x="76" y="86" width="11" height="36" rx="5" fill="#f2f2f2" stroke="#222" stroke-width="3"/><rect x="76" y="114" width="11" height="9" rx="3" fill="#ffc814" stroke="#222" stroke-width="2.5"/></g>
    <g class="u-leg u-back2"><rect x="128" y="84" width="11" height="38" rx="5" fill="#f2f2f2" stroke="#222" stroke-width="3"/><rect x="128" y="114" width="11" height="9" rx="3" fill="#ffc814" stroke="#222" stroke-width="2.5"/></g>
    <path d="M120 58 L140 18 L170 22 L150 70 Z" fill="#fff" stroke="#222" stroke-width="3.5" stroke-linejoin="round"/>
    <ellipse cx="166" cy="30" rx="26" ry="17" transform="rotate(18 166 30)" fill="#fff" stroke="#222" stroke-width="3.5"/>
    <path d="M160 16 L176 -20 L178 18 Z" fill="#ffd84d" stroke="#222" stroke-width="3" stroke-linejoin="round"/>
    <path d="M166 6 L174 2 M164 12 L176 8" stroke="#c98a00" stroke-width="2"/>
    <path d="M150 12 C140 6 128 14 132 26 C122 26 116 38 122 48" stroke="#ff4d6d" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M154 18 C146 16 138 24 142 34 C134 36 130 46 134 54" stroke="#4dc3ff" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M156 24 C172 16 186 22 190 32 C180 40 166 40 156 24 Z" fill="#111"/>
    <path d="M168 26 C174 23 182 25 184 30 C178 33 172 32 168 26 Z" fill="#fff"/>
    <circle cx="186" cy="44" r="4" fill="#ff8fb1" opacity=".8"/><circle cx="191" cy="38" r="2" fill="#222"/>
  </svg>`;
  const DOG = `<svg viewBox="0 0 220 230" class="dog-svg">
    <g class="d-ear d-earL"><path d="M50 70 C10 60 6 130 36 146 C44 120 50 100 64 88 Z" fill="#e7ddcf" stroke="#222" stroke-width="4"/></g>
    <g class="d-ear d-earR"><path d="M170 70 C210 60 214 130 184 146 C176 120 170 100 156 88 Z" fill="#e7ddcf" stroke="#222" stroke-width="4"/></g>
    <path d="M86 34 L92 8 L100 30 L108 4 L114 30 L124 6 L128 34 L140 14 L138 40" fill="#fff" stroke="#222" stroke-width="3" stroke-linejoin="round"/>
    <ellipse cx="110" cy="112" rx="74" ry="80" fill="#efe6d8" stroke="#222" stroke-width="4.5"/>
    <path d="M38 104 C40 60 70 34 110 34 C150 34 180 60 182 104 C160 118 60 118 38 104 Z" fill="url(#redGrad)" stroke="#222" stroke-width="4"/>
    <path d="M104 106 C98 84 70 74 44 84 L42 104 C64 112 92 112 104 106 Z M116 106 C122 84 150 74 176 84 L178 104 C156 112 128 112 116 106 Z" fill="#0a0a0b"/>
    <path d="M52 92 C66 84 88 88 98 102 C82 108 62 104 52 92 Z M168 92 C154 84 132 88 122 102 C138 108 158 104 168 92 Z" fill="#fff"/>
    <ellipse cx="110" cy="140" rx="17" ry="12" fill="#1a1a1a"/><ellipse cx="104" cy="136" rx="5" ry="3" fill="#fff" opacity=".6"/>
    <path d="M110 152 C104 166 90 170 82 162 M110 152 C116 166 130 170 138 162" stroke="#222" stroke-width="4" fill="none" stroke-linecap="round"/>
    <g class="d-tongue"><path d="M112 164 C112 198 118 222 132 222 C146 222 146 196 136 162 Z" fill="#ff7aa2" stroke="#222" stroke-width="4"/><path d="M126 172 L130 206" stroke="#d94f7c" stroke-width="3"/></g>
  </svg>`;
  function spawn(cls, html, ms) {
    const el = document.createElement("div"); el.className = cls; el.innerHTML = html;
    overlay.appendChild(el); setTimeout(() => el.remove(), ms); return el;
  }
  FX.unicorn = function () {
    const el = spawn("fx-unicorn", UNICORN, 3400);
    const prev = FX.mode; FX.mode = "unicorn";
    let n = 0; const iv = setInterval(() => {
      const r = el.getBoundingClientRect();
      FX.burst(r.left + r.width * 0.15, r.top + r.height * 0.55, 6, PALETTES.unicorn);
      if (++n > 24) clearInterval(iv);
    }, 110);
    setTimeout(() => { FX.mode = prev; }, 3400);
  };
  FX.dogpool = function () { spawn("fx-dog", DOG, 3600); };
  FX.snikt = function () {
    const el = spawn("fx-word snikt", "SNIKT!", 1200);
    FX.claws(); return el;
  };
  FX.word = function (txt, cls = "") { spawn("fx-word " + cls, txt, 1300); };

  // ---------- v2 eggs: baby legs walker + disco ball ----------
  const LEGS = `<svg viewBox="0 0 120 170" class="legs-svg"><circle cx="60" cy="42" r="38" fill="url(#maskGrad)" stroke="#111" stroke-width="4"/>
    <path d="M56 44 C52 30 34 26 22 32 L22 52 C36 56 50 52 56 48Z M64 44 C68 30 86 26 98 32 L98 52 C84 56 70 52 64 48Z" fill="#0a0a0b"/>
    <path d="M28 38 C36 34 48 36 52 44 C44 48 34 46 28 38Z M92 38 C84 34 72 36 68 44 C76 48 86 46 92 38Z" fill="#fff"/>
    <rect x="44" y="78" width="32" height="30" rx="10" fill="#b30f18" stroke="#111" stroke-width="3"/>
    <g class="bl-l"><rect x="46" y="104" width="11" height="40" rx="5" fill="#f2c6a8" stroke="#111" stroke-width="3"/><ellipse cx="50" cy="146" rx="10" ry="6" fill="#f2c6a8" stroke="#111" stroke-width="3"/></g>
    <g class="bl-r"><rect x="63" y="104" width="11" height="40" rx="5" fill="#f2c6a8" stroke="#111" stroke-width="3"/><ellipse cx="72" cy="146" rx="10" ry="6" fill="#f2c6a8" stroke="#111" stroke-width="3"/></g>
    <rect x="42" y="100" width="36" height="14" rx="6" fill="#fff" stroke="#111" stroke-width="3"/></svg>`;
  FX.babyLegs = function () { spawn("fx-legs", LEGS, 5200); };
  const DISCO = `<div class="disco-string"></div><svg viewBox="0 0 100 100" class="disco-ball"><defs><clipPath id="dbc"><circle cx="50" cy="50" r="44"/></clipPath></defs><circle cx="50" cy="50" r="44" fill="#9aa3ad"/><g clip-path="url(#dbc)" class="disco-tiles">${Array.from({ length: 11 }, (_, r) => Array.from({ length: 11 }, (_, c) => `<rect x="${c * 9 + 1}" y="${r * 9 + 1}" width="8" height="8" fill="hsl(${(r * 37 + c * 53) % 360} 70% ${55 + ((r + c) % 3) * 12}%)" opacity="${0.35 + ((r * c) % 5) / 8}"/>`).join("")).join("")}</g><circle cx="36" cy="32" r="10" fill="#fff" opacity=".7"/></svg>`;
  FX.disco = function (ms = 8000) { spawn("fx-disco", DISCO, ms); };
  DP.fx = FX;
})();
