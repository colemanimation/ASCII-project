export {makeTown} from './towns.js?v=compact-1';
export {makeDream,syncDreamMap,operateDream,roomAt} from './dungeons.js?v=compact-1';
// Feverwake: deterministic game rules. The UI supplies randomness for encounters.
export const ITEMS={
 potion:{name:'Red cordial',kind:'use',price:12,heal:26,description:'Restores 26 HP.'},
 tonic:{name:'Lucidity tonic',kind:'use',price:16,mana:9,description:'Restores 9 focus.'},
 salt:{name:'Waking salts',kind:'use',price:10,dread:30,description:'Lowers nightmare dread by 30.'},
 wooden_blade:{name:'Walking sword',kind:'weapon',price:12,power:1,description:'+1 attack. Familiar and reassuring.'},
 iron_blade:{name:'Iron saber',kind:'weapon',price:48,power:4,description:'+4 attack, awake or asleep.'},
 silver_blade:{name:'Silver needle',kind:'weapon',price:95,power:7,description:'+7 attack. Sew a dream back together.'},
 traveler_coat:{name:'Traveler coat',kind:'armor',price:10,power:1,description:'+1 defense.'},
 quilted_coat:{name:'Quilted coat',kind:'armor',price:38,power:3,description:'+3 defense.'},
 ward_coat:{name:'Wardstitched coat',kind:'armor',price:85,power:5,description:'+5 defense.'},
 tooth:{name:'Briar tooth',kind:'loot',price:8,description:'A trader will pay 4 coins.'},
 dust:{name:'Dream dust',kind:'loot',price:14,description:'A trader will pay 7 coins.'},
 memory:{name:'Waking memory',kind:'key',price:0,description:'An anchor recovered from an infected dream.'}
};
export const ENEMIES={
 wolf:{name:'Briar wolf',hp:19,attack:5,defense:0,gold:9,xp:0,drop:'tooth',portrait:'wolf'},
 slime:{name:'Marsh jelly',hp:16,attack:4,defense:1,gold:7,xp:0,drop:'tooth',portrait:'slime'},
 bandit:{name:'Road scavenger',hp:24,attack:6,defense:1,gold:13,xp:0,drop:'potion',portrait:'bandit'},
 moth:{name:'Paper moth',hp:19,attack:5,defense:0,gold:9,xp:7,drop:'dust',portrait:'moth'},
 reflection:{name:'Wrong reflection',hp:25,attack:6,defense:1,gold:12,xp:10,drop:'tonic',portrait:'reflection'},
 hound:{name:'Clockwork hound',hp:28,attack:7,defense:1,gold:15,xp:11,drop:'dust',portrait:'hound'},
 warden:{name:'The Nursery Warden',hp:38,attack:6,defense:1,gold:28,xp:24,drop:'tonic',portrait:'warden'},
 teacher:{name:'The Empty Teacher',hp:50,attack:8,defense:2,gold:37,xp:32,drop:'potion',portrait:'teacher'},
 drowned:{name:'The Drowned Guest',hp:66,attack:10,defense:3,gold:48,xp:44,drop:'tonic',portrait:'drowned'}
};
export const DREAMS=[
 {id:'nursery',town:'bracken',name:'The Endless Nursery',dreamer:'Theo',boss:'warden',description:'His childhood home has more doors every night.',color:'#a5a3bb'},
 {id:'school',town:'northgate',name:'The School After Midnight',dreamer:'Iven',boss:'teacher',description:'The lesson ends only when someone disappears.',color:'#88a8bf'},
 {id:'house',town:'cedar',name:'The House Beneath the Tide',dreamer:'Sela',boss:'drowned',description:'An unfamiliar guest has been living in her memories.',color:'#86b5ae'}
];
export const TOWN_IDS=['bracken','hollow','northgate','wayfarer','cedar','oasis'];
export const PORTRAITS={
 child:["       .----.      ","      /  __  \\     ","      | o  o |     ","      |  __  |     ","       \\____/      ","      /| /\\ |\\     ","     /_|/__\\|_\\    "],
 worker:["      _______      ","    _/_______\\_    ","      |o   o|      ","      |  >  |      ","      \\ --- /      ","    __/\\___/\\__    ","   /  |     |  \\   ","  /___|_____|___\\  "],
 dog:["    /\\        /\\   ","   /  \\______/  \\  ","   |  (o)  (o)  |  ","    \\    __    /   ","     |  \\__/  |    ","      \\__U___/     ","       /    \\      "],
 mara:["      .------.     ","     /  /\\   \\    ","    |  /  \\   |   ","    |  o  o   |   ","     \\  __  /    ","    __|\\____/|__   ","   /  | /\\ |  \\  ","  /___|/  \\|___\\ "],
 merchant:["       _____      ","     _/_____\\_    ","      |o   o|     ","      |  >  |     ","      \\ === /     ","   ___/\\___/\\___  ","  /  $ |   | $ \\ "," /_____|___|_____\\"],
 innkeeper:["      ______      ","     / ~  ~ \\     ","    ( o   o )     ","     |  ^  |      ","     \\ \\_/ /      ","    __\\___/___    ","   /  /   \\  \\   ","  /__|_____|__\\  "],
 sleeper:["     .----------. ","    /   __  __   \\","   |   -    -    |","   |      .      |","    \\    __    / "," .---\\________/--."," |     / / /     |"," |____/_/_/______|"],
 wolf:["  /\\           /\\ "," /  \\_________/  \\"," |  /  o   o  \\  |","  \\|    ^    |/  ","    \\  \\_/  /   ","   / /-----\\ \\  "," _/ /       \\ \\_"],
 slime:["       .--.       ","    .-'    '-.    ","  .'  o    o  '.  "," /      __      \\ ","(     _/  \\_     )"," '---'------'---' "],
 bandit:["       ______     ","      /______\\    ","     /| .  . |\\   ","      | ==== |    ","      \\______/    ","     /| /\\ |\\    ","  __/ |/  \\| \\__ "],
 moth:[" \\  .      .  /  ","  \\/ \\    / \\/   ","  /\\  \\||/  /\\   "," (  \\  ||  /  )  ","  \\__\\_||_/__/   ","  /  / || \\  \\   "," /__/  ||  \\__\\  "],
 reflection:["    .--------.    ","    | .----. |    ","    | |o  o| |    ","    | | \\/ | |    ","    | /____\\ |    ","    |/ /||\\ \\|    ","    '--------'    "],
 hound:["    /\\ _____ /\\   ","   (  |  X  |  )  ","    \\_|_===_|_/   ","      /| O |\\     ","  ___/ |___| \\___ ","  | | /     \\ | |"],
 warden:["      _______     ","     /       \\    ","    |  o   o  |   ","    |   ___   |   ","    |  |   |  |   ","    /\\_|___|_/\\   "," __/  /|||||\\  \\__","     /|||||||\\    "],
 teacher:["      .----.      ","      |    |      ","      |    |      ","   ___|____|___   ","  /  /      \\  \\  "," |  |  ----  |  | "," |  |  ----  |  | ","    /|      |\\    "],
 drowned:["     ~ /\\/\\ ~     ","    ~ | . . | ~   ","      |  ~  |     ","    ~ \\___/ ~     ","  ~ /|~~~~~|\\ ~   ","   / |~~~~~| \\    ","  ~  |~~~~~|  ~   ","      ~ ~ ~       "],
 pursuer:["        .--.      ","        |..|      ","        |  |      ","      __|  |__    ","     /  |  |  \\   ","    /   |  |   \\  ","   /    |  |    \\","        |  |      ","       /    \\     "]
};
export const isDream=s=>s.scene==='dream';
export const maxHp=s=>40+(isDream(s)?(s.hero.level-1)*7:0);
export const maxMp=s=>12+(s.hero.level-1)*3;
export const attackPower=s=>5+(ITEMS[s.hero.weapon]?.power||0)+(isDream(s)?s.hero.level*2:0);
export const defensePower=s=>ITEMS[s.hero.armor]?.power||0;
export const xpNeeded=level=>16+level*8;
export function newGame(){return{version:2,layoutVersion:3,dreamFlags:[],scene:'world',player:{x:44,y:68},local:{x:16,y:17},town:'bracken',dream:0,hero:{hp:40,mp:12,level:1,xp:0,gold:38,weapon:'wooden_blade',armor:'traveler_coat',empathy:0,courage:0},bag:{potion:3,tonic:1,salt:1,wooden_blade:1,traveler_coat:1},discovered:[],cleared:[],opened:[],defeated:[],choices:[],steps:0,encounterClock:0,dreamTicks:0,dread:0,hiddenSteps:0,stalker:{x:25,y:17,active:false,chasing:false},combat:null,stage:'illness',lastTown:'bracken',message:'Brackenport is just north of you. Find Mara in the square.'};}
export function hydrate(raw){
 const s=newGame();if(raw?.version!==2)return s;s.layoutVersion=raw.layoutVersion===3?3:2;
 const finite=(v,f,min=0,max=99999)=>Number.isFinite(v)?Math.max(min,Math.min(max,Math.floor(v))):f;
 for(const k of ['town','lastTown'])if(TOWN_IDS.includes(raw[k]))s[k]=raw[k];
 s.scene=['world','town','dream','finale'].includes(raw.scene)?raw.scene:'world';s.dream=finite(raw.dream,0,0,2);
 for(const k of ['player','local'])s[k]={x:finite(raw[k]?.x,s[k].x,0,k==='player'?279:63),y:finite(raw[k]?.y,s[k].y,0,k==='player'?115:39)};
 for(const k of ['level','xp','gold','empathy','courage'])s.hero[k]=finite(raw.hero?.[k],s.hero[k],k==='level'?1:0,k==='level'?25:['empathy','courage'].includes(k)?10:99999);
 s.bag={};for(const [id,n] of Object.entries(raw.bag||{}))if(ITEMS[id]&&Number.isInteger(n)&&n>0)s.bag[id]=Math.min(n,999);
 for(const k of ['weapon','armor'])if(ITEMS[raw.hero?.[k]]?.kind===k&&s.bag[raw.hero[k]])s.hero[k]=raw.hero[k];else s.bag[s.hero[k]]=Math.max(1,s.bag[s.hero[k]]||0);
 s.hero.hp=finite(raw.hero?.hp,40,1,maxHp(s));s.hero.mp=finite(raw.hero?.mp,12,0,maxMp(s));
 for(const k of ['discovered','opened','defeated','choices','dreamFlags'])s[k]=Array.isArray(raw[k])?[...new Set(raw[k].filter(v=>typeof v==='string').slice(0,500))]:[];
 s.cleared=Array.isArray(raw.cleared)?[...new Set(raw.cleared.filter(id=>DREAMS.some(d=>d.id===id)))]:[];
 for(const k of ['steps','encounterClock','dreamTicks','dread','hiddenSteps'])s[k]=finite(raw[k],0,0,k==='dread'?100:999999);
 if(['illness','breach','ended'].includes(raw.stage))s.stage=raw.stage;
 if(typeof raw.message==='string')s.message=raw.message.slice(0,300);
 s.stalker={x:finite(raw.stalker?.x,25,0,63),y:finite(raw.stalker?.y,17,0,39),active:raw.stalker?.active===true,chasing:raw.stalker?.chasing===true};
 if(raw.combat&&ENEMIES[raw.combat.id]&&['ongoing','won','lost','fled'].includes(raw.combat.phase)){
  const e=ENEMIES[raw.combat.id],tier=finite(raw.combat.tier,0,0,2);s.combat={id:raw.combat.id,tier,hp:finite(raw.combat.hp,e.hp,0,e.hp+tier*6),maxHp:e.hp+tier*6,phase:raw.combat.phase,boss:raw.combat.boss===true,turn:finite(raw.combat.turn,0),log:Array.isArray(raw.combat.log)?raw.combat.log.filter(x=>typeof x==='string').slice(-4):['The encounter continues.']};
 }
 return s;
}
export function addItem(s,id,n=1){if(ITEMS[id])s.bag[id]=(s.bag[id]||0)+n;}
export function priceFor(s,id){return Math.max(1,Math.ceil(ITEMS[id].price*(1-Math.min(s.hero.empathy,3)*.08)));}
export function buyItem(s,id){if(!ITEMS[id]||!['use','weapon','armor'].includes(ITEMS[id].kind))return 'That is not for sale.';const price=priceFor(s,id);if(s.hero.gold<price)return 'Not enough coins.';s.hero.gold-=price;addItem(s,id);return 'Bought '+ITEMS[id].name+'.';}
export function sellItem(s,id){if(!ITEMS[id]||!s.bag[id]||ITEMS[id].kind==='key')return 'You cannot sell that.';if((s.hero.weapon===id||s.hero.armor===id)&&s.bag[id]===1)return 'Equip something else before selling it.';s.bag[id]--;const gold=Math.max(1,Math.floor(ITEMS[id].price/2));s.hero.gold+=gold;return 'Sold for '+gold+' coins.';}
export function equipItem(s,id){const item=ITEMS[id];if(!item||!s.bag[id]||!['weapon','armor'].includes(item.kind))return 'You cannot equip that.';s.hero[item.kind]=id;return 'Equipped '+item.name+'.';}
export function useItem(s,id){const item=ITEMS[id];if(!item||item.kind!=='use'||!s.bag[id])return {ok:false,message:'None left.'};if(item.heal&&s.hero.hp>=maxHp(s)||item.mana&&s.hero.mp>=maxMp(s)||item.dread&&s.dread===0)return{ok:false,message:'You do not need that right now.'};s.bag[id]--;if(item.heal)s.hero.hp=Math.min(maxHp(s),s.hero.hp+item.heal);if(item.mana)s.hero.mp=Math.min(maxMp(s),s.hero.mp+item.mana);if(item.dread)s.dread=Math.max(0,s.dread-item.dread);return{ok:true,message:'Used '+item.name+'.'};}
export function rest(s,paid=true){const fee=Math.max(4,10-s.hero.empathy);if(paid&&s.hero.gold<fee)return 'Not enough coins. The common room is free.';if(paid)s.hero.gold-=fee;s.hero.hp=paid?maxHp(s):Math.max(s.hero.hp,Math.ceil(maxHp(s)*.65));s.hero.mp=paid?maxMp(s):Math.max(s.hero.mp,Math.ceil(maxMp(s)*.5));s.dread=0;return paid?'A warm meal and a dreamless rest. Fully restored.':'You rest by the common-room fire. Some strength returns.';}
export function gainXp(s,n){if(!isDream(s))return 0;s.hero.xp+=n;let levels=0;while(s.hero.xp>=xpNeeded(s.hero.level)&&s.hero.level<25){s.hero.xp-=xpNeeded(s.hero.level);s.hero.level++;levels++;s.hero.hp=Math.min(maxHp(s),s.hero.hp+14);s.hero.mp=maxMp(s);}return levels;}
export function startBattle(s,id,boss=false){if(s.combat||s.scene==='town'||s.scene==='finale'||!ENEMIES[id])return false;const tier=isDream(s)&&!boss?s.dream:0,e=ENEMIES[id];s.combat={id,tier,hp:e.hp+tier*6,maxHp:e.hp+tier*6,phase:'ongoing',boss,turn:0,log:[e.name+' blocks your path.']};return true;}
export function battleAction(s,action,rng=Math.random){
 const b=s.combat;if(!b||b.phase!=='ongoing')return b;
 const enemy=ENEMIES[b.id];let damage=0,guard=false,consumeTurn=true;
 if(action==='attack'){damage=Math.max(1,attackPower(s)-enemy.defense+Math.floor(rng()*3));b.log.push('Your attack hits for '+damage+'.');}
 else if(action==='spark'||action==='sever'){
  const cost=action==='spark'?3:5;if(!isDream(s)){b.log.push('Dream powers do not work while awake.');return b;}if(action==='sever'&&s.hero.level<3){b.log.push('Sever unlocks at dream level 3.');return b;}if(s.hero.mp<cost){b.log.push('Not enough focus.');return b;}s.hero.mp-=cost;damage=(action==='spark'?10:19)+s.hero.level*2;b.log.push((action==='spark'?'Lucid spark':'Sever')+' deals '+damage+'.');
 }else if(action==='guard'){guard=true;s.hero.mp=Math.min(maxMp(s),s.hero.mp+2);b.log.push('You brace yourself and recover 2 focus.');}
 else if(action==='potion'||action==='tonic'){const used=useItem(s,action);b.log.push(used.message);if(!used.ok)return b;}
 else if(action==='flee'){if(rng()<.6+s.hero.courage*.07){b.phase='fled';b.log.push('You find a way out.');return b;}b.log.push('Your escape is cut off.');}
 else consumeTurn=false;
 if(!consumeTurn)return b;b.turn++;b.hp=Math.max(0,b.hp-damage);
 if(b.hp===0){b.phase='won';s.hero.gold+=enemy.gold;addItem(s,enemy.drop);const levels=gainXp(s,enemy.xp);b.log.push('Won '+enemy.gold+' coins and '+ITEMS[enemy.drop].name+(isDream(s)?' / '+enemy.xp+' dream XP.':'.'));if(levels)b.log.push('Dream level '+s.hero.level+'!'+(s.hero.level>=3?' Sever is available.':''));if(b.boss&&!s.defeated.includes(DREAMS[s.dream].id))s.defeated.push(DREAMS[s.dream].id);b.log=b.log.slice(-4);return b;}
 const hit=Math.max(1,enemy.attack+b.tier-defensePower(s)+Math.floor(rng()*3));const received=guard?Math.max(1,Math.floor(hit*.3)):hit;s.hero.hp=Math.max(0,s.hero.hp-received);b.log.push(enemy.name+' hits for '+received+'.');if(!s.hero.hp){b.phase='lost';b.log.push('The world slips away. Someone finds you before it is too late.');}b.log=b.log.slice(-4);return b;
}
export function randomEncounter(s,terrain,rng=Math.random){
 if(s.combat||s.scene==='town'||s.scene==='finale'||s.stage==='breach')return null;
 s.encounterClock++;const min=isDream(s)?14:17;
 if(s.encounterClock<min||['+','=','H','o','!','@'].includes(terrain))return null;
 const risk=isDream(s)?.12:['T','Y',';'].includes(terrain)?.17:.08;
 if(rng()>risk)return null;s.encounterClock=0;const list=isDream(s)?['moth','reflection','hound']:['wolf','slime','bandit'];return list[Math.min(2,Math.floor(rng()*3))];
}
const DIRS=[[0,-1],[1,0],[0,1],[-1,0]];
export function makeFinale(){
 const w=33,h=21,g=Array.from({length:h},()=>Array(w).fill('#'));
 const carve=(x1,y1,x2,y2)=>{for(let y=Math.min(y1,y2);y<=Math.max(y1,y2);y++)for(let x=Math.min(x1,x2);x<=Math.max(x1,x2);x++)g[y][x]='.';};
 carve(2,2,28,4);carve(26,4,28,9);carve(6,7,28,9);carve(6,9,8,15);carve(6,13,29,15);carve(27,15,29,18);g[18][28]='>';g[8][12]='h';
 return{width:w,height:h,grid:g,spawn:{x:3,y:3},stalker:{x:2,y:2},objects:[{x:28,y:18,type:'ending',label:'Wake',glyph:'>'},{x:12,y:8,type:'hide',label:'Hide',glyph:'h'}]};
}
export const localWalkable=(map,x,y)=>map.walk?map.walk[y]?.[x]===true:map.grid[y]?.[x]!==undefined&&!['#','^','T',' '].includes(map.grid[y][x]);
export function localRoute(map,start,end){if(!localWalkable(map,end.x,end.y))return null;const queue=[start],seen=new Set([start.x+','+start.y]),prev=new Map;for(let q=0;q<queue.length;q++){const p=queue[q];if(p.x===end.x&&p.y===end.y){const path=[];let k=p;while(k.x!==start.x||k.y!==start.y){path.push(k);k=prev.get(k.x+','+k.y);}return path.reverse();}for(const [dx,dy] of DIRS){const x=p.x+dx,y=p.y+dy,key=x+','+y;if(!localWalkable(map,x,y)||seen.has(key))continue;seen.add(key);prev.set(key,p);queue.push({x,y});}}return null;}
export function hideFromStalker(s){if(!['dream','finale'].includes(s.scene))return false;s.stalker.chasing=false;s.dread=Math.max(0,s.dread-35);s.hiddenSteps=6;return true;}
export function advanceStalker(s,map){
 s.dreamTicks++;if(s.scene==='dream'&&s.dreamTicks%2===0)s.dread=Math.min(100,s.dread+1);
 if(s.hiddenSteps>0){s.hiddenSteps--;s.stalker.chasing=false;return false;}
 if(s.dreamTicks<(s.scene==='finale'?5:22))return false;s.stalker.active=true;
 const distance=Math.abs(s.stalker.x-s.local.x)+Math.abs(s.stalker.y-s.local.y);
 const aligned=s.stalker.x===s.local.x||s.stalker.y===s.local.y;
 let visible=aligned; if(aligned){const dx=Math.sign(s.local.x-s.stalker.x),dy=Math.sign(s.local.y-s.stalker.y);let x=s.stalker.x+dx,y=s.stalker.y+dy;while(x!==s.local.x||y!==s.local.y){if(!localWalkable(map,x,y)){visible=false;break;}x+=dx;y+=dy;}}
 if((visible&&distance<=11)||s.dread>=65||s.scene==='finale')s.stalker.chasing=true;
 if(s.stalker.chasing&&s.dreamTicks%(s.scene==='finale'?2:3)===0){const path=localRoute(map,s.stalker,s.local);if(path?.length)s.stalker={...s.stalker,...path[0]};}
 return s.stalker.x===s.local.x&&s.stalker.y===s.local.y;
}

export function approachRoute(map,start,o){
 if(Math.abs(start.x-o.x)+Math.abs(start.y-o.y)<=1)return [];
 if(!o.mobile&&localWalkable(map,o.x,o.y))return localRoute(map,start,o);
 const options=DIRS.map(([dx,dy])=>localRoute(map,start,{x:o.x+dx,y:o.y+dy})).filter(Boolean);return options.sort((a,b)=>a.length-b.length)[0]||null;
}
export function tickTown(map,state,target=null){
 if(state.scene!=='town')return false;let changed=false;
 for(const a of map.actors||[]){
  if(Math.abs(a.x-state.local.x)+Math.abs(a.y-state.local.y)<=2||(a===target&&Math.abs(a.x-state.local.x)+Math.abs(a.y-state.local.y)<=6))continue;
  if(a.pause>0){a.pause--;continue;}
  const goal=a.route[a.waypoint%a.route.length],p=localRoute(map,a,goal);
  if(!p?.length){a.waypoint=(a.waypoint+1)%a.route.length;a.pause=2;continue;}
  const next=p[0];if(map.actors.some(b=>b!==a&&b.x===next.x&&b.y===next.y)||state.local.x===next.x&&state.local.y===next.y)continue;
  a.x=next.x;a.y=next.y;changed=true;
 }
 return changed;
}
