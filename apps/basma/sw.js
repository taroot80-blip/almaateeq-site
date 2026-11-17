// بصمتي المرنة: يحفظ التطبيق ليفتح دون إنترنت، ويجلب التحديثات متى توفرت الشبكة
const CACHE = 'basma-v6';
const CORE = [
  './', './index.html', './manifest.webmanifest', './bg.jpg', './about.jpg',
  './icon-180.png', './icon-192.png', './icon-512.png', './icon-apple-180.png', './icon-maskable-512.png',
  './fonts/cairo-arabic-700-normal.woff2', './fonts/cairo-arabic-800-normal.woff2',
  './fonts/cairo-latin-700-normal.woff2', './fonts/cairo-latin-800-normal.woff2',
  './fonts/tajawal-arabic-400-normal.woff2', './fonts/tajawal-arabic-500-normal.woff2',
  './fonts/tajawal-arabic-700-normal.woff2', './fonts/tajawal-arabic-800-normal.woff2',
  './fonts/tajawal-latin-400-normal.woff2', './fonts/tajawal-latin-500-normal.woff2',
  './fonts/tajawal-latin-700-normal.woff2', './fonts/tajawal-latin-800-normal.woff2'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith('basma-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url); if (url.origin !== location.origin) return;
  // الصفحة: الشبكة أولًا لتصل التحديثات، والمحفوظ عند الانقطاع
  if (req.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/')) {
    e.respondWith(fetch(req).then(r => {
      if (r.ok) { const c = r.clone(); caches.open(CACHE).then(k => k.put(req, c)); }
      return r;
    }).catch(() => caches.match(req).then(h => h || caches.match('./index.html'))));
    return;
  }
  // الصور والخطوط: المحفوظ أولًا
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok) { const c = r.clone(); caches.open(CACHE).then(k => k.put(req, c)); }
    return r;
  })));
});
// الضغط على الإشعار يفتح التطبيق
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(ws => {
    const w = ws.find(c => c.url.includes('/apps/basma/'));
    return w ? w.focus() : self.clients.openWindow('./');
  }));
});
