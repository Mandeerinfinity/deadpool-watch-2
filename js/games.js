/* Deadpool Watch 2 — Merc Arcade: Katana Slice (swipe) and Catch the Bullet (reaction). All art drawn in code. */
(function () {
  "use strict";
  const K = DP.core, $ = s => document.querySelector(s);
  const { LS, say, pick, ach, egg, esc, stats, saveStats, toast } = K;
  const layer = $("#gameLayer"), cv = $("#gameCanvas"), cx = cv.getContext("2d"), msg = $("#gMsg");
  const G = { active: null };
  let W = 0, H = 0, DPR = 1, raf = 0, last = 0;
  function resize() { DPR = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); cv.style.width = W + "px"; cv.style.height = H + "px"; cx.setTransform(DPR, 0, 0, DPR, 0, 0); }
  addEventListener("resize", () => { if (G.active) resize(); });
  const best = { slice: LS.get("best.slice", 0), bullet: LS.get("best.bullet", 0) };
  function renderBests() {
    $("#bestSlice").textContent = best.slice || 0; $("#bestBullet").textContent = best.bullet ? best.bullet + " ms" : "--";
    const h = (stats.games || []).slice(-6).reverse();
    $("#scoreList").innerHTML = h.length ? h.map(g => `<li><b>${g.g === "slice" ? "\uD83D\uDDE1\uFE0F KATANA SLICE" : "\uD83D\uDD2B CATCH THE BULLET"}</b><span>${g.g === "slice" ? g.s + " pts" : g.s + " ms avg"}</span><i>${new Date(g.t).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</i></li>`).join("") : `<li class="empty">No scores yet. Go embarrass yourself.</li>`;
  }
  function record(g, s) { stats.games = (stats.games || []).concat([{ g, s, t: Date.now() }]).slice(-30); saveStats(); }
  K.onEnter("scr-games", renderBests); renderBests();
  document.querySelectorAll(".game-card").forEach(c => c.addEventListener("click", () => start(c.dataset.game)));
  $("#gQuit").addEventListener("click", e => { e.stopPropagation(); stop(); });

  function start(name) {
    G.active = name; layer.hidden = false; layer.dataset.game = name; resize(); msg.innerHTML = ""; msg.className = "game-msg";
    document.documentElement.classList.add("gaming");
    DP.sound.start();
    (name === "slice" ? Slice : Bullet).start();
    cancelAnimationFrame(raf); last = performance.now(); raf = requestAnimationFrame(loop);
  }
  function stop() {
    G.active = null; layer.hidden = true; cancelAnimationFrame(raf); document.documentElement.classList.remove("gaming");
    Slice.pts = []; renderBests();
  }
  function loop(now) {
    if (!G.active) return;
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    (G.active === "slice" ? Slice : Bullet).frame(now, dt);
  }
  function showMsg(html, cls = "") { msg.innerHTML = html; msg.className = "game-msg show " + cls; }
  function overMsg(title, big, sub, isRecord) {
    showMsg(`<h2>${title}</h2><div class="gm-big">${big}</div><p>${esc(sub)}</p>${isRecord ? `<div class="gm-rec">NEW RECORD!</div>` : ""}<div class="gm-btns"><button class="btn btn-dark" data-g="quit">QUIT</button><button class="btn btn-red btn-big" data-g="again">AGAIN!</button></div>`, "over");
  }
  msg.addEventListener("click", e => { const b = e.target.closest("[data-g]"); if (!b) return; e.stopPropagation(); if (b.dataset.g === "quit") stop(); else start(G.active); });

  // shared drawing helpers
  function glow(x, y, r, col, a = 1) { const g = cx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, "rgba(0,0,0,0)"); cx.globalAlpha = a; cx.fillStyle = g; cx.beginPath(); cx.arc(x, y, r, 0, 7); cx.fill(); cx.globalAlpha = 1; }
  function bg(t, tint) {
    const g = cx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#1a0508"); g.addColorStop(0.6, "#0a0a0c"); g.addColorStop(1, "#050506");
    cx.fillStyle = g; cx.fillRect(0, 0, W, H);
    // halftone sun + rays
    cx.save(); cx.translate(W / 2, H * 0.36); cx.rotate(t * 0.05);
    for (let i = 0; i < 16; i++) { cx.rotate(Math.PI / 8); cx.fillStyle = i % 2 ? "rgba(255,255,255,.025)" : (tint || "rgba(209,18,28,.08)"); cx.beginPath(); cx.moveTo(0, 0); cx.lineTo(-60, -Math.max(W, H)); cx.lineTo(60, -Math.max(W, H)); cx.fill(); }
    cx.restore();
    glow(W / 2, H * 0.36, Math.min(W, H) * 0.5, "rgba(209,18,28,.35)");
  }

  // ================= KATANA SLICE =================
  const Slice = {
    items: [], halves: [], parts: [], pts: [], score: 0, lives: 3, t: 0, spawnT: 0, over: false, combo: 0, comboT: 0, texts: [],
    start() {
      Object.assign(this, { items: [], halves: [], parts: [], pts: [], score: 0, lives: 3, t: 0, spawnT: 0.8, over: false, combo: 0, texts: [], sliced: 0 });
      this.hud(); showMsg(`<h2>KATANA SLICE</h2><p>Swipe to slice chimichangas.<br>Tacos = +10. Unicorns = extra life.<br>Grenades = very bad.</p>`, "intro");
      setTimeout(() => { if (G.active === "slice" && !this.over) msg.className = "game-msg"; }, 1800);
      say(pick("game.sliceStart"), { silent: false });
    },
    hud() { $("#gScore").textContent = this.score; $("#gLives").innerHTML = "\u2764\uFE0F".repeat(Math.max(0, this.lives)) + "<s>" + "\u2764\uFE0F".repeat(Math.max(0, 3 - this.lives)) + "</s>"; },
    spawn() {
      const n = this.t > 40 ? 1 + Math.floor(Math.random() * 3) : this.t > 15 ? 1 + Math.floor(Math.random() * 2) : 1;
      for (let i = 0; i < n; i++) {
        const r = Math.random(), bomb = Math.min(0.28, 0.08 + this.t / 300);
        const type = r < bomb ? "grenade" : r < bomb + 0.05 ? "taco" : r < bomb + 0.075 && this.lives < 3 ? "unicorn" : "chimi";
        const x = W * (0.15 + Math.random() * 0.7), tx = W * (0.3 + Math.random() * 0.4);
        const vy = -Math.sqrt(2 * 900 * H * (0.55 + Math.random() * 0.3));
        const tFlight = -vy / 900;
        this.items.push({ type, x, y: H + 40, vx: (tx - x) / tFlight * 0.9, vy, r: type === "grenade" ? 26 : type === "taco" ? 30 : 32, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 6 });
      }
    },
    slice(it, ang) {
      it.dead = true;
      const pal = it.type === "chimi" ? ["#ffd54a", "#e0a650", "#ff8a3d"] : it.type === "taco" ? ["#ffd54a", "#4dff88", "#ff4d4d"] : it.type === "unicorn" ? ["#ff4d6d", "#ffe94d", "#4dc3ff", "#b44dff"] : ["#ff3b1f", "#ffd54a", "#ffffff"];
      for (let k = 0; k < 18; k++) { const a = Math.random() * 7, s = 80 + Math.random() * 320; this.parts.push({ x: it.x, y: it.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 120, life: 1, c: pal[k % pal.length], r: 2 + Math.random() * 4 }); }
      if (it.type === "grenade") {
        DP.sound.boom(); K.shake("shake-hard"); this.lives--; this.flash = 1; this.text("KABOOM!", it.x, it.y, "#ff3b1f");
        if (DP.fx.shock) DP.fx.shock(it.x, it.y, "#ffd54a", 300);
        this.hud(); if (this.lives <= 0) this.end(); return;
      }
      for (const side of [-1, 1]) this.halves.push({ type: it.type, x: it.x, y: it.y, vx: it.vx * 0.5 + Math.cos(ang + Math.PI / 2) * side * 140, vy: it.vy * 0.3 - 80, rot: it.rot, vr: side * 5, r: it.r, side, ang, life: 1.4 });
      this.sliced++; this.combo++; this.comboT = 0.25;
      let pts = it.type === "taco" ? 10 : it.type === "unicorn" ? 5 : 1;
      if (it.type === "taco") { DP.sound.sparkle(); this.text("+10 TACO!", it.x, it.y, "#ffd54a"); if (egg("taco")) setTimeout(() => say(pick("taco")), 300); }
      else if (it.type === "unicorn") { DP.sound.sparkle(); this.lives = Math.min(3, this.lives + 1); this.text("+1 LIFE", it.x, it.y, "#ff8fd1"); }
      else DP.sound.chop();
      this.score += pts; this.hud();
    },
    text(t, x, y, c) { this.texts.push({ t, x, y, c, life: 1 }); },
    end() {
      if (this.over) return; this.over = true;
      const s = this.score, rec = s > best.slice;
      if (rec) { best.slice = s; LS.set("best.slice", s); }
      record("slice", s); if (s >= 50) ach("slice_50"); if (s >= 200) ach("slice_200");
      DP.sound[rec ? "fanfare" : "gong"]();
      setTimeout(() => { overMsg("GAME OVER", s, rec && s > 0 ? pick("game.record") : pick("game.over"), rec && s > 0); if (rec && s > 0) DP.fx.confetti(120); }, 700);
    },
    frame(now, dt) {
      const t = now / 1000; bg(t);
      if (!this.over) {
        this.t += dt; this.spawnT -= dt;
        if (this.spawnT <= 0) { this.spawn(); this.spawnT = Math.max(0.55, 1.5 - this.t / 60) * (0.7 + Math.random() * 0.6); }
      }
      if (this.comboT > 0) { this.comboT -= dt; if (this.comboT <= 0) { if (this.combo >= 3) { const b = this.combo; this.score += b; this.hud(); this.text(`${b}x COMBO +${b}`, W / 2, H * 0.3, "#ffffff"); DP.sound.coin(); } this.combo = 0; } }
      const g = 900;
      for (let i = this.items.length - 1; i >= 0; i--) {
        const it = this.items[i];
        it.vy += g * dt; it.x += it.vx * dt; it.y += it.vy * dt; it.rot += it.vr * dt;
        if (it.dead) { this.items.splice(i, 1); continue; }
        if (it.y > H + 60 && it.vy > 0) {
          this.items.splice(i, 1);
          if (it.type === "chimi" && !this.over) { this.lives--; this.hud(); this.text("MISSED!", it.x, H - 60, "#ff3b44"); DP.sound.hit(); if (this.lives <= 0) this.end(); }
          continue;
        }
        drawItem(it.type, it.x, it.y, it.r, it.rot, t);
      }
      for (let i = this.halves.length - 1; i >= 0; i--) {
        const h = this.halves[i]; h.vy += g * dt; h.x += h.vx * dt; h.y += h.vy * dt; h.rot += h.vr * dt; h.life -= dt;
        if (h.life <= 0 || h.y > H + 80) { this.halves.splice(i, 1); continue; }
        cx.save(); cx.translate(h.x, h.y); cx.rotate(h.ang); cx.beginPath(); cx.rect(-80, h.side < 0 ? -80 : 0, 160, 80); cx.clip(); cx.rotate(-h.ang);
        drawItem(h.type, 0, 0, h.r, h.rot, t); cx.restore();
      }
      cx.globalCompositeOperation = "lighter";
      for (let i = this.parts.length - 1; i >= 0; i--) { const p = this.parts[i]; p.vy += 500 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt * 1.4; if (p.life <= 0) { this.parts.splice(i, 1); continue; } cx.globalAlpha = p.life; cx.fillStyle = p.c; cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, 7); cx.fill(); }
      cx.globalAlpha = 1;
      // blade trail
      const nowMs = performance.now(); this.pts = this.pts.filter(p => nowMs - p.t < 140);
      if (this.pts.length > 1) {
        for (let i = 1; i < this.pts.length; i++) {
          const a = this.pts[i - 1], b = this.pts[i], k = i / this.pts.length;
          cx.strokeStyle = `rgba(255,70,80,${0.5 * k})`; cx.lineWidth = 16 * k; cx.lineCap = "round"; cx.beginPath(); cx.moveTo(a.x, a.y); cx.lineTo(b.x, b.y); cx.stroke();
          cx.strokeStyle = `rgba(255,255,255,${k})`; cx.lineWidth = 5 * k; cx.beginPath(); cx.moveTo(a.x, a.y); cx.lineTo(b.x, b.y); cx.stroke();
        }
      }
      cx.globalCompositeOperation = "source-over";
      for (let i = this.texts.length - 1; i >= 0; i--) { const x = this.texts[i]; x.life -= dt * 0.9; x.y -= 40 * dt; if (x.life <= 0) { this.texts.splice(i, 1); continue; } cx.globalAlpha = Math.min(1, x.life * 2); cx.font = "34px Bangers, Impact, sans-serif"; cx.textAlign = "center"; cx.lineWidth = 6; cx.strokeStyle = "#000"; cx.strokeText(x.t, x.x, x.y); cx.fillStyle = x.c; cx.fillText(x.t, x.x, x.y); }
      cx.globalAlpha = 1;
      if (this.flash > 0) { cx.fillStyle = `rgba(255,120,40,${this.flash * 0.5})`; cx.fillRect(0, 0, W, H); this.flash -= dt * 2; }
    },
    move(x, y) {
      const p = { x, y, t: performance.now() }, prev = this.pts[this.pts.length - 1];
      this.pts.push(p); if (!prev || this.over) return;
      const dx = x - prev.x, dy = y - prev.y, L2 = dx * dx + dy * dy; if (L2 < 16) return;
      if (L2 > 900 && Math.random() < 0.3) DP.sound.swish();
      const ang = Math.atan2(dy, dx);
      for (const it of this.items) {
        if (it.dead) continue;
        let u = ((it.x - prev.x) * dx + (it.y - prev.y) * dy) / L2; u = Math.max(0, Math.min(1, u));
        const qx = prev.x + u * dx, qy = prev.y + u * dy;
        if ((it.x - qx) ** 2 + (it.y - qy) ** 2 < (it.r + 8) ** 2) this.slice(it, ang);
      }
    }
  };
  function drawItem(type, x, y, r, rot, t) {
    cx.save(); cx.translate(x, y); cx.rotate(rot);
    if (type === "chimi") {
      glow(0, 0, r * 1.6, "rgba(255,160,60,.25)");
      cx.fillStyle = "#e0a650"; cx.strokeStyle = "#3a1d06"; cx.lineWidth = 3.5; rr(-r * 1.25, -r * 0.62, r * 2.5, r * 1.24, r * 0.62); cx.fill(); cx.stroke();
      cx.strokeStyle = "#8a4a12"; cx.lineWidth = 2.5; for (const k of [-0.55, 0, 0.55]) { cx.beginPath(); cx.moveTo(k * r * 1.2 - 4, -r * 0.58); cx.quadraticCurveTo(k * r * 1.2 + 5, 0, k * r * 1.2 - 4, r * 0.58); cx.stroke(); }
      cx.fillStyle = "rgba(255,255,255,.35)"; rr(-r * 0.9, -r * 0.45, r * 1.5, r * 0.18, 4); cx.fill();
    } else if (type === "taco") {
      glow(0, 0, r * 1.8, "rgba(255,220,80,.35)");
      cx.fillStyle = "#4dd46a"; cx.beginPath(); for (let i = 0; i <= 8; i++) { const a = Math.PI + i / 8 * Math.PI; cx.lineTo(Math.cos(a) * r * 1.02, Math.sin(a) * r * 0.2 - 2 + (i % 2) * 5); } cx.fill();
      cx.fillStyle = "#e84a3a"; for (const k of [-0.5, 0, 0.5]) { cx.beginPath(); cx.arc(k * r, -4, 5, 0, 7); cx.fill(); }
      cx.fillStyle = "#f5c542"; cx.strokeStyle = "#6a4210"; cx.lineWidth = 3.5; cx.beginPath(); cx.arc(0, -2, r, 0, Math.PI); cx.closePath(); cx.fill(); cx.stroke();
      cx.fillStyle = "rgba(160,100,20,.5)"; for (let i = 0; i < 6; i++) { cx.beginPath(); cx.arc(-r * 0.6 + i * r * 0.25, r * 0.35 + (i % 2) * 6, 2.4, 0, 7); cx.fill(); }
    } else if (type === "grenade") {
      const sp = 0.6 + 0.4 * Math.sin(t * 30);
      glow(r * 0.2, -r * 1.35, 16 * sp, "rgba(255,200,60,1)");
      cx.fillStyle = "#3d5a2a"; cx.strokeStyle = "#111"; cx.lineWidth = 3.5; cx.beginPath(); cx.ellipse(0, 0, r * 0.9, r, 0, 0, 7); cx.fill(); cx.stroke();
      cx.strokeStyle = "rgba(0,0,0,.45)"; cx.lineWidth = 2.5; for (const k of [-0.45, 0, 0.45]) { cx.beginPath(); cx.moveTo(-r * 0.85, k * r); cx.lineTo(r * 0.85, k * r); cx.stroke(); }
      cx.fillStyle = "#777"; cx.fillRect(-7, -r - 10, 14, 12); cx.strokeStyle = "#bbb"; cx.lineWidth = 2.5; cx.beginPath(); cx.arc(12, -r - 6, 6, 0, 7); cx.stroke();
      cx.fillStyle = "#fff"; cx.font = "bold 13px Oswald, sans-serif"; cx.textAlign = "center"; cx.fillText("NOPE", 0, 5);
    } else if (type === "unicorn") {
      glow(0, 0, r * 1.9, "rgba(255,120,220,.35)");
      const cols = ["#ff4d6d", "#ffb13d", "#ffe94d", "#4dff88", "#4dc3ff", "#b44dff"];
      cols.forEach((c, i) => { cx.strokeStyle = c; cx.lineWidth = 5; cx.beginPath(); cx.arc(0, r * 0.35, r - i * 5, Math.PI, 0); cx.stroke(); });
      cx.fillStyle = "#fff"; cx.strokeStyle = "#222"; cx.lineWidth = 3; cx.beginPath(); cx.ellipse(0, 0, r * 0.55, r * 0.5, 0, 0, 7); cx.fill(); cx.stroke();
      cx.fillStyle = "#ffd84d"; cx.beginPath(); cx.moveTo(-6, -r * 0.4); cx.lineTo(0, -r * 1.2); cx.lineTo(6, -r * 0.4); cx.closePath(); cx.fill(); cx.stroke();
      cx.fillStyle = "#111"; cx.beginPath(); cx.arc(-7, -2, 3, 0, 7); cx.arc(7, -2, 3, 0, 7); cx.fill();
    }
    cx.restore();
  }
  function rr(x, y, w, h, r) { cx.beginPath(); cx.moveTo(x + r, y); cx.arcTo(x + w, y, x + w, y + h, r); cx.arcTo(x + w, y + h, x, y + h, r); cx.arcTo(x, y + h, x, y, r); cx.arcTo(x, y, x + w, y, r); cx.closePath(); }

  // ================= CATCH THE BULLET =================
  const Bullet = {
    start() {
      Object.assign(this, { round: 0, times: [], state: "intro", t0: 0, fireAt: 0, shownAt: 0, result: "", early: 0, over: false });
      $("#gScore").textContent = "ROUND 1/5"; $("#gLives").textContent = "";
      showMsg(`<h2>CATCH THE BULLET</h2><p>Wait for <b>BANG!</b> then tap anywhere as fast as you can.<br>Tap early and I'll know. I always know.</p><button class="btn btn-red btn-big" data-b="go">READY</button>`, "intro");
      say(pick("game.bulletStart"));
    },
    arm() {
      this.round++; this.state = "wait"; this.fireAt = performance.now() + 1300 + Math.random() * 2800; msg.className = "game-msg";
      $("#gScore").textContent = `ROUND ${this.round}/5`;
    },
    tap() {
      const now = performance.now();
      if (this.state === "wait") { this.early++; this.state = "early"; this.round--; DP.sound.hit(); K.shake(); this.result = "TOO EARLY! \uD83D\uDE44"; this.until = now + 1300; return; }
      if (this.state === "fire") {
        const ms = Math.round(now - this.shownAt); this.times.push(ms); this.state = "caught"; this.until = now + 1200; this.lastMs = ms;
        DP.sound.coin(); this.result = ms < 200 ? "INHUMAN!" : ms < 250 ? "SLO-MO LEGEND" : ms < 320 ? "NICE CATCH" : ms < 450 ? "DECENT-ISH" : "YOU GOT SHOT";
        if (DP.fx.shock) DP.fx.shock(W / 2, H * 0.45, "#ffd54a", 200);
      }
    },
    end() {
      this.over = true; this.state = "over";
      const avg = Math.round(this.times.reduce((a, b) => a + b, 0) / this.times.length), rec = !best.bullet || avg < best.bullet;
      if (rec) { best.bullet = avg; LS.set("best.bullet", avg); }
      record("bullet", avg); if (avg < 300) ach("bullet_300"); if (avg < 220) ach("bullet_220");
      DP.sound[rec ? "fanfare" : "gong"](); if (rec) DP.fx.confetti(120);
      overMsg("RESULTS", avg + "<small> ms</small>", (rec ? pick("game.record") : pick("game.over")) + `  Rounds: ${this.times.join(", ")} ms${this.early ? ` \u2022 false starts: ${this.early}` : ""}`, rec);
    },
    frame(now) {
      const t = now / 1000;
      bg(t, this.state === "fire" ? "rgba(255,200,40,.14)" : undefined);
      const cxm = W / 2, cy = H * 0.45;
      // the merc (original silhouette): head + mask eyes, holding up a hand
      cx.save(); cx.translate(cxm, cy + 40); const s = Math.min(W, H) / 420; cx.scale(s, s);
      const mg = cx.createRadialGradient(-30, -40, 10, 0, 0, 120); mg.addColorStop(0, "#ff4a52"); mg.addColorStop(0.6, "#cf111b"); mg.addColorStop(1, "#5e040a");
      cx.fillStyle = mg; cx.strokeStyle = "#000"; cx.lineWidth = 6; cx.beginPath(); cx.ellipse(0, 0, 95, 110, 0, 0, 7); cx.fill(); cx.stroke();
      cx.fillStyle = "#0a0a0b"; cx.beginPath(); cx.moveTo(-6, 0); cx.bezierCurveTo(-14, -34, -56, -44, -92, -30); cx.lineTo(-94, 22); cx.bezierCurveTo(-60, 28, -20, 20, -6, 10); cx.closePath(); cx.fill();
      cx.beginPath(); cx.moveTo(6, 0); cx.bezierCurveTo(14, -34, 56, -44, 92, -30); cx.lineTo(94, 22); cx.bezierCurveTo(60, 28, 20, 20, 6, 10); cx.closePath(); cx.fill();
      const wide = this.state === "fire" ? 1.5 : this.state === "caught" ? 0.4 : 1;
      cx.fillStyle = "#fff"; cx.save(); cx.translate(-44, -8); cx.scale(1, wide); cx.beginPath(); cx.ellipse(0, 0, 30, 10, -0.15, 0, 7); cx.fill(); cx.restore();
      cx.save(); cx.translate(44, -8); cx.scale(1, wide); cx.beginPath(); cx.ellipse(0, 0, 30, 10, 0.15, 0, 7); cx.fill(); cx.restore();
      cx.restore();
      if (this.state === "intro" || this.state === "over") return;
      if (this.state === "wait") {
        cx.font = `${Math.round(Math.min(W, H) / 7)}px Bangers, Impact, sans-serif`; cx.textAlign = "center"; cx.fillStyle = "rgba(255,255,255," + (0.5 + 0.3 * Math.sin(t * 6)) + ")"; cx.fillText("WAIT FOR IT...", cxm, H * 0.18);
        if (now >= this.fireAt) { this.state = "fire"; this.shownAt = now; DP.sound.bang(); if (DP.gl) DP.gl.boom(1); }
      }
      if (this.state === "fire") {
        const e = Math.min(1, (now - this.shownAt) / 700), bx = -60 + (cxm - 20 + 60) * e;
        cx.fillStyle = "rgba(255,255,255,.12)"; cx.fillRect(0, H * 0.3 - 4, bx, 8);
        cx.save(); cx.translate(bx, H * 0.3); cx.fillStyle = "#c9a24a"; cx.strokeStyle = "#5a4210"; cx.lineWidth = 3; rr(-40, -12, 50, 24, 4); cx.fill(); cx.stroke();
        cx.fillStyle = "#b87333"; cx.beginPath(); cx.moveTo(10, -12); cx.quadraticCurveTo(40, 0, 10, 12); cx.closePath(); cx.fill(); cx.stroke(); cx.restore();
        cx.font = `${Math.round(Math.min(W, H) / 4.5)}px Bangers, Impact, sans-serif`; cx.textAlign = "center"; cx.lineWidth = 10; cx.strokeStyle = "#000"; cx.strokeText("BANG!", cxm, H * 0.2); cx.fillStyle = "#ffd54a"; cx.fillText("BANG!", cxm, H * 0.2);
        if (now - this.shownAt > 2000) { this.times.push(2000); this.state = "caught"; this.lastMs = 2000; this.result = "ASLEEP?"; this.until = now + 1200; }
      }
      if (this.state === "caught" || this.state === "early") {
        cx.textAlign = "center"; cx.lineWidth = 8; cx.strokeStyle = "#000";
        cx.font = `${Math.round(Math.min(W, H) / 8)}px Bangers, Impact, sans-serif`; cx.strokeText(this.result, cxm, H * 0.17); cx.fillStyle = this.state === "early" ? "#ff3b44" : "#ffffff"; cx.fillText(this.result, cxm, H * 0.17);
        if (this.state === "caught") { cx.font = `${Math.round(Math.min(W, H) / 5)}px Bangers, Impact, sans-serif`; cx.strokeText(this.lastMs + " ms", cxm, H * 0.78); cx.fillStyle = "#ffd54a"; cx.fillText(this.lastMs + " ms", cxm, H * 0.78); }
        if (now >= this.until) { if (this.times.length >= 5) this.end(); else this.arm(); }
      }
    }
  };
  msg.addEventListener("click", e => { if (e.target.closest("[data-b='go']")) { e.stopPropagation(); Bullet.arm(); } });

  // input
  cv.addEventListener("pointerdown", e => {
    if (G.active === "slice") { Slice.pts = [{ x: e.clientX, y: e.clientY, t: performance.now() }]; try { cv.setPointerCapture(e.pointerId); } catch (_) { } }
    else if (G.active === "bullet") Bullet.tap();
  });
  cv.addEventListener("pointermove", e => { if (G.active === "slice" && e.buttons !== 0 || (G.active === "slice" && e.pointerType === "touch")) { const ev = e.getCoalescedEvents ? e.getCoalescedEvents() : [e]; for (const c of (ev.length ? ev : [e])) Slice.move(c.clientX, c.clientY); } });
  cv.addEventListener("pointerup", () => { if (G.active === "slice") Slice.pts = []; });
  DP.games = G; G.start = start; G.stop = stop; G.Slice = Slice; G.Bullet = Bullet;
})();
