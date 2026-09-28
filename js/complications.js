/* Deadpool Watch 2 — complications: weather (Open-Meteo, keyless), moon phase, sunrise/sunset, steps, heal, next alarm, countdown, focus. */
(function () {
  const C = {};
  const LSK = "dpw2.";
  const lsGet = (k, d) => { try { const v = localStorage.getItem(LSK + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(LSK + k, JSON.stringify(v)); } catch (e) { } };
  C.list = [
    { id: "date", name: "Date" }, { id: "day", name: "Weekday" }, { id: "weather", name: "Weather" }, { id: "moon", name: "Moon phase" },
    { id: "sunrise", name: "Sunrise" }, { id: "sunset", name: "Sunset" }, { id: "steps", name: "Steps" }, { id: "heal", name: "Healing factor" },
    { id: "alarm", name: "Next alarm" }, { id: "countdown", name: "Next countdown" }, { id: "focus", name: "Focus status" }, { id: "hilo", name: "High / low" }
  ];
  // ---------- location ----------
  const TZ = { "America/Chicago": ["Chicago", 41.88, -87.63], "America/New_York": ["New York", 40.71, -74.01], "America/Los_Angeles": ["Los Angeles", 34.05, -118.24], "America/Denver": ["Denver", 39.74, -104.99], "America/Phoenix": ["Phoenix", 33.45, -112.07], "America/Anchorage": ["Anchorage", 61.22, -149.9], "Pacific/Honolulu": ["Honolulu", 21.31, -157.86], "America/Toronto": ["Toronto", 43.65, -79.38], "America/Vancouver": ["Vancouver", 49.28, -123.12], "Europe/London": ["London", 51.51, -0.13], "Europe/Paris": ["Paris", 48.86, 2.35], "Europe/Berlin": ["Berlin", 52.52, 13.4], "Asia/Tokyo": ["Tokyo", 35.68, 139.69], "Australia/Sydney": ["Sydney", -33.87, 151.21] };
  C.loc = lsGet("loc", null);
  if (!C.loc) {
    let tz = ""; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) { }
    const g = TZ[tz]; if (g) C.loc = { name: g[0], lat: g[1], lon: g[2], approx: true };
  }
  C.wx = lsGet("wx", null); // {t, code, day, wind, hi, lo, rise, set, at, unit}
  C.status = "";
  const WMO = c => c === 0 ? ["Clear", "sun"] : c <= 2 ? ["Partly cloudy", "part"] : c === 3 ? ["Overcast", "cloud"] : c <= 48 ? ["Foggy", "fog"] : c <= 57 ? ["Drizzle", "rain"] : c <= 67 ? ["Rain", "rain"] : c <= 77 ? ["Snow", "snow"] : c <= 82 ? ["Showers", "rain"] : c <= 86 ? ["Snow showers", "snow"] : ["Thunderstorm", "storm"];
  C.desc = () => C.wx ? WMO(C.wx.code)[0] : "";
  C.kind = () => C.wx ? WMO(C.wx.code)[1] : "none";
  C.unit = () => (DP.settings && DP.settings.celsius) ? "C" : "F";
  C.refresh = async function (force) {
    if (!C.loc) { C.status = "No location yet"; return null; }
    if (!force && C.wx && Date.now() - C.wx.at < 30 * 60000 && C.wx.unit === C.unit() && C.wx.lat === C.loc.lat) return C.wx;
    if (!navigator.onLine && C.wx) return C.wx;
    const u = C.unit() === "C" ? "celsius" : "fahrenheit";
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${C.loc.lat.toFixed(3)}&longitude=${C.loc.lon.toFixed(3)}&current=temperature_2m,weather_code,is_day,wind_speed_10m,apparent_temperature&daily=sunrise,sunset,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1&temperature_unit=${u}&wind_speed_unit=mph`;
    try {
      C.status = "Loading weather...";
      const r = await fetch(url, { cache: "no-store" }); if (!r.ok) throw new Error("HTTP " + r.status);
      const j = await r.json(), cur = j.current, dy = j.daily;
      C.wx = { t: Math.round(cur.temperature_2m), feels: Math.round(cur.apparent_temperature), code: cur.weather_code, day: cur.is_day, wind: Math.round(cur.wind_speed_10m), hi: Math.round(dy.temperature_2m_max[0]), lo: Math.round(dy.temperature_2m_min[0]), rise: dy.sunrise[0], set: dy.sunset[0], at: Date.now(), unit: C.unit(), lat: C.loc.lat };
      lsSet("wx", C.wx); C.status = "Updated " + new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      document.dispatchEvent(new CustomEvent("dp-weather"));
      return C.wx;
    } catch (e) { C.status = "Weather failed (" + e.message + ")"; return C.wx; }
  };
  C.useGeo = function () {
    return new Promise((res, rej) => {
      if (!navigator.geolocation) return rej(new Error("Geolocation not available"));
      navigator.geolocation.getCurrentPosition(p => {
        C.loc = { name: "Your location", lat: p.coords.latitude, lon: p.coords.longitude, approx: false }; lsSet("loc", C.loc);
        C.refresh(true).then(res);
      }, err => rej(err), { enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 });
    });
  };
  C.searchCity = async function (name) {
    const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en&format=json`);
    const j = await r.json(); if (!j.results || !j.results.length) throw new Error("City not found");
    const g = j.results[0]; C.loc = { name: g.name + (g.admin1 ? ", " + g.admin1 : ""), lat: g.latitude, lon: g.longitude, approx: false }; lsSet("loc", C.loc);
    return C.refresh(true);
  };
  // ---------- moon ----------
  C.moon = function (d = new Date()) {
    const syn = 29.530588853, ref = Date.UTC(2000, 0, 6, 18, 14);
    const age = (((d.getTime() - ref) / 864e5) % syn + syn) % syn, p = age / syn;
    const illum = (1 - Math.cos(2 * Math.PI * p)) / 2;
    const names = ["New Moon", "Waxing Crescent", "First Quarter", "Waxing Gibbous", "Full Moon", "Waning Gibbous", "Last Quarter", "Waning Crescent"];
    return { p, illum, age, name: names[Math.floor(p * 8 + 0.5) % 8] };
  };
  C.moonSVG = function (p, size = 24) {
    const r = 10, lit = "#f4f1e6", dark = "#2a2a30";
    const k = Math.cos(2 * Math.PI * p) * r; // terminator x-radius
    const waxing = p < 0.5;
    const sweepOuter = waxing ? 1 : 0;
    const d = `M12 2 A10 10 0 0 ${sweepOuter} 12 22 A${Math.abs(k).toFixed(2)} 10 0 0 ${(k > 0) === waxing ? 0 : 1} 12 2Z`;
    return `<svg viewBox="0 0 24 24" width="${size}" height="${size}"><circle cx="12" cy="12" r="10" fill="${dark}"/><path d="${d}" fill="${lit}"/><circle cx="12" cy="12" r="10" fill="none" stroke="rgba(255,255,255,.35)"/></svg>`;
  };
  // ---------- sun (SunCalc-style) ----------
  C.sun = function (date = new Date()) {
    if (C.wx && C.wx.rise && new Date(C.wx.rise).toDateString() === date.toDateString()) return { rise: new Date(C.wx.rise), set: new Date(C.wx.set) };
    if (!C.loc) return null;
    const rad = Math.PI / 180, dayMs = 864e5, J1970 = 2440588, J2000 = 2451545, e = rad * 23.4397;
    const toDays = d => d.valueOf() / dayMs - 0.5 + J1970 - J2000, fromJ = j => new Date((j + 0.5 - J1970) * dayMs);
    const d = toDays(date), lw = rad * -C.loc.lon, phi = rad * C.loc.lat;
    const n = Math.round(d - 0.0009 - lw / (2 * Math.PI)), ds = 0.0009 + lw / (2 * Math.PI) + n;
    const M = rad * (357.5291 + 0.98560028 * ds), Cc = rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
    const L = M + Cc + rad * 102.9372 + Math.PI, dec = Math.asin(Math.sin(e) * Math.sin(L));
    const Jnoon = J2000 + ds + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
    const w = Math.acos((Math.sin(rad * -0.833) - Math.sin(phi) * Math.sin(dec)) / (Math.cos(phi) * Math.cos(dec)));
    if (isNaN(w)) return null;
    const Jset = J2000 + 0.0009 + (w + lw) / (2 * Math.PI) + n + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
    return { rise: fromJ(Jnoon - (Jset - Jnoon)), set: fromJ(Jset) };
  };
  // ---------- glyphs ----------
  const I = {
    sun: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" fill="#ffc814"/><g stroke="#ffc814" stroke-width="2" stroke-linecap="round"><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/></g></svg>',
    moonI: '<svg viewBox="0 0 24 24"><path d="M15 3a9 9 0 1 0 6 15A8 8 0 0 1 15 3Z" fill="#e8e4d6"/></svg>',
    part: '<svg viewBox="0 0 24 24"><circle cx="9" cy="9" r="4" fill="#ffc814"/><path d="M7 19h10a4 4 0 0 0 0-8 5 5 0 0 0-9.6 1.5A3.3 3.3 0 0 0 7 19Z" fill="#dfe6ee"/></svg>',
    cloud: '<svg viewBox="0 0 24 24"><path d="M6 19h11a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.4 2A3.6 3.6 0 0 0 6 19Z" fill="#c8d0da"/></svg>',
    rain: '<svg viewBox="0 0 24 24"><path d="M6 15h11a4 4 0 0 0 0-8 5.5 5.5 0 0 0-10.5 1.8A3.2 3.2 0 0 0 6 15Z" fill="#c8d0da"/><path d="M8 18l-1 3M12 18l-1 3M16 18l-1 3" stroke="#4dc3ff" stroke-width="2" stroke-linecap="round"/></svg>',
    snow: '<svg viewBox="0 0 24 24"><path d="M6 14h11a4 4 0 0 0 0-8 5.5 5.5 0 0 0-10.5 1.8A3.2 3.2 0 0 0 6 14Z" fill="#dfe6ee"/><g fill="#fff"><circle cx="8" cy="18" r="1.4"/><circle cx="12" cy="20" r="1.4"/><circle cx="16" cy="18" r="1.4"/></g></svg>',
    storm: '<svg viewBox="0 0 24 24"><path d="M6 14h11a4 4 0 0 0 0-8 5.5 5.5 0 0 0-10.5 1.8A3.2 3.2 0 0 0 6 14Z" fill="#9aa4b2"/><path d="M12 13l-3 5h3l-1 4 4-6h-3l1-3Z" fill="#ffc814"/></svg>',
    fog: '<svg viewBox="0 0 24 24"><path d="M4 9h16M3 13h18M5 17h14" stroke="#c8d0da" stroke-width="2.4" stroke-linecap="round"/></svg>',
    none: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="none" stroke="#777" stroke-width="2" stroke-dasharray="3 3"/></svg>',
    rise: '<svg viewBox="0 0 24 24"><path d="M5 17a7 7 0 0 1 14 0" fill="#ff9a1f"/><path d="M2 19h20M12 3v6M9 6l3-3 3 3" stroke="#ffc814" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
    set: '<svg viewBox="0 0 24 24"><path d="M5 17a7 7 0 0 1 14 0" fill="#ff5a1f"/><path d="M2 19h20M12 3v6M9 6l3 3 3-3" stroke="#ff8a3d" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
    steps: '<svg viewBox="0 0 24 24"><path d="M8 3c2 0 3 2 3 5s-1 5-3 5-3-2-3-5 1-5 3-5Zm-2 12h4v2a2 2 0 0 1-4 0v-2Zm10-9c2 0 3 2 3 5s-1 5-3 5-3-2-3-5 1-5 3-5Zm-2 12h4v2a2 2 0 0 1-4 0v-2Z" fill="#4dff88"/></svg>',
    heal: '<svg viewBox="0 0 24 24"><path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11Z" fill="#ff3b44"/><path d="M12 8v6M9 11h6" stroke="#fff" stroke-width="2"/></svg>',
    alarm: '<svg viewBox="0 0 24 24"><path d="M6 17v-6a6 6 0 0 1 12 0v6l2 2H4Z" fill="#ffc814"/><path d="M10 21h4" stroke="#ffc814" stroke-width="2"/></svg>',
    countdown: '<svg viewBox="0 0 24 24"><path d="M6 2h12M6 22h12M7 2c0 6 10 6 10 10S7 16 7 22M17 2c0 6-10 6-10 10s10 4 10 10" stroke="#b44dff" stroke-width="2" fill="none"/></svg>',
    focus: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="#ff3b44" stroke-width="2"/><circle cx="12" cy="12" r="5" fill="none" stroke="#ff3b44" stroke-width="2"/><circle cx="12" cy="12" r="1.8" fill="#fff"/></svg>'
  };
  C.icon = k => I[k] || I.none;
  const hm = d => { if (!d) return "--"; const H = d.getHours(), M = d.getMinutes(); if (DP.settings && DP.settings.h24) return `${String(H).padStart(2, "0")}:${String(M).padStart(2, "0")}`; return `${H % 12 || 12}:${String(M).padStart(2, "0")}${H >= 12 ? "p" : "a"}`; };
  C.hm = hm;
  // providers: {v, l, icon, sub}
  C.data = function (id, d = new Date()) {
    const X = DP.cx || {};
    switch (id) {
      case "date": return { v: String(d.getDate()), l: DP.faces.MONS[d.getMonth()], icon: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="3" fill="none" stroke="#fff" stroke-width="2"/><path d="M3 10h18M8 3v4M16 3v4" stroke="#ff3b44" stroke-width="2"/></svg>' };
      case "day": return { v: DP.faces.DAYS[d.getDay()].slice(0, 3), l: "DAY", icon: I.countdown.replace(/#b44dff/g, "#fff") };
      case "weather": { if (!C.wx) return { v: "--\u00b0", l: C.loc ? "LOADING" : "NO LOC", icon: I.none }; const k = C.kind(); return { v: C.wx.t + "\u00b0", l: C.desc().toUpperCase(), icon: k === "sun" && !C.wx.day ? I.moonI : I[k] }; }
      case "hilo": return C.wx ? { v: `${C.wx.hi}\u00b0/${C.wx.lo}\u00b0`, l: "HI / LO", icon: I.part } : { v: "--", l: "HI / LO", icon: I.none };
      case "moon": { const m = C.moon(d); return { v: Math.round(m.illum * 100) + "%", l: m.name.toUpperCase(), icon: C.moonSVG(m.p) }; }
      case "sunrise": { const s = C.sun(d); return { v: s ? hm(s.rise) : "--", l: "SUNRISE", icon: I.rise }; }
      case "sunset": { const s = C.sun(d); return { v: s ? hm(s.set) : "--", l: "SUNSET", icon: I.set }; }
      case "steps": { const n = X.steps ? X.steps() : 0; return { v: n >= 10000 ? (n / 1000).toFixed(1) + "k" : String(n), l: "STEPS", icon: I.steps }; }
      case "heal": return { v: (X.heal ? X.heal() : 100) + "%", l: "HEAL", icon: I.heal };
      case "alarm": { const a = X.nextAlarm ? X.nextAlarm() : null; return { v: a ? a.txt : "NONE", l: "ALARM", icon: I.alarm }; }
      case "countdown": { const c = X.nextCountdown ? X.nextCountdown() : null; return { v: c ? c.txt : "--", l: c ? c.name.toUpperCase().slice(0, 12) : "COUNTDOWN", icon: I.countdown }; }
      case "focus": { const f = X.focus ? X.focus() : null; return { v: f ? f.txt : "IDLE", l: f ? f.phase : "FOCUS", icon: I.focus }; }
    }
    return { v: "--", l: id, icon: I.none };
  };
  C.short = function (id, d) {
    const x = C.data(id, d);
    if (id === "date" || id === "day") return x.v;
    if (id === "sunrise" || id === "sunset") return x.v.replace(/[ap]$/, "");
    if (id === "alarm") return x.v === "NONE" ? "--" : x.v.replace(/ ?[AP]M$/i, "");
    if (id === "moon") return x.v;
    return String(x.v).slice(0, 6);
  };
  C.weatherQuip = function () {
    if (!C.wx) return null;
    const Q = DP.QUIPS.weather, k = C.kind(), F = C.unit() === "C" ? C.wx.t * 9 / 5 + 32 : C.wx.t;
    const pool = k === "storm" ? Q.storm : k === "snow" ? Q.snow : k === "rain" ? Q.rain : F >= 86 ? Q.hot : F <= 40 ? Q.cold : Q.nice;
    return pool[Math.floor(Math.random() * pool.length)].replace("{t}", C.wx.t + "\u00b0" + C.unit()).replace("{c}", C.desc().toLowerCase());
  };
  DP.cmp = C;
})();
