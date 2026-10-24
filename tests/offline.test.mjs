import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import vm from 'node:vm';
const root=existsSync(new URL('../dist/index.html',import.meta.url))?'../dist/':'../';
const code=readFileSync(new URL(root+'sw.js',import.meta.url),'utf8');
test('offline reload serves the complete app within a GitHub Pages subpath and preserves other caches',async()=>{
 const scope='https://example.github.io/ASCII-project/',handlers={},stored=new Map([['another-app',new Map],['feverwake-old',new Map]]);let online=true,claimed=false;
 const absolute=x=>new URL(typeof x==='string'?x:x.url||x.href,scope).href;
 const caches={async keys(){return [...stored.keys()];},async delete(k){return stored.delete(k);},async open(key){if(!stored.has(key))stored.set(key,new Map);const cache=stored.get(key);return{async addAll(paths){for(const path of paths){const asset=path==='./'?'index.html':path;cache.set(absolute(path),new Response(readFileSync(new URL(root+asset,import.meta.url))));}},async put(req,res){cache.set(absolute(req),res);}};},async match(req){for(const cache of stored.values())if(cache.has(absolute(req)))return cache.get(absolute(req)).clone();}};
 const self={location:{origin:'https://example.github.io'},registration:{scope},clients:{claim:async()=>{claimed=true;}},skipWaiting:async()=>{},addEventListener:(type,fn)=>handlers[type]=fn};
 vm.runInNewContext(code,{self,caches,URL,Response,fetch:async()=>{if(!online)throw new Error('offline');return new Response('online');}});
 const run=async type=>{let task;handlers[type]({waitUntil:p=>task=p});await task;};
 await run('install');await run('activate');assert.equal(claimed,true);assert.ok(stored.has('another-app'));assert.equal(stored.has('feverwake-old'),false);online=false;
 const html=readFileSync(new URL(root+'index.html',import.meta.url),'utf8');const entry=html.match(/<script type="module" src="([^"]+)"/)[1],styles=[...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map(m=>m[1]);const dependencies=new Set;function visit(path){if(dependencies.has(path))return;dependencies.add(path);const source=readFileSync(new URL(root+new URL(path,scope).href.slice(scope.length),import.meta.url),'utf8');for(const m of source.matchAll(/from '([^']+)'/g))visit(new URL(m[1],new URL(path,scope)).href);}visit(entry);
 for(const path of ['./',entry,...styles,...dependencies,'./data/maps/lantern_coast.txt','./icons/icon-192.png','./fonts/fever-terminal.ttf','./kit.html','./js/kit.js?v=compact-1']){let task;handlers.fetch({request:{method:'GET',url:new URL(path,scope).href,mode:path==='./'?'navigate':'same-origin'},respondWith:p=>task=p,waitUntil:()=>{}});const response=await task;assert.equal(response.status,200,path);assert.ok((await response.arrayBuffer()).byteLength>0,path);}
 let intercepted=false;handlers.fetch({request:{method:'GET',url:'https://example.github.io/another-app/',mode:'navigate'},respondWith:()=>intercepted=true});assert.equal(intercepted,false);
});
