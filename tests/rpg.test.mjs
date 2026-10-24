import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
const root=existsSync(new URL('../dist/index.html',import.meta.url))?'../dist/':'../';
const r=await import(new URL(root+'js/rpg.js',import.meta.url));
const {newGame,hydrate,ITEMS,DREAMS,TOWN_IDS,makeTown,makeDream,makeFinale,localWalkable,localRoute,buyItem,sellItem,equipItem,useItem,rest,priceFor,maxHp,maxMp,gainXp,startBattle,battleAction,randomEncounter,advanceStalker}=r;
test('every town service and nightmare objective is reachable without crossing walls',()=>{
 for(const map of [...TOWN_IDS.map(makeTown),...DREAMS.map((_,i)=>makeDream(i)),makeFinale()]){
  assert.ok(localWalkable(map,map.spawn.x,map.spawn.y));
  for(const object of map.objects){const path=localRoute(map,map.spawn,object);assert.ok(path,'unreachable '+object.type);let last=map.spawn;for(const p of path){assert.equal(Math.abs(p.x-last.x)+Math.abs(p.y-last.y),1);assert.ok(localWalkable(map,p.x,p.y));last=p;}}
 }
});
test('economy respects funds, discounts, equipment ownership, and consumable quantities',()=>{
 const s=newGame();s.hero.gold=0;const bag={...s.bag};buyItem(s,'iron_blade');assert.deepEqual(s.bag,bag);s.hero.gold=200;s.hero.empathy=2;const cost=priceFor(s,'iron_blade');assert.ok(cost<ITEMS.iron_blade.price);buyItem(s,'iron_blade');assert.equal(s.hero.gold,200-cost);equipItem(s,'iron_blade');const gold=s.hero.gold;sellItem(s,'iron_blade');assert.equal(s.hero.gold,gold);sellItem(s,'wooden_blade');assert.equal(s.bag.wooden_blade,0);assert.equal(useItem(s,'potion').ok,false);assert.equal(s.bag.potion,3);s.hero.hp=2;assert.equal(useItem(s,'potion').ok,true);assert.equal(s.hero.hp,28);assert.equal(s.bag.potion,2);equipItem(s,'ward_coat');assert.equal(s.hero.armor,'traveler_coat');
});
test('an empty purse can recover enough to play; paid rest fully restores',()=>{
 const s=newGame();s.hero.gold=0;s.hero.hp=1;s.hero.mp=0;rest(s,true);assert.equal(s.hero.hp,1);rest(s,false);assert.equal(s.hero.hp,26);assert.equal(s.hero.mp,6);s.hero.gold=20;rest(s,true);assert.equal(s.hero.hp,maxHp(s));assert.equal(s.hero.mp,maxMp(s));assert.equal(s.hero.gold,10);
});
test('dream powers and levels stay in dreams; guard restores focus while reducing damage',()=>{
 const s=newGame();startBattle(s,'wolf');const enemyHp=s.combat.hp;gainXp(s,999);assert.equal(s.hero.level,1);battleAction(s,'spark',()=>0);assert.equal(s.combat.hp,enemyHp);assert.equal(s.combat.turn,0);s.combat=null;s.scene='dream';startBattle(s,'moth');s.hero.mp=0;battleAction(s,'guard',()=>0);assert.equal(s.hero.mp,2);assert.ok(s.hero.hp>=38);const hp=s.combat.hp;battleAction(s,'spark',()=>0);assert.equal(s.combat.hp,hp);gainXp(s,56);assert.equal(s.hero.level,3);assert.equal(maxHp(s),54);s.scene='world';assert.equal(maxHp(s),40);
});
test('victory awards once, survives a reload, and guardians can be beaten with starter provisions',()=>{
 const s=newGame();s.scene='dream';s.hero.hp=40;startBattle(s,'warden',true);for(let n=0;n<20&&s.combat.phase==='ongoing';n++){battleAction(s,s.hero.hp<16?'potion':s.hero.mp>=3?'spark':'attack',()=>.3);}
 assert.equal(s.combat.phase,'won');assert.ok(s.defeated.includes('nursery'));const gold=s.hero.gold,count=s.bag.tonic;const saved=hydrate(JSON.parse(JSON.stringify(s)));battleAction(saved,'attack',()=>0);assert.equal(saved.hero.gold,gold);assert.equal(saved.bag.tonic,count);assert.equal(saved.combat.phase,'won');assert.ok(saved.hero.level>=2);
});
test('all three guardians support a continuous progression with loot and dream XP',()=>{
 const s=newGame();s.scene='dream';s.bag.potion=10;s.bag.tonic=5;
 for(let i=0;i<3;i++){s.dream=i;s.hero.hp=maxHp(s);s.hero.mp=maxMp(s);s.combat=null;startBattle(s,DREAMS[i].boss,true);for(let turns=0;turns<40&&s.combat.phase==='ongoing';turns++){battleAction(s,s.hero.hp<20?'potion':s.hero.mp>=3?'spark':'attack',()=>.5);}assert.equal(s.combat.phase,'won',DREAMS[i].name);assert.ok(s.defeated.includes(DREAMS[i].id));s.cleared.push(DREAMS[i].id);}
 assert.equal(s.cleared.length,3);assert.ok(s.hero.level>=3);
});
test('encounters respect towns, roads, cooldowns, and the powerless finale',()=>{
 const s=newGame();for(let i=0;i<100;i++)assert.equal(randomEncounter(s,'+',()=>0),null);s.encounterClock=0;for(let i=0;i<16;i++)assert.equal(randomEncounter(s,'T',()=>0),null);assert.equal(randomEncounter(s,'T',()=>0),'wolf');s.scene='town';assert.equal(randomEncounter(s,'.',()=>0),null);s.scene='finale';assert.equal(startBattle(s,'wolf'),false);assert.equal(randomEncounter(s,'.',()=>0),null);
});
test('the visitor notices a clear line of sight, stays behind walls, and can be escaped in the finale',()=>{
 const s=newGame(),map=makeDream(0);s.scene='dream';s.local={x:3,y:17};s.stalker={x:6,y:17,active:true,chasing:false};s.dreamTicks=23;advanceStalker(s,map);assert.equal(s.stalker.chasing,true);assert.equal(s.stalker.x,5);
 s.stalker={x:24,y:17,active:true,chasing:false};s.local={x:3,y:17};s.dreamTicks=23;s.dread=0;advanceStalker(s,map);assert.equal(s.stalker.chasing,false);
 const final=makeFinale();s.scene='finale';s.local={...final.spawn};s.stalker={...final.stalker,active:false,chasing:false};s.dreamTicks=0;const path=localRoute(final,s.local,final.objects.find(o=>o.type==='ending'));for(const step of path){s.local=step;assert.equal(advanceStalker(s,final),false);}assert.deepEqual(s.local,{x:28,y:18});
});
test('save loading repairs hostile or damaged values and preserves active battles',()=>{
 const damaged=hydrate({version:2,scene:'invalid',player:{x:-12,y:Infinity},hero:{hp:NaN,gold:-5,weapon:'potion',armor:'fake',level:Infinity},bag:{fake:100,potion:-5},cleared:['nursery','nursery','fake'],opened:{}});assert.equal(damaged.scene,'world');assert.equal(damaged.hero.gold,0);assert.equal(damaged.hero.weapon,'wooden_blade');assert.equal(damaged.bag.fake,undefined);assert.deepEqual(damaged.cleared,['nursery']);assert.ok(damaged.hero.hp>0);const s=newGame();s.scene='dream';startBattle(s,'reflection');battleAction(s,'attack',()=>.25);const saved=hydrate(JSON.parse(JSON.stringify(s)));assert.equal(saved.combat.hp,s.combat.hp);assert.equal(saved.hero.hp,s.hero.hp);assert.equal(saved.combat.turn,1);
});
test('the offline manifest points at existing relative resources for GitHub Pages subpaths',()=>{
 const manifest=JSON.parse(readFileSync(new URL(root+'manifest.webmanifest',import.meta.url),'utf8'));assert.equal(manifest.start_url,'./');assert.equal(manifest.scope,'./');assert.equal(manifest.display,'standalone');for(const icon of manifest.icons)assert.ok(existsSync(new URL(root+icon.src,import.meta.url)));
 const sw=readFileSync(new URL(root+'sw.js',import.meta.url),'utf8');const assets=JSON.parse(sw.match(/const ASSETS=(\[[^;]+\])/)[1].replaceAll("'",'"'));for(const asset of assets)if(asset!=='./')assert.ok(existsSync(new URL(root+asset,import.meta.url)),asset);
});
test('hiding grants a short escape window that survives a save',()=>{const s=newGame();s.scene='dream';s.dread=90;s.dreamTicks=50;s.local={x:4,y:17};s.stalker={x:5,y:17,active:true,chasing:true};assert.equal(r.hideFromStalker(s),true);const restored=hydrate(JSON.parse(JSON.stringify(s)));const map=makeDream(0);for(let i=0;i<6;i++){assert.equal(advanceStalker(restored,map),false);assert.equal(restored.stalker.chasing,false);}assert.equal(restored.hiddenSteps,0);advanceStalker(restored,map);assert.equal(restored.stalker.chasing,true);});
