import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
const root=existsSync(new URL('../dist/index.html',import.meta.url))?'../dist/':'../';
const r=await import(new URL(root+'js/rpg.js',import.meta.url));
const {textMap,STAMPS}=await import(new URL(root+'js/tilekit.js',import.meta.url));
const {newGame,makeTown,makeDream,TOWN_IDS,localWalkable,localRoute,approachRoute,tickTown,operateDream,hydrate,advanceStalker}=r;
test('six different towns compile as ASCII and every resident route is traversable',()=>{
 const layouts=new Set;for(const id of TOWN_IDS){const m=makeTown(id);assert.match(textMap(m),/^[\x20-\x7e\n]+$/);layouts.add(textMap(m));for(const a of m.actors){for(const p of a.route)assert.ok(localRoute(m,a,p),id+': '+a.name);assert.ok(approachRoute(m,m.spawn,a));}assert.ok(m.objects.some(o=>o.type==='shop'));assert.ok(m.objects.some(o=>o.type==='inn'));assert.ok(m.objects.some(o=>o.type==='clinic'));}assert.equal(layouts.size,6);
 for(const stamp of Object.values(STAMPS))assert.match(stamp.art.join('\n'),/^[\x20-\x7e\n]+$/);
});
test('residents move, avoid scenery and each other, and stop for a conversation; services stay fixed',()=>{
 for(const id of TOWN_IDS){const m=makeTown(id),s=newGame();s.scene='town';s.local={...m.spawn};const before=m.actors.map(a=>({x:a.x,y:a.y})),fixed=m.objects.filter(o=>!o.mobile).map(o=>({...o}));let moved=false;for(let t=0;t<50;t++){moved=tickTown(m,s)||moved;const occupied=new Set;for(const a of m.actors){assert.ok(localWalkable(m,a.x,a.y),a.name);assert.ok(!occupied.has(a.x+','+a.y));occupied.add(a.x+','+a.y);}}assert.equal(moved,true,id);assert.ok(m.actors.some((a,i)=>a.x!==before[i].x||a.y!==before[i].y));assert.deepEqual(m.objects.filter(o=>!o.mobile),fixed);const a=m.actors[0];s.local={x:a.x,y:a.y};const at={x:a.x,y:a.y};for(let t=0;t<10;t++)tickTown(m,s,a);assert.deepEqual({x:a.x,y:a.y},at);}
});
test('dream mechanisms gate progress, alter hazards, and survive reloading',()=>{
 for(let i=0;i<3;i++){const s=newGame();s.scene='dream';s.dream=i;let m=makeDream(i,s);s.local={...m.spawn};assert.match(textMap(m),/^[\x20-\x7e\n]+$/);assert.ok(m.rooms.length>=5);const boss=m.objects.find(o=>o.type==='boss');assert.equal(localRoute(m,m.spawn,boss),null);assert.equal(operateDream(s,m,m.gates[0]).ok,false);
  for(const type of ['lever','key']){const o=m.objects.find(o=>o.type===type),p=approachRoute(m,s.local,o);assert.ok(p,type);s.local=p.at(-1)||s.local;assert.equal(operateDream(s,m,o).ok,true);assert.equal(operateDream(s,m,o).ok,false);}
  assert.equal(m.hazardsActive,false);assert.ok(!m.grid.flat().includes('%'));for(const gate of m.gates){assert.ok(approachRoute(m,s.local,gate));assert.equal(operateDream(s,m,gate).ok,true);}
  for(const o of m.objects)assert.ok(localRoute(m,m.spawn,o),'unreachable after solving: '+o.type);const restored=hydrate(JSON.parse(JSON.stringify(s)));m=makeDream(i,restored);assert.ok(localRoute(m,m.spawn,boss));assert.equal(m.hazardsActive,false);assert.equal(m.gates.every(g=>g.open),true);
 }
});
test('the flooded gallery opens only after using the pump, and both school entrances are gated',()=>{
 const s=newGame(),house=makeDream(2,s),key=house.objects.find(o=>o.type==='key');assert.equal(localRoute(house,house.spawn,key),null);operateDream(s,house,house.objects.find(o=>o.type==='lever'));assert.ok(localRoute(house,house.spawn,key));const school=makeDream(1);assert.equal(school.gates.length,2);for(const g of school.gates)assert.ok(g.cells.every(([x,y])=>!localWalkable(school,x,y)));
});
test('a continuous route through each dream can reach its anchor without unavoidable capture',()=>{
 for(let i=0;i<3;i++){const s=newGame();s.scene='dream';s.dream=i;const m=makeDream(i,s);s.local={...m.spawn};s.stalker={...m.stalker,active:false,chasing:false};for(const type of ['lever','key','gate','boss','anchor']){const candidates=m.objects.filter(o=>o.type===type).map(o=>({o,p:approachRoute(m,s.local,o)})).filter(v=>v.p).sort((a,b)=>a.p.length-b.p.length);const {o,p}=candidates[0];for(const step of p){s.local=step;assert.equal(advanceStalker(s,m),false,'caught in '+i+' approaching '+type);}operateDream(s,m,o);} }
});
test('active renderers use printable text and black surfaces without vector ornaments',()=>{
 for(const name of ['scene.js','render.js']){const source=readFileSync(new URL(root+'js/'+name,import.meta.url),'utf8');assert.match(source,/^[\x00-\x7f]+$/);assert.doesNotMatch(source,/\.arc\(|createRadialGradient|\.stroke\(|Georgia/);}
 const html=readFileSync(new URL(root+'index.html',import.meta.url),'utf8');assert.match(html,/^[\x00-\x7f]+$/);assert.match(html,/fonts\/fever-terminal.ttf/);
});
