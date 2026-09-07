import { readFileSync,writeFileSync,readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
const walk=(dir)=>readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(`${dir}/${e.name}`):[`${dir}/${e.name}`]);
const files=walk('dist').filter(f=>!f.endsWith('/sw.js'));
const revision=createHash('sha256').update(files.map(f=>`${f}:${createHash('sha256').update(readFileSync(f)).digest('hex')}`).join('|')).digest('hex').slice(0,12);
const assets=files.map(f=>'./'+f.slice(5));
writeFileSync('dist/sw.js',`// Mia's World 5.0.0 — release ${revision}\nconst CACHE='mias-world-5-${revision}';\nconst ASSETS=${JSON.stringify(assets)};\nconst PREFIXES=['mias-world-','math-quest','mathQuest','miasPlayground'];
self.addEventListener('install',event=>event.waitUntil((async()=>{const c=await caches.open(CACHE);await c.addAll(ASSETS.map(url=>new Request(url,{cache:'reload'})));await self.skipWaiting();})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k!==CACHE&&PREFIXES.some(p=>k.startsWith(p))).map(k=>caches.delete(k)));await self.clients.claim();})()));
self.addEventListener('fetch',event=>{const request=event.request;if(request.method!=='GET'||new URL(request.url).origin!==location.origin)return;
if(request.mode==='navigate'){event.respondWith((async()=>{try{const response=await fetch(request,{cache:'no-store'});if(!response.ok)throw new Error('Navigation unavailable');return response;}catch{const cache=await caches.open(CACHE);const offline=await cache.match(new URL('index.html',self.registration.scope).href,{ignoreVary:true});if(!offline)return Response.error();return new Response(await offline.text(),{headers:{'Content-Type':'text/html; charset=utf-8'}});}})());return;}
if(new URL(request.url).pathname.endsWith('/sw.js'))return;
event.respondWith((async()=>{const cache=await caches.open(CACHE);const cached=await cache.match(request,{ignoreVary:true});if(cached)return cached;const response=await fetch(request);return response;})());});
`);
writeFileSync('dist/release.json',JSON.stringify({version:'5.0.0',revision,assets:assets.length}));
writeFileSync('dist/.nojekyll','');
console.log(`Offline release ${revision}: ${assets.length} assets.`);
