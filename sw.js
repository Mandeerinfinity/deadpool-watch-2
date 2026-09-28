/* Deadpool Watch 2 service worker: offline app shell. Own cache namespace ("dpw2-") so it never touches v1's cache.
   v1's worker (different scope) may delete other caches on its own activate, so every lookup here tolerates a
   missing cache and simply falls back to the network and repopulates. */
const VERSION = "dpw2-v2.0.0";
const ASSETS = [
  "./", "./index.html", "./manifest.json", "./css/style.css", "./css/v2.css",
  "./js/quips.js", "./js/quips2.js", "./js/sound.js", "./js/fx.js", "./js/gl.js", "./js/faces.js", "./js/faces2.js",
  "./js/complications.js", "./js/app.js", "./js/tools2.js", "./js/games.js",
  "./fonts/Bangers-Regular.woff2", "./fonts/Oswald.woff2", "./fonts/ShareTechMono-Regular.woff2", "./fonts/LuckiestGuy-Regular.woff2",
  "./fonts/PermanentMarker-Regular.woff2", "./fonts/GochiHand-Regular.woff2", "./fonts/GreatVibes-Regular.woff2", "./fonts/BebasNeue-Regular.woff2",
  "./fonts/Orbitron.woff2", "./fonts/Cinzel.woff2",
  "./icons/icon.svg", "./icons/icon-180.png", "./icons/icon-192.png", "./icons/icon-512.png",
  "./icons/icon-maskable-512.png", "./icons/favicon-64.png", "./icons/icon-167.png", "./icons/icon-152.png",
  "./icons/splash-1290x2796.png"
];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("dpw2-") && k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const put = (req, res) => caches.open(VERSION).then(c => c.put(req, res)).catch(() => { });
const match = (req) => caches.open(VERSION).then(c => c.match(req, { ignoreSearch: true })).catch(() => undefined);
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(r => { put("./index.html", r.clone()); return r; })
      .catch(() => match("./index.html").then(hit => hit || new Response("Offline and the cache got unalived. Reconnect once and I'll heal.", { status: 503, headers: { "Content-Type": "text/plain" } }))));
    return;
  }
  e.respondWith(match(req).then(hit => hit || fetch(req).then(r => { if (r.ok) put(req, r.clone()); return r; })));
});
