/* Deadpool Watch 2 — nine NEW faces. All original SVG/CSS art. */
(function () {
  const F = DP.faces, U = F.util, { pol, ticks, hands3, secHand, cap, katana } = U;
  const setText = F.setText;
  const TAU = Math.PI * 2;

  // gear path generator (evenodd spokes)
  function gear(r, teeth, opt = {}) {
    const rr = r - (opt.depth || Math.max(2.5, r * 0.09)), w = TAU / teeth;
    let d = "";
    for (let i = 0; i < teeth; i++) {
      const a = i * w, P = (rad, ang) => `${(rad * Math.cos(ang)).toFixed(2)} ${(rad * Math.sin(ang)).toFixed(2)}`;
      d += (i ? "L" : "M") + P(rr, a) + " L" + P(r, a + w * .2) + " L" + P(r, a + w * .45) + " L" + P(rr, a + w * .65) + " ";
    }
    d += "Z ";
    const ri = rr * (opt.rim || 0.78), hub = r * 0.2, sp = opt.spokes || 5;
    if (!opt.solid) {
      for (let k = 0; k < sp; k++) {
        const a0 = k * TAU / sp + 0.18, a1 = (k + 1) * TAU / sp - 0.18;
        const p = (rad, ang) => `${(rad * Math.cos(ang)).toFixed(2)} ${(rad * Math.sin(ang)).toFixed(2)}`;
        const ai0 = k * TAU / sp + 0.5, ai1 = (k + 1) * TAU / sp - 0.5;
        d += `M${p(ri, a0)} A${ri} ${ri} 0 0 1 ${p(ri, a1)} L${p(hub * 1.3, ai1)} A${hub * 1.3} ${hub * 1.3} 0 0 0 ${p(hub * 1.3, ai0)} Z `;
      }
    }
    return `<path d="${d}" fill-rule="evenodd" fill="${opt.fill || "url(#goldGrad)"}" stroke="${opt.stroke || "#5a4210"}" stroke-width=".8"/>`;
  }
  const jewel = (x, y, r = 4) => `<circle cx="${x}" cy="${y}" r="${r + 2}" fill="#c9a24a"/><circle cx="${x}" cy="${y}" r="${r}" fill="url(#rubyGrad)"/><circle cx="${x - r * .35}" cy="${y - r * .35}" r="${r * .3}" fill="#fff" opacity=".8"/>`;
  const screw = (x, y, a = 20) => `<g transform="translate(${x} ${y}) rotate(${a})"><circle r="5.5" fill="url(#blueScrew)" stroke="#0a1840" stroke-width=".8"/><rect x="-5" y="-.9" width="10" height="1.8" fill="#0a1030"/></g>`;
  function heart(x, y, s, fill, extra = "") { return `<path transform="translate(${x} ${y}) scale(${s})" d="M0 4 C-6 -2 -10 -6 -6 -9 C-3 -11 -1 -9 0 -7 C1 -9 3 -11 6 -9 C10 -6 6 -2 0 4 Z" fill="${fill}" ${extra}/>`; }

  // ================= SKELETON / REGENERATOR MOVEMENT =================
  F.register({
    id: "skeleton", name: "REGENERATOR MOVEMENT", analog: true,
    make() {
      let hs = "";
      [["12", 0], ["3", 90], ["6", 180], ["9", 270]].forEach(([n, a]) => { const [x, y] = pol(168, a); hs += `<text x="${x}" y="${y + 6}" class="sk-num">${n}</text>`; });
      let spiral = "M0 0";
      for (let t = 0; t < 26; t += 0.25) { const r = 1.5 + t * 0.55; spiral += ` L${(r * Math.cos(t)).toFixed(2)} ${(r * Math.sin(t)).toFixed(2)}`; }
      const skHand = (len, w) => `<path d="M0 22 L${-w} -10 L${-w * .7} ${-len + 18} L0 ${-len} L${w * .7} ${-len + 18} L${w} -10 Z" fill="rgba(255,255,255,.08)" stroke="#e9edf2" stroke-width="2.2" stroke-linejoin="round"/><path d="M0 ${-len + 8} L${-w * .45} ${-len + 26} L${w * .45} ${-len + 26} Z" fill="#b8ffcf"/>`;
      return `<svg viewBox="0 0 400 400" class="face-svg">
      <defs><clipPath id="skClip"><circle cx="200" cy="200" r="160"/></clipPath></defs>
      <circle cx="200" cy="200" r="199" fill="url(#bezelGrad)"/>
      <circle cx="200" cy="200" r="186" fill="#0a0a0c" stroke="#000" stroke-width="3"/>
      <g clip-path="url(#skClip)">
        <rect width="400" height="400" fill="#26262c"/><rect width="400" height="400" fill="url(#perlage)"/>
        <g class="sk-g" data-g="barrel" transform="translate(142 138)">${gear(56, 64, { spokes: 6 })}<circle r="36" fill="url(#goldGrad)" stroke="#5a4210"/><path d="M-22 2 C-18 -12 -6 -16 -2 -6 L-2 8 C-8 12 -18 12 -22 2Z M22 2 C18 -12 6 -16 2 -6 L2 8 C8 12 18 12 22 2Z" fill="none" stroke="#6a4c12" stroke-width="1.6"/><circle r="30" fill="none" stroke="#6a4c12" stroke-width="1.2" stroke-dasharray="2 3"/></g>
        <g class="sk-g" data-g="third" transform="translate(268 150)">${gear(32, 40)}</g>
        <g class="sk-g" data-g="fourth" transform="translate(256 262)">${gear(28, 36)}<line x1="0" y1="4" x2="0" y2="-24" stroke="var(--accent-hi)" stroke-width="2"/></g>
        <g class="sk-g" data-g="escape" transform="translate(172 300)">${gear(17, 15, { depth: 5, spokes: 3, fill: "url(#steelGrad)", stroke: "#333" })}</g>
        <g data-g="pallet" transform="translate(140 304)"><path d="M-20 -3 L20 -3 L24 4 L-24 4 Z M-2 -3 L2 -3 L2 -22 L-2 -22Z" fill="url(#steelGrad)" stroke="#222" stroke-width=".8"/><rect x="-26" y="1" width="5" height="6" fill="#d1121c"/><rect x="21" y="1" width="5" height="6" fill="#d1121c"/></g>
        <g class="sk-g" data-g="center" transform="translate(200 200)">${gear(42, 50)}</g>
        <path d="M40 104 C90 70 220 64 262 92 C280 104 276 124 256 124 C210 118 120 120 64 144 C44 150 30 122 40 104Z" fill="url(#roseGrad)" stroke="#5a2e1c" stroke-width="1.5"/>
        <text x="150" y="104" class="sk-eng">REGENERATOR CAL. DP-2 &#8226; 31 JEWELS</text>
        <g data-g="balance" transform="translate(108 250)"><circle r="36" fill="none" stroke="url(#goldGrad)" stroke-width="6"/><path d="M-34 0 L34 0 M-17 -29 L17 29 M-17 29 L17 -29" stroke="#c9a24a" stroke-width="3"/>${[0, 60, 120, 180, 240, 300].map(a => `<circle cx="${36 * Math.cos(a * Math.PI / 180)}" cy="${36 * Math.sin(a * Math.PI / 180)}" r="3" fill="#e8d18a" stroke="#6a4c12" stroke-width=".6"/>`).join("")}</g>
        <g data-g="spring" transform="translate(108 250)"><path d="${spiral}" fill="none" stroke="#9ab4ff" stroke-width="1" opacity=".9"/></g>
        <path d="M60 300 C70 262 96 236 124 232 C140 234 150 250 146 264 C120 270 100 300 96 330 C80 336 58 324 60 300Z" fill="url(#roseGrad)" stroke="#5a2e1c" stroke-width="1.5" opacity=".95"/>
        <path d="M300 300 C330 270 350 230 344 200 C356 206 364 250 350 290 C340 320 310 336 290 326Z" fill="url(#roseGrad)" stroke="#5a2e1c" stroke-width="1.5"/>
        ${jewel(142, 138, 5)}${jewel(268, 150)}${jewel(256, 262)}${jewel(172, 300, 3.5)}${jewel(108, 250, 4)}${jewel(140, 304, 3)}
        ${screw(52, 118)}${screw(250, 108, 70)}${screw(84, 312, 120)}${screw(338, 232, 45)}${screw(305, 318, 10)}
        <circle cx="200" cy="200" r="160" fill="url(#sapphire)"/>
      </g>
      <circle cx="200" cy="200" r="186" fill="none" stroke="#000" stroke-width="2"/>
      <circle cx="200" cy="200" r="186" fill="rgba(12,12,16,.35)" mask="url(#ringMask)"/>
      <g class="ticks">${ticks(174, 184, 164, 184, [0, 3, 6, 9])}</g>${hs}
      ${hands3(skHand(100, 9), skHand(150, 7), secHand())}
      ${cap()}
    </svg>`;
    },
    init(E, r) { E.g = {}; r.querySelectorAll("[data-g]").forEach(el => { E.g[el.dataset.g] = { el, base: el.getAttribute("transform") }; }); },
    render(E, c) {
      const t = c.now / 1000, beat = Math.floor(t * 6), g = E.g;
      const set = (k, a) => g[k].el.setAttribute("transform", `${g[k].base} rotate(${a.toFixed(2)})`);
      set("barrel", t * 0.6); set("center", c.m * 6); set("third", -t * 9); set("fourth", Math.floor(c.s * 6) / 6 * 6);
      set("escape", -beat * 12); set("pallet", (beat % 2 ? 7 : -7));
      const bal = 210 * Math.sin(TAU * 3 * t); set("balance", bal);
      g.spring.el.setAttribute("transform", `${g.spring.base} rotate(${(bal * 0.25).toFixed(1)}) scale(${(1 + Math.sin(TAU * 3 * t) * 0.06).toFixed(3)})`);
    }
  });

  // ================= TACHY-CHRONO (linked to stopwatch) =================
  F.register({
    id: "chrono", name: "TACHY-CHRONO", analog: true,
    make() {
      let tach = "";
      [500, 400, 300, 250, 200, 175, 150, 125, 110, 100, 90, 80, 70, 65].forEach(v => { const a = 21600 / v; tach += `<text transform="rotate(${a.toFixed(1)} 200 200)" x="200" y="17" class="tach-txt">${v}</text>`; });
      for (let i = 0; i < 60; i++) { const a = i * 6 + 6; if (a > 330) break; const [x1, y1] = pol(178, a), [x2, y2] = pol(183, a); tach += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#999" stroke-width="1"/>`; }
      const sub = (cx, cy, n, lbl, key, color) => {
        let s = `<g transform="translate(${cx} ${cy})"><circle r="40" fill="#0c0c0e" stroke="#000" stroke-width="2"/><circle r="40" fill="url(#guilloche)"/><circle r="38" fill="none" style="stroke:${color}" stroke-width="1.5"/>`;
        for (let i = 0; i < n; i++) { const a = i * 360 / n * Math.PI / 180, l = i % (n / (n > 12 ? 6 : 4)) === 0 ? 8 : 4; s += `<line x1="${Math.sin(a) * 36}" y1="${-Math.cos(a) * 36}" x2="${Math.sin(a) * (36 - l)}" y2="${-Math.cos(a) * (36 - l)}" stroke="#ddd" stroke-width="${l > 4 ? 1.6 : .8}"/>`; }
        s += `<text y="16" class="sub-lbl">${lbl}</text><g data-sub="${key}"><line x1="0" y1="6" x2="0" y2="-33" style="stroke:${color}" stroke-width="2" stroke-linecap="round"/><circle r="3.5" fill="#fff"/></g></g>`;
        return s;
      };
      return `<svg viewBox="0 0 400 400" class="face-svg">
      <circle cx="200" cy="200" r="199" fill="#0b0b0c" stroke="#333" stroke-width="2"/>
      <text x="96" y="46" class="tach-lbl" transform="rotate(-36 200 200)">TACHYMETER</text>${tach}
      <circle cx="200" cy="200" r="174" fill="url(#carbon)" stroke="#000" stroke-width="3"/>
      <circle cx="200" cy="200" r="174" fill="url(#vignette)"/>
      ${Array.from({ length: 12 }, (_, i) => i === 3 || i === 6 || i === 9 ? "" : `<g transform="rotate(${i * 30} 200 200)"><rect x="195" y="30" width="10" height="${i === 0 ? 28 : 22}" rx="2" fill="url(#bladeGrad)" stroke="#000"/><rect x="197.5" y="33" width="5" height="${i === 0 ? 22 : 16}" fill="#c8ffd8"/></g>`).join("")}
      <text x="200" y="104" class="chr-brand">DEADPOOL</text>
      <text x="200" y="118" class="chr-sub">TACHY-CHRONO &#8226; MAXIMUM EFFORT CERTIFIED</text>
      <g transform="translate(200 146)"><rect x="-38" y="-11" width="76" height="20" rx="4" fill="#050506" stroke="var(--accent)" style="stroke:var(--accent)"/><text y="4.5" class="chr-dig" data-chr>00:00.0</text></g>
      ${sub(122, 200, 60, "SEC", "sec", "#e9e9e9")}${sub(278, 200, 30, "MIN", "cmin", "var(--accent-hi)")}${sub(200, 278, 12, "HRS", "chr", "var(--accent-hi)")}
      <text x="200" y="352" class="chr-hint">TAP: START/STOP &#8226; TAP LOW: RESET</text>
      ${hands3(U.baton(104, 10), U.baton(152, 8), "")}
      <g transform="translate(200 200)"><g data-chrono><line x1="0" y1="34" x2="0" y2="-172" style="stroke:var(--accent-hi)" stroke-width="2"/><path d="M-3 -150 L0 -172 L3 -150Z" style="fill:var(--accent-hi)"/><circle cy="24" r="6" style="fill:var(--accent)"/></g></g>
      ${cap("var(--accent-hi)", "#fff")}
    </svg>`;
    },
    init(E, r) { E.sub = {}; r.querySelectorAll("[data-sub]").forEach(el => { E.sub[el.dataset.sub] = el; }); E.chrono = r.querySelector("[data-chrono]"); E.chr = r.querySelector("[data-chr]"); },
    tap(E, x, y) {
      const r = E.root.getBoundingClientRect(), ry = (y - r.top) / r.height;
      if (!DP.sw) return;
      if (ry > 0.62 && !DP.sw.running()) { DP.sw.reset(); return "chronoReset"; }
      DP.sw.toggle(); return DP.sw.running() ? "chronoStart" : "chronoStop";
    },
    render(E, c) {
      const e = DP.sw ? DP.sw.elapsed() : 0;
      E.sub.sec.setAttribute("transform", `rotate(${(c.s * 6).toFixed(1)})`);
      E.sub.cmin.setAttribute("transform", `rotate(${((e / 60000) % 30 * 12).toFixed(1)})`);
      E.sub.chr.setAttribute("transform", `rotate(${((e / 3600000) % 12 * 30).toFixed(1)})`);
      E.chrono.setAttribute("transform", `rotate(${((e / 1000) % 60 * 6).toFixed(2)})`);
      const ds = Math.floor(e / 100), txt = `${String(Math.floor(ds / 600) % 100).padStart(2, "0")}:${String(Math.floor(ds / 10) % 60).padStart(2, "0")}.${ds % 10}`;
      setText(E.chr, "chrdig", txt);
    }
  });

  // ================= CABLE-STYLE TECH HUD =================
  const TARGETS = ["SMARTASS MERC", "CHIMICHANGA", "NICK (FRIENDLY)", "UNICORN?!", "BAD GUY #47", "YOUR EX", "FOURTH WALL", "SNACK DRAWER"];
  F.register({
    id: "cable", name: "TIME-JUMP HUD",
    make() {
      let tk = "";
      for (let i = 0; i < 60; i++) { const [x1, y1] = pol(i % 5 ? 176 : 170, i * 6), [x2, y2] = pol(182, i * 6); tk += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke-width="${i % 5 ? 1 : 2.4}"/>`; }
      return `<div class="cable"><div class="cb-hex"></div><div class="cb-radar"></div>
      <svg class="cb-rings" viewBox="0 0 400 400"><g class="cb-spin1"><circle cx="200" cy="200" r="190" class="cb-r1"/></g><g class="cb-spin2"><circle cx="200" cy="200" r="160" class="cb-r2"/></g>
        <g class="cb-tk">${tk}</g><circle cx="200" cy="200" r="150" class="cb-prog" data-ring transform="rotate(-90 200 200)"/></svg>
      <div class="cb-eye"></div>
      <div class="cb-top">T-JUMP CHARGE <b data-charge>87%</b></div>
      <div class="cb-time"><span data-t>10:42</span><small data-s>07</small></div>
      <div class="cb-date" data-date>SUN 27 SEP 2026</div>
      <div class="cb-grid"><div><i>STEPS</i><b data-steps>0</b></div><div><i>HEAL</i><b data-heal>100%</b></div><div><i>TEMP</i><b data-temp>--</b></div></div>
      <div class="cb-target">TARGET LOCK: <b data-target>SMARTASS MERC</b></div><div class="cb-flash"></div></div>`;
    },
    init(E, r) {
      const q = s => r.querySelector(s);
      Object.assign(E, { t: q("[data-t]"), s: q("[data-s]"), date: q("[data-date]"), steps: q("[data-steps]"), heal: q("[data-heal]"), temp: q("[data-temp]"), charge: q("[data-charge]"), target: q("[data-target]"), ring: q("[data-ring]"), charged: 40 });
      E.C = TAU * 150; E.ring.style.strokeDasharray = E.C;
    },
    tap(E) { E.charged = 0; E.target.textContent = TARGETS[Math.floor(Math.random() * TARGETS.length)]; E.root.classList.remove("jump"); void E.root.offsetWidth; E.root.classList.add("jump"); return "cable"; },
    render(E, c) {
      const { d, t } = c;
      setText(E.t, "cbT", `${t.hh}:${t.mm}`); setText(E.s, "cbS", t.ss);
      setText(E.date, "cbD", `${F.DAYS[d.getDay()].slice(0, 3)} ${d.getDate()} ${F.MONS[d.getMonth()]} ${d.getFullYear()}`);
      E.ring.style.strokeDashoffset = (E.C * (1 - c.s / 60)).toFixed(1);
      E.charged = Math.min(100, E.charged + 0.02);
      setText(E.charge, "cbC", Math.floor(E.charged) + "%");
      if (DP.cmp) { setText(E.steps, "cbSt", DP.cmp.short("steps", d)); setText(E.heal, "cbH", DP.cmp.short("heal", d)); setText(E.temp, "cbTe", DP.cmp.short("weather", d)); }
    }
  });

  // ================= SACRED TIMELINE =================
  F.register({
    id: "sacred", name: "SACRED TIMELINE", analog: true,
    make() {
      const rom = ["XII", "I", "II", "III", "IIII", "V", "VI", "VII", "VIII", "IX", "X", "XI"];
      let nums = ""; rom.forEach((n, i) => { const [x, y] = pol(146, i * 30); nums += `<text x="${x.toFixed(1)}" y="${(y + 7).toFixed(1)}" class="st-num">${n}</text>`; });
      const decoH = `<path d="M0 18 L-4 0 L-7 -52 L0 -78 L7 -52 L4 0 Z" fill="#b8862b" stroke="#3a2410" stroke-width="1.4"/><circle cy="-52" r="6" fill="none" stroke="#3a2410" stroke-width="2"/>`;
      const decoM = `<path d="M0 20 L-3.5 0 L-5 -100 L0 -140 L5 -100 L3.5 0 Z" fill="#b8862b" stroke="#3a2410" stroke-width="1.4"/>`;
      const decoS = `<line y1="30" y2="-160" stroke="#1f6f6a" stroke-width="1.6"/><circle cy="-120" r="6" fill="none" stroke="#1f6f6a" stroke-width="2"/><circle r="4.5" fill="#1f6f6a"/>`;
      return `<svg viewBox="0 0 400 400" class="face-svg">
      <defs><clipPath id="stClip"><circle cx="200" cy="200" r="176"/></clipPath><path id="stArc" d="M 70 200 A 130 130 0 0 1 330 200"/><path id="stArcB" d="M 62 200 A 138 138 0 0 0 338 200"/></defs>
      <circle cx="200" cy="200" r="199" fill="#4a2e16"/><circle cx="200" cy="200" r="190" fill="none" stroke="#c9a24a" stroke-width="4"/>
      <circle cx="200" cy="200" r="178" fill="url(#creamGrad)" stroke="#2a1a0c" stroke-width="3"/>
      <g clip-path="url(#stClip)"><rect width="400" height="400" fill="url(#halftoneBrown)"/>
        <circle cx="200" cy="200" r="120" fill="none" stroke="#1f6f6a" stroke-width="10" opacity=".25"/>
        <path data-glow class="st-glow"/><path data-br class="st-br"/><path data-dead class="st-dead"/><path data-line class="st-line"/></g>
      <g class="st-ticks">${ticks(168, 176, 162, 176)}</g>${nums}
      <text class="st-arc"><textPath href="#stArc" startOffset="50%" text-anchor="middle">TEMPORAL OFFICE OF NICK</textPath></text>
      <text class="st-arc sm"><textPath href="#stArcB" startOffset="50%" text-anchor="middle">KEEPING TIME SINCE BEFORE TIME</textPath></text>
      <text x="200" y="300" class="st-count" data-count>BRANCHES PRUNED: 0</text>
      ${hands3(decoH, decoM, decoS)}
      <circle cx="200" cy="200" r="9" fill="#b8862b" stroke="#3a2410" stroke-width="2"/>
    </svg>`;
    },
    init(E, r) { const q = s => r.querySelector(s); Object.assign(E, { line: q("[data-line]"), glow: q("[data-glow]"), br: q("[data-br]"), dead: q("[data-dead]"), count: q("[data-count]"), branches: [], pruned: 0, next: 0 }); },
    tap(E) { for (let i = 0; i < 4; i++) E.branches.push(mkBranch(performance.now())); return "sacred"; },
    render(E, c) {
      const t = c.now / 1000, yAt = x => 232 + Math.sin(x * 0.02 + t * 1.3) * 10 + Math.sin(x * 0.051 - t * 0.7) * 4;
      let p = ""; for (let x = 20; x <= 380; x += 8) p += (x > 20 ? "L" : "M") + x + " " + yAt(x).toFixed(1);
      E.line.setAttribute("d", p); E.glow.setAttribute("d", p);
      if (c.now > E.next) { E.next = c.now + 2400 + Math.random() * 2600; E.branches.push(mkBranch(c.now)); }
      let b = "", dd = "";
      for (let i = E.branches.length - 1; i >= 0; i--) {
        const br = E.branches[i], age = (c.now - br.born) / 1000;
        if (age > 5) { E.branches.splice(i, 1); E.pruned++; setText(E.count, "stc", `BRANCHES PRUNED: ${E.pruned}`); continue; }
        const g = Math.min(1, age / 1.6), y0 = yAt(br.x), x1 = br.x + br.len * g, y1 = y0 + br.dir * br.h * g;
        const seg = `M${br.x} ${y0.toFixed(1)} C${br.x + 20} ${y0.toFixed(1)} ${(x1 - 20).toFixed(1)} ${y1.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)} `;
        if (age > 3.4) dd += seg; else b += seg;
      }
      E.br.setAttribute("d", b || "M0 0"); E.dead.setAttribute("d", dd || "M0 0");
    }
  });
  function mkBranch(now) { return { x: 60 + Math.random() * 220, len: 40 + Math.random() * 70, h: 25 + Math.random() * 45, dir: Math.random() < .5 ? -1 : 1, born: now }; }

  // ================= HEADPOOL =================
  F.register({
    id: "headpool", name: "HEADPOOL",
    make() {
      let dots = ""; for (let i = 0; i < 60; i++) { const [x, y] = pol(184, i * 6); dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${i % 5 ? 2.6 : 4.2}"/>`; }
      return `<svg viewBox="0 0 400 400" class="face-svg">
      <circle cx="200" cy="200" r="199" fill="#1a0a2a"/>
      <g class="hp-rays">${Array.from({ length: 18 }, (_, i) => `<path d="M200 200 L${pol(260, i * 20 - 5).join(" ")} L${pol(260, i * 20 + 5).join(" ")} Z"/>`).join("")}</g>
      <circle cx="200" cy="200" r="199" fill="url(#vignette)"/>
      <g class="hp-dots" data-dots>${dots}</g>
      <g data-bob transform="translate(200 300)"><g transform="translate(-200 -300)">
        <path d="M150 300 L160 318 L172 304 L186 322 L200 306 L214 322 L228 304 L240 318 L250 300 Z" fill="#7a0a10" stroke="#000" stroke-width="3" stroke-linejoin="round"/>
        <path d="M156 306 l6 -6 M176 310 l6 -6 M200 310 l6 -6 M222 310 l6 -6" stroke="#fff" stroke-width="2" opacity=".6"/>
        <ellipse cx="200" cy="190" rx="112" ry="122" fill="#000"/><ellipse cx="200" cy="190" rx="107" ry="117" fill="url(#maskGrad)"/>
        <path d="M200 74 V306" stroke="#000" stroke-width="2.5" opacity=".35"/>
        <path d="M194 196 C184 158 132 136 96 146 L94 222 C136 232 180 226 194 214 Z M206 196 C216 158 268 136 304 146 L306 222 C264 232 220 226 206 214 Z" fill="#0a0a0b"/>
        <g class="eyes"><g class="eye"><path d="M108 178 C132 162 170 170 186 202 C156 214 124 208 108 178Z" fill="url(#eyeGrad)"/></g><g class="eye"><path d="M292 178 C268 162 230 170 214 202 C244 214 276 208 292 178Z" fill="url(#eyeGrad)"/></g></g>
        <path d="M170 256 Q200 276 230 256 Q222 270 200 272 Q178 270 170 256Z" fill="#200"/><path d="M196 264 C196 290 212 298 220 286 C224 278 218 266 212 262Z" fill="#ff7aa2" stroke="#000" stroke-width="2.5"/>
        <g transform="translate(248 110) rotate(28)"><rect x="-20" y="-7" width="40" height="14" rx="5" fill="#f3d2a2" stroke="#000" stroke-width="2"/><circle cx="-6" cy="0" r="1.4"/><circle cx="6" cy="0" r="1.4"/><circle cx="0" cy="-3" r="1.4"/><circle cx="0" cy="3" r="1.4"/></g>
        <path d="M112 118 C140 84 190 72 220 76" stroke="#fff" stroke-width="10" fill="none" opacity=".2" stroke-linecap="round"/>
        <path d="M120 96 C150 56 250 56 280 96 Z" fill="#ffc814" stroke="#000" stroke-width="3"/><path d="M170 66 L166 96 M230 66 L234 96 M200 60 V96" stroke="#1f5fd6" stroke-width="6"/><path d="M120 96 C150 56 250 56 280 96" fill="none" stroke="#000" stroke-width="3"/>
        <rect x="197" y="42" width="6" height="18" fill="#333"/>
        <g transform="translate(200 42)"><g data-prop><ellipse cx="-30" cy="0" rx="30" ry="6" fill="#d1121c" stroke="#000" stroke-width="2"/><ellipse cx="30" cy="0" rx="30" ry="6" fill="#1f5fd6" stroke="#000" stroke-width="2"/></g><circle r="5" fill="#ffc814" stroke="#000" stroke-width="2"/></g>
      </g></g>
      <g transform="translate(200 356)"><rect x="-64" y="-26" width="128" height="44" fill="#fff" stroke="#000" stroke-width="3.5" transform="skewX(-8)"/><text y="11" class="hp-time" data-dig>10:42</text></g>
    </svg>`;
    },
    init(E, r) { E.bob = r.querySelector("[data-bob]"); E.prop = r.querySelector("[data-prop]"); E.dots = [...r.querySelector("[data-dots]").children]; E.th = 0; E.v = 0; },
    tap(E) { E.v += (Math.random() < .5 ? -1 : 1) * 3.2; return "headpool"; },
    render(E, c) {
      setText(E.dig, "hpdig", `${c.t.hh}:${c.t.mm}` + (c.t.ampm ? c.t.ampm[0].toLowerCase() : ""));
      const target = F.look.x * 14; E.v += (target - E.th) * 0.02 - E.v * 0.06; E.th += E.v;
      E.bob.setAttribute("transform", `translate(200 300) rotate(${E.th.toFixed(2)})`);
      E.prop.setAttribute("transform", `scale(${Math.cos(c.now / 40).toFixed(3)} 1)`);
      const si = Math.floor(c.s); if (E.si !== si) { E.si = si; E.dots.forEach((el, i) => el.classList.toggle("on", i <= si)); }
      F.eyeT(E);
    }
  });

  // ================= LADY DEADPOOL =================
  F.register({
    id: "lady", name: "LADY DEADPOOL", analog: true,
    make() {
      let hs = ""; for (let i = 0; i < 12; i++) { const [x, y] = pol(166, i * 30); hs += heart(x, y, i === 0 ? 1.7 : 1.05, i % 3 ? "#ffd7df" : "url(#roseGoldGrad)", `stroke="#5a1020" stroke-width=".6"`); }
      const leaf = (len, w) => `<path d="M0 18 C${-w} 0 ${-w} ${-len * .5} 0 ${-len} C${w} ${-len * .5} ${w} 0 0 18Z" fill="url(#roseGoldGrad)" stroke="#5a2e1c" stroke-width="1"/><path d="M0 10 L0 ${-len + 10}" stroke="#fff" stroke-width=".8" opacity=".7"/>`;
      const sec = `<line y1="28" y2="-168" stroke="#ff6b9a" stroke-width="1.5"/>${heart(0, -150, 1.2, "#ff6b9a", `stroke="#fff" stroke-width=".6"`)}${heart(0, 24, 1, "#ff6b9a")}<circle r="4.5" fill="#fff"/>`;
      return `<svg viewBox="0 0 400 400" class="face-svg">
      <defs><clipPath id="ladyClip"><circle cx="200" cy="200" r="124"/></clipPath></defs>
      <circle cx="200" cy="200" r="199" fill="url(#roseGoldGrad)"/><circle cx="200" cy="200" r="188" fill="none" stroke="#fff" stroke-width="1.5" opacity=".6"/>
      <circle cx="200" cy="200" r="182" fill="url(#ladyDial)" stroke="#3a0612" stroke-width="3"/><circle cx="200" cy="200" r="182" fill="url(#heartsPat)"/>
      <g class="ticks lady-ticks">${ticks(174, 180, 180, 180)}</g>${hs}
      <g class="lady-tail"><path d="M228 88 C270 40 340 50 344 110 C348 160 320 190 330 236 C300 210 314 160 300 128 C290 104 260 96 238 104 Z" fill="#f2cf63" stroke="#8a6414" stroke-width="2.5"/><path d="M250 90 C290 70 330 90 330 130 M262 100 C300 96 318 130 312 170" stroke="#c99a2e" stroke-width="2" fill="none"/><rect x="226" y="88" width="20" height="14" rx="4" fill="#d1121c" stroke="#000" stroke-width="2" transform="rotate(-30 236 95)"/></g>
      <circle cx="200" cy="200" r="128" fill="#000"/><circle cx="200" cy="200" r="124" fill="url(#redGrad)"/>
      <g clip-path="url(#ladyClip)"><path d="M200 76 V324" stroke="#000" stroke-width="2.5" opacity=".35"/>
        <path d="M194 206 C180 166 130 146 80 150 L60 120 L74 232 C120 240 176 232 194 220Z M206 206 C220 166 270 146 320 150 L340 120 L326 232 C280 240 224 232 206 220Z" fill="#0a0a0b"/>
        <g class="eyes"><g class="eye"><path d="M92 192 C118 174 160 180 180 210 C146 222 112 216 92 192Z" fill="url(#eyeGrad)"/><path d="M92 192 l-8 -6 M98 186 l-6 -8 M106 181 l-3 -9" stroke="#0a0a0b" stroke-width="3" stroke-linecap="round"/></g>
          <g class="eye"><path d="M308 192 C282 174 240 180 220 210 C254 222 288 216 308 192Z" fill="url(#eyeGrad)"/><path d="M308 192 l8 -6 M302 186 l6 -8 M294 181 l3 -9" stroke="#0a0a0b" stroke-width="3" stroke-linecap="round"/></g></g>
        <path d="M110 110 C140 84 180 78 206 80" stroke="#fff" stroke-width="9" fill="none" opacity=".22" stroke-linecap="round"/></g>
      <text x="200" y="296" class="lady-script">Lady</text>
      <g transform="translate(200 328)"><rect x="-44" y="-13" width="88" height="26" rx="13" fill="#2a0610" stroke="url(#roseGoldGrad)" stroke-width="2"/><text y="5.5" class="dig-txt lady-dig" data-dig>10:42</text></g>
      ${hands3(leaf(92, 11), leaf(142, 9), sec)}
      <circle cx="200" cy="200" r="9" fill="url(#roseGoldGrad)" stroke="#5a2e1c" stroke-width="2"/>
    </svg>`;
    },
    render(E, c) { setText(E.dig, "ladydig", c.t.full); F.eyeT(E); }
  });

  // ================= KIDPOOL =================
  function wobble(r, n, amp, seed) { let d = "", s = seed; const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; for (let i = 0; i <= n; i++) { const a = i / n * TAU, rr = r + (rnd() - .5) * amp; d += (i ? "L" : "M") + (200 + rr * Math.cos(a)).toFixed(1) + " " + (200 + rr * Math.sin(a)).toFixed(1); } return d + "Z"; }
  F.register({
    id: "kid", name: "KIDPOOL", analog: true,
    make() {
      const cols = ["#e8302a", "#ff8a1f", "#f5c518", "#2fb344", "#1f7ae0", "#8a3ffc"];
      let nums = ""; for (let i = 1; i <= 12; i++) { const [x, y] = pol(150, i * 30); nums += `<text x="${x.toFixed(1)}" y="${(y + 9).toFixed(1)}" class="kid-num" fill="${cols[i % 6]}" transform="rotate(${((i * 37) % 24) - 12} ${x.toFixed(1)} ${y.toFixed(1)})">${i}</text>`; }
      const crayon = (len, col) => `<path d="M-5 16 L-5 ${-len + 20} L0 ${-len} L5 ${-len + 20} L5 16Z" fill="${col}" stroke="#222" stroke-width="1.6" stroke-linejoin="round"/><rect x="-5.5" y="${-len * .55}" width="11" height="${len * .35}" fill="#fff" stroke="#222" stroke-width="1.2" opacity=".9"/><path d="M-5 ${-len * .45} L5 ${-len * .45} M-5 ${-len * .35} L5 ${-len * .35}" stroke="${col}" stroke-width="1.5"/>`;
      const pencil = `<path d="M-2.6 26 L-2.6 -150 L0 -166 L2.6 -150 L2.6 26Z" fill="#f5c518" stroke="#222" stroke-width="1"/><path d="M-2.6 -150 L0 -166 L2.6 -150Z" fill="#f3d2a2"/><path d="M-1 -161 L0 -166 L1 -161Z" fill="#222"/><rect x="-3" y="24" width="6" height="8" rx="2" fill="#ff8fb1" stroke="#222" stroke-width="1"/><circle r="4" fill="#222"/>`;
      return `<svg viewBox="0 0 400 400" class="face-svg">
      <defs><clipPath id="kidClip"><circle cx="200" cy="200" r="196"/></clipPath></defs>
      <g clip-path="url(#kidClip)"><rect width="400" height="400" fill="#fbf6e6"/>${Array.from({ length: 22 }, (_, i) => `<line x1="0" x2="400" y1="${i * 19 + 10}" y2="${i * 19 + 10}" stroke="#9cc3e8" stroke-width="1.2"/>`).join("")}<line x1="62" x2="62" y1="0" y2="400" stroke="#f08a8a" stroke-width="1.6"/></g>
      <path d="${wobble(184, 60, 6, 7)}" fill="none" stroke="#222" stroke-width="4" stroke-linejoin="round"/>
      <path d="${wobble(176, 50, 8, 3)}" fill="none" stroke="#e8302a" stroke-width="3" stroke-dasharray="14 6" opacity=".7"/>
      ${nums}
      <g transform="translate(200 206)"><path d="${wobble(64, 30, 6, 11).replace(/([\d.]+) ([\d.]+)/g, (m, a, b) => `${(a - 200).toFixed(1)} ${(b - 200).toFixed(1)}`)}" fill="#e8302a" stroke="#222" stroke-width="3"/>
        <path d="M-44 -14 C-34 -30 -8 -28 -3 -8 C-18 0 -38 0 -44 -14Z M44 -14 C34 -30 8 -28 3 -8 C18 0 38 0 44 -14Z" fill="#222"/>
        <g class="eyes"><g class="eye"><ellipse cx="-24" cy="-12" rx="11" ry="8" fill="#fff"/></g><g class="eye"><ellipse cx="24" cy="-12" rx="11" ry="8" fill="#fff"/></g></g>
        <path d="M-16 22 Q0 34 16 22" stroke="#222" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M-60 -40 l-12 -10 M60 -40 l12 -10" stroke="#222" stroke-width="3"/></g>
      <g transform="translate(318 84) rotate(12)"><path d="M0 -26 L7 -8 L26 -8 L11 4 L17 23 L0 12 L-17 23 L-11 4 L-26 -8 L-7 -8Z" fill="#f5c518" stroke="#b8860b" stroke-width="2"/><text y="44" class="kid-sticker">GOOD JOB!</text></g>
      <text x="200" y="330" class="kid-name" data-nap>kidpool</text>
      <g transform="translate(200 356)"><text class="kid-dig" data-dig>10:42</text></g>
      ${hands3(crayon(90, "#1f7ae0"), crayon(138, "#2fb344"), pencil)}
      <circle cx="200" cy="200" r="7" fill="#e8302a" stroke="#222" stroke-width="2"/>
    </svg>`;
    },
    init(E, r) { E.nap = r.querySelector("[data-nap]"); },
    render(E, c) { setText(E.dig, "kiddig", `${c.t.hh}:${c.t.mm}`); const h = c.d.getHours(); setText(E.nap, "kidnap", h >= 13 && h < 15 ? "NAP TIME!!" : h >= 20 || h < 6 ? "bed time, bud" : "kidpool"); F.eyeT(E); }
  });

  // ================= NICEPOOL =================
  F.register({
    id: "nice", name: "NICEPOOL", analog: true,
    make() {
      const words = [["please", 0], ["thank you", 90], ["sorry!", 180], ["hugs", 270]];
      let w = ""; words.forEach(([t, a]) => { const [x, y] = pol(160, a); w += `<text x="${x.toFixed(1)}" y="${(y + 6).toFixed(1)}" class="nice-word">${t}</text>`; });
      let sp = ""; [[80, 90], [320, 110], [300, 300], [96, 300], [200, 40], [350, 210], [52, 200]].forEach(([x, y], i) => { sp += `<path class="spark" style="animation-delay:${i * .37}s" transform="translate(${x} ${y})" d="M0 -9 L2 -2 L9 0 L2 2 L0 9 L-2 2 L-9 0 L-2 -2Z" fill="#fff"/>`; });
      const flower = `<path d="M-2 16 L-2 -120 L2 -120 L2 16Z" fill="#3aa56a"/><path d="M0 -70 C14 -80 20 -66 8 -60Z" fill="#5bd18a"/><g transform="translate(0 -132)">${[0, 60, 120, 180, 240, 300].map(a => `<ellipse rx="6" ry="12" transform="rotate(${a}) translate(0 -11)" fill="#fff" stroke="#e9a0b8"/>`).join("")}<circle r="7" fill="#ffd54a" stroke="#d1a000"/></g>`;
      const wand = `<path d="M-2.5 16 L-2.5 -70 L2.5 -70 L2.5 16Z" fill="#fff" stroke="#e17aa0"/>${heart(0, -80, 2.2, "#ff7aa0", `stroke="#fff" stroke-width=".8"`)}`;
      return `<svg viewBox="0 0 400 400" class="face-svg">
      <defs><clipPath id="niceClip"><circle cx="200" cy="200" r="112"/></clipPath></defs>
      <circle cx="200" cy="200" r="199" fill="url(#pearlGrad)"/>
      <circle cx="200" cy="200" r="182" fill="url(#niceDial)" stroke="#e8b4c8" stroke-width="3"/>
      <g class="ticks nice-ticks">${ticks(174, 180, 170, 180, [0, 3, 6, 9])}</g>${w}${sp}
      <path d="M86 176 C70 120 110 70 160 64 C230 54 300 80 318 150 C330 200 316 260 330 320 C300 300 300 250 290 220 L110 220 C100 260 100 300 70 320 C80 270 92 220 86 176Z" fill="url(#hairGrad)" stroke="#5a3418" stroke-width="2"/>
      <path d="M110 110 C150 80 250 80 290 120" stroke="#e9b27a" stroke-width="4" fill="none" opacity=".6"/>
      <circle cx="200" cy="202" r="116" fill="#5a3418"/><circle cx="200" cy="202" r="112" fill="url(#niceMask)"/>
      <g clip-path="url(#niceClip)"><path d="M194 208 C184 172 140 154 100 160 L94 232 C130 240 180 234 194 222Z M206 208 C216 172 260 154 300 160 L306 232 C270 240 220 234 206 222Z" fill="#3a2230"/>
        <g class="eyes"><g class="eye"><path d="M108 206 C130 180 164 184 180 208 C160 214 128 218 108 206Z" fill="#fff"/><path d="M130 196 l3 -6 l3 6 l-3 2z" fill="#ffd54a"/></g><g class="eye"><path d="M292 206 C270 180 236 184 220 208 C240 214 272 218 292 206Z" fill="#fff"/><path d="M264 196 l3 -6 l3 6 l-3 2z" fill="#ffd54a"/></g></g>
        <ellipse cx="130" cy="254" rx="18" ry="9" fill="#ff9ab8" opacity=".75"/><ellipse cx="270" cy="254" rx="18" ry="9" fill="#ff9ab8" opacity=".75"/>
        <path d="M176 276 Q200 294 224 276" stroke="#3a2230" stroke-width="4" fill="none" stroke-linecap="round"/></g>
      <path d="M120 100 C150 80 180 76 204 78" stroke="#fff" stroke-width="10" fill="none" opacity=".3" stroke-linecap="round"/>
      <g transform="translate(200 346)"><rect x="-48" y="-14" width="96" height="28" rx="14" fill="#fff" stroke="#ff9ab8" stroke-width="2"/><text y="6" class="dig-txt nice-dig" data-dig>10:42</text></g>
      ${hands3(wand, flower, secHand("#ff7aa0"))}
      <circle cx="200" cy="200" r="8" fill="#ffd54a" stroke="#fff" stroke-width="2"/>
    </svg>`;
    },
    render(E, c) { setText(E.dig, "nicedig", c.t.full); F.eyeT(E); }
  });

  // ================= DOGPOOL =================
  F.register({
    id: "dog", name: "DOGPOOL",
    make() {
      const paw = (x, y, s, a) => `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${a}) scale(${s})"><ellipse cx="0" cy="3" rx="7" ry="6"/><circle cx="-7" cy="-5" r="2.8"/><circle cx="-2.5" cy="-8.5" r="2.8"/><circle cx="2.5" cy="-8.5" r="2.8"/><circle cx="7" cy="-5" r="2.8"/></g>`;
      let paws = ""; for (let i = 0; i < 12; i++) { const [x, y] = pol(160, i * 30); paws += paw(x, y, i === 0 ? 1.4 : 1, i * 30); }
      let studs = ""; for (let i = 0; i < 24; i++) { const [x, y] = pol(190, i * 15 + 7.5); studs += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="url(#bladeGrad)" stroke="#333"/>`; }
      const bone = len => `<path d="M-3.5 12 L-3.5 ${-len + 14} L3.5 ${-len + 14} L3.5 12Z" fill="#f6efe0" stroke="#5a4a30" stroke-width="1.4"/><g fill="#f6efe0" stroke="#5a4a30" stroke-width="1.4"><circle cx="-5" cy="${-len + 10}" r="6"/><circle cx="5" cy="${-len + 10}" r="6"/><circle cx="-5" cy="14" r="5"/><circle cx="5" cy="14" r="5"/></g><rect x="-3" y="${-len + 12}" width="6" height="${len - 22}" fill="#f6efe0"/>`;
      const ball = `<circle cy="-172" r="9" fill="#d8f02a" stroke="#6a7a00" stroke-width="1.5"/><path d="M-8 -176 Q0 -168 8 -176 M-8 -168 Q0 -176 8 -168" stroke="#fff" stroke-width="1.6" fill="none"/>`;
      return `<svg viewBox="0 0 400 400" class="face-svg">
      <circle cx="200" cy="200" r="199" fill="#6b0f14"/><circle cx="200" cy="200" r="199" fill="url(#leather)"/>${studs}
      <circle cx="200" cy="200" r="180" fill="url(#redGrad)" stroke="#000" stroke-width="3"/><circle cx="200" cy="200" r="180" fill="url(#pawPat)"/>
      <g class="dog-paws">${paws}</g>
      <g transform="translate(200 212) scale(.92) translate(-110 -118)">
        <g class="d-ear d-earL"><path d="M50 70 C10 60 6 130 36 146 C44 120 50 100 64 88 Z" fill="#e7ddcf" stroke="#222" stroke-width="4"/></g>
        <g class="d-ear d-earR"><path d="M170 70 C210 60 214 130 184 146 C176 120 170 100 156 88 Z" fill="#e7ddcf" stroke="#222" stroke-width="4"/></g>
        <path d="M86 34 L92 8 L100 30 L108 4 L114 30 L124 6 L128 34 L140 14 L138 40" fill="#fff" stroke="#222" stroke-width="3" stroke-linejoin="round"/>
        <ellipse cx="110" cy="112" rx="74" ry="80" fill="#efe6d8" stroke="#222" stroke-width="4.5"/>
        <path d="M38 104 C40 60 70 34 110 34 C150 34 180 60 182 104 C160 118 60 118 38 104 Z" fill="url(#redGrad)" stroke="#222" stroke-width="4"/>
        <path d="M104 106 C98 84 70 74 44 84 L42 104 C64 112 92 112 104 106 Z M116 106 C122 84 150 74 176 84 L178 104 C156 112 128 112 116 106 Z" fill="#0a0a0b"/>
        <g class="eyes"><g class="eye"><path d="M52 92 C66 84 88 88 98 102 C82 108 62 104 52 92 Z" fill="#fff"/></g><g class="eye"><path d="M168 92 C154 84 132 88 122 102 C138 108 158 104 168 92 Z" fill="#fff"/></g></g>
        <ellipse cx="110" cy="140" rx="17" ry="12" fill="#1a1a1a"/><ellipse cx="104" cy="136" rx="5" ry="3" fill="#fff" opacity=".6"/>
        <path d="M110 152 C104 166 90 170 82 162 M110 152 C116 166 130 170 138 162" stroke="#222" stroke-width="4" fill="none" stroke-linecap="round"/>
        <g class="d-tongue"><path d="M112 164 C112 198 118 222 132 222 C146 222 146 196 136 162 Z" fill="#ff7aa2" stroke="#222" stroke-width="4"/></g>
      </g>
      <g transform="translate(200 358)"><path d="M-40 -14 L40 -14 L46 0 L40 14 L-40 14 L-46 0Z" fill="url(#goldGrad)" stroke="#5a4210" stroke-width="2"/><text y="6" class="dog-tag" data-dig>10:42</text></g>
      ${hands3(bone(88), bone(136), ball)}
      <circle cx="200" cy="200" r="8" fill="#222" stroke="#f6efe0" stroke-width="2.5"/>
    </svg>`;
    },
    tap(E) { DP.sound && DP.sound.woof(); E.root.classList.remove("zoomies"); void E.root.offsetWidth; E.root.classList.add("zoomies"); return "dogface"; },
    render(E, c) { setText(E.dig, "dogdig", `${c.t.hh}:${c.t.mm}`); F.eyeT(E); }
  });
})();
