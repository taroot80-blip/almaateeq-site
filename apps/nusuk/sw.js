// يحفظ الدليل ليعمل دون إنترنت: الواجهة والبيانات عند التثبيت، والشرائح عند فتحها أو تنزيلها
const CORE_CACHE = 'nusk-core-v30', SLIDES = 'nusk-slides';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-180.png',
  './fonts/fonts.css', './assets/designer.webp', './assets/scene-haram.svg', './assets/scene-nabawi.svg', './data/journey.js', './data/issues.js', './data/overrides.js', './data/rulings.js', './data/rulings_tawaf.js', './data/rulings_sai.js', './data/rulings_taqsir.js', './data/rulings_muharramat.js', './data/rulings_umrah_mufrada.js', './data/rulings_adab.js', './data/hidden_maraji.js', './data/topics.js', './data/solver.js', './data/contacts.js', './data/ready_quiz.js', './js/extras.js', './js/ready.js', './js/custom.js', './js/mustajadd.js', './js/sfx.js', './js/ocr.js', './js/sos.js', './js/teach.js', './js/onboard.js', './js/display.js', './js/fx.js', './js/i18n.js', './data/text.js'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CORE_CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('nusk-core') && k !== CORE_CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url); if (url.origin !== location.origin) return;
  // الصفحة والبيانات: الشبكة أولاً لتصل التحديثات، والمحفوظ عند الانقطاع
  if (req.mode === 'navigate' || url.pathname.includes('/data/') || url.pathname.endsWith('.html')) {
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(CORE_CACHE).then(k => k.put(req, c)); return r; })
      .catch(() => caches.match(req).then(h => h || caches.match('./index.html'))));
    return;
  }
  // الشرائح والخطوط: المحفوظ أولاً
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok && (url.pathname.includes('/slides/') || url.pathname.includes('/vendor/'))) { const c = r.clone(); caches.open(SLIDES).then(k => k.put(req, c)); }
    return r;
  })));
});
