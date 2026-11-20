// المسابقة بلا إنترنت: الصفحة تُجلب من الشبكة أولًا (فتظهر أحدث نسخة دائمًا)، وتُستعمل النسخة المخزنة عند انقطاع الإنترنت
const C='jubail-1448-v13';
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.add(new Request('./',{cache:'reload'}))));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.pathname.startsWith('/api/'))return;
  e.respondWith(fetch(e.request,{cache:'no-cache'}).then(r=>{if(r&&r.ok){const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp))}return r})
    .catch(()=>caches.match(e.request,{ignoreSearch:true}).then(h=>h||caches.match('./'))))});
