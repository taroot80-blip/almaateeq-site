/* لا تخزين: يُبقي الموقع على أحدث نسخة دائمًا */
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
