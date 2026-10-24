import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const root=existsSync(new URL('../dist/index.html',import.meta.url))?'../dist/':'../';
const {parseMap,serializeMap,findRoute,costAt,sanitizeProgress,nearestWalkable}=await import(new URL(root+'js/atlas.js',import.meta.url));
const text=readFileSync(new URL(root+'data/maps/lantern_coast.txt',import.meta.url),'utf8');
const meta=JSON.parse(readFileSync(new URL(root+'data/maps/lantern_coast.json',import.meta.url),'utf8'));
const world=parseMap(text);
test('world and metadata agree, and plain-text export round-trips exactly',()=>{assert.equal(world.width,280);assert.equal(world.height,116);assert.equal(world.width,meta.width);assert.equal(world.height,meta.height);assert.equal(serializeMap(world),text);assert.match(text,/^[\x20-\x7e\n]+$/);assert.ok(world.grid.every(r=>r.length===world.width));});
test('all 14 landmarks are reachable from the harbor without walking through peaks',()=>{
 assert.equal(meta.places.length,14);
 for(const place of meta.places){const route=findRoute(world,meta.spawn,place);assert.ok(route,place.name+' is reachable');let last=meta.spawn;for(const p of route){assert.equal(Math.abs(last.x-p.x)+Math.abs(last.y-p.y),1);assert.ok(Number.isFinite(costAt(world,p.x,p.y)));last=p;}assert.deepEqual(last,{x:place.x,y:place.y});}
});
test('the full beacon journey returns to the Observatory',()=>{let p=meta.spawn;for(const target of [...meta.places.filter(p=>p.kind==='beacon'),meta.places.find(p=>p.kind==='observatory')]){const r=findRoute(world,p,target);assert.ok(r);p=r.at(-1)||p;}assert.deepEqual(p,{x:184,y:55});});
test('routes reject off-map, blocked, and unreachable destinations',()=>{assert.equal(findRoute(world,meta.spawn,{x:-1,y:0}),null);const tiny=parseMap('...\n^^^\n...');assert.equal(findRoute(tiny,{x:0,y:0},{x:0,y:2}),null);assert.equal(findRoute(tiny,{x:0,y:0},{x:0,y:1}),null);assert.deepEqual(findRoute(tiny,{x:0,y:0},{x:0,y:0}),[]);});
test('malformed map files fail safely and short rows preserve their columns',()=>{assert.throws(()=>parseMap('a'));assert.throws(()=>parseMap('a\tb\n...\n...'));assert.throws(()=>parseMap('.'.repeat(513)+'\n...\n...'));assert.equal(serializeMap(parseMap('....\n..\n...')),'....\n..  \n... \n');});
test('saved positions and progress are validated after edits',()=>{const s=sanitizeProgress({player:{x:-5,y:999},discovered:['bracken','fake','bracken'],lit:['bracken','mosswatch','mosswatch','mosswatch'],complete:true},world,meta);assert.ok(Number.isFinite(costAt(world,s.player.x,s.player.y)));assert.deepEqual(s.discovered,['bracken']);assert.deepEqual(s.lit,['mosswatch']);assert.equal(s.complete,false);assert.throws(()=>nearestWalkable(parseMap('^^^\n^^^\n^^^'),{x:1,y:1}));});
