/* Deadpool Watch 2 — core app: navigation, faces, crown/bezel, complications, timer, stopwatch, alarms, multiverse,
   weather, vitals, motion, voice, achievements, customizer, eggs. Storage prefix "dpw2." so v1 and v2 never collide. */
(function () {
  "use strict";
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const app = $("#app");
  const PFX = "dpw2.";
  const LS = {
    get(k, d) { try { const v = localStorage.getItem(PFX + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(PFX + k, JSON.stringify(v)); } catch (e) { } }
  };
  const DEF = {
    h24: false, sound: true, seconds: true, particles: true, autoQuips: true, tilt: true, wake: false, face: 0, wolverine: false,
    shader: true, celsius: false, trans: "katana", voice: false, voiceName: "", rate: 1.05, pitch: 0.9,
    hands: "katana", tickSec: false, cmpL: "day", cmpR: "date", chips: ["weather", "moon", "steps"], accent: "red", tintMask: false
  };
  const settings = DP.settings = Object.assign({}, DEF, LS.get("settings", {}));
  const saveSettings = () => LS.set("settings", settings);
  const todayKey = () => new Date().toDateString();
  const stats = Object.assign({ quips: 0, walls: 0, shakes: 0, steps: 0, stepsDay: todayKey(), eggs: {}, ach: {}, seen: {}, laps: 0, moods: [], focusDay: todayKey(), focusToday: 0, focusTotal: 0, games: [] }, LS.get("stats", {}));
  if (stats.stepsDay !== todayKey()) { stats.steps = 0; stats.stepsDay = todayKey(); }
  if (stats.focusDay !== todayKey()) { stats.focusToday = 0; stats.focusDay = todayKey(); }
  let statsDirty = false;
  const saveStats = () => { statsDirty = true; };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const pad = n => String(n).padStart(2, "0");
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const bags = {};
  const pool = cat => { if (Array.isArray(cat)) return cat; return String(cat).split(".").reduce((o, k) => o && o[k], DP.QUIPS); };
  const pick = cat => { const key = Array.isArray(cat) ? cat.join("|").slice(0, 40) : cat; const src = pool(cat); if (!src || !src.length) return pick("general"); if (!bags[key] || !bags[key].length) bags[key] = shuffle(src.slice()); return bags[key].pop(); };
  let lastInteraction = Date.now();

  // ---------- time ----------
  const warp = { active: false, t0: 0 };
  function nowDate() {
    if (!warp.active) return new Date();
    const e = (performance.now() - warp.t0) / 2600;
    if (e >= 1) { warp.active = false; app.classList.remove("rewinding"); return new Date(); }
    return new Date(Date.now() - Math.sin(Math.PI * e) * 12 * 3600e3);
  }
  function fmt(d, showSec) {
    let h = d.getHours(), ampm = "";
    if (!settings.h24) { ampm = h >= 12 ? "PM" : "AM"; h = h % 12 || 12; }
    const hh = settings.h24 ? pad(h) : String(h), mm = pad(d.getMinutes()), ss = pad(d.getSeconds());
    return { hh, mm, ss, ampm, full: hh + ":" + mm + (showSec ? ":" + ss : "") };
  }
  const fmtHM = (H, M) => { if (settings.h24) return `${pad(H)}:${pad(M)}`; return `${H % 12 || 12}:${pad(M)} ${H >= 12 ? "PM" : "AM"}`; };

  // ---------- voice (Web Speech API) ----------
  const synth = window.speechSynthesis;
  let voices = [];
  function loadVoices() { if (!synth) return; voices = synth.getVoices().filter(v => /^en/i.test(v.lang)); fillVoiceSel(); }
  function bestVoice() {
    if (settings.voiceName) { const v = voices.find(x => x.name === settings.voiceName); if (v) return v; }
    const pref = [/Daniel/i, /Aaron/i, /Fred/i, /Alex/i, /Arthur/i, /Google US English/i, /Samantha/i];
    for (const p of pref) { const v = voices.find(x => p.test(x.name)); if (v) return v; }
    return voices[0] || null;
  }
  function speak(text, force) {
    if (!synth || (!settings.voice && !force)) return;
    try {
      synth.cancel();
      const u = new SpeechSynthesisUtterance(String(text).replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/gu, ""));
      const v = bestVoice(); if (v) u.voice = v;
      u.rate = +settings.rate || 1; u.pitch = +settings.pitch || 1; u.volume = 1;
      synth.speak(u);
    } catch (e) { }
  }
  if (synth) { loadVoices(); try { synth.addEventListener("voiceschanged", loadVoices); } catch (e) { synth.onvoiceschanged = loadVoices; } }
  function fillVoiceSel() {
    const sel = $("#selVoice"); if (!sel) return;
    sel.innerHTML = `<option value="">Auto (best English voice)</option>` + voices.map(v => `<option value="${esc(v.name)}" ${v.name === settings.voiceName ? "selected" : ""}>${esc(v.name)} (${esc(v.lang)})</option>`).join("");
  }

  // ---------- speech bubbles, toast, jolts ----------
  const layer = $("#bubbleLayer");
  let bubbleT = 0;
  function say(text, opts = {}) {
    if (!text) return;
    layer.innerHTML = "";
    const b = document.createElement("div");
    b.className = "bubble" + (opts.cls ? " " + opts.cls : "");
    b.innerHTML = `<span>${esc(text)}</span>`;
    const w = $("#watch");
    if (current === "scr-watch" && !navBusy) {
      const r = w.getBoundingClientRect();
      if (innerWidth > innerHeight) { b.classList.add("side"); b.style.left = Math.min(innerWidth - 20, r.right - r.width * 0.12) + "px"; b.style.top = (r.top + r.height * 0.12) + "px"; }
      else { b.style.bottom = (innerHeight - (r.top + r.height * 0.3)) + "px"; }
    } else { b.classList.add("top"); b.style.top = ($(".topbar").getBoundingClientRect().bottom + 8) + "px"; }
    layer.appendChild(b);
    DP.sound.pop();
    stats.quips++; saveStats();
    ach("first_quip"); if (stats.quips >= 100) ach("quips_100");
    clearTimeout(bubbleT);
    bubbleT = setTimeout(() => { b.classList.add("out"); setTimeout(() => b.remove(), 320); }, Math.max(2800, text.length * 62));
    if (current === "scr-watch") DP.faces.eyes(Math.random() < 0.5 ? "squint" : "wide");
    if (!opts.silent) speak(text);
  }
  DP.say = say;
  let toastT = 0;
  function toast(t) { const el = $("#toast"); el.textContent = t; el.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove("show"), 2800); }
  function shake(cls = "shake") { app.classList.remove("shake", "shake-hard"); void app.offsetWidth; app.classList.add(cls); setTimeout(() => app.classList.remove(cls), 600); }
  function jolt(el) { if (!el) return; el.classList.remove("jolt"); void el.offsetWidth; el.classList.add("jolt"); }
  const centerOf = el => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };

  // ---------- achievements ----------
  const achQ = []; let achBusy = false;
  function ach(id) {
    if (stats.ach[id]) return false;
    const a = DP.ACHIEVEMENTS.find(x => x.id === id); if (!a) return false;
    stats.ach[id] = Date.now(); saveStats();
    achQ.push(a); if (!achBusy) nextAch();
    if (current === "scr-ach") renderAch();
    return true;
  }
  function nextAch() {
    const a = achQ.shift(); if (!a) { achBusy = false; return; }
    achBusy = true;
    const pop = $("#achPop");
    $("#achPopBadge").textContent = a.icon; $("#achPopName").textContent = a.name; $("#achPopDesc").textContent = a.desc;
    pop.hidden = false; pop.classList.remove("show"); void pop.offsetWidth; pop.classList.add("show");
    DP.sound.achieve(); DP.fx.confetti(40);
    setTimeout(() => { pop.classList.remove("show"); setTimeout(() => { pop.hidden = true; nextAch(); }, 380); }, 3000);
  }
  function renderAch() {
    const L = DP.ACHIEVEMENTS, n = L.filter(a => stats.ach[a.id]).length;
    $("#achCount").textContent = `${n} / ${L.length}`;
    $("#achBar").style.transform = `scaleX(${n / L.length})`;
    $("#achGrid").innerHTML = L.map(a => {
      const got = stats.ach[a.id];
      return `<div class="ach ${got ? "got" : ""}"><div class="ach-badge">${got ? a.icon : "?"}</div><b>${esc(a.name)}</b><span>${esc(a.desc)}</span>${got ? `<em>${new Date(got).toLocaleDateString([], { month: "short", day: "numeric" })}</em>` : ""}</div>`;
    }).join("");
  }

  // ---------- eggs ----------
  function egg(id) {
    if (stats.eggs[id]) return false;
    stats.eggs[id] = Date.now(); saveStats(); renderEggs();
    const e = DP.EGGS.find(x => x.id === id), n = Object.keys(stats.eggs).length;
    setTimeout(() => toast(`EASTER EGG: ${e ? e.name : id} (${n}/${DP.EGGS.length})`), 1400);
    if (n >= 5) ach("eggs_5"); if (n >= DP.EGGS.length) ach("eggs_all");
    return true;
  }
  function renderEggs() {
    const n = Object.keys(stats.eggs).length;
    $("#eggCount").textContent = `${n}/${DP.EGGS.length}`;
    $("#eggList").innerHTML = DP.EGGS.map(e => stats.eggs[e.id]
      ? `<li class="found"><b>${esc(e.name)}</b><span>${esc(e.hint)}</span></li>`
      : `<li><b>??? LOCKED</b><span>${esc(e.hint)}</span></li>`).join("");
  }

  // ---------- navigation: katana slash or comic page-turn ----------
  const TIMERS = [["scr-timer", "Chimi"], ["scr-stopwatch", "Stopwatch"], ["scr-focus", "Focus"], ["scr-interval", "Interval"], ["scr-countdown", "Countdown"], ["scr-alarms", "Alarms"]];
  $$('.subnav[data-sub="timers"]').forEach(n => { n.innerHTML = TIMERS.map(([id, l]) => `<button data-go="${id}">${l}</button>`).join(""); });
  let current = "scr-watch", navBusy = false, prevScreen = "scr-watch", navFrom = null, lastTimer = LS.get("lastTimer", "scr-timer");
  const enterHooks = {}, frameHooks = {};
  const onEnter = (id, fn) => { (enterHooks[id] = enterHooks[id] || []).push(fn); };
  const onFrame = (id, fn) => { (frameHooks[id] = frameHooks[id] || []).push(fn); };
  function go(id) {
    if (id === current || navBusy || !$("#" + id)) return;
    navBusy = true;
    const from = $("#" + current), to = $("#" + id);
    if (id === "scr-settings") prevScreen = current;
    navFrom = current;
    to.classList.add("active"); to.style.zIndex = 3; from.style.zIndex = 2;
    to.scrollTop = 0;
    const done = () => { from.classList.remove("active"); from.style.zIndex = ""; to.style.zIndex = ""; to.classList.remove("paper"); navBusy = false; navFrom = null; };
    let style = settings.trans; if (style === "random") style = Math.random() < 0.5 ? "katana" : "page";
    try {
      let a;
      if (style === "page") {
        DP.sound.swish(); to.classList.add("paper");
        a = to.animate([{ transform: "perspective(1400px) rotateY(-104deg)", opacity: 0.6, filter: "brightness(.5)" }, { transform: "perspective(1400px) rotateY(12deg)", opacity: 1, filter: "brightness(1.1)", offset: 0.72 }, { transform: "perspective(1400px) rotateY(0deg)", opacity: 1, filter: "brightness(1)" }], { duration: 620, easing: "cubic-bezier(.3,.7,.3,1)" });
        from.animate([{ transform: "none", filter: "brightness(1)" }, { transform: "translateX(-6%) scale(.96)", filter: "brightness(.35)" }], { duration: 620, easing: "ease-in" });
      } else {
        DP.sound.slash(); DP.fx.blade(460);
        a = to.animate([{ clipPath: "polygon(0 0, 0 0, 0 0, 0 0)", webkitClipPath: "polygon(0 0, 0 0, 0 0, 0 0)" }, { clipPath: "polygon(0 0, 200% 0, 0 200%, 0 0)", webkitClipPath: "polygon(0 0, 200% 0, 0 200%, 0 0)" }], { duration: 460, easing: "cubic-bezier(.7,0,.25,1)" });
        from.animate([{ transform: "none", opacity: 1 }, { transform: "scale(.94) rotate(-1.5deg)", opacity: 0.35 }], { duration: 460, easing: "ease-in" });
      }
      a.onfinish = done; setTimeout(() => { if (navBusy) done(); }, 900);
    } catch (e) { done(); }
    current = id;
    const grp = to.dataset.group;
    if (grp === "timers") { lastTimer = id; LS.set("lastTimer", id); }
    $$(".dock button").forEach(b => b.classList.toggle("active", b.dataset.g === grp));
    $$(".subnav button").forEach(b => b.classList.toggle("on", b.dataset.go === id));
    if (DP.gl) DP.gl.boom(0.35);
    (enterHooks[id] || []).forEach(f => { try { f(); } catch (e) { console.warn(e); } });
    layer.innerHTML = "";
  }
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-go]"); if (!b || b.closest(".dock")) return;
    go(b.dataset.go);
  });
  $$(".dock button").forEach(b => b.addEventListener("click", () => {
    const g = b.dataset.g, grpNow = $("#" + current).dataset.group;
    if (g === "timers") go(grpNow === "timers" ? "scr-timer" : lastTimer);
    else if (g === "hub" && grpNow === "hub" && current !== "scr-hub") go("scr-hub");
    else go(b.dataset.go);
  }));
  $("#btnSettings").addEventListener("click", () => go(current === "scr-settings" ? prevScreen : "scr-settings"));
  $("#btnBack").addEventListener("click", () => go(prevScreen === "scr-settings" ? "scr-watch" : prevScreen));

  // ---------- accent themes ----------
  const ACCENTS = {
    red: ["#d1121c", "#ff3b44", "#5e040a", "Deadpool Red"], pink: ["#d81b60", "#ff5aa0", "#5a0626", "Lady Pink"], orange: ["#e8570c", "#ff8a3d", "#5a2003", "Chimi Orange"],
    gold: ["#c9951e", "#ffd05a", "#4a3405", "Merc Gold"], green: ["#1e9a58", "#4dffa0", "#063a1f", "TVA Green"], blue: ["#1f63e0", "#58a6ff", "#08214d", "Cable Blue"],
    purple: ["#7b35e8", "#b47aff", "#2a0b5a", "Void Purple"], white: ["#b9bec7", "#ffffff", "#3a3d44", "Nicepool Chrome"]
  };
  function applyThemeVars(W, A) {
    const tint = settings.tintMask && !W && settings.accent !== "red";
    [["--mask-hi", 1], ["--mask-mid", 0], ["--mask-lo", 2]].forEach(([k, i]) => { if (tint) document.body.style.setProperty(k, A[i]); else document.body.style.removeProperty(k); });
  }
  function applyTheme() {
    const W = !!settings.wolverine;
    app.classList.toggle("wolverine", W); document.body.classList.toggle("wolverine", W);
    const A = ACCENTS[settings.accent] || ACCENTS.red;
    ["--accent", "--accent-hi", "--accent-lo"].forEach((k, i) => { if (W) app.style.removeProperty(k); else app.style.setProperty(k, A[i]); });
    applyThemeVars(W, A);
    DP.fx.mode = W ? "wolverine" : "dp"; DP.fx.recolor();
    if (DP.gl) DP.gl.setTheme(W ? "#ffc814" : A[0], W ? "#1f5fd6" : A[1]);
  }
  function toggleWolverine() {
    settings.wolverine = !settings.wolverine; saveSettings(); applyTheme();
    if (settings.wolverine) { DP.fx.snikt(); DP.sound.snikt(); say(pick("wolverineOn")); egg("wolverine"); ach("wolverine"); }
    else { DP.fx.word("BACK IN RED", "red"); DP.sound.slash(); say(pick("wolverineOff")); }
    shake();
  }

  // ---------- watch faces ----------
  const F = DP.faces, track = $("#facesTrack"), vp = $("#facesVp"), watch = $("#watch");
  F.build(track);
  const N = F.list.length;
  track.style.width = N * 100 + "%";
  [...track.children].forEach(el => { el.style.width = (100 / N) + "%"; });
  $("#faceDots").innerHTML = F.list.map((f, i) => `<button data-i="${i}" aria-label="${f.name}"></button>`).join("");
  let faceIdx = Math.min(N - 1, settings.face | 0), faceMoving = 0;
  F.renderIdx = faceIdx;
  function setFace(i, animate = true) {
    const changed = i !== faceIdx;
    faceIdx = Math.max(0, Math.min(N - 1, i)); F.renderIdx = faceIdx;
    track.style.transition = animate ? "transform .5s cubic-bezier(.2,.9,.25,1.08)" : "none";
    track.style.transform = `translate3d(${(-faceIdx * 100 / N).toFixed(4)}%,0,0)`;
    faceMoving = performance.now() + 650;
    [...track.children].forEach((el, k) => el.classList.toggle("off", Math.abs(k - faceIdx) > 1));
    $$("#faceDots button").forEach((b, k) => b.classList.toggle("on", k === faceIdx));
    const cap = $("#faceName"), f = F.list[faceIdx]; cap.textContent = f.name; if (changed) jolt(cap);
    $("#faceCount").textContent = `${faceIdx + 1}/${N}`;
    app.dataset.face = f.id;
    stats.seen[f.id] = 1; saveStats();
    if (F.list.every(x => stats.seen[x.id])) ach("faces_all");
    if (changed && animate) { DP.sound.slash(); watch.classList.remove("face-slash"); void watch.offsetWidth; watch.classList.add("face-slash"); if (DP.gl) DP.gl.boom(0.4); }
  }
  setFace(faceIdx, false);
  $("#faceDots").addEventListener("click", e => { const b = e.target.closest("button"); if (b) setFace(+b.dataset.i); });

  // face picker sheet
  const SW_ART = { mask: ["#d1121c", "#5e040a", "\u2694"], effort: ["#ffc814", "#d1121c", "!"], dw: ["#d1121c", "#ffc814", "\u2665"], void: ["#1a0f2a", "#6b3dff", "\u221E"], skeleton: ["#2a2a30", "#e8c66a", "\u2699"], chrono: ["#101012", "#ff3b44", "\u23F1"], cable: ["#021a28", "#27e6ff", "\u25CE"], sacred: ["#2a1d08", "#ff9a2a", "\u2307"], headpool: ["#ff4a52", "#ffd54a", "\u2708"], lady: ["#b3123e", "#ff5a86", "\u2640"], kid: ["#4dc3ff", "#ff4d6d", "\u2605"], nice: ["#b8f0dc", "#ffd6e6", "\u2740"], dog: ["#d1121c", "#efe6d8", "\u2742"] };
  $("#fpGrid").innerHTML = F.list.map((f, i) => { const a = SW_ART[f.id] || ["#333", "#999", "?"]; return `<button data-i="${i}"><i style="background:radial-gradient(circle at 35% 30%, ${a[1]}, ${a[0]} 72%)">${a[2]}</i><span>${esc(f.name)}</span></button>`; }).join("");
  const picker = $("#facePicker");
  $("#faceName").addEventListener("click", () => { $$("#fpGrid button").forEach((b, k) => b.classList.toggle("on", k === faceIdx)); picker.hidden = false; DP.sound.click(); });
  picker.addEventListener("click", e => {
    const b = e.target.closest("#fpGrid button");
    if (b) { picker.hidden = true; setFace(+b.dataset.i); hideHint(); return; }
    if (e.target === picker || e.target.closest("[data-close]")) picker.hidden = true;
  });

  let drag = null, lpTimer = 0, maskTaps = [];
  vp.addEventListener("pointerdown", e => {
    drag = { x: e.clientX, y: e.clientY, t: performance.now(), dx: 0, moved: false, long: false };
    try { vp.setPointerCapture(e.pointerId); } catch (_) { }
    track.style.transition = "none";
    clearTimeout(lpTimer);
    lpTimer = setTimeout(() => { if (drag && !drag.moved) { drag.long = true; dogpool(); } }, 650);
  });
  vp.addEventListener("pointermove", e => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) > 9) { drag.moved = true; clearTimeout(lpTimer); }
    if (drag.moved) {
      let d = dx;
      if ((faceIdx === 0 && dx > 0) || (faceIdx === N - 1 && dx < 0)) d = dx * 0.3;
      drag.dx = dx;
      track.style.transform = `translate3d(calc(${(-faceIdx * 100 / N).toFixed(4)}% + ${d}px),0,0)`;
      faceMoving = performance.now() + 650;
    }
  });
  function endDrag(e, cancel) {
    if (!drag) return;
    clearTimeout(lpTimer);
    const d = drag; drag = null;
    if (d.long) { setFace(faceIdx); return; }
    if (!d.moved && !cancel) { setFace(faceIdx, false); faceTap(e); return; }
    const w = vp.clientWidth, v = d.dx / Math.max(1, performance.now() - d.t);
    if (d.dx < -w * 0.18 || v < -0.45) { setFace(faceIdx + 1); hideHint(); }
    else if (d.dx > w * 0.18 || v > 0.45) { setFace(faceIdx - 1); hideHint(); }
    else setFace(faceIdx);
  }
  vp.addEventListener("pointerup", e => endDrag(e, false));
  vp.addEventListener("pointercancel", e => endDrag(e, true));
  function hideHint() { LS.set("swiped", true); $("#swipeHint").classList.add("gone"); }
  if (LS.get("swiped", false)) $("#swipeHint").classList.add("gone");

  function faceTap(e) {
    const f = F.list[faceIdx], id = f.id;
    DP.fx.boom(e.clientX, e.clientY, 14);
    jolt(watch);
    if (id === "mask") {
      const now = Date.now(); maskTaps = maskTaps.filter(t => now - t < 3000); maskTaps.push(now);
      if (maskTaps.length >= 7) { maskTaps = []; unicorn(); return; }
      F.eyes("squint"); DP.sound.blink();
      say(pick(Math.random() < 0.45 ? "mask" : "general"));
    } else if (id === "effort") { F.pop(); say(pick(Math.random() < 0.4 ? "effort" : "general")); }
    else if (id === "dw") { F.eyes("wide"); if (Math.random() < 0.3) { DP.fx.claws(); DP.sound.snikt(); } say(pick(Math.random() < 0.5 ? "dw" : "general")); }
    else if (id === "void") { F.tap(faceIdx, e.clientX, e.clientY); DP.sound.glitch(); say(pick(Math.random() < 0.6 ? "void" : "general"), { cls: "void" }); }
    else {
      const cat = F.tap(faceIdx, e.clientX, e.clientY);
      if (id === "chrono") { DP.sound[DP.sw.running() ? "start" : "stop"](); swUI(); say(pick(cat || "general")); return; }
      if (id === "cable") DP.sound.glitch(); else if (id === "skeleton") DP.sound.tick(); else if (id !== "dog") DP.sound.blink();
      say(pick(cat && Math.random() < 0.65 ? cat : "general"));
    }
  }
  (function blinkLoop() { setTimeout(() => { if (current === "scr-watch") { F.eyes("blink"); if (Math.random() < 0.15) setTimeout(() => F.eyes("blink"), 260); } blinkLoop(); }, 2200 + Math.random() * 4200); })();

  // ---------- crown: 5 taps = caseback, drag = spin the dive bezel ----------
  const crown = $("#crown"), flipper = $("#flipper"), bezelRing = $("#bezelRing");
  $("#caseBack").innerHTML = caseBackSVG();
  let bez = LS.get("bezel", 0), bezSpin = 0, crownTaps = [], cdrag = null, bezTick = 0;
  bezelRing.style.setProperty("--bez", bez + "deg");
  crown.addEventListener("pointerdown", e => { e.preventDefault(); cdrag = { y: e.clientY, moved: false, last: e.clientY }; try { crown.setPointerCapture(e.pointerId); } catch (_) { } crown.classList.add("pressed"); });
  crown.addEventListener("pointermove", e => {
    if (!cdrag) return;
    if (Math.abs(e.clientY - cdrag.y) > 6) cdrag.moved = true;
    if (!cdrag.moved) return;
    const dy = e.clientY - cdrag.last; cdrag.last = e.clientY;
    const dd = dy * 1.6; bez = (bez + dd) % 360; bezSpin += dd; bezTick += Math.abs(dd);
    bezelRing.style.setProperty("--bez", bez.toFixed(1) + "deg"); crown.style.setProperty("--cr", (bez * 3).toFixed(0) + "deg");
    if (bezTick > 6) { bezTick = 0; DP.sound.tick(); }
    if (Math.abs(bezSpin) >= 360) { bezSpin = 0; if (egg("bezel")) { DP.fx.word("CLICK!", "heal"); say(pick("bezel")); DP.fx.confetti(60); } else DP.sound.coin(); }
  });
  const crownUp = () => {
    if (!cdrag) return; const d = cdrag; cdrag = null; crown.classList.remove("pressed"); LS.set("bezel", Math.round(bez));
    if (d.moved) return;
    DP.sound.click(); jolt(crown);
    const now = Date.now(); crownTaps = crownTaps.filter(t => now - t < 3000); crownTaps.push(now);
    if (flipper.classList.contains("flipped")) { flipper.classList.remove("flipped"); flipper.classList.add("unflip"); crownTaps = []; return; }
    if (crownTaps.length >= 5) { crownTaps = []; flipper.classList.remove("unflip"); flipper.classList.add("flipped"); DP.sound.sparkle(); egg("crown"); setTimeout(() => say(pick("crown")), 500); }
    else if (crownTaps.length === 1) toast("Crown: tap 5x for a surprise, or drag up/down to spin the bezel.");
  };
  crown.addEventListener("pointerup", crownUp); crown.addEventListener("pointercancel", crownUp);
  $("#caseBack").addEventListener("click", () => { flipper.classList.remove("flipped"); flipper.classList.add("unflip"); DP.sound.click(); });
  function caseBackSVG() {
    let gear = "";
    for (let i = 0; i < 24; i++) gear += `<rect x="-5" y="-96" width="10" height="14" rx="2" transform="rotate(${i * 15})" fill="url(#goldGrad)"/>`;
    const screws = Array.from({ length: 8 }, (_, i) => { const a = (i * 45 + 22.5) * Math.PI / 180; return `<g transform="translate(${(200 + Math.cos(a) * 172).toFixed(1)} ${(200 + Math.sin(a) * 172).toFixed(1)})"><circle r="7" fill="#c9ced6" stroke="#555" stroke-width="1.2"/><path d="M-4 0 H4" stroke="#444" stroke-width="2" transform="rotate(${i * 30})"/></g>`; }).join("");
    return `<svg viewBox="0 0 400 400" class="face-svg"><defs><path id="cbArc" d="M 62 200 A 138 138 0 0 1 338 200"/><path id="cbArc2" d="M 44 200 A 156 156 0 0 0 356 200"/></defs>
      <circle cx="200" cy="200" r="199" fill="url(#steelGrad)"/><circle cx="200" cy="200" r="186" fill="#9aa1aa"/>
      <circle cx="200" cy="200" r="186" fill="url(#guilloche)"/>${screws}
      <text class="cb-engr"><textPath href="#cbArc" startOffset="50%" text-anchor="middle">TO NICK &#8226; WITH MAXIMUM EFFORT &#8226; LOVE, W.</textPath></text>
      <text class="cb-engr sm"><textPath href="#cbArc2" startOffset="50%" text-anchor="middle">WATER RESISTANT TO 0 M &#8226; DO NOT MICROWAVE &#8226; No. 002/&#8734;</textPath></text>
      <circle cx="200" cy="200" r="112" fill="#0b0b0d" stroke="#555" stroke-width="3"/>
      <circle cx="200" cy="200" r="108" fill="url(#perlage)"/>
      <g transform="translate(200 200)"><g class="cb-gear"><circle r="84" fill="none" stroke="url(#goldGrad)" stroke-width="10"/>${gear}<path d="M0 -76 V76 M-76 0 H76 M-54 -54 L54 54 M54 -54 L-54 54" stroke="url(#goldGrad)" stroke-width="7"/><circle r="18" fill="url(#rubyGrad)"/></g></g>
      <circle cx="200" cy="200" r="112" fill="url(#sapphire)"/>
      <text x="200" y="300" class="cb-engr mid" text-anchor="middle">SAPPHIRE CASEBACK &#8226; TAP TO FLIP</text></svg>`;
  }

  // ---------- eggs: unicorn, dogpool, wolverine, dance, baby legs ----------
  function unicorn() { DP.fx.unicorn(); DP.sound.sparkle(); setTimeout(() => say(pick("unicorn")), 500); egg("unicorn"); }
  function dogpool() { DP.fx.dogpool(); DP.sound.woof(); setTimeout(() => say(pick("dogpool")), 700); egg("dogpool"); }
  function dance() {
    if (app.classList.contains("dance")) return;
    app.classList.add("dance"); DP.fx.disco(8000); DP.sound.danceStart(8000); DP.fx.confetti(160);
    if (DP.gl) DP.gl.mode = 1; egg("dance"); say(pick("dance"));
    setTimeout(() => { app.classList.remove("dance"); if (DP.gl) DP.gl.mode = 0; }, 8000);
  }
  const brand = $("#brand"); let brandT = 0, brandLong = false, brandTaps = [];
  brand.addEventListener("pointerdown", () => { brandLong = false; brand.classList.add("charging"); brandT = setTimeout(() => { brandLong = true; brand.classList.remove("charging"); toggleWolverine(); }, 900); });
  const brandUp = () => { clearTimeout(brandT); brand.classList.remove("charging"); };
  brand.addEventListener("pointerup", brandUp); brand.addEventListener("pointercancel", brandUp); brand.addEventListener("pointerleave", brandUp);
  brand.addEventListener("click", () => {
    if (brandLong) return; jolt(brand);
    const now = Date.now(); brandTaps = brandTaps.filter(t => now - t < 4000); brandTaps.push(now);
    if (brandTaps.length >= 10) { brandTaps = []; dance(); return; }
    if (brandTaps.length === 1) say(pick("general")); else DP.sound.click();
  });
  brand.addEventListener("contextmenu", e => e.preventDefault());
  const healMini = $("#healMini"); let hmT = 0, hmLong = false;
  healMini.addEventListener("pointerdown", () => { hmLong = false; hmT = setTimeout(() => { hmLong = true; DP.fx.babyLegs(); DP.sound.sparkle(); egg("babylegs"); setTimeout(() => say(pick("babylegs")), 600); }, 750); });
  ["pointerup", "pointercancel", "pointerleave"].forEach(ev => healMini.addEventListener(ev, () => clearTimeout(hmT)));
  healMini.addEventListener("click", () => { if (!hmLong) go("scr-vitals"); });
  healMini.addEventListener("contextmenu", e => e.preventDefault());

  // ---------- quip, voice toggle, fourth wall ----------
  $("#btnQuip").addEventListener("click", e => { jolt(e.currentTarget); const [x, y] = centerOf(e.currentTarget); DP.fx.boom(x, y, 10); say(pick("general")); });
  const btnVoice = $("#btnVoice");
  const voiceUI = () => { btnVoice.classList.toggle("on", !!settings.voice); const s = $('[data-set="voice"]'); if (s) s.checked = !!settings.voice; };
  btnVoice.addEventListener("click", () => {
    if (!synth) { toast("This browser has no speech voice. Rude."); return; }
    settings.voice = !settings.voice; saveSettings(); voiceUI(); jolt(btnVoice);
    if (settings.voice) { ach("voice"); say("Voice on. You can hear me now. Every. Single. Word."); } else { synth.cancel(); toast("Voice off. Back to silent judgment."); }
  });
  let wallHits = [];
  $("#btnWall").addEventListener("click", () => {
    const r = watch.getBoundingClientRect();
    const x = r.left + r.width * (0.35 + Math.random() * 0.3), y = r.top + r.height * (0.3 + Math.random() * 0.35);
    DP.fx.shatter(x, y); DP.sound.shatter(); shake("shake-hard"); DP.fx.shock(x, y, "#ffffff", 260); if (DP.gl) DP.gl.boom(1);
    watch.classList.remove("cracked"); void watch.offsetWidth; watch.classList.add("cracked");
    damage(22, true);
    stats.walls++; saveStats(); ach("wall_1"); if (stats.walls >= 10) ach("wall_10");
    const now = Date.now(); wallHits = wallHits.filter(t => now - t < 10000); wallHits.push(now);
    if (wallHits.length >= 3 && egg("demolition")) { setTimeout(() => say(pick("demolition")), 380); }
    else setTimeout(() => say(pick("fourthWall")), 380);
    setTimeout(() => DP.fx.word("HEALING...", "heal"), 1800);
  });

  // ---------- healing factor ----------
  const heal = { injury: 0, base: 100, real: false, charging: false, shown: -1, wasHurt: false };
  function damage(n, silent) {
    heal.injury = Math.min(92, heal.injury + n); heal.wasHurt = true;
    DP.sound.hit(); app.classList.remove("hurt"); void app.offsetWidth; app.classList.add("hurt");
    if (healValue() < 20) ach("near_death");
    if (!silent) { shake(); say(pick("damage")); }
  }
  const healCellsG = $("#healCells"); let cellsHTML = "";
  for (let i = 0; i < 30; i++) {
    const a = (i / 30) * Math.PI * 2 - Math.PI / 2, x = 150 + Math.cos(a) * 104, y = 150 + Math.sin(a) * 104;
    cellsHTML += `<polygon points="${[0, 1, 2, 3, 4, 5].map(k => { const t = k * Math.PI / 3 + a; return `${(x + Math.cos(t) * 7.5).toFixed(1)},${(y + Math.sin(t) * 7.5).toFixed(1)}`; }).join(" ")}"/>`;
  }
  healCellsG.innerHTML = cellsHTML;
  const healCells = [...healCellsG.children], healRing = $("#healRing"), HC = 2 * Math.PI * 128;
  healRing.style.strokeDasharray = HC;
  $("#healSource").textContent = "Safari keeps your battery secret, so this is a simulated healing factor. Hurt me. I'll grow back.";
  if (navigator.getBattery) {
    navigator.getBattery().then(b => {
      heal.real = true;
      const upd = () => { heal.base = Math.round(b.level * 100); heal.charging = b.charging; $("#healSource").textContent = `Healing factor linked to your battery: ${heal.base}%${b.charging ? " \u26A1 charging = regenerating" : ""}. Take hits to test it.`; };
      upd(); b.addEventListener("levelchange", upd); b.addEventListener("chargingchange", upd);
    }).catch(() => { });
  }
  $("#btnHit").addEventListener("click", e => { jolt(e.currentTarget); damage(15 + Math.random() * 25); });
  $("#btnChimi").addEventListener("click", e => { jolt(e.currentTarget); heal.injury = Math.max(0, heal.injury - 40); DP.sound.heal(); DP.fx.word("NOM!", "heal"); const r = e.currentTarget.getBoundingClientRect(); DP.fx.boom(r.left + r.width / 2, r.top, 20, ["#ffd54a", "#ff8a3d", "#ffffff"]); });
  function healValue() { return Math.max(1, Math.round(heal.base - heal.injury)); }
  function updateHeal(dt) {
    if (heal.injury > 0) {
      heal.injury = Math.max(0, heal.injury - dt * (heal.charging ? 0.14 : 0.07));
      if (heal.injury === 0 && heal.wasHurt) { heal.wasHurt = false; DP.sound.heal(); if (current === "scr-vitals") say(pick("heal")); }
    }
    const v = healValue();
    if (v !== heal.shown) {
      heal.shown = v;
      $("#healMiniFill").style.transform = `scaleX(${v / 100})`;
      $("#healMiniVal").textContent = v + "%";
      $("#healMini").classList.toggle("low", v < 40);
      $("#healVal").textContent = v + "%";
      healRing.style.strokeDashoffset = (HC * (1 - v / 100)).toFixed(1);
      const lit = Math.round(v / 100 * 30);
      healCells.forEach((c, i) => c.classList.toggle("on", i < lit));
      $("#healStatus").textContent = v >= 99 ? "FULLY HEALED (STILL UGLY)" : v > 70 ? "REGENERATING... TICKLES" : v > 40 ? "REGROWING SOMETHING IMPORTANT" : "OUCH. BIG OUCH. HEALING...";
    }
    const regen = heal.injury > 0;
    if (regen !== heal.regen) { heal.regen = regen; app.classList.toggle("regen", regen); }
  }

  // ---------- chimichanga timer ----------
  const T = Object.assign({ dur: 180, end: 0, left: 180, running: false }, LS.get("timer", {}));
  const saveT = () => LS.set("timer", T);
  if (T.running && T.end <= Date.now()) { T.running = false; T.left = 0; setTimeout(() => toast("Your chimichanga finished while you were gone. It's cold and sad now."), 1500); saveT(); }
  const timerRing = $("#timerRing"), TC = 2 * Math.PI * 136; timerRing.style.strokeDasharray = TC;
  (function () { let s = ""; for (let i = 0; i < 60; i++) { const a = i * 6 * Math.PI / 180, r1 = i % 5 ? 118 : 112; s += `<line x1="${(150 + Math.sin(a) * r1).toFixed(1)}" y1="${(150 - Math.cos(a) * r1).toFixed(1)}" x2="${(150 + Math.sin(a) * 124).toFixed(1)}" y2="${(150 - Math.cos(a) * 124).toFixed(1)}" class="${i % 5 ? "tk-m" : "tk-h"}"/>`; } $("#timerTicks").innerHTML = s; $("#swTicks").innerHTML = s; })();
  const lerpColor = (a, b, t) => { const pa = a.match(/\w\w/g).map(h => parseInt(h, 16)), pb = b.match(/\w\w/g).map(h => parseInt(h, 16)); return "#" + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, "0")).join(""); };
  let lastTimerTxt = "";
  function timerRemaining() { return T.running ? Math.max(0, (T.end - Date.now()) / 1000) : T.left; }
  function renderTimer() {
    const rem = timerRemaining(), sec = Math.ceil(rem - 0.001);
    const txt = sec >= 3600 ? `${Math.floor(sec / 3600)}:${pad(Math.floor(sec / 60) % 60)}:${pad(sec % 60)}` : `${pad(Math.floor(sec / 60))}:${pad(sec % 60)}`;
    if (txt !== lastTimerTxt) { lastTimerTxt = txt; $("#timerTime").textContent = txt; }
    const frac = T.dur ? rem / T.dur : 0;
    timerRing.style.strokeDashoffset = (TC * (1 - frac)).toFixed(1);
    const cook = Math.max(0, Math.min(1, 1 - frac));
    $("#chimiBody").setAttribute("fill", lerpColor("#f1d9a6", "#c26d22", cook));
    $("#chimiGrill").setAttribute("opacity", (cook * 0.9).toFixed(2));
    $("#chimiFace").setAttribute("opacity", rem <= 0 && T.dur ? 1 : 0);
  }
  function timerUI() {
    const st = $("#timerState"), g = $("#timerGo");
    $("#timerDial").classList.toggle("running", T.running);
    $("#timerSet").classList.toggle("locked", T.running || (T.left > 0 && T.left < T.dur));
    if (T.running) { g.textContent = "PAUSE"; st.textContent = "COOKING... DON'T PEEK"; }
    else if (T.left > 0 && T.left < T.dur) { g.textContent = "RESUME"; st.textContent = "PAUSED. CHIMI IS WORRIED"; }
    else if (T.left <= 0) { g.textContent = "AGAIN!"; st.textContent = "DONE! GOLDEN BROWN!"; }
    else { g.textContent = "NUKE IT"; st.textContent = "READY TO NUKE"; }
    $("#setMin").textContent = pad(Math.floor(T.dur / 60)); $("#setSec").textContent = pad(T.dur % 60);
    $$("#timerPresets button").forEach(b => b.classList.toggle("on", +b.dataset.sec === T.dur));
    lastTimerTxt = ""; renderTimer();
  }
  function setDur(s) { if (T.running) return; T.dur = Math.max(5, Math.min(99 * 60 + 55, s)); T.left = T.dur; saveT(); timerUI(); DP.sound.tick(); }
  $("#timerGo").addEventListener("click", e => {
    jolt(e.currentTarget);
    if (T.running) { T.left = timerRemaining(); T.running = false; DP.sound.stop(); }
    else { if (T.left <= 0) T.left = T.dur; T.end = Date.now() + T.left * 1000; T.running = true; DP.sound.start(); DP.fx.word("NUKE IT!"); const [x, y] = centerOf($("#timerDial")); DP.fx.boom(x, y, 18); }
    saveT(); timerUI();
  });
  $("#timerReset").addEventListener("click", e => { jolt(e.currentTarget); T.running = false; T.left = T.dur; saveT(); timerUI(); DP.sound.click(); });
  $("#timerPresets").addEventListener("click", e => { const b = e.target.closest("button"); if (b) setDur(+b.dataset.sec); });
  function repeatBtn(b, step) {
    let iv = 0, to = 0;
    const stop = () => { clearTimeout(to); clearInterval(iv); };
    b.addEventListener("pointerdown", e => { e.preventDefault(); step(); to = setTimeout(() => { iv = setInterval(step, 90); }, 420); });
    ["pointerup", "pointerleave", "pointercancel"].forEach(ev => b.addEventListener(ev, stop));
  }
  $$("#timerSet button").forEach(b => repeatBtn(b, () => { const k = b.dataset.step, m = Math.floor(T.dur / 60), s = T.dur % 60; if (k === "m+") setDur((m + 1) * 60 + s); if (k === "m-") setDur(Math.max(0, m - 1) * 60 + s); if (k === "s+") setDur(m * 60 + (s + 5) % 60); if (k === "s-") setDur(m * 60 + (s + 55) % 60); }));
  function timerCheck() { if (T.running && Date.now() >= T.end) { T.running = false; T.left = 0; saveT(); timerUI(); ach("chimi_1"); ring("timer"); } }

  // ---------- stopwatch (also drives the Tachy-Chrono face) ----------
  const SW = Object.assign({ running: false, start: 0, acc: 0, laps: [] }, LS.get("sw", {}));
  const saveSW = () => LS.set("sw", SW);
  const swElapsed = () => SW.acc + (SW.running ? Date.now() - SW.start : 0);
  const fmtSW = ms => { const cs = Math.floor(ms / 10) % 100, s = Math.floor(ms / 1000) % 60, m = Math.floor(ms / 60000) % 60, h = Math.floor(ms / 3600000); return { main: (h ? h + ":" + pad(m) : pad(m)) + ":" + pad(s), cs: "." + pad(cs) }; };
  let lastSwTxt = "";
  function renderSW() {
    const e = swElapsed(), f = fmtSW(e), t = f.main + f.cs;
    if (t !== lastSwTxt) {
      lastSwTxt = t; $("#swTime").innerHTML = `${f.main}<small>${f.cs}</small>`;
      const lastLap = SW.laps.length ? SW.laps[SW.laps.length - 1] : 0, lf = fmtSW(e - lastLap);
      $("#swLapLive").textContent = `LAP ${SW.laps.length + 1}  ${lf.main}${lf.cs}`;
    }
    $("#swSweep").setAttribute("transform", `rotate(${((e / 1000) % 60 * 6).toFixed(2)} 150 150)`);
  }
  function swUI() {
    const g = $("#swGo");
    g.classList.toggle("running", SW.running);
    g.querySelector("span").innerHTML = SW.running ? "CHILL<br>OUT" : (swElapsed() > 0 ? "MORE<br>EFFORT" : "MAXIMUM<br>EFFORT");
    $("#swLap").disabled = !SW.running;
    $("#swReset").disabled = SW.running || swElapsed() === 0;
    const splits = SW.laps.map((t, i) => t - (i ? SW.laps[i - 1] : 0));
    const mn = Math.min(...splits), mx = Math.max(...splits);
    $("#swLaps").innerHTML = splits.map((s, i) => {
      const f = fmtSW(s), tt = fmtSW(SW.laps[i]);
      const cls = splits.length >= 3 ? (s === mn ? "best" : s === mx ? "worst" : "") : "";
      const tag = cls === "best" ? "<em>SPEEDY</em>" : cls === "worst" ? "<em>SLOWPOKE</em>" : "";
      return `<li class="${cls}"><span>LAP ${i + 1} ${tag}</span><b>${f.main}${f.cs}</b><i>${tt.main}${tt.cs}</i></li>`;
    }).reverse().join("");
    lastSwTxt = ""; renderSW();
  }
  function swToggle() { if (SW.running) { SW.acc = swElapsed(); SW.running = false; } else { SW.start = Date.now(); SW.running = true; } saveSW(); swUI(); }
  function swReset() { SW.running = false; SW.acc = 0; SW.laps = []; saveSW(); swUI(); }
  DP.sw = { elapsed: swElapsed, running: () => SW.running, toggle: swToggle, reset: swReset };
  $("#swGo").addEventListener("click", e => {
    jolt(e.currentTarget);
    const fresh = !SW.running && SW.acc === 0;
    swToggle(); DP.sound[SW.running ? "start" : "stop"]();
    if (fresh) { DP.fx.word("MAXIMUM EFFORT!"); const [x, y] = centerOf(e.currentTarget); DP.fx.boom(x, y, 30); }
  });
  $("#swLap").addEventListener("click", e => { if (!SW.running) return; jolt(e.currentTarget); SW.laps.push(swElapsed()); stats.laps++; saveStats(); if (stats.laps >= 5) ach("laps_5"); DP.sound.lap(); saveSW(); swUI(); });
  $("#swReset").addEventListener("click", e => { jolt(e.currentTarget); swReset(); DP.sound.click(); });

  // ---------- alarms ----------
  let alarms = LS.get("alarms", []), snooze = LS.get("snooze", null);
  const saveAlarms = () => LS.set("alarms", alarms);
  function renderAlarms() {
    const ul = $("#alarmList");
    if (!alarms.length) { ul.innerHTML = `<li class="empty">No alarms. Living dangerously, I see.</li>`; return; }
    ul.innerHTML = alarms.slice().sort((a, b) => a.time.localeCompare(b.time)).map(a => {
      const [H, M] = a.time.split(":").map(Number);
      return `<li class="${a.on ? "" : "off"}" data-id="${a.id}"><div class="al-main"><b>${fmtHM(H, M)}</b><span>${esc(a.label || "Unalive the day")} <em>${a.daily ? "DAILY" : "ONCE"}</em></span></div>
        <input type="checkbox" class="switch" data-act="toggle" ${a.on ? "checked" : ""} aria-label="Toggle alarm"><button class="del" data-act="del" aria-label="Delete alarm">&times;</button></li>`;
    }).join("");
  }
  $("#alarmAdd").addEventListener("click", e => {
    jolt(e.currentTarget);
    const time = $("#alarmTime").value || "07:00";
    alarms.push({ id: Date.now().toString(36), time, label: $("#alarmLabel").value.trim(), daily: $("#alarmDaily").checked, on: true, last: "" });
    saveAlarms(); renderAlarms(); DP.sound.click(); $("#alarmLabel").value = "";
    toast(`Alarm set for ${fmtHM(...time.split(":").map(Number))}. I'll be LOUD.`);
    requestWake(); renderChips(true);
  });
  $("#alarmList").addEventListener("click", e => {
    const li = e.target.closest("li[data-id]"); if (!li) return;
    const a = alarms.find(x => x.id === li.dataset.id); if (!a) return;
    if (e.target.dataset.act === "del") { alarms = alarms.filter(x => x !== a); saveAlarms(); renderAlarms(); DP.sound.slash(); toast("Alarm unalived."); }
    else if (e.target.dataset.act === "toggle") { a.on = e.target.checked; saveAlarms(); li.classList.toggle("off", !a.on); DP.sound.tick(); }
  });
  $("#alarmTest").addEventListener("click", () => ring("alarm", { label: "Test alarm", time: fmtHM(new Date().getHours(), new Date().getMinutes()) }));
  function alarmCheck() {
    const d = new Date(), hm = `${pad(d.getHours())}:${pad(d.getMinutes())}`, key = d.toDateString() + hm;
    for (const a of alarms) {
      if (a.on && a.time === hm && a.last !== key) { a.last = key; if (!a.daily) a.on = false; saveAlarms(); if (current === "scr-alarms") renderAlarms(); ring("alarm", a); return; }
    }
    if (snooze && Date.now() >= snooze.at) { const s = snooze; snooze = null; LS.set("snooze", null); ring("alarm", s.alarm); }
  }
  function nextAlarm() {
    const on = alarms.filter(a => a.on); if (!on.length) return null;
    const d = new Date(), nowM = d.getHours() * 60 + d.getMinutes();
    const best = on.map(a => { const [H, M] = a.time.split(":").map(Number); let diff = H * 60 + M - nowM; if (diff <= 0) diff += 1440; return { a, H, M, diff }; }).sort((x, y) => x.diff - y.diff)[0];
    return { txt: fmtHM(best.H, best.M), label: best.a.label };
  }

  // ---------- ringing modal (alarms, timers, focus, interval, countdowns) ----------
  let ringing = null, ringAuto = 0;
  function ring(kind, data = {}) {
    if (ringing) return;
    ringing = { kind, data };
    const m = $("#ringModal"); m.hidden = false; app.classList.add("ringing");
    if (kind === "timer") {
      $("#ringTitle").textContent = "CHIMICHANGA'S READY!"; $("#ringSub").textContent = pick("timerDone");
      $("#ringTime").textContent = "00:00"; $("#ringSnooze").hidden = true;
      DP.sound.ding(); setTimeout(() => { if (ringing) DP.sound.alarmStart(); }, 1700);
    } else if (kind === "alarm") {
      $("#ringTitle").textContent = pick("alarmTitles");
      $("#ringSub").textContent = (data.label ? `\u201C${data.label}\u201D \u2014 ` : "") + pick("alarmSubs");
      const t = data.time && /^\d\d:\d\d$/.test(data.time) ? fmtHM(...data.time.split(":").map(Number)) : (data.time || "");
      $("#ringTime").textContent = t; $("#ringSnooze").hidden = false;
      DP.sound.alarmStart();
    } else {
      $("#ringTitle").textContent = data.title || "DING!"; $("#ringSub").textContent = data.sub || pick("general");
      $("#ringTime").textContent = data.time || ""; $("#ringSnooze").hidden = true;
      DP.sound.ding(); if (data.loop !== false) setTimeout(() => { if (ringing) DP.sound.alarmStart(); }, 1700);
    }
    DP.fx.confetti(60); if (DP.gl) DP.gl.boom(1);
    speak($("#ringTitle").textContent + ". " + $("#ringSub").textContent);
    clearTimeout(ringAuto); ringAuto = setTimeout(() => { if (ringing) stopRing("timeout"); }, 90000);
  }
  function stopRing(how) {
    if (!ringing) return;
    const r = ringing; ringing = null;
    DP.sound.alarmStop(); $("#ringModal").hidden = true; app.classList.remove("ringing");
    if (how === "snooze") { snooze = { at: Date.now() + 5 * 60000, alarm: r.data }; LS.set("snooze", snooze); say(pick("snooze")); }
    else if (how === "shake") { DP.fx.word("UNALIVED!"); say(pick("unalive")); }
    else if (how === "dismiss" && r.kind !== "custom") say(pick("dismiss"));
    if (r.data && r.data.onClose) r.data.onClose(how);
  }
  $("#ringDismiss").addEventListener("click", () => stopRing("dismiss"));
  $("#ringSnooze").addEventListener("click", () => stopRing("snooze"));

  // ---------- multiverse ----------
  const fmtCache = {};
  function tzParts(tz, now) {
    if (!tz) { const d = new Date(now); return { y: d.getFullYear(), mo: d.getMonth() + 1, d: d.getDate(), h: d.getHours(), m: d.getMinutes(), s: d.getSeconds() }; }
    const f = fmtCache[tz] || (fmtCache[tz] = new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric" }));
    const o = {}; f.formatToParts(new Date(now)).forEach(p => { o[p.type] = p.value; });
    return { y: +o.year, mo: +o.month, d: +o.day, h: (+o.hour) % 24, m: +o.minute, s: +o.second };
  }
  const tlGrid = $("#tlGrid");
  tlGrid.innerHTML = DP.TIMELINES.map(t => `<button class="tl-card ${t.id === "void" ? "tl-void" : ""} ${t.id === "local" ? "tl-local" : ""}" data-id="${t.id}">
    <svg viewBox="0 0 100 100" class="tl-clock"><circle cx="50" cy="50" r="46" class="tlc-face"/>${Array.from({ length: 12 }, (_, i) => { const a = i * 30 * Math.PI / 180; return `<line x1="${50 + Math.sin(a) * 36}" y1="${50 - Math.cos(a) * 36}" x2="${50 + Math.sin(a) * 42}" y2="${50 - Math.cos(a) * 42}" class="tlc-tk"/>`; }).join("")}
      <line x1="50" y1="50" x2="50" y2="26" class="tlc-h" data-h/><line x1="50" y1="50" x2="50" y2="14" class="tlc-m" data-m/><line x1="50" y1="56" x2="50" y2="10" class="tlc-s" data-s/><circle cx="50" cy="50" r="3.5" class="tlc-c"/></svg>
    <div class="tl-info"><b>${esc(t.name)}</b><span>${esc(t.sub)}</span></div>
    <div class="tl-time"><b data-t>--:--</b><small data-d>Today</small><em data-o></em></div></button>`).join("");
  const tlEls = [...tlGrid.children].map((el, i) => ({ el, t: DP.TIMELINES[i], h: el.querySelector("[data-h]"), m: el.querySelector("[data-m]"), s: el.querySelector("[data-s]"), tt: el.querySelector("[data-t]"), dd: el.querySelector("[data-d]"), oo: el.querySelector("[data-o]"), last: "" }));
  let multiLast = 0;
  function renderMulti(force) {
    const now = Date.now();
    const local = tzParts(null, now), lUTC = Date.UTC(local.y, local.mo - 1, local.d, local.h, local.m, local.s);
    const fine = (now % 1000) / 1000;
    tlEls.forEach(x => {
      const p = tzParts(x.t.tz, now), s = p.s + fine, m = p.m + s / 60, h = (p.h % 12) + m / 60;
      x.h.setAttribute("transform", `rotate(${(h * 30).toFixed(1)} 50 50)`);
      x.m.setAttribute("transform", `rotate(${(m * 6).toFixed(1)} 50 50)`);
      x.s.setAttribute("transform", `rotate(${(s * 6).toFixed(1)} 50 50)`);
      if (force || now - multiLast > 500) {
        const glitch = x.t.id === "void" && Math.random() < 0.3;
        const txt = glitch ? ["??:??", "4:04", "\u221E:00", "13:61", "NO"][Math.floor(Math.random() * 5)] : fmtHM(p.h, p.m);
        if (txt !== x.last) { x.last = txt; x.tt.textContent = txt; }
        const pUTC = Date.UTC(p.y, p.mo - 1, p.d, p.h, p.m, p.s), diffH = Math.round((pUTC - lUTC) / 1800000) / 2;
        const dayDiff = Math.round((Date.UTC(p.y, p.mo - 1, p.d) - Date.UTC(local.y, local.mo - 1, local.d)) / 86400000);
        x.dd.textContent = x.t.id === "void" ? "Whenever" : dayDiff === 0 ? "Today" : dayDiff > 0 ? "Tomorrow" : "Yesterday";
        x.oo.textContent = x.t.id === "local" ? "YOU ARE HERE" : x.t.id === "void" ? "OFF THE MAP" : diffH === 0 ? "SAME TIME" : (diffH > 0 ? "+" : "") + diffH + "H";
      }
    });
    if (force || now - multiLast > 500) multiLast = now;
  }
  let voidTaps = [];
  tlGrid.addEventListener("click", e => {
    const c = e.target.closest(".tl-card"); if (!c) return;
    const t = DP.TIMELINES.find(x => x.id === c.dataset.id);
    jolt(c);
    if (t.id === "void") {
      const now = Date.now(); voidTaps = voidTaps.filter(x => now - x < 4000); voidTaps.push(now);
      DP.sound.glitch();
      if (voidTaps.length >= 3) { voidTaps = []; timeTravel(); return; }
    } else DP.sound.click();
    say(t.quip);
  });
  function timeTravel() {
    warp.active = true; warp.t0 = performance.now(); app.classList.add("rewinding");
    DP.sound.rewind(); DP.fx.word("REWIND!", "void"); if (DP.gl) DP.gl.boom(1);
    egg("timetravel");
    setTimeout(() => { if (current !== "scr-watch") go("scr-watch"); }, 350);
    setTimeout(() => say(pick("timetravel")), 2800);
  }

  // ---------- weather card + complications strip ----------
  const C = DP.cmp;
  function renderWeather() {
    const w = C.wx, k = C.kind(), loc = C.loc;
    $("#wxIcon").innerHTML = C.icon(k === "sun" && w && !w.day ? "moonI" : k);
    $("#wxTemp").textContent = w ? `${w.t}\u00b0${C.unit()}` : "--\u00b0";
    $("#wxDesc").textContent = w ? `${C.desc()} \u2022 feels ${w.feels}\u00b0 \u2022 wind ${w.wind} mph` : (loc ? "Loading weather..." : "Set a location to get weather");
    $("#wxLoc").textContent = loc ? `\uD83D\uDCCD ${loc.name}${loc.approx ? " (approx., from your time zone)" : ""}` : "No location yet";
    $("#wxHiLo").textContent = w ? `H ${w.hi}\u00b0 / L ${w.lo}\u00b0` : "";
    const s = C.sun(); $("#wxSun").textContent = s ? `\u2600 ${C.hm(s.rise)} \u2192 ${C.hm(s.set)}` : "";
    const m = C.moon(); $("#wxMoon").innerHTML = `${C.moonSVG(m.p, 16)} ${esc(m.name)} ${Math.round(m.illum * 100)}%`;
    $("#wxStatus").textContent = C.status || "Weather by Open-Meteo (no account, no tracking).";
    $("#wxCard").dataset.kind = k;
  }
  const strip = $("#cmpStrip");
  function buildChips() {
    strip.innerHTML = settings.chips.slice(0, 3).map(id => `<button class="chip" data-c="${id}"><i class="chip-ic"></i><span><b></b><small></small></span></button>`).join("");
    renderChips(true);
  }
  let chipLast = 0;
  function renderChips(force) {
    const now = Date.now(); if (!force && now - chipLast < 1000) return; chipLast = now;
    const d = new Date();
    [...strip.children].forEach(b => {
      const x = C.data(b.dataset.c, d);
      const ic = b.querySelector(".chip-ic"); if (ic._h !== x.icon) { ic._h = x.icon; ic.innerHTML = x.icon; }
      const bb = b.querySelector("b"), sm = b.querySelector("small");
      if (bb.textContent !== x.v) bb.textContent = x.v; if (sm.textContent !== x.l) sm.textContent = x.l;
    });
  }
  strip.addEventListener("click", e => {
    const b = e.target.closest(".chip"); if (!b) return; jolt(b); DP.sound.click();
    const id = b.dataset.c;
    const dest = { steps: "scr-vitals", heal: "scr-vitals", alarm: "scr-alarms", countdown: "scr-countdown", focus: "scr-focus", sunrise: "scr-multi", sunset: "scr-multi", hilo: "scr-multi" }[id];
    if (id === "weather") { const q = C.weatherQuip(); if (q) say(q); else go("scr-multi"); }
    else if (id === "moon") { const m = C.moon(); say(`${m.name}, ${Math.round(m.illum * 100)}% lit. ${m.illum > 0.9 ? "Werewolves are clocking in. Lock up the chimichangas." : m.illum < 0.1 ? "New moon. Perfect night for sneaky merc stuff." : "The moon is half-trying. Relatable."}`); }
    else if (dest) go(dest);
    else say(pick("general"));
  });
  document.addEventListener("dp-weather", () => { renderWeather(); renderChips(true); if (C.wx) ach("weather"); });
  $("#wxGeo").addEventListener("click", async e => {
    jolt(e.currentTarget); $("#wxStatus").textContent = "Asking your phone where you are...";
    try { await C.useGeo(); toast("Location locked. Only used for weather, only on this phone."); }
    catch (err) { $("#wxStatus").textContent = "Location denied or unavailable" + (err && err.code === 1 ? " (permission denied)" : "") + ". Try SET CITY instead."; return; }
    renderWeather();
  });
  $("#wxCity").addEventListener("click", async e => {
    jolt(e.currentTarget);
    const name = prompt("Which city? (e.g. Chicago)", C.loc && !C.loc.approx ? C.loc.name.split(",")[0] : "");
    if (!name) return;
    $("#wxStatus").textContent = "Looking up " + name + "...";
    try { await C.searchCity(name); toast("Weather set to " + C.loc.name); } catch (err) { $("#wxStatus").textContent = "Couldn't find that city. Try another spelling."; return; }
    renderWeather();
  });
  $("#wxRefresh").addEventListener("click", async e => { jolt(e.currentTarget); $("#wxStatus").textContent = "Refreshing..."; await C.refresh(true); renderWeather(); });

  // ---------- motion (steps, shake, tilt) ----------
  let motionOn = false, lp = 9.81, above = false, lastStep = 0, shakeHits = [], lastShake = 0;
  const spark = []; const tilt = { x: 0.5, y: 0.3, tx: 0.5, ty: 0.3 };
  function onMotion(e) {
    const g = e.accelerationIncludingGravity; if (!g || g.x == null) return;
    const now = performance.now(), mag = Math.hypot(g.x, g.y, g.z);
    lp = lp * 0.8 + mag * 0.2;
    if (!above && lp > 11.3 && now - lastStep > 300) { above = true; lastStep = now; stats.steps++; saveStats(); if (stats.steps >= 1000) ach("steps_1000"); if (current === "scr-vitals") $("#statSteps").textContent = stats.steps; }
    if (lp < 10.3) above = false;
    const a = e.acceleration && e.acceleration.x != null ? Math.hypot(e.acceleration.x, e.acceleration.y, e.acceleration.z) : Math.abs(mag - 9.81);
    spark.push(a); if (spark.length > 120) spark.shift();
    if (a > 16) {
      shakeHits = shakeHits.filter(t => now - t < 800); shakeHits.push(now);
      if (shakeHits.length >= 3 && now - lastShake > 1600) { lastShake = now; shakeHits = []; onShake(); }
    }
  }
  function onShake() {
    stats.shakes++; saveStats(); egg("shaker");
    if (ringing) { stopRing("shake"); return; }
    if (DP.games && DP.games.active) return;
    shake(); F.eyes("wide"); say(pick("shake"));
  }
  function onOrient(e) {
    if (e.gamma == null || !settings.tilt) return;
    tilt.tx = Math.max(0, Math.min(1, 0.5 + e.gamma / 50));
    tilt.ty = Math.max(0, Math.min(1, 0.5 + ((e.beta || 45) - 45) / 50));
    F.lookAt(e.gamma / 30, ((e.beta || 45) - 45) / 30);
  }
  function startMotion() {
    if (motionOn) return; motionOn = true;
    addEventListener("devicemotion", onMotion); addEventListener("deviceorientation", onOrient);
    LS.set("motion", true);
    const b = $("#btnMotion"); b.textContent = "MOTION ON \u2713 (SHAKE ME)"; b.classList.add("done");
  }
  $("#btnMotion").addEventListener("click", async () => {
    try {
      if (typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function") {
        const r = await DeviceMotionEvent.requestPermission();
        if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") { try { await DeviceOrientationEvent.requestPermission(); } catch (_) { } }
        if (r === "granted") { startMotion(); say("Motion unlocked. Tilt me to move the light. Shake me, Nick. Gently. Or don't."); }
        else toast("Motion denied. My feelings too. (Settings > Safari > Motion & Orientation)");
      } else if ("DeviceMotionEvent" in window) { startMotion(); toast("Motion sensors on. (If nothing happens, this device has no sensors.)"); }
      else toast("No motion sensors here. Are you on a toaster?");
    } catch (err) { toast("Motion permission failed: " + (err && err.message ? err.message : err)); }
  });
  if (typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission !== "function" && LS.get("motion", false)) startMotion();
  addEventListener("pointermove", e => {
    lastInteraction = Date.now();
    if (motionOn && settings.tilt) return;
    tilt.tx = e.clientX / innerWidth; tilt.ty = e.clientY / innerHeight;
    const r = watch.getBoundingClientRect();
    F.lookAt((e.clientX - (r.left + r.width / 2)) / (r.width / 2), (e.clientY - (r.top + r.height / 2)) / (r.height / 2));
  }, { passive: true });
  const sparkC = $("#motionSpark"), sparkX = sparkC.getContext("2d");
  function renderSpark() {
    const w = sparkC.clientWidth, h = 60, dpr = Math.min(2, devicePixelRatio || 1);
    if (!w) return;
    if (sparkC.width !== Math.round(w * dpr)) { sparkC.width = Math.round(w * dpr); sparkC.height = h * dpr; }
    sparkX.setTransform(dpr, 0, 0, dpr, 0, 0); sparkX.clearRect(0, 0, w, h);
    sparkX.strokeStyle = "rgba(255,255,255,.12)"; sparkX.beginPath(); sparkX.moveTo(0, h - 16 / 25 * h); sparkX.lineTo(w, h - 16 / 25 * h); sparkX.stroke();
    if (!spark.length) { sparkX.fillStyle = "rgba(255,255,255,.35)"; sparkX.font = "12px Oswald, sans-serif"; sparkX.fillText(motionOn ? "Waiting for wiggles..." : "Motion off. Tap the button above.", 8, 34); return; }
    sparkX.strokeStyle = getComputedStyle(app).getPropertyValue("--accent-hi").trim() || "#ff3b44"; sparkX.lineWidth = 2; sparkX.beginPath();
    spark.forEach((v, i) => { const x = i / 119 * w, y = h - Math.min(1, v / 25) * (h - 4) - 2; i ? sparkX.lineTo(x, y) : sparkX.moveTo(x, y); });
    sparkX.stroke();
  }
  function updateStats() {
    $("#statSteps").textContent = stats.steps; $("#statShakes").textContent = stats.shakes;
    $("#statQuips").textContent = stats.quips; $("#statWalls").textContent = stats.walls;
  }

  // ---------- hub ----------
  const HUB = [
    ["scr-vitals", "\u2764\uFE0F", "Vitals", "Healing factor, motion, eggs"], ["scr-horo", "\uD83D\uDD2E", "Horoscope", "Your daily cosmic roast"],
    ["scr-mood", "\uD83C\uDF21\uFE0F", "Mood Meter", "Cheer-up quips on demand"], ["scr-custom", "\uD83C\uDFA8", "Customize", "Colors, hands, complications"],
    ["scr-ach", "\uD83C\uDFC6", "Achievements", "Shiny digital validation"], ["light", "\uD83D\uDD26", "Screen Light", "Flashlight, disco, DP signal"],
    ["scr-games", "\uD83D\uDDE1\uFE0F", "Arcade", "Katana Slice + Catch the Bullet"], ["scr-settings", "\u2699\uFE0F", "Settings", "Voice, shader, transitions"]
  ];
  $("#hubGrid").innerHTML = HUB.map(([id, ic, n, s]) => `<button class="hub-tile" data-hub="${id}"><i>${ic}</i><b>${n}</b><span>${s}</span></button>`).join("");
  $("#hubGrid").addEventListener("click", e => {
    const b = e.target.closest(".hub-tile"); if (!b) return; jolt(b);
    const id = b.dataset.hub;
    if (id === "light") { if (DP.tools) DP.tools.light(true); return; }
    go(id);
  });
  function renderHub() {
    const n = DP.ACHIEVEMENTS.filter(a => stats.ach[a.id]).length;
    const t = $('[data-hub="scr-ach"] span'); if (t) t.textContent = `${n}/${DP.ACHIEVEMENTS.length} unlocked`;
    const v = $('[data-hub="scr-vitals"] span'); if (v) v.textContent = `${healValue()}% healed \u2022 ${Object.keys(stats.eggs).length}/${DP.EGGS.length} eggs`;
  }

  // ---------- customizer ----------
  $("#swatches").innerHTML = Object.entries(ACCENTS).map(([k, a]) => `<button data-a="${k}" title="${a[3]}" style="--c1:${a[0]};--c2:${a[1]}"><i></i><span>${a[3]}</span></button>`).join("");
  const cmpOpts = sel => C.list.map(c => `<option value="${c.id}" ${c.id === sel ? "selected" : ""}>${c.name}</option>`).join("");
  function customUI() {
    $$("#swatches button").forEach(b => b.classList.toggle("on", b.dataset.a === settings.accent && !settings.wolverine));
    $$("#segHands button").forEach(b => b.classList.toggle("on", b.dataset.v === settings.hands));
    $("#selCmpL").innerHTML = cmpOpts(settings.cmpL); $("#selCmpR").innerHTML = cmpOpts(settings.cmpR);
    $$("[data-chip]").forEach(s => { s.innerHTML = cmpOpts(settings.chips[+s.dataset.chip]); });
  }
  const customized = () => { saveSettings(); ach("custom"); DP.sound.tick(); };
  $("#swatches").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; settings.accent = b.dataset.a; settings.wolverine = false; customized(); applyTheme(); customUI(); const [x, y] = centerOf(b); DP.fx.boom(x, y, 16); });
  $("#segHands").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; settings.hands = b.dataset.v; customized(); F.rebuild("mask"); customUI(); toast(`Classic Mask now has ${b.textContent.toLowerCase()} for hands.`); });
  $("#selCmpL").addEventListener("change", e => { settings.cmpL = e.target.value; customized(); F.rebuild("mask"); });
  $("#selCmpR").addEventListener("change", e => { settings.cmpR = e.target.value; customized(); F.rebuild("mask"); });
  $$("[data-chip]").forEach(s => s.addEventListener("change", () => { const c = settings.chips.slice(); c[+s.dataset.chip] = s.value; settings.chips = c; customized(); buildChips(); }));
  $("#customPreview").addEventListener("click", () => { setFace(0, false); go("scr-watch"); });

  // ---------- settings ----------
  $$("[data-set]").forEach(inp => {
    inp.checked = !!settings[inp.dataset.set];
    inp.addEventListener("change", () => { settings[inp.dataset.set] = inp.checked; saveSettings(); applySettings(inp.dataset.set); DP.sound.tick(); if (["tintMask", "tickSec"].includes(inp.dataset.set)) ach("custom"); });
  });
  $("#selFace").innerHTML = F.list.map((f, i) => `<option value="${i}" ${i === settings.face ? "selected" : ""}>${esc(f.name)}</option>`).join("");
  $("#selFace").addEventListener("change", e => { settings.face = +e.target.value; saveSettings(); setFace(settings.face, false); toast(`Default face: ${F.list[settings.face].name}`); });
  $$("#segTrans button").forEach(b => { b.classList.toggle("on", b.dataset.v === settings.trans); b.addEventListener("click", () => { settings.trans = b.dataset.v; saveSettings(); $$("#segTrans button").forEach(x => x.classList.toggle("on", x === b)); DP.sound.tick(); }); });
  $("#selVoice").addEventListener("change", e => { settings.voiceName = e.target.value; saveSettings(); speak("How do I sound? Be honest. Actually, don't.", true); });
  const rate = $("#voiceRate"), pitch = $("#voicePitch");
  rate.value = settings.rate; pitch.value = settings.pitch; $("#rateVal").textContent = settings.rate; $("#pitchVal").textContent = settings.pitch;
  rate.addEventListener("input", () => { settings.rate = +rate.value; $("#rateVal").textContent = rate.value; saveSettings(); });
  pitch.addEventListener("input", () => { settings.pitch = +pitch.value; $("#pitchVal").textContent = pitch.value; saveSettings(); });
  $("#voiceTest").addEventListener("click", () => { if (!synth) { toast("No speech voices available in this browser."); return; } speak(pick("general"), true); ach("voice"); });
  function applySettings(k) {
    if (!k || k === "particles") DP.fx.setEmbers(settings.particles);
    if (k === "h24") { renderAlarms(); renderMulti(true); renderChips(true); }
    if (!k || k === "wake") requestWake();
    if (k === "tilt" && !settings.tilt) { tilt.tx = 0.5; tilt.ty = 0.3; }
    if (!k || k === "shader") { if (DP.gl) DP.gl.setVisible(settings.shader); app.classList.toggle("no-shader", !settings.shader || !(DP.gl && DP.gl.ok)); }
    if (k === "voice") { voiceUI(); if (settings.voice) { ach("voice"); speak("Voice on. Hi Nick.", true); } else if (synth) synth.cancel(); }
    if (k === "celsius") C.refresh(true).then(() => { renderWeather(); renderChips(true); });
    if (k === "tintMask") applyTheme();
  }
  $("#btnReset").addEventListener("click", () => {
    if (!confirm("Reset ALL Deadpool Watch 2 settings, alarms, scores, stats, eggs and achievements? (v1 is untouched.)")) return;
    Object.keys(localStorage).filter(k => k.startsWith(PFX)).forEach(k => localStorage.removeItem(k));
    location.reload();
  });
  let wakeLock = null, wakeForced = false;
  async function requestWake(force) {
    if (typeof force === "boolean") wakeForced = force;
    try {
      if (!("wakeLock" in navigator)) return;
      if ((settings.wake || wakeForced) && document.visibilityState === "visible") { if (!wakeLock) { wakeLock = await navigator.wakeLock.request("screen"); wakeLock.addEventListener("release", () => { wakeLock = null; }); } }
      else if (wakeLock) { await wakeLock.release(); wakeLock = null; }
    } catch (e) { wakeLock = null; }
  }
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") { requestWake(); timerCheck(); C.refresh(false).then(renderWeather); } });

  // ---------- audio unlock (capture phase: runs before any handler that plays sound) ----------
  const unlock = () => { DP.sound.unlock(); removeEventListener("touchend", unlock, true); removeEventListener("click", unlock, true); };
  addEventListener("touchend", unlock, { passive: true, capture: true }); addEventListener("click", unlock, true);
  addEventListener("pointerdown", () => { lastInteraction = Date.now(); }, { passive: true });
  document.addEventListener("gesturestart", e => e.preventDefault());
  document.addEventListener("dblclick", e => e.preventDefault());
  addEventListener("keydown", e => { if (current !== "scr-watch" || (e.target.matches && e.target.matches("input,select,textarea"))) return; if (e.key === "ArrowRight") setFace(faceIdx + 1); if (e.key === "ArrowLeft") setFace(faceIdx - 1); });

  // ---------- logic tick ----------
  let lastHourQuip = "", lastAuto = Date.now();
  function timeAch() { const h = new Date().getHours(); if (h < 4) ach("night_owl"); else if (h < 6) ach("early_bird"); }
  setInterval(() => {
    timerCheck(); alarmCheck();
    const d = new Date();
    if (stats.stepsDay !== todayKey()) { stats.steps = 0; stats.stepsDay = todayKey(); saveStats(); }
    if (settings.autoQuips && !ringing && document.visibilityState === "visible" && !(DP.games && DP.games.active)) {
      const hk = d.toDateString() + d.getHours();
      if (d.getMinutes() === 0 && d.getSeconds() < 2 && lastHourQuip !== hk) { lastHourQuip = hk; say(pick("hourly").replace("{t}", fmtHM(d.getHours(), 0))); lastAuto = Date.now(); timeAch(); }
      else if (d.getHours() % 12 === 11 && d.getMinutes() === 11 && d.getSeconds() < 1) say("11:11! Make a wish. I wished for a bigger CGI budget.");
      else if (current === "scr-watch" && Date.now() - lastInteraction > 45000 && Date.now() - lastAuto > 150000) { lastAuto = Date.now(); say((Math.random() < 0.25 && C.weatherQuip()) || pick("general")); }
    }
    if (statsDirty) { statsDirty = false; LS.set("stats", stats); if (current === "scr-vitals") updateStats(); }
  }, 500);
  setInterval(() => { C.refresh(false).then(() => { renderWeather(); renderChips(true); }); }, 10 * 60000);

  // ---------- main loop (rAF; runs at the display rate, so 120Hz on ProMotion) ----------
  let lastFrame = performance.now(), sparkT = 0;
  const caseSpec = $(".case-spec");
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - lastFrame) / 1000); lastFrame = now;
    const gaming = DP.games && DP.games.active;
    if (DP.gl && !gaming) DP.gl.frame(now);
    const vis = s => current === s || navFrom === s;
    tilt.x += (tilt.tx - tilt.x) * 0.08; tilt.y += (tilt.ty - tilt.y) * 0.08;
    if (DP.gl) DP.gl.light(0.15 + tilt.x * 0.7, 0.98 - tilt.y * 0.35);
    if (vis("scr-watch") && !gaming) {
      const d = nowDate();
      F.render(faceIdx, d, fmt, settings.seconds, now);
      if (now < faceMoving || drag) { if (faceIdx > 0) F.render(faceIdx - 1, d, fmt, settings.seconds, now); if (faceIdx < N - 1) F.render(faceIdx + 1, d, fmt, settings.seconds, now); }
      watch.style.setProperty("--lx", (tilt.x * 100).toFixed(1) + "%");
      watch.style.setProperty("--ly", (tilt.y * 100).toFixed(1) + "%");
      watch.style.setProperty("--rx", ((0.5 - tilt.y) * 10).toFixed(2) + "deg");
      watch.style.setProperty("--ry", ((tilt.x - 0.5) * 12).toFixed(2) + "deg");
      caseSpec.style.setProperty("--spec", ((tilt.x - 0.5) * 140 + (tilt.y - 0.3) * 60).toFixed(1) + "deg");
      renderChips(false);
    }
    if (vis("scr-timer")) renderTimer();
    if (vis("scr-stopwatch")) renderSW();
    if (vis("scr-multi")) renderMulti(false);
    if (vis("scr-vitals") && now - sparkT > 60) { sparkT = now; renderSpark(); }
    for (const id in frameHooks) if (id === "*" || vis(id)) frameHooks[id].forEach(f => f(now, dt));
    updateHeal(dt * 60);
    DP.fx.frame(now);
  }

  // ---------- enter hooks ----------
  onEnter("scr-alarms", renderAlarms);
  onEnter("scr-vitals", () => { renderEggs(); updateStats(); });
  onEnter("scr-multi", () => { renderMulti(true); renderWeather(); C.refresh(false).then(renderWeather); });
  onEnter("scr-ach", renderAch);
  onEnter("scr-hub", renderHub);
  onEnter("scr-custom", customUI);
  onEnter("scr-stopwatch", swUI);
  onEnter("scr-settings", fillVoiceSel);

  // ---------- public API for tools2.js / games.js ----------
  DP.cx = { steps: () => stats.steps, heal: healValue, nextAlarm };
  DP.core = { LS, settings, saveSettings, stats, saveStats, say, speak, toast, shake, jolt, pick, egg, ach, go, onEnter, onFrame, fmtHM, pad, esc, ring, stopRing, centerOf, requestWake, repeatBtn, renderChips, get current() { return current; }, get ringing() { return !!ringing; } };

  // ---------- boot ----------
  applyTheme(); applySettings(); timerUI(); swUI(); renderAlarms(); renderEggs(); updateStats(); buildChips(); renderWeather(); voiceUI(); customUI(); renderHub();
  requestAnimationFrame(frame);
  timeAch();
  setTimeout(() => C.refresh(false).then(() => { renderWeather(); renderChips(true); }), 1200);
  setTimeout(() => {
    if (!LS.get("greeted", false)) { LS.set("greeted", true); say("Nick! It's me, but SEQUEL. 13 faces, games, weather, a voice... Tap my face. Tap my name. Twist my crown."); }
    else if (Math.random() < 0.5) say(pick("general"));
  }, 900);
  if ("serviceWorker" in navigator && /^https?:/.test(location.protocol)) {
    addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => { }));
  }
  DP.app = { go, setFace, ring, stopRing, say, egg, ach, get faceIdx() { return faceIdx; }, T, SW, heal, damage, onShake, timeTravel, toggleWolverine, unicorn, dogpool, dance, stats, applyTheme };
})();
