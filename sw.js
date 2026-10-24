// Cache only this game's scope; never evict another app's offline files.
const CACHE='feverwake-v2-20261024-3';
const ASSETS=['./','./index.html','./style.css?v=feverwake-20261024-1','./manifest.webmanifest','./js/main.js?v=feverwake-20261024-1','./js/rpg.js?v=feverwake-20261024-1','./js/atlas.js?v=feverwake-20261024-1','./js/render.js?v=feverwake-20261024-1','./js/scene.js?v=feverwake-20261024-1','./js/music.js?v=feverwake-20261024-1','./js/songs.js?v=feverwake-20261024-1','./data/maps/lantern_coast.txt','./data/maps/lantern_coast.json','./icons/icon.svg','./icons/icon-192.png','./icons/icon-512.png','./icons/apple-touch-icon.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('feverwake-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;
 event.respondWith(fetch(event.request).then(response=>{if(response.ok&&ASSETS.some(path=>new URL(path,self.registration.scope).href===url.href)){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)));}return response;}).catch(async()=>{const cached=await caches.match(event.request);if(cached)return cached;if(event.request.mode==='navigate')return caches.match(new URL('./index.html',self.registration.scope));return Response.error();}));
});
