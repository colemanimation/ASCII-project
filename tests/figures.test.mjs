import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
const root=existsSync(new URL('../dist/index.html',import.meta.url))?'../dist/':'../';
const {FIGURE_STYLES,FACINGS,figureGlyphs,figureHit}=await import(new URL(root+'js/figures.js',import.meta.url));
const {SceneRenderer}=await import(new URL(root+'js/scene.js',import.meta.url));
const {newGame,hydrate,makeTown,tickTown}=await import(new URL(root+'js/rpg.js',import.meta.url));
const {FABLE}=await import(new URL(root+'js/fable.js',import.meta.url));
const {FABLE_ART}=await import(new URL(root+'js/fable-art.js',import.meta.url));

test('every figure retains its clothes while facing four directions using two ASCII cells',()=>{
 for(const [kind,style] of Object.entries(FIGURE_STYLES))for(const facing of FACINGS){const glyphs=figureGlyphs(kind,facing);assert.equal(glyphs.length,2);assert.match(glyphs.join(''),/^[\x21-\x7e]{2}$/);assert.equal(glyphs[1],style.body);}
 const bodies=['player','keeper','traveler','fisher','worker','child','animal'].map(k=>figureGlyphs(k)[1]);assert.equal(new Set(bodies).size,bodies.length);
});
test('a head and body select the same NPC, with no hit in the tile above their head',()=>{
 const layout={cell:10,ch:16,ox:5,oy:3,vx:0,vy:0,cols:20,rows:20},person={x:4,y:5,type:'npc'},map={objects:[person]};
 const renderer=Object.create(SceneRenderer.prototype);renderer.layout=layout;
 assert.equal(renderer.objectAt(map,50,75),person);assert.equal(renderer.objectAt(map,50,91),person);
 assert.equal(figureHit(person,50,55,layout),false);assert.equal(figureHit(person,65,75,layout),false);
});
test('old journeys gain a default facing, new facings persist, and nearby residents look at the player',()=>{
 assert.equal(hydrate({version:2}).facing,'down');const s=newGame();s.facing='left';assert.equal(hydrate(s).facing,'left');s.facing='invalid';assert.equal(hydrate(s).facing,'down');
 const map=makeTown('bracken'),npc=map.actors[0];s.scene='town';s.local={x:npc.x+1,y:npc.y};const position={x:npc.x,y:npc.y};tickTown(map,s);assert.equal(npc.facing,'right');assert.deepEqual({x:npc.x,y:npc.y},position);
});
test('the entire creation tale has real, equally sized printable ASCII plates',()=>{
 assert.equal(Object.keys(FABLE_ART).length,4);assert.equal(FABLE.length,6);
 for(const slide of FABLE){const rows=FABLE_ART[slide.art];assert.ok(rows);assert.equal(rows.length,38);assert.ok(rows.every(row=>row.length===112));assert.match(rows.join('\n'),/^[\x20-\x7e\n]+$/);assert.ok(slide.text.length<=145);}
 assert.match(FABLE.at(-1).text,/Or so the tale is told/);
});
