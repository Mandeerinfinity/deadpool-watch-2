/* Deadpool Watch 2 — watch face engine (registry) + the four original faces. Original SVG art generated in code. */
window.DP = window.DP || {};
(function () {
  const F = { list: [], els: {} };
  F.register = def => { F.list.push(def); return def; };
  const pol = (r, deg, c = 200) => { const a = (deg - 90) * Math.PI / 180; return [c + r * Math.cos(a), c + r * Math.sin(a)]; };

  // ---------- shared hand + dial builders ----------
  function katana(len) {
    const b0 = -20, tip = -len;
    const blade = `M -3.6 ${b0} L -3.6 ${tip + 22} Q -3 ${tip + 6} 3.2 ${tip} Q 4.8 ${tip + 14} 4.4 ${tip + 22} L 4.4 ${b0} Z`;
    let wraps = "";
    for (let y = -11; y < 21; y += 6.5) wraps += `M0 ${y} L3.4 ${y + 3.25} L0 ${y + 6.5} L-3.4 ${y + 3.25} Z `;
    return `<path d="${blade}" fill="url(#bladeGrad)" stroke="#23262b" stroke-width=".7"/>
      <path d="M 3.1 ${b0 - 2} L 3.1 ${tip + 22} Q 3.3 ${tip + 10} 2.7 ${tip + 3}" stroke="#fff" stroke-width="1" fill="none" opacity=".9"/>
      <path d="M -.6 ${b0 - 4} Q .6 ${(b0 + tip) / 2} -.4 ${tip + 26}" stroke="#7d8591" stroke-width=".8" fill="none" opacity=".75"/>
      <rect x="-4.8" y="${b0 - 1}" width="9.6" height="5" rx="1" fill="#d9a83a"/>
      <ellipse cx="0" cy="-14" rx="11.5" ry="3.8" fill="#141414" stroke="#d9a83a" stroke-width="1.3"/>
      <rect x="-4.3" y="-12" width="8.6" height="38" rx="2.4" fill="#0d0d0d"/>
      <path d="${wraps}" class="wrap"/>
      <rect x="-4.8" y="25" width="9.6" height="4.5" rx="1.6" fill="#d9a83a"/>`;
  }
  function claws(len) {
    let s = "";
    [-8, 0, 8].forEach((x, i) => {
      const l = len - (i === 1 ? 0 : 12);
      s += `<path d="M ${x - 2.5} -6 L ${x - 2.3} ${-l + 16} Q ${x - .5} ${-l + 2} ${x + .4} ${-l} L ${x + 2.5} ${-l + 16} L ${x + 2.5} -6 Z" fill="url(#clawGrad)" stroke="#34404e" stroke-width=".7"/>
        <path d="M ${x + 1.1} -8 L ${x + 1.1} ${-l + 15}" stroke="#fff" stroke-width=".8" opacity=".85"/>`;
    });
    return `${s}<rect x="-14" y="-10" width="28" height="15" rx="6" fill="#ffc814" stroke="#111" stroke-width="1.6"/>
      <rect x="-14" y="2" width="28" height="12" rx="5" fill="#1f5fd6" stroke="#111" stroke-width="1.6"/>`;
  }
  function baton(len, w = 7) {
    return `<path d="M ${-w / 2} 18 L ${-w / 2 + 1} ${-len + 8} L 0 ${-len} L ${w / 2 - 1} ${-len + 8} L ${w / 2} 18 Z" fill="url(#bladeGrad)" stroke="#111" stroke-width="1"/>
      <path d="M -1.6 -14 L -1.2 ${-len + 12} L 1.2 ${-len + 12} L 1.6 -14 Z" fill="#eaffd9" opacity=".95"/>`;
  }
  function chimiHand(len) {
    return `<rect x="-2" y="${-(len - 44)}" width="4" height="${len - 30}" fill="#2a1606"/>
      <g transform="translate(0 ${-len + 22})"><rect x="-9" y="-22" width="18" height="44" rx="9" fill="#e0a650" stroke="#3a1d06" stroke-width="2.2"/>
      <path d="M-9 -8 Q0 -4 9 -8 M-9 6 Q0 10 9 6" stroke="#8a4a12" stroke-width="2" fill="none"/><path d="M-4 -14 L-4 12" stroke="#fff" stroke-width="1.5" opacity=".35"/></g>
      <rect x="-3" y="-8" width="6" height="26" rx="3" fill="#2a1606"/>`;
  }
  const HANDS = { katana, claws, baton, chimi: chimiHand };
  function secHand(color = "var(--accent)") {
    return `<line x1="0" y1="30" x2="0" y2="-172" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/>
      <circle cx="0" cy="-150" r="4.2" style="fill:${color}" stroke="#fff" stroke-width="1.4"/>
      <rect x="-3" y="14" width="6" height="18" rx="3" style="fill:${color}"/>
      <circle r="5.2" fill="#fff"/>`;
  }
  const handPair = (id, inner) => `<g class="hand-shadow" transform="translate(202.5 205)"><g data-hand="${id}">${inner}</g></g>`;
  const hand = (id, inner) => `<g transform="translate(200 200)"><g data-hand="${id}">${inner}</g></g>`;
  const hands3 = (h, m, s) => handPair("h", h) + handPair("m", m) + handPair("s", s) + hand("h", h) + hand("m", m) + hand("s", s);
  function ticks(r1, r2, rh1, rh2, skip = []) {
    let s = "";
    for (let i = 0; i < 60; i++) {
      const hour = i % 5 === 0;
      if (hour && skip.includes(i / 5)) continue;
      const [x1, y1] = pol(hour ? rh1 : r1, i * 6), [x2, y2] = pol(hour ? rh2 : r2, i * 6);
      s += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" class="${hour ? (i === 0 ? "tk-12" : "tk-h") : "tk-m"}"/>`;
    }
    return s;
  }
  const cap = (stroke = "var(--accent)", dot = "#d9a83a") => `<circle cx="200" cy="200" r="10" fill="#111" style="stroke:${stroke}" stroke-width="3"/><circle cx="200" cy="200" r="3.4" fill="${dot}"/>`;
  F.util = { pol, katana, claws, baton, chimiHand, HANDS, secHand, handPair, hand, hands3, ticks, cap };

  const DAYS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
  const MONS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  F.DAYS = DAYS; F.MONS = MONS;
  const last = {};
  F.setText = function (el, key, v) { if (el && last[key] !== v) { last[key] = v; el.textContent = v; } };
  const setText = F.setText;
  const rot = (list, deg) => { const t = `rotate(${deg.toFixed(2)})`; for (const el of list) el.setAttribute("transform", t); };
  F.rot = rot;
  const look = { x: 0, y: 0, tx: 0, ty: 0 };
  F.look = look;
  F.lookAt = (nx, ny) => { look.tx = Math.max(-1, Math.min(1, nx)); look.ty = Math.max(-1, Math.min(1, ny)); };
  const eyeT = E => E.eyes && E.eyes.setAttribute("transform", `translate(${(look.x * 7).toFixed(2)} ${(look.y * 5).toFixed(2)})`);
  F.eyeT = eyeT;

  // ================= FACE: CLASSIC MASK =================
  F.register({
    id: "mask", name: "CLASSIC MASK", analog: true,
    make() {
      const hs = (DP.settings && DP.settings.hands) || "katana", H = HANDS[hs] || katana;
      const c = DP.settings || {};
      return `<svg viewBox="0 0 400 400" class="face-svg">
      <defs><clipPath id="clipMask"><circle cx="200" cy="200" r="150"/></clipPath>
        <path id="arcTop" d="M 12.5 200 A 187.5 187.5 0 0 1 387.5 200"/>
        <path id="arcBot" d="M 5.5 200 A 194.5 194.5 0 0 0 394.5 200"/></defs>
      <circle cx="200" cy="200" r="199" fill="url(#bezelGrad)"/>
      <circle cx="200" cy="200" r="184" fill="#0b0b0d" stroke="#000" stroke-width="3"/>
      <circle cx="200" cy="200" r="184" fill="url(#halftone)"/>
      <text class="bezel-txt"><textPath href="#arcTop" startOffset="50%" text-anchor="middle">&#9733; MAXIMUM EFFORT &#9733; NOW WITH 200% MORE EFFORT &#9733;</textPath></text>
      <text class="bezel-txt"><textPath href="#arcBot" startOffset="50%" text-anchor="middle">PROPERTY OF NICK &#8226; MARK II &#8226; STILL DO NOT FEED AFTER MIDNIGHT</textPath></text>
      <g class="ticks">${ticks(173, 181, 158, 181, [3, 9])}</g>
      <g class="cmp-win" transform="translate(367 200)"><rect x="-17" y="-12" width="34" height="24" rx="4" fill="#f2f2f2" stroke="#000" stroke-width="2"/><text y="5" class="cw-txt dark" data-cmp="${c.cmpR || "date"}">27</text></g>
      <g class="cmp-win" transform="translate(33 200)"><rect x="-17" y="-12" width="34" height="24" rx="4" fill="#111" style="stroke:var(--accent)" stroke-width="1.5"/><text y="4.5" class="cw-txt" data-cmp="${c.cmpL || "day"}">SUN</text></g>
      <g class="mask-g">
        <circle cx="200" cy="200" r="154" fill="#000"/>
        <circle cx="200" cy="200" r="150" fill="url(#maskGrad)"/>
        <circle cx="200" cy="200" r="150" fill="url(#halftoneRed)" opacity=".5"/>
        <g clip-path="url(#clipMask)">
          <path d="M200 50 V350" stroke="#000" stroke-width="3" opacity=".35"/>
          <path d="M204 50 V350" stroke="#fff" stroke-width="1" opacity=".18"/>
          <path d="M193 205 C182 160 124 128 44 138 L36 262 C96 270 170 256 193 232 Z" fill="#0a0a0b"/>
          <path d="M207 205 C218 160 276 128 356 138 L364 262 C304 270 230 256 207 232 Z" fill="#0a0a0b"/>
          <g class="eyes">
            <g class="eye"><path d="M70 184 C104 164 158 180 182 216 C142 232 96 222 70 184 Z" fill="url(#eyeGrad)"/></g>
            <g class="eye"><path d="M330 184 C296 164 242 180 218 216 C258 232 304 222 330 184 Z" fill="url(#eyeGrad)"/></g>
          </g>
        </g>
        <path d="M78 118 C112 70 170 56 200 56 C250 56 296 78 322 116 C282 96 240 90 200 90 C156 90 114 98 78 118 Z" fill="#fff" opacity=".22"/>
        <circle cx="200" cy="200" r="150" fill="none" stroke="#000" stroke-width="4"/>
      </g>
      <g transform="translate(200 290)">
        <rect x="-56" y="-17" width="112" height="34" rx="17" fill="#0b0b0c" stroke="#000" stroke-width="2"/>
        <rect x="-53" y="-14" width="106" height="28" rx="14" fill="none" style="stroke:var(--accent)" stroke-width="1.5" opacity=".8"/>
        <text y="7" class="dig-txt" data-dig>10:42</text>
      </g>
      ${hands3(H(98), H(146), secHand())}
      ${cap()}
    </svg>`;
    },
    render(E, c) { setText(E.dig, "mdig", c.t.full); eyeT(E); }
  });

  // ================= FACE: MAXIMUM EFFORT =================
  const FXW = ["BLAM!", "KAPOW!", "SNIKT?", "THWIP!", "BONK!", "ZOINK!", "SPLAT!", "WHAM!", "CHIMI!", "BOOM!", "YEET!", "SHWING!"];
  F.register({
    id: "effort", name: "MAXIMUM EFFORT",
    make() {
      let seg = "";
      for (let i = 0; i < 60; i++) {
        const [x1, y1] = pol(170, i * 6), [x2, y2] = pol(i % 5 ? 178 : 184, i * 6);
        seg += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
      }
      return `<div class="effort">
      <div class="effort-rays"></div><div class="effort-dots"></div>
      <svg class="effort-ring" viewBox="0 0 400 400">
        <circle cx="200" cy="200" r="194" class="er-track"/>
        <circle cx="200" cy="200" r="194" class="er-prog" data-ring transform="rotate(-90 200 200)"/>
        <g class="er-seg" data-seg>${seg}</g>
      </svg>
      <div class="effort-banner"><span>MAXIMUM EFFORT</span></div>
      <div class="effort-time"><span data-h>10</span><i>:</i><span data-m>42</span></div>
      <div class="effort-row"><span class="effort-sec" data-s>07</span><span class="effort-ampm" data-ap>PM</span></div>
      <div class="effort-date" data-date>SUNDAY &bull; SEP 27</div>
      <div class="effort-fx" data-fx>BLAM!</div>
    </div>`;
    },
    init(E, r) {
      const q = s => r.querySelector(s);
      Object.assign(E, { H: q("[data-h]"), M: q("[data-m]"), S: q("[data-s]"), AP: q("[data-ap]"), date: q("[data-date]"), ring: q("[data-ring]"), fx: q("[data-fx]"), segs: [...q("[data-seg]").children] });
      E.C = 2 * Math.PI * 194; E.ring.style.strokeDasharray = E.C;
    },
    tap(E) { F.pop(E); },
    render(E, c) {
      const { d, t, s } = c;
      setText(E.H, "eH", t.hh); setText(E.M, "eM", t.mm); setText(E.S, "eS", t.ss); setText(E.AP, "eAP", t.ampm || "HRS");
      setText(E.date, "eDate", `${DAYS[d.getDay()]} \u2022 ${MONS[d.getMonth()]} ${d.getDate()}`);
      E.ring.style.strokeDashoffset = (E.C * (1 - s / 60)).toFixed(1);
      const si = Math.floor(s);
      if (E.si !== si) { E.si = si; E.segs.forEach((el, i) => el.classList.toggle("on", i <= si)); if (si % 15 === 0) F.pop(E); }
    }
  });
  F.pop = function (E) {
    E = E || F.els.effort; const el = E.fx;
    el.textContent = FXW[Math.floor(Math.random() * FXW.length)];
    el.classList.remove("show"); void el.offsetWidth; el.classList.add("show");
  };

  // ================= FACE: BESTIES (D&W) =================
  F.register({
    id: "dw", name: "BESTIES 4 EVER", analog: true,
    make() {
      const letters = "BESTIES4EVER".split(""), cols = ["#d1121c", "#ffc814", "#1f5fd6", "#f4f4f4"];
      let beads = "";
      letters.forEach((l, i) => {
        const [x, y] = pol(184, i * 30), c = cols[i % 4];
        beads += `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><circle r="13" fill="${c}" stroke="#000" stroke-width="2"/><circle r="13" fill="url(#halftone)"/><ellipse cx="-4" cy="-5" rx="4" ry="2.5" fill="#fff" opacity=".55"/><text y="5.5" class="bead-txt" fill="${c === "#f4f4f4" || c === "#ffc814" ? "#111" : "#fff"}">${l}</text></g>`;
        const [sx, sy] = pol(184, i * 30 + 15);
        beads += `<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="4" fill="${cols[(i + 2) % 4]}" stroke="#000" stroke-width="1.2"/>`;
      });
      return `<svg viewBox="0 0 400 400" class="face-svg">
      <defs><clipPath id="clipDw"><circle cx="200" cy="200" r="166"/></clipPath></defs>
      <circle cx="200" cy="200" r="199" fill="#121214"/>
      <circle cx="200" cy="200" r="184" fill="none" stroke="#d8d2c4" stroke-width="2.5" stroke-dasharray="2 3"/>
      <circle cx="200" cy="200" r="170" fill="#000"/>
      <g clip-path="url(#clipDw)">
        <rect width="400" height="400" fill="url(#redGrad)"/>
        <path d="M200 20 L214 78 L190 128 L216 186 L188 246 L212 306 L194 390 L400 390 L400 20 Z" fill="url(#yellowGrad)"/>
        <path d="M212 306 L194 390 L400 390 L400 290 C330 320 260 318 212 306 Z" fill="#1f5fd6"/>
        <path d="M0 300 C60 330 130 330 190 300 L190 400 L0 400 Z" fill="#111" opacity=".55"/>
        <rect width="400" height="400" fill="url(#halftoneRed)" opacity=".45"/>
        <path d="M200 20 L214 78 L190 128 L216 186 L188 246 L212 306 L194 390" fill="none" stroke="#000" stroke-width="5" stroke-linejoin="round"/>
        <path d="M186 188 C174 150 120 130 44 142 L38 222 C92 230 160 222 186 206 Z" fill="#0a0a0b"/>
        <path d="M214 196 C230 154 282 140 330 150 L372 64 L356 176 C350 206 318 222 280 222 C246 222 224 212 214 196 Z" fill="#0a0a0b"/>
        <g class="eyes">
          <g class="eye"><path d="M62 170 C94 152 148 162 172 192 C136 206 90 200 62 170 Z" fill="url(#eyeGrad)"/></g>
          <g class="eye"><path d="M232 190 C258 168 300 166 336 172 C318 198 272 208 232 190 Z" fill="url(#eyeGrad)"/></g>
        </g>
        <g class="ticks dw-ticks">${ticks(158, 164, 146, 164)}</g>
      </g>
      <circle cx="200" cy="200" r="168" fill="none" stroke="#000" stroke-width="4"/>
      ${beads}
      <g transform="translate(200 296)"><rect x="-50" y="-15" width="100" height="30" rx="15" fill="#0b0b0c" stroke="#ffc814" stroke-width="2"/><text y="6.5" class="dig-txt small" data-dig>10:42</text></g>
      ${hands3(katana(92), claws(140), secHand("#1f5fd6"))}
      ${cap("#ffc814", "#d1121c")}
    </svg>`;
    },
    render(E, c) { setText(E.dig, "dwdig", c.t.full); eyeT(E); }
  });

  // ================= FACE: THE VOID =================
  F.register({
    id: "void", name: "THE VOID",
    make() {
      return `<div class="void">
      <div class="void-hdr">THE VOID <b>//</b> TIMELINE MONITOR</div>
      <div class="void-time"><span data-t>10:42</span><small data-s>:07</small></div>
      <div class="void-ampm" data-ap>PM &middot; SUNDAY</div>
      <svg class="void-line" viewBox="0 0 300 80" preserveAspectRatio="none"><path data-br class="vb"/><path data-p class="vp"/></svg>
      <div class="void-blocks" data-blocks>${"<i></i>".repeat(30)}</div>
      <div class="void-meta"><span>BRANCH: NICK-616</span><span data-date>27.09.2026</span></div>
      <div class="void-status" data-status>NEXUS EVENTS: 0 &middot; ALL GOOD-ISH</div>
      <div class="void-scan"></div></div>`;
    },
    init(E, r) {
      const q = s => r.querySelector(s);
      Object.assign(E, { time: q("[data-t]"), sec: q("[data-s]"), ampm: q("[data-ap]"), path: q("[data-p]"), br: q("[data-br]"), blocks: [...q("[data-blocks]").children], date: q("[data-date]"), status: q("[data-status]"), branches: [], nexus: 0 });
    },
    tap(E) {
      E.nexus++;
      for (let k = 0; k < 3; k++) E.branches.push({ x: 60 + Math.random() * 180, born: performance.now(), dir: Math.random() < .5 ? -1 : 1, len: 40 + Math.random() * 60 });
      E.status.textContent = `NEXUS EVENT DETECTED! #${E.nexus}`; E.status.classList.add("alert");
      E.root.classList.add("glitch"); setTimeout(() => E.root.classList.remove("glitch"), 600);
      setTimeout(() => { E.status.classList.remove("alert"); E.status.textContent = `NEXUS EVENTS: ${E.nexus} \u00b7 PRUNING... JK`; }, 2600);
    },
    render(E, c) {
      const { d, t, s } = c;
      setText(E.time, "vT", `${t.hh}:${t.mm}`); setText(E.sec, "vS", `:${t.ss}`);
      setText(E.ampm, "vAP", `${t.ampm ? t.ampm + " \u00b7 " : ""}${DAYS[d.getDay()]}`);
      setText(E.date, "vD", `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`);
      const bi = Math.floor(s / 2);
      if (E.bi !== bi) { E.bi = bi; E.blocks.forEach((el, i) => el.classList.toggle("on", i <= bi)); }
      const now = c.now / 1000; let p = "";
      for (let x = 0; x <= 300; x += 6) { const y = 40 + Math.sin(x * 0.045 + now * 2.2) * 5 + Math.sin(x * 0.13 - now * 3.1) * 2; p += (x ? "L" : "M") + x + " " + y.toFixed(1); }
      E.path.setAttribute("d", p);
      let b = "";
      for (let i = E.branches.length - 1; i >= 0; i--) {
        const br = E.branches[i], age = (c.now - br.born) / 1000;
        if (age > 6) { E.branches.splice(i, 1); continue; }
        const g = Math.min(1, age * 1.5), y0 = 40 + Math.sin(br.x * 0.045 + now * 2.2) * 5, x1 = br.x + br.len * g, y1 = y0 + br.dir * 30 * g;
        b += `M${br.x} ${y0.toFixed(1)} Q${(br.x + x1) / 2} ${y0.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)} `;
      }
      E.br.setAttribute("d", b || "M0 0");
    }
  });

  // ---------- engine ----------
  F.build = function (track) {
    track.innerHTML = F.list.map(f => `<div class="face face-${f.id}" data-face="${f.id}"><div class="face-inner">${f.make()}</div></div>`).join("");
    F.list.forEach((f, i) => F.initFace(f, track.children[i]));
  };
  F.initFace = function (f, root) {
    const E = F.els[f.id] = { root, h: root.querySelectorAll('[data-hand="h"]'), m: root.querySelectorAll('[data-hand="m"]'), s: root.querySelectorAll('[data-hand="s"]'), dig: root.querySelector("[data-dig]"), eyes: root.querySelector(".eyes"), cmps: [...root.querySelectorAll("[data-cmp]")] };
    if (f.init) f.init(E, root);
  };
  F.rebuild = function (id) {
    const f = F.list.find(x => x.id === id), E = F.els[id]; if (!f || !E) return;
    const root = E.root; root.querySelector(".face-inner").innerHTML = f.make();
    Object.keys(last).forEach(k => delete last[k]);
    F.initFace(f, root);
  };
  F.render = function (idx, d, fmt, showSec, now) {
    const f = F.list[idx], E = F.els[f.id]; if (!E) return;
    const ms = d.getMilliseconds(), s = d.getSeconds() + ms / 1000, m = d.getMinutes() + s / 60, h = (d.getHours() % 12) + m / 60;
    const c = { d, s, m, h, t: fmt(d, showSec), now: now || performance.now(), sec: DP.settings && DP.settings.tickSec ? Math.floor(s) : s };
    if (idx === F.renderIdx) { look.x += (look.tx - look.x) * 0.12; look.y += (look.ty - look.y) * 0.12; }
    if (E.h.length) { rot(E.h, h * 30); rot(E.m, m * 6); rot(E.s, c.sec * 6); }
    if (E.cmps.length && DP.cmp) for (const el of E.cmps) setText(el, f.id + el.dataset.cmp + E.cmps.indexOf(el), DP.cmp.short(el.dataset.cmp, d));
    f.render && f.render(E, c);
  };
  F.tap = function (idx, x, y) { const f = F.list[idx]; if (f.tap) return f.tap(F.els[f.id], x, y); };
  F.eyes = function (kind) {
    const all = document.querySelectorAll("#facesTrack .eyes");
    all.forEach(el => { el.classList.remove("blink", "squint", "wide"); void el.getBoundingClientRect(); el.classList.add(kind); });
    clearTimeout(F._et);
    F._et = setTimeout(() => all.forEach(el => el.classList.remove(kind)), kind === "blink" ? 220 : 900);
  };
  DP.faces = F;
})();
