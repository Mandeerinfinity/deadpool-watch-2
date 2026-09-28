/* Deadpool Watch 2 — tools: Maximum Effort focus (pomodoro), interval workouts, countdowns, horoscope, mood meter, screen light. */
(function () {
  "use strict";
  const K = DP.core, $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const { LS, pad, esc, say, toast, jolt, pick, ach, ring, onEnter, onFrame, stats, saveStats, speak } = K;
  const app = $("#app");
  const mmss = s => { s = Math.max(0, Math.ceil(s)); return s >= 3600 ? `${Math.floor(s / 3600)}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}` : `${pad(Math.floor(s / 60))}:${pad(s % 60)}`; };

  // ================= FOCUS (pomodoro) =================
  const FO = Object.assign({ focus: 25, short: 5, long: 15, phase: "focus", idx: 0, running: false, end: 0, left: 25 * 60 }, LS.get("focus", {}));
  const saveFO = () => LS.set("focus", FO);
  const PH = { focus: ["FOCUS", "Phone down. Stab procrastination."], short: ["SHORT BREAK", "Stretch. Hydrate. Crack your neck ominously."], long: ["LONG BREAK", "Four blocks down. You've earned a chimichanga."] };
  const fRing = $("#focusRing"), FC = 2 * Math.PI * 136; fRing.style.strokeDasharray = FC;
  const phaseLen = p => FO[p] * 60;
  const fRem = () => FO.running ? Math.max(0, (FO.end - Date.now()) / 1000) : FO.left;
  function focusUI() {
    $("#focusPhase").textContent = PH[FO.phase][0]; $("#focusSub").textContent = PH[FO.phase][1];
    $("#fFocus").textContent = FO.focus; $("#fShort").textContent = FO.short; $("#fLong").textContent = FO.long;
    $("#focusGo").textContent = FO.running ? "PAUSE" : (FO.left < phaseLen(FO.phase) ? "RESUME" : "START");
    $("#focusDial").dataset.phase = FO.phase; $("#focusDial").classList.toggle("running", FO.running);
    $("#focusDots").innerHTML = [0, 1, 2, 3].map(i => `<i class="${i < FO.idx % 4 || (FO.idx % 4 === 0 && FO.idx && FO.phase === "long") ? "on" : ""}"></i>`).join("");
    $("#focusStats").textContent = `${stats.focusToday} focus block${stats.focusToday === 1 ? "" : "s"} today \u2022 ${stats.focusTotal || 0} all-time`;
    renderFocus();
  }
  function renderFocus() {
    const r = fRem(); $("#focusTime").textContent = mmss(r);
    fRing.style.strokeDashoffset = (FC * (1 - r / phaseLen(FO.phase))).toFixed(1);
  }
  function setPhase(p) { FO.phase = p; FO.left = phaseLen(p); FO.running = false; saveFO(); focusUI(); }
  function focusDone() {
    FO.running = false;
    if (FO.phase === "focus") {
      FO.idx++; stats.focusToday++; stats.focusTotal = (stats.focusTotal || 0) + 1; saveStats(); ach("focus_1"); if (stats.focusToday >= 4) ach("focus_4");
      const next = FO.idx % 4 === 0 ? "long" : "short";
      ring("custom", { title: "MAXIMUM EFFORT: DONE!", sub: pick("focus.done"), time: PH[next][0], loop: false });
      setPhase(next);
    } else {
      ring("custom", { title: "BREAK'S OVER", sub: pick("focus.breakDone"), time: "FOCUS", loop: false });
      setPhase("focus");
    }
  }
  $("#focusGo").addEventListener("click", e => {
    jolt(e.currentTarget);
    if (FO.running) { FO.left = fRem(); FO.running = false; DP.sound.stop(); }
    else { if (FO.left <= 0) FO.left = phaseLen(FO.phase); FO.end = Date.now() + FO.left * 1000; FO.running = true; DP.sound.start(); if (FO.phase === "focus") { DP.fx.word("MAXIMUM EFFORT!"); say(pick("focus.start")); } const [x, y] = K.centerOf($("#focusDial")); DP.fx.boom(x, y, 20); K.requestWake(true); }
    saveFO(); focusUI();
  });
  $("#focusReset").addEventListener("click", e => { jolt(e.currentTarget); FO.idx = 0; setPhase("focus"); DP.sound.click(); K.requestWake(false); });
  $("#focusSkip").addEventListener("click", e => { jolt(e.currentTarget); DP.sound.slash(); setPhase(FO.phase === "focus" ? ((FO.idx + 1) % 4 === 0 ? "long" : "short") : "focus"); });
  $$("[data-f]").forEach(b => K.repeatBtn(b, () => {
    if (FO.running) return;
    const [k, op] = [b.dataset.f.slice(0, -1), b.dataset.f.slice(-1)], lim = { focus: [5, 90], short: [1, 30], long: [5, 60] }[k];
    FO[k] = Math.max(lim[0], Math.min(lim[1], FO[k] + (op === "+" ? (k === "focus" ? 5 : 1) : (k === "focus" ? -5 : -1))));
    if (FO.phase === k) FO.left = phaseLen(k);
    saveFO(); focusUI(); DP.sound.tick();
  }));
  onEnter("scr-focus", focusUI);
  onFrame("scr-focus", renderFocus);

  // ================= INTERVAL WORKOUT =================
  const IV = Object.assign({ work: 40, rest: 20, rounds: 10 }, LS.get("iv", {}));
  const run = { on: false, phase: "idle", round: 0, end: 0, paused: 0, lastBeep: -1 };
  const saveIV = () => LS.set("iv", IV);
  const MERC = { work: ["STAB!", "PUNCH!", "SQUAT LIKE YOU MEAN IT", "KATANA ARMS!", "FASTER, NICK!", "MAXIMUM EFFORT!"], rest: ["BREATHE...", "CHIMI BREAK (NO)", "SHAKE IT OUT", "HYDRATE, MERC"] };
  function ivUI() {
    $("#ivWork").textContent = IV.work; $("#ivRest").textContent = IV.rest; $("#ivRounds").textContent = IV.rounds;
    $$("#ivPresets button").forEach(b => b.classList.toggle("on", b.dataset.p === `${IV.work},${IV.rest},${IV.rounds}`));
    $("#ivGo").textContent = run.on ? (run.paused ? "RESUME" : "PAUSE") : "LET'S GO";
    const d = $("#ivDisplay"); d.dataset.phase = run.phase;
    if (!run.on) { $("#ivPhase").textContent = run.phase === "done" ? "DONE! \uD83D\uDCAA" : "READY?"; $("#ivTime").textContent = mmss(IV.work); $("#ivRound").textContent = `${IV.rounds} ROUNDS \u2022 ${mmss(IV.rounds * (IV.work + IV.rest) - IV.rest)} TOTAL`; $("#ivBar").style.transform = "scaleX(0)"; }
  }
  function ivPhase(p) {
    run.phase = p; const len = p === "prep" ? 5 : p === "work" ? IV.work : IV.rest;
    run.len = len; run.end = Date.now() + len * 1000; run.lastBeep = -1;
    $("#ivPhase").textContent = p === "prep" ? "GET READY" : p === "work" ? "WORK" : "REST";
    $("#ivMerc").textContent = p === "prep" ? "Stretch something. Anything." : MERC[p][Math.floor(Math.random() * MERC[p].length)];
    $("#ivDisplay").dataset.phase = p;
    if (p === "work") { DP.sound.whistle(); speak(run.round === 1 ? "Go! " + pick("interval.work") : "Work!", false); if (DP.gl) DP.gl.boom(0.7); }
    if (p === "rest") { DP.sound.beep(true); speak("Rest. " + (Math.random() < 0.4 ? pick("interval.rest") : ""), false); }
  }
  function ivTick() {
    if (!run.on || run.paused) return;
    const rem = (run.end - Date.now()) / 1000;
    const sec = Math.ceil(rem);
    if (sec <= 3 && sec >= 1 && sec !== run.lastBeep) { run.lastBeep = sec; DP.sound.beep(false); }
    if (rem <= 0) {
      if (run.phase === "prep") { run.round = 1; ivPhase("work"); }
      else if (run.phase === "work") { if (run.round >= IV.rounds) return ivDone(); if (IV.rest > 0) ivPhase("rest"); else { run.round++; ivPhase("work"); } }
      else { run.round++; ivPhase("work"); }
    }
    const r2 = Math.max(0, (run.end - Date.now()) / 1000);
    $("#ivTime").textContent = mmss(r2);
    $("#ivRound").textContent = run.phase === "prep" ? `ROUND 1 / ${IV.rounds} UP NEXT` : `ROUND ${run.round} / ${IV.rounds}`;
    $("#ivBar").style.transform = `scaleX(${(1 - r2 / run.len).toFixed(3)})`;
  }
  function ivDone() {
    run.on = false; run.phase = "done"; K.requestWake(false); ach("interval_1"); ivUI();
    DP.sound.fanfare(); DP.fx.confetti(140);
    ring("custom", { title: "WORKOUT DESTROYED", sub: pick("interval.done"), time: `${IV.rounds} ROUNDS`, loop: false });
  }
  $("#ivGo").addEventListener("click", e => {
    jolt(e.currentTarget);
    if (!run.on) { run.on = true; run.paused = 0; run.round = 0; ivPhase("prep"); K.requestWake(true); DP.sound.start(); }
    else if (run.paused) { run.end += Date.now() - run.paused; run.paused = 0; DP.sound.start(); }
    else { run.paused = Date.now(); DP.sound.stop(); $("#ivPhase").textContent = "PAUSED"; }
    ivUI();
  });
  $("#ivReset").addEventListener("click", e => { jolt(e.currentTarget); run.on = false; run.phase = "idle"; run.paused = 0; K.requestWake(false); ivUI(); DP.sound.click(); });
  $("#ivPresets").addEventListener("click", e => { const b = e.target.closest("button"); if (!b || run.on) return; [IV.work, IV.rest, IV.rounds] = b.dataset.p.split(",").map(Number); saveIV(); ivUI(); DP.sound.tick(); });
  $$("[data-iv]").forEach(b => K.repeatBtn(b, () => {
    if (run.on) return;
    const k = b.dataset.iv.slice(0, -1), up = b.dataset.iv.endsWith("+"), lim = { work: [5, 600], rest: [0, 300], rounds: [1, 50] }[k], st = k === "rounds" ? 1 : 5;
    IV[k] = Math.max(lim[0], Math.min(lim[1], IV[k] + (up ? st : -st))); saveIV(); ivUI(); DP.sound.tick();
  }));
  onEnter("scr-interval", ivUI);
  onFrame("*", () => { if (run.on) ivTick(); if (FO.running && Date.now() >= FO.end) focusDone(); cdCheck(); });

  // ================= COUNTDOWNS =================
  let cds = LS.get("cds", []);
  const saveCds = () => LS.set("cds", cds);
  const toLocalInput = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  $("#cdWhen").value = toLocalInput(new Date(Date.now() + 86400000));
  function addCd(name, at) {
    if (!name) name = "Something awesome";
    if (!(at > Date.now())) { toast("That's in the past. Time travel is a Void thing."); return; }
    cds.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), name, at, done: false }); saveCds(); renderCds(true); ach("countdown");
    DP.sound.coin(); say(pick("countdown")); K.renderChips(true);
  }
  $("#cdAdd").addEventListener("click", e => { jolt(e.currentTarget); const v = $("#cdWhen").value; addCd($("#cdName").value.trim(), v ? new Date(v).getTime() : 0); $("#cdName").value = ""; });
  $("#cdQuick").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    const n = new Date(); let d, name;
    if (b.dataset.q === "ny") { d = new Date(n.getFullYear() + 1, 0, 1, 0, 0); name = "New Year " + (n.getFullYear() + 1); }
    if (b.dataset.q === "fri") { d = new Date(n); d.setHours(17, 0, 0, 0); d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7)); if (d <= n) d.setDate(d.getDate() + 7); name = "Weekend"; }
    if (b.dataset.q === "tom") { d = new Date(n); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); name = "Tomorrow 9 AM"; }
    if (b.dataset.q === "hour") { d = new Date(n); d.setHours(d.getHours() + 1, 0, 0, 0); name = "Top of the hour"; }
    addCd(name, d.getTime());
  });
  function cdParts(ms) { ms = Math.max(0, ms); const s = Math.floor(ms / 1000); return [Math.floor(s / 86400), Math.floor(s / 3600) % 24, Math.floor(s / 60) % 60, s % 60]; }
  let cdLast = 0;
  function renderCds(force) {
    const ul = $("#cdList"), now = Date.now();
    if (force) {
      if (!cds.length) { ul.innerHTML = `<li class="empty">No countdowns. Add one: birthday, vacation, taco night, the heat death of the universe...</li>`; return; }
      cds.sort((a, b) => a.at - b.at);
      ul.innerHTML = cds.map(c => `<li data-id="${c.id}" class="${c.done ? "done" : ""}"><div class="cd-top"><b>${esc(c.name)}</b><span>${new Date(c.at).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span><button class="del" aria-label="Delete">&times;</button></div>
        <div class="cd-cards">${["DAYS", "HRS", "MIN", "SEC"].map(l => `<div><b>--</b><i>${l}</i></div>`).join("")}</div></li>`).join("");
    }
    if (!force && now - cdLast < 250) return; cdLast = now;
    $$("#cdList li[data-id]").forEach(li => {
      const c = cds.find(x => x.id === li.dataset.id); if (!c) return;
      const p = cdParts(c.at - now);
      li.querySelectorAll(".cd-cards b").forEach((b, i) => { const t = c.at <= now ? "0" : (i ? pad(p[i]) : String(p[i])); if (b.textContent !== t) { b.textContent = t; b.parentNode.classList.remove("flip"); void b.offsetWidth; if (!force) b.parentNode.classList.add("flip"); } });
    });
  }
  $("#cdList").addEventListener("click", e => { const b = e.target.closest(".del"); if (!b) return; const id = b.closest("li").dataset.id; cds = cds.filter(c => c.id !== id); saveCds(); renderCds(true); DP.sound.slash(); K.renderChips(true); });
  function cdCheck() {
    const now = Date.now();
    for (const c of cds) if (!c.done && c.at <= now) {
      c.done = true; saveCds(); if (K.current === "scr-countdown") renderCds(true);
      ring("custom", { title: "IT'S HAPPENING!", sub: `\u201C${c.name}\u201D is NOW. ` + pick("countdown"), time: "00:00:00" }); DP.fx.confetti(200); break;
    }
  }
  DP.cx.nextCountdown = () => { const now = Date.now(), c = cds.filter(x => x.at > now).sort((a, b) => a.at - b.at)[0]; if (!c) return null; const p = cdParts(c.at - now); return { name: c.name, txt: p[0] ? `${p[0]}d ${p[1]}h` : `${pad(p[1])}:${pad(p[2])}` }; };
  DP.cx.focus = () => FO.running ? { txt: mmss(fRem()), phase: PH[FO.phase][0] } : null;
  onEnter("scr-countdown", () => renderCds(true));
  onFrame("scr-countdown", () => renderCds(false));

  // ================= HOROSCOPE =================
  const H = DP.HORO;
  let sign = LS.get("sign", -1);
  $("#signGrid").innerHTML = H.signs.map(([n, g], i) => `<button data-i="${i}"><i>${g}</i><span>${n}</span></button>`).join("");
  function seeded(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function reading(i) {
    const d = new Date(), r = seeded(d.getFullYear() * 1000 + (d.getMonth() + 1) * 40 + d.getDate() * 13 + i * 7919);
    const p = a => a[Math.floor(r() * a.length)];
    return { open: p(H.open), main: p(H.main), love: p(H.love), work: p(H.work), warn: p(H.warn), weapon: p(H.weapon), lucky: 1 + Math.floor(r() * 99), stars: 1 + Math.floor(r() * 5), chimi: Math.floor(r() * 101) };
  }
  function renderHoro() {
    $$("#signGrid button").forEach(b => b.classList.toggle("on", +b.dataset.i === sign));
    const card = $("#horoCard");
    if (sign < 0) { card.innerHTML = `<p class="horo-empty">Pick your sign. I promise to be mean-ish.</p>`; $("#horoSpeak").hidden = true; return; }
    const R = reading(sign), [n, g] = H.signs[sign];
    card.innerHTML = `<div class="horo-head"><span class="horo-glyph">${g}</span><div><b>${n.toUpperCase()}</b><small>${new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}</small></div><span class="horo-stars">${"\u2605".repeat(R.stars)}${"\u2606".repeat(5 - R.stars)}</span></div>
      <p class="horo-open">${esc(R.open)}</p><p class="horo-main">${esc(R.main)}</p><p>${esc(R.love)}</p><p>${esc(R.work)}</p><p class="horo-warn">${esc(R.warn)}</p>
      <div class="horo-foot"><span>LUCKY # <b>${R.lucky}</b></span><span>WEAPON <b>${esc(R.weapon)}</b></span><span>CHIMI ODDS <b>${R.chimi}%</b></span></div>`;
    card.classList.remove("in"); void card.offsetWidth; card.classList.add("in");
    $("#horoSpeak").hidden = false; ach("horoscope");
  }
  $("#signGrid").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; sign = +b.dataset.i; LS.set("sign", sign); DP.sound.sparkle(); renderHoro(); });
  $("#horoSpeak").addEventListener("click", () => { if (sign < 0) return; const R = reading(sign); speak(`${H.signs[sign][0]}. ${R.open} ${R.main} ${R.love} ${R.work} ${R.warn} Lucky weapon: ${R.weapon}.`, true); if (!window.speechSynthesis) toast("No speech voice here, sorry."); });
  onEnter("scr-horo", renderHoro);

  // ================= MOOD METER =================
  const FACES = ["\uD83D\uDC80", "\uD83D\uDE24", "\uD83D\uDE10", "\uD83D\uDE0F", "\uD83E\uDD29"];
  $("#moodRow").innerHTML = DP.MOODS.map((m, i) => `<button data-m="${i}" style="--mc:${m.color}"><i>${FACES[i]}</i><span>${m.name}</span></button>`).join("");
  function renderMood() {
    const days = []; const now = new Date();
    for (let k = 6; k >= 0; k--) { const d = new Date(now); d.setDate(d.getDate() - k); const key = d.toDateString(); const ms = (stats.moods || []).filter(x => new Date(x.t).toDateString() === key); days.push({ d, v: ms.length ? ms.reduce((a, b) => a + b.m, 0) / ms.length : null }); }
    $("#moodChart").innerHTML = days.map(x => `<div class="mc-col"><div class="mc-bar" style="height:${x.v === null ? 4 : 14 + x.v * 20}%;background:${x.v === null ? "#333" : DP.MOODS[Math.round(x.v)].color}"></div><span>${x.d.toLocaleDateString([], { weekday: "narrow" })}</span></div>`).join("");
  }
  $("#moodRow").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    const i = +b.dataset.m, m = DP.MOODS[i];
    $$("#moodRow button").forEach(x => x.classList.toggle("on", x === b)); jolt(b);
    stats.moods = (stats.moods || []).concat([{ t: Date.now(), m: i }]).slice(-200); saveStats();
    if (stats.moods.length >= 3) ach("mood_3");
    const q = m.quips[Math.floor(Math.random() * m.quips.length)];
    const r = $("#moodReply"); r.textContent = q; r.style.setProperty("--mc", m.color); r.classList.remove("in"); void r.offsetWidth; r.classList.add("in");
    speak(q); DP.sound[i >= 3 ? "sparkle" : "heal"]();
    const [x, y] = K.centerOf(b); DP.fx.boom(x, y, 16, [m.color, "#ffffff", "#ffd54a"]);
    if (i === 4) DP.fx.confetti(90);
    renderMood();
  });
  onEnter("scr-mood", renderMood);

  // ================= SCREEN LIGHT =================
  const LL = $("#lightLayer"), fill = $("#lightFill"), ui = $("#lightUi");
  let lMode = "white", uiT = 0;
  function lightMode(m) {
    lMode = m; $$("#lightModes button").forEach(b => b.classList.toggle("on", b.dataset.m === m));
    fill.className = "light-fill m-" + m;
  }
  function showUi() { ui.classList.remove("hide"); clearTimeout(uiT); uiT = setTimeout(() => ui.classList.add("hide"), 3500); }
  function light(on) {
    LL.hidden = !on;
    if (on) { lightMode(lMode); showUi(); K.requestWake(true); ach("flashlight"); DP.sound.click(); }
    else { K.requestWake(false); }
  }
  $("#lightModes").addEventListener("click", e => { const b = e.target.closest("button"); if (b) { lightMode(b.dataset.m); DP.sound.tick(); showUi(); } e.stopPropagation(); });
  $("#lightLevel").addEventListener("input", e => { fill.style.opacity = e.target.value / 100; showUi(); });
  $("#lightClose").addEventListener("click", e => { e.stopPropagation(); light(false); });
  LL.addEventListener("click", showUi);
  DP.tools = { light, focus: FO, iv: run };
})();
