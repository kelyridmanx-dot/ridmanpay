/* Ridman Pay - Service Worker */
const CACHE_VERSION = "v12"; // 👈 subí versión para que NO se quede pegado
const CACHE_NAME = `ridmanpay-${CACHE_VERSION}`;

const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(()=>{})
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async()=>{
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k !== CACHE_NAME) ? caches.delete(k) : Promise.resolve()));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if(req.method !== "GET") return;

  event.respondWith(
    (async()=>{
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req);
      if(cached) return cached;

      try{
        const fresh = await fetch(req);
        if(new URL(req.url).origin === self.location.origin){
          cache.put(req, fresh.clone());
        }
        return fresh;
      }catch{
        if(req.mode === "navigate"){
          const fallback = await cache.match("./index.html");
          if(fallback) return fallback;
        }
        throw new Error("Offline");
      }
    })()
  );
});
