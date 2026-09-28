/* Deadpool Watch 2 — all sounds are synthesized live with Web Audio. No samples, no music. */
window.DP = window.DP || {};
(function () {
  let ctx = null, master = null, noiseBuf = null, alarmTimer = null, unlocked = false;
  const S = {};
  S.enabled = () => DP.settings ? DP.settings.sound : true;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.55;
      const comp = ctx.createDynamicsCompressor();
      master.connect(comp); comp.connect(ctx.destination);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  // iOS: unlock audio on the first user gesture
  S.unlock = function () {
    unlocked = true;
    const c = ensure(); if (!c) return;
    const b = c.createBuffer(1, 1, 22050), s = c.createBufferSource();
    s.buffer = b; s.connect(c.destination); s.start(0);
  };

  function tone(freq, t0, dur, type = "sine", vol = 0.3, freqEnd = null, attack = 0.005) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function noise(t0, dur, vol = 0.3, ftype = "bandpass", f0 = 2000, f1 = null, q = 1) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; f.type = ftype; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t0);
    if (f1) f.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f); f.connect(g); g.connect(master); s.start(t0, Math.random() * 0.5); s.stop(t0 + dur + 0.05);
  }
  function play(fn) { if (!S.enabled() || !unlocked) return; const c = ensure(); if (!c) return; fn(c.currentTime + 0.01); }

  S.tick = () => play(t => tone(2200, t, 0.03, "square", 0.05));
  S.click = () => play(t => tone(900, t, 0.05, "triangle", 0.12, 500));
  S.pop = () => play(t => { tone(320, t, 0.14, "sine", 0.25, 900); tone(640, t + 0.03, 0.1, "triangle", 0.08, 1400); });
  S.blink = () => play(t => tone(1400, t, 0.04, "sine", 0.06, 700));
  S.slash = () => play(t => { noise(t, 0.28, 0.5, "bandpass", 7000, 900, 2.5); tone(3200, t + 0.02, 0.18, "sine", 0.05, 1600); });
  S.snikt = () => play(t => {
    noise(t, 0.12, 0.6, "highpass", 5000, 2500, 1);
    [2630, 3890, 5210].forEach((f, i) => tone(f, t + 0.02 + i * 0.012, 0.5, "sine", 0.07));
  });
  S.shatter = () => play(t => {
    noise(t, 0.08, 0.9, "lowpass", 1200, 300, 0.7);
    noise(t, 0.6, 0.5, "highpass", 3000, 8000, 0.8);
    for (let i = 0; i < 18; i++) tone(2500 + Math.random() * 4500, t + 0.03 + Math.random() * 0.45, 0.12 + Math.random() * 0.2, "sine", 0.05);
  });
  S.hit = () => play(t => { tone(160, t, 0.25, "sine", 0.6, 45); noise(t, 0.12, 0.5, "lowpass", 900, 200, 1); });
  S.heal = () => play(t => [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.07, 0.3, "triangle", 0.12)));
  S.ding = () => play(t => { [0, 0.55, 1.1].forEach(d => { tone(1318.5, t + d, 1.1, "sine", 0.35); tone(2637, t + d, 0.6, "sine", 0.08); }); });
  S.sparkle = () => play(t => [1047, 1319, 1568, 2093, 2637, 3136, 2637, 3520].forEach((f, i) => tone(f, t + i * 0.06, 0.35, "sine", 0.1)));
  S.woof = () => play(t => { [0, 0.22].forEach(d => { tone(420, t + d, 0.16, "sawtooth", 0.18, 150); noise(t + d, 0.1, 0.25, "bandpass", 700, 300, 2); }); });
  S.glitch = () => play(t => { for (let i = 0; i < 6; i++) tone(80 + Math.random() * 900, t + i * 0.05, 0.05, "square", 0.08); });
  S.rewind = () => play(t => { tone(1400, t, 1.6, "sawtooth", 0.06, 90); noise(t, 1.6, 0.12, "bandpass", 4000, 400, 3); });
  S.start = () => play(t => { tone(392, t, 0.12, "square", 0.12); tone(587, t + 0.1, 0.12, "square", 0.12); tone(784, t + 0.2, 0.25, "square", 0.14); });
  S.stop = () => play(t => { tone(784, t, 0.1, "square", 0.1); tone(392, t + 0.1, 0.2, "square", 0.1); });
  S.lap = () => play(t => tone(1760, t, 0.08, "triangle", 0.15));

  // Original 8-bit-ish alarm riff, looping until stopped.
  const riff = [659, 0, 784, 659, 988, 0, 880, 784, 659, 0, 523, 587, 659, 0, 0, 0];
  S.alarmStart = function () {
    S.alarmStop();
    if (!S.enabled() || !unlocked) return;
    const c = ensure(); if (!c) return;
    let loops = 0;
    const once = () => {
      const t0 = c.currentTime + 0.02;
      riff.forEach((f, i) => { if (f) { tone(f, t0 + i * 0.11, 0.1, "square", 0.12); tone(f / 2, t0 + i * 0.11, 0.1, "triangle", 0.1); } });
      if (++loops > 40) S.alarmStop();
    };
    once(); alarmTimer = setInterval(once, riff.length * 110 + 300);
  };
  S.alarmStop = function () { if (alarmTimer) clearInterval(alarmTimer); alarmTimer = null; };

  // ---------- v2 sounds ----------
  S.beep = (hi) => play(t => tone(hi ? 1320 : 880, t, hi ? 0.35 : 0.12, "square", 0.16));
  S.whistle = () => play(t => { tone(2100, t, 0.18, "sine", 0.18, 2600); tone(2600, t + 0.2, 0.3, "sine", 0.18, 2000); });
  S.coin = () => play(t => { tone(988, t, 0.07, "square", 0.1); tone(1319, t + 0.07, 0.22, "square", 0.1); });
  S.boom = () => play(t => { tone(120, t, 0.5, "sine", 0.7, 30); noise(t, 0.6, 0.6, "lowpass", 1600, 80, 0.8); });
  S.bang = () => play(t => { noise(t, 0.18, 0.9, "lowpass", 4000, 300, 0.7); tone(220, t, 0.16, "square", 0.25, 60); });
  S.swish = () => play(t => noise(t, 0.16, 0.35, "bandpass", 3200, 900, 1.8));
  S.chop = () => play(t => { noise(t, 0.08, 0.5, "highpass", 2500, 900, 1); tone(300, t, 0.1, "triangle", 0.2, 120); });
  S.fanfare = () => play(t => [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => { tone(f, t + i * 0.1, 0.22, "square", 0.08); tone(f * 2, t + i * 0.1, 0.18, "sine", 0.05); }));
  S.achieve = () => play(t => { [784, 988, 1175, 1568].forEach((f, i) => tone(f, t + i * 0.08, 0.4, "triangle", 0.14)); tone(3136, t + 0.34, 0.5, "sine", 0.05); });
  S.gong = () => play(t => { [110, 220, 331, 443].forEach((f, i) => tone(f, t, 2.2 - i * 0.3, "sine", 0.25 / (i + 1))); });
  // original disco groove (bassline + hats), loops while dance mode is on
  let danceTimer = null;
  S.danceStart = function (ms = 8000) {
    S.danceStop(); if (!S.enabled() || !unlocked) return; const c = ensure(); if (!c) return;
    const bass = [110, 110, 220, 110, 131, 131, 262, 131, 147, 147, 294, 147, 131, 165, 196, 220];
    const bar = () => { const t0 = c.currentTime + 0.02; bass.forEach((f, i) => { tone(f, t0 + i * 0.125, 0.11, "sawtooth", 0.09); if (i % 2) noise(t0 + i * 0.125, 0.04, 0.12, "highpass", 8000, 6000, 1); if (i % 4 === 0) tone(60, t0 + i * 0.125, 0.18, "sine", 0.5, 40); }); };
    bar(); danceTimer = setInterval(bar, 2000); setTimeout(S.danceStop, ms);
  };
  S.danceStop = function () { if (danceTimer) clearInterval(danceTimer); danceTimer = null; };
  DP.sound = S;
})();
