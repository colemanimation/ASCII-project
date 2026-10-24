import {parseMap,serializeMap,TILES,costAt,isWater,findRoute,sanitizeProgress,nearestWalkable} from './atlas.js';
import {AtlasRenderer} from './render.js';
import {ChipPlayer} from './music.js';
import {SONGS} from './songs.js';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const SAVE='duskwatch-lantern-v1',EDIT='duskwatch-coast-edits-v1';
let world,meta,original,renderer,state,selected,mode='atlas',route=[],routeTimer=null,dialogue=null,toastTimer=null,undo=[],redo=[],stroke=null,brush='.',space=false,soundOn=false,hasStarted=false,storageWarningShown=false;
const chip=new ChipPlayer();
const portraits={
 harbor:["             |        ","        .   /|\\       ","       /_\\  |||   .    ","  _   |[]|  |||  /_\\  "," /_\\__|__|__|||__|[]|_ "," |[]|  []   []   |  | ","_|__|____________|__|_","  ~  ~   __|__  ~   ~ "," ~    ~  \\___/    ~   ","   ~    ~     ~    ~  "],
 beacon:["           *          ","       .   |   .      ","        \\  |  /       ","    ----[ * ]----     ","        /|_|\\         ","       /_____\        ","       |  :  |        ","       |  :  |        ","      /|  _  |\\       ","   __/ | | | | \\__    "," _/____|_|_|_|____\\_  "],
 village:["        .      .      ","         )    (       ","      ___|___ |       ","     /       \\|__     ","    /___/\\___\\  \\    ","    | [] || [] |__\\   "," ___|____||____|__|__ ","  T   ~   ~   ~   Y   "," /|\\    ~    ~   /|\\  "],
 ruin:["       .       *      ","   __           __    ","  |  |    _    |  |   "," _|  |___| |___|  |_  "," |   .     .       |  "," | []  /---\\  []   |  ","_|____|     |______|_ ","  .  *  .  . *   .    ","    /|\\    /|\\        "],
 observatory:["      *     .   *     ","   .    ___           ","       / . \\___       ","      /_____\\  \\===>  ","     |   o   |        ","    _|_______|_       ","   / | [] [] | \\      ","  /__|   _   |__\\     ","     |  | |  |        ","_____|__|_|__|_____   "],
 wonder:["        .    *        ","    /\\          /\\   ","   /  \\________/  \\  ","  /    ~  .  ~     \\ "," /  ~    *    ~     \\"," | ~   .   .   ~   | ","  \\   ~  *  ~    /  ","   \\____________/   ","      .     .        "]
};
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3700);}
function readStorage(key){try{return JSON.parse(localStorage.getItem(key));}catch{return null;}}
function store(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{if(!storageWarningShown){toast('Device storage is unavailable. Export your map to keep edits.');storageWarningShown=true;}}}
function save(){store(SAVE,{...state,hasStarted});}
function saveEdits(){store(EDIT,{text:serializeMap(world)});}
function refreshStats(){
 $('#beacon-count').textContent=state.lit.length+' / 3';$('#discovery-count').textContent=state.discovered.length+' / '+meta.places.length;
 $('#beacons').replaceChildren();
 for(const p of meta.places.filter(p=>p.kind==='beacon')){const b=document.createElement('button'),on=state.lit.includes(p.id);b.className=on?'lit':'';b.innerHTML='<span><span class="lamp">'+(on?'✦':'◇')+'</span><span></span></span><span>'+(on?'Alight':'Quiet')+'</span>';b.querySelector('span>span:last-child').textContent=p.name;b.addEventListener('click',()=>selectPlace(p,true));$('#beacons').append(b);}
 $('#quest-note').textContent=state.complete?'The old sky has found its way home.':state.lit.length===3?'All three lights are awake. Return to the Observatory.':'Explore the coast. Find the keepers.';
 const journal=$('#journal');journal.replaceChildren();
 if(!state.discovered.length){journal.innerHTML='<p>Your journal is waiting for its first story.</p>';}
 for(const id of [...state.discovered].reverse().slice(0,3)){const p=meta.places.find(p=>p.id===id);if(!p)continue;const row=document.createElement('p'),small=document.createElement('small');small.textContent='DISCOVERED / '+p.region.toUpperCase();row.textContent=p.name;row.append(small);journal.append(row);}
 renderer.lit=new Set(state.lit);renderer.discovered=new Set(state.discovered);renderer.complete=state.complete;
}
function updatePosition(){
 renderer.player=state.player;const c=world.grid[state.player.y][state.player.x];
 $('#coordinates').textContent=String(state.player.x).padStart(3,'0')+' E / '+String(state.player.y).padStart(3,'0')+' N';
 $('#terrain').textContent=mode==='explore'?(isWater(c)?'SAILING':'ON FOOT')+' · '+(TILES[c]?.name||'Uncharted ground').toUpperCase():mode==='workshop'?'WORKSHOP · '+world.width+' × '+world.height+' TILES':'ATLAS · '+meta.places.length+' PLACES TO FIND';
 const near=nearestPlace();$('#interact').disabled=!near;$('#interact').textContent=near?(near.kind==='beacon'?'Light / inspect':'Interact'):'Keep exploring';
 if(mode==='explore')for(const p of meta.places){if(Math.hypot(p.x-state.player.x,p.y-state.player.y)<=2&&!state.discovered.includes(p.id)){state.discovered.push(p.id);toast('Discovered '+p.name);selectPlace(p,false);refreshStats();save();}}
 const nearbySelected=selected&&Math.abs(selected.x-state.player.x)+Math.abs(selected.y-state.player.y)<=2;
 $('#visit').hidden=!(hasStarted&&nearbySelected&&mode==='explore');$('#travel').textContent=!hasStarted?'Begin expedition ↗':nearbySelected?(mode==='explore'?'Explore beyond ↗':'Resume expedition ↗'):'Chart a course ↗';
 if(selected)$('#visit').textContent=selected.kind==='beacon'&&!state.lit.includes(selected.id)?'Wake this beacon':selected.id==='observatory'&&state.lit.length===3&&!state.complete?'Restore the old sky':'Listen to its story';
 renderer.draw();
}
function selectPlace(p,focus=false){
 selected=p;renderer.selected=p.id;$('#place-picker').value=p.id;$('#place-kind').textContent=p.kind.toUpperCase();$('#place-number').textContent=String(meta.places.indexOf(p)+1).padStart(2,'0')+' / '+meta.places.length;$('#portrait').textContent=(portraits[p.kind]||portraits.wonder).join('\n');$('#place-region').textContent=p.region.toUpperCase();$('#place-name').textContent=p.name;$('#place-tag').textContent=p.tag;$('#place-description').textContent=p.description;
 if(focus&&renderer.zoom>1.25){renderer.cx=p.x;renderer.cy=p.y;}
 updatePosition();
}
function nearestPlace(){return meta.places.find(p=>Math.abs(p.x-state.player.x)+Math.abs(p.y-state.player.y)<=2);}
function setMode(next){
 stopRoute();mode=next;renderer.mode=mode;document.body.dataset.mode=mode;
 $$('.tabs button').forEach(b=>{b.classList.toggle('active',b.dataset.mode===mode);b.setAttribute('aria-pressed',b.dataset.mode===mode);});
 $('#workshop').hidden=mode!=='workshop';$('#travel-controls').hidden=mode!=='explore';$('#mode-status').textContent=mode==='atlas'?'THE KNOWN WORLD':mode==='explore'?'AN EXPEDITION IN PROGRESS':'THE CARTOGRAPHER’S WORKSHOP';
 $('#map-hint').textContent=mode==='workshop'?'Paint the land · Space + drag to pan':mode==='explore'?'Walk, sail, and follow your curiosity.':'Drag to wander · Scroll to look closer';
 if(mode==='explore'){
  hasStarted=true;state.player=nearestWalkable(world,state.player);renderer.zoom=Math.max(3.6,1/renderer.fitScale*.82);renderer.center(state.player);save();
 }else renderer.fit();
 updatePosition();
}
function stopRoute(){if(routeTimer)clearTimeout(routeTimer);routeTimer=null;route=[];if(renderer){renderer.route=route;renderer.draw();}$('#stop-route').hidden=true;}
function travelTo(target){
 if(!hasStarted){setMode('explore');toast('Your folding skiff is packed. The coast is yours.');return;}
 if(mode!=='explore')setMode('explore');stopRoute();
 const found=findRoute(world,state.player,target);if(found===null){toast('That tile is impassable. Try a road or a nearby shore.');return;}
 if(!found.length){const p=nearestPlace();if(p)interact(p);return;}
 route=found;renderer.route=route;$('#stop-route').hidden=false;toast('Course charted · '+route.length+' steps. Use any movement key to stop.');
 const step=()=>{
  if(!route.length||dialogue||document.hidden){stopRoute();return;}
  const next=route.shift();if(!Number.isFinite(costAt(world,next.x,next.y))){stopRoute();toast('The route is blocked.');return;}
  state.player=next;renderer.center(state.player);updatePosition();updateMusic();save();
  if(route.length)routeTimer=setTimeout(step,isWater(world.grid[next.y][next.x])?90:75);
  else{stopRoute();const near=nearestPlace();if(near)selectPlace(near);toast(near?'Arrived at '+near.name+'. Interact to hear its story.':'You have arrived.');}
 };step();
}
function move(dir){
 if(mode!=='explore'||anyDialog())return;
 stopRoute();const [dx,dy]={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[dir],nx=state.player.x+dx,ny=state.player.y+dy;
 if(!Number.isFinite(costAt(world,nx,ny))){toast('The peaks are too steep. Find a pass.');return;}
 const was=isWater(world.grid[state.player.y][state.player.x]);state.player={x:nx,y:ny};const now=isWater(world.grid[ny][nx]);if(was!==now)toast(now?'Your skiff unfolds. Fair winds.':'Boots on dry ground.');renderer.center(state.player);updatePosition();updateMusic();save();
}
function anyDialog(){return $$('dialog').some(d=>d.open);}
function interact(p=nearestPlace()){
 if(!p||anyDialog()||mode!=='explore')return;stopRoute();selectPlace(p);
 let lines=[...p.lines],finish=null;
 if(p.kind==='beacon'&&!state.lit.includes(p.id)){finish=()=>{state.lit.push(p.id);refreshStats();save();updatePosition();toast(state.lit.length===3?'Three lights awake. The Observatory is waiting.':p.name+' is alight.');if(soundOn)chip.chime();};}
 else if(p.kind==='beacon')lines=['The lantern burns steadily. Its keeper gives you a quiet nod.'];
 if(p.id==='observatory'){
  if(state.lit.length===3&&!state.complete){lines=['One by one, the lenses fill with light. The telescope turns by itself.','Above the coast, the lost constellations return. Every harbor sees them. Every road has a direction again.','You do not need to conquer a world to leave it brighter. Thank you, traveler.'];finish=()=>{state.complete=true;save();refreshStats();setMode('atlas');toast('THE LONG WAY HOME · Journey complete. Keep exploring, or make the coast your own.');if(soundOn)chip.chime();};}
  else if(state.complete)lines=['The sky is whole again. The coast is still full of little stories.','Your map has room for more. It always will.'];
  else lines=['The telescope is waiting for '+(3-state.lit.length)+' more beacon'+(state.lit.length===2?'':'s')+'. Find Mosswatch, Frostspire, and the Sunken Bell.'];
 }
 dialogue={lines,index:0,finish};$('#dialog-title').textContent=p.person;$('#dialog-eyebrow').textContent=p.name.toUpperCase();renderDialogue();$('#conversation').showModal();
}
function renderDialogue(){const d=dialogue;$('#dialog-text').textContent=d.lines[d.index];$('#dialog-page').textContent=String(d.index+1).padStart(2,'0')+' / '+String(d.lines.length).padStart(2,'0');$('#dialog-next').textContent=d.index===d.lines.length-1?(d.finish?'Keep the promise ↗':'Until next time ↗'):'Continue ↗';}
function advanceDialogue(){if(!dialogue)return;dialogue.index++;if(dialogue.index>=dialogue.lines.length){const finish=dialogue.finish;dialogue=null;$('#conversation').close();finish?.();}else renderDialogue();}
function updateMusic(){if(!soundOn)return;const p=state.player,track=p.x>213&&p.y>45?SONGS.dunes:p.y<38?SONGS.snow:SONGS.coast;chip.play(track);}
function commitStroke(){if(!stroke)return;if(stroke.size){undo.push([...stroke.values()]);if(undo.length>60)undo.shift();redo=[];saveEdits();}stroke=null;renderer.buildCache();updateEditButtons();renderer.draw();}
function updateEditButtons(){$('#undo').disabled=!undo.length;$('#redo').disabled=!redo.length;}
function paint(x,y,refresh=true){
 if(!stroke)stroke=new Map;const radius=(+$('#brush-size').value-1)/2;
 for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++){
  const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=world.width||yy>=world.height)continue;
  if(meta.places.some(p=>p.x===xx&&p.y===yy))continue;
  if(state.player.x===xx&&state.player.y===yy&&!Number.isFinite(TILES[brush]?.cost))continue;
  const key=yy*world.width+xx,old=world.grid[yy][xx];if(old===brush)continue;if(!stroke.has(key))stroke.set(key,{x:xx,y:yy,before:old,after:brush});else stroke.get(key).after=brush;world.grid[yy][xx]=brush;
 }
 if(refresh){renderer.buildCache();renderer.draw();}
}
function applyHistory(from,to){const s=from.pop();if(!s)return;to.push(s);for(const t of s)world.grid[t.y][t.x]=from===undo?t.before:t.after;renderer.buildCache();updateEditButtons();saveEdits();renderer.draw();}
function replaceWorld(next,custom=false){
 stopRoute();world=next;renderer.world=world;renderer.meta=custom?{...meta,regions:[],places:[]}:meta;
 state.player=nearestWalkable(world,state.player);undo=[];redo=[];renderer.buildCache();renderer.resize();renderer.fit();updateEditButtons();updatePosition();saveEdits();
}
function bindMap(){
 const canvas=$('#map'),pointers=new Map;let down=null,dragged=false,pinchDistance=0,multi=false;
 const pos=e=>{const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};};
 canvas.addEventListener('pointerdown',e=>{
  canvas.focus({preventScroll:true});canvas.setPointerCapture(e.pointerId);const p=pos(e);pointers.set(e.pointerId,p);
  if(pointers.size===2){if(stroke){for(const t of stroke.values())world.grid[t.y][t.x]=t.before;stroke=null;renderer.buildCache();renderer.draw();}multi=true;const a=[...pointers.values()];pinchDistance=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);return;}
  down=p;dragged=false;multi=false;
  if(mode==='workshop'&&!space){const t=renderer.tile(p.x,p.y);paint(t.x,t.y);}
 });
 canvas.addEventListener('pointermove',e=>{
  const p=pos(e),prev=pointers.get(e.pointerId);const t=renderer.tile(p.x,p.y);
  if(mode!=='explore'&&t.x>=0&&t.y>=0&&t.x<world.width&&t.y<world.height)$('#coordinates').textContent=String(t.x).padStart(3,'0')+' E / '+String(t.y).padStart(3,'0')+' N';
  if(!prev)return;pointers.set(e.pointerId,p);
  if(pointers.size===2){const a=[...pointers.values()],d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);renderer.zoomBy(d/Math.max(1,pinchDistance),(a[0].x+a[1].x)/2,(a[0].y+a[1].y)/2);renderer.pan((p.x-prev.x)/2,(p.y-prev.y)/2);pinchDistance=d;dragged=true;return;}
  if(multi)return;
  if(mode==='workshop'&&!space){const from=renderer.tile(prev.x,prev.y),n=Math.max(Math.abs(t.x-from.x),Math.abs(t.y-from.y),1);for(let i=1;i<=n;i++)paint(Math.round(from.x+(t.x-from.x)*i/n),Math.round(from.y+(t.y-from.y)*i/n),false);renderer.buildCache();renderer.draw();return;}
  if(down&&Math.hypot(p.x-down.x,p.y-down.y)>4)dragged=true;
  if(dragged)renderer.pan(p.x-prev.x,p.y-prev.y);
 });
 const end=(e,cancel=false)=>{
  const p=pos(e);pointers.delete(e.pointerId);commitStroke();
  if(!cancel&&!multi&&!dragged&&down&&mode!=='workshop'){
   const place=renderer.landmarkAt(p.x,p.y);if(place){selectPlace(place);if(mode==='explore')travelTo(place);}else if(mode==='explore'){const t=renderer.tile(p.x,p.y);travelTo(t);}
  }
  if(!pointers.size){down=null;multi=false;}
 };
 canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',e=>end(e,true));
 canvas.addEventListener('wheel',e=>{e.preventDefault();const p=pos(e);renderer.zoomBy(Math.exp(-e.deltaY*.0015),p.x,p.y);},{passive:false});
}
function bindControls(){
 $$('.tabs button').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
 $('#zoom-in').onclick=()=>renderer.zoomBy(1.35);$('#zoom-out').onclick=()=>renderer.zoomBy(1/1.35);$('#fit').onclick=()=>renderer.fit();
 $('#labels').onclick=()=>{renderer.labels=!renderer.labels;$('#labels').textContent='Labels '+(renderer.labels?'on':'off');$('#labels').setAttribute('aria-pressed',renderer.labels);renderer.draw();};
 $('#travel').onclick=()=>{if(mode==='explore'&&Math.abs(selected.x-state.player.x)+Math.abs(selected.y-state.player.y)<=2){renderer.center(state.player);toast('Use the arrows or click the map. The coast is yours.');}else travelTo(selected);};
 $('#place-picker').onchange=e=>selectPlace(meta.places.find(p=>p.id===e.target.value),true);
 $('#visit').onclick=()=>interact(selected);$('#interact').onclick=()=>interact();$('#center').onclick=()=>renderer.center(state.player);$('#stop-route').onclick=stopRoute;
 $('#help').onclick=()=>{stopRoute();$('#help-dialog').showModal();};$('#dialog-next').onclick=advanceDialogue;
 $('#conversation').addEventListener('cancel',()=>{dialogue=null;});
 $('#new-journey').onclick=()=>{$('#help-dialog').close();$('#journey-dialog').showModal();};$('#cancel-journey').onclick=()=>$('#journey-dialog').close();$('#confirm-journey').onclick=()=>{$('#journey-dialog').close();state=sanitizeProgress({},world,meta);hasStarted=false;refreshStats();selectPlace(meta.places[0]);setMode('atlas');save();toast('A fresh page. The coast is waiting.');};
 $('#sound').onclick=async()=>{
  if(soundOn){soundOn=false;chip.stop();}else{try{await chip.init();soundOn=true;updateMusic();}catch{toast('Audio is unavailable in this browser. You can keep exploring.');}}
  $('#sound').setAttribute('aria-pressed',soundOn);$('#sound span').textContent='Sound '+(soundOn?'on':'off');
 };
 let held=null,repeatTimer=null;const clearHold=()=>{held=null;clearTimeout(repeatTimer);repeatTimer=null;};
 const hold=dir=>{clearHold();held=dir;move(dir);const again=()=>{if(!held)return;move(held);repeatTimer=setTimeout(again,115);};repeatTimer=setTimeout(again,220);};
 $$('[data-dir]').forEach(b=>{
  b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);hold(b.dataset.dir);});b.addEventListener('pointerup',clearHold);b.addEventListener('pointercancel',clearHold);b.addEventListener('lostpointercapture',clearHold);
  b.addEventListener('click',e=>{if(e.detail===0)move(b.dataset.dir);});
 });
 const keys={arrowup:'up',w:'up',arrowdown:'down',s:'down',arrowleft:'left',a:'left',arrowright:'right',d:'right'};
 window.addEventListener('keydown',e=>{
  if(e.target.closest('input,textarea,select'))return;const k=e.key.toLowerCase();
  if(k==='escape'){stopRoute();return;}
  if(anyDialog()){
   if(dialogue&&(k==='enter'||k==='e'||k===' ')){e.preventDefault();if(!e.repeat)advanceDialogue();}return;
  }
  if(k===' '){space=true;if(e.target===$('#map'))e.preventDefault();return;}
  if(keys[k]&&mode==='explore'){e.preventDefault();if(!e.repeat)hold(keys[k]);}
  else if((k==='e'||k==='enter')&&mode==='explore'&&!e.target.closest('button,a')){e.preventDefault();interact();}
  else if(k==='c'&&mode==='explore')renderer.center(state.player);
  else if((e.ctrlKey||e.metaKey)&&k==='z'&&mode==='workshop'){e.preventDefault();applyHistory(e.shiftKey?redo:undo,e.shiftKey?undo:redo);}
 });
 window.addEventListener('keyup',e=>{if(e.key===' ')space=false;if(keys[e.key.toLowerCase()]===held)clearHold();});
 window.addEventListener('blur',()=>{clearHold();space=false;commitStroke();stopRoute();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){clearHold();stopRoute();chip.suspend();}else if(soundOn)chip.resume().catch(()=>toast('Tap Sound to resume the music.'));});
 const brushes=[['.','Meadow'],['T','Forest'],['^','Peaks'],["'",'Snow'],[':','Dunes'],['~','Water'],['+','Road'],['=','Bridge']];
 for(const [glyph,name] of brushes){const b=document.createElement('button');b.innerHTML='<b></b><span></span>';b.querySelector('b').textContent=glyph;b.querySelector('span').textContent=name;b.classList.toggle('active',glyph===brush);b.setAttribute('aria-pressed',glyph===brush);b.onclick=()=>{brush=glyph;$$('#brushes button').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',x===b);});};$('#brushes').append(b);}
 $('#undo').onclick=()=>applyHistory(undo,redo);$('#redo').onclick=()=>applyHistory(redo,undo);
 $('#export-map').onclick=()=>{const url=URL.createObjectURL(new Blob([serializeMap(world)],{type:'text/plain'})),a=document.createElement('a');a.href=url;a.download='duskwatch-lantern-coast.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Your atlas, saved as plain text.');};
 $('#import-map').onclick=()=>$('#map-file').click();
 $('#map-file').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>600000)throw new Error('Keep maps smaller than 600 KB.');const next=parseMap(await f.text());if(next.width!==meta.width||next.height!==meta.height)throw new Error('This expedition uses a '+meta.width+' × '+meta.height+' map. Export the coast as your template.');for(const p of meta.places)next.grid[p.y][p.x]=p.glyph;nearestWalkable(next,meta.spawn);replaceWorld(next);toast('Map imported. Paint it, explore it, or export a copy.');}catch(err){toast(err.message);}e.target.value='';};
 $('#reset-map').onclick=()=>$('#reset-dialog').showModal();$('#cancel-reset').onclick=()=>$('#reset-dialog').close();$('#confirm-reset').onclick=()=>{$('#reset-dialog').close();replaceWorld(parseMap(original));toast('The original coast is restored.');};
 new ResizeObserver(()=>renderer.resize()).observe($('#map-stage'));
 bindMap();
}
async function boot(){
 const responses=await Promise.all([fetch('data/maps/lantern_coast.txt'),fetch('data/maps/lantern_coast.json')]);if(responses.some(r=>!r.ok))throw new Error('The atlas could not be loaded. Refresh to try again.');
 [original,meta]=await Promise.all([responses[0].text(),responses[1].json()]);world=parseMap(original);const edited=readStorage(EDIT);
 if(typeof edited?.text==='string'){try{const candidate=parseMap(edited.text);if(candidate.width===meta.width&&candidate.height===meta.height){nearestWalkable(candidate,meta.spawn);world=candidate;}}catch{}}
 const raw=readStorage(SAVE);state=sanitizeProgress(raw,world,meta);hasStarted=raw?.hasStarted===true;
 renderer=new AtlasRenderer($('#map'),world,meta);if(world.width!==meta.width||world.height!==meta.height)renderer.meta={...meta,regions:[],places:[]};
 for(const p of meta.places){const option=document.createElement('option');option.value=p.id;option.textContent=p.name;$('#place-picker').append(option);}
 selected=meta.places.find(p=>Math.abs(p.x-state.player.x)+Math.abs(p.y-state.player.y)<=2)||meta.places[0];refreshStats();selectPlace(selected);bindControls();$('#loading').remove();
 const wanted=new URLSearchParams(location.search).get('mode');setMode(wanted==='workshop'?'workshop':'atlas');
 let last=0;const frame=time=>{if(!document.hidden&&time-last>120&&(mode==='explore'||state.lit.length)){renderer.draw(time);last=time;}requestAnimationFrame(frame);};requestAnimationFrame(frame);
}
boot().catch(err=>{const e=$('#loading');e.textContent=err.message;e.style.font='14px monospace';});
