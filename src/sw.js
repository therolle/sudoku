// Quiet Sudoku service worker: cache the app shell so it opens offline.
// Bump CACHE when index.html changes so clients pick up the new version.
const CACHE = 'quiet-sudoku-v12';
const SHELL = ['./', './index.html', './grader.js', './manifest.json', './icon.svg', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];
// Clone before returning: once the page reads the body, the response can no longer be cloned.
const store = (req, res) => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {}); return res; };
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin === location.origin) {
    // App shell: cache first, refresh in background.
    e.respondWith(caches.match(e.request).then(hit => {
      const net = fetch(e.request).then(res => res.ok ? store(e.request, res) : res).catch(() => hit);
      return hit || net;
    }));
  } else if (FONT_HOSTS.includes(url.hostname)) {
    // Fonts: network first, fall back to cache; the app has system-font fallbacks anyway.
    e.respondWith(fetch(e.request).then(res => store(e.request, res)).catch(() => caches.match(e.request)));
  }
  // Anything else (extensions, other hosts) is left to the browser.
});
