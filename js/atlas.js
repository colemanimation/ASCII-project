// Pure map and route logic, shared by the explorer, workshop, and tests.
export const TILES = {
 '~':{name:'Open water',color:'#385d6d',cost:1.25},
 '-':{name:'Coastal shallows',color:'#547f87',cost:1.15},
 '.':{name:'Meadow',color:'#9ab18b',cost:1},
 ',':{name:'Coastal grass',color:'#768974',cost:1},
 T:{name:'Old woodland',color:'#749574',cost:1.5},
 Y:{name:'Young woodland',color:'#8ba389',cost:1.3},
 '^':{name:'Mountain',color:'#b6b8a7',cost:Infinity},
 A:{name:'High peak',color:'#cad2c6',cost:Infinity},
 '/':{name:'Foothills',color:'#7b8475',cost:1.4},
 '\\':{name:'Foothills',color:'#7b8475',cost:1.4},
 "'":{name:'Snowfield',color:'#aabdb9',cost:1.3},
 '*':{name:'Snow',color:'#d2dcd0',cost:1.3},
 ':':{name:'Dunes',color:'#ac976b',cost:1.2},
 ';':{name:'Reeds & scrub',color:'#82815b',cost:1.2},
 '+':{name:'Old road',color:'#c2ac7e',cost:.8},
 '=':{name:'Bridge',color:'#d5c5a4',cost:.8},
 '"':{name:'Farmland',color:'#a09d65',cost:1},
 '#':{name:'Ruins',color:'#a8a28f',cost:1},
 H:{name:'Harbor',color:'#dbceb0',cost:1},
 o:{name:'Settlement',color:'#d6c9a6',cost:1},
 '!':{name:'Beacon',color:'#ead399',cost:1},
 '@':{name:'Observatory',color:'#dddcca',cost:1},
 O:{name:'Wonder',color:'#abc9bf',cost:1},
 '&':{name:'Standing stones',color:'#a4baab',cost:1},
 '%':{name:'Shipwreck',color:'#b9aa8d',cost:1},
 ' ':{name:'Open ground',color:'#2f4441',cost:1},
 '≈':{name:'Open water',color:'#385d6d',cost:1.25},
 '▲':{name:'High peak',color:'#cad2c6',cost:Infinity},
};
export function parseMap(text){
 const lines=text.replace(/\r/g,'').replace(/\n+$/,'').split('\n');
 const width=Math.max(...lines.map(l=>[...l].length));
 if(width<3||lines.length<3||width>512||lines.length>256)throw new Error('Use a text map between 3 × 3 and 512 × 256 characters.');
 if(lines.some(l=>/[\u0000-\u0009\u000b-\u001f]/.test(l)))throw new Error('Use printable characters, with no tabs.');
 return {width,height:lines.length,grid:lines.map(l=>[...l.padEnd(width,' ')])};
}
export const serializeMap=world=>world.grid.map(r=>r.join('')).join('\n')+'\n';
export const tileAt=(w,x,y)=>w.grid[y]?.[x];
export const costAt=(w,x,y)=>tileAt(w,x,y)===undefined?Infinity:(TILES[tileAt(w,x,y)]?.cost??1);
export const isWater=c=>c==='~'||c==='-'||c==='≈';
export function validPosition(w,p){return !!p&&Number.isInteger(p.x)&&Number.isInteger(p.y)&&Number.isFinite(costAt(w,p.x,p.y));}
export function nearestWalkable(w,p){
 if(validPosition(w,p))return {x:p.x,y:p.y};
 const x=Math.max(0,Math.min(w.width-1,Number.isFinite(p?.x)?Math.round(p.x):0));
 const y=Math.max(0,Math.min(w.height-1,Number.isFinite(p?.y)?Math.round(p.y):0));
 for(let r=0;r<Math.max(w.width,w.height);r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
  if(Math.abs(dx)!==r&&Math.abs(dy)!==r)continue;
  if(Number.isFinite(costAt(w,x+dx,y+dy)))return{x:x+dx,y:y+dy};
 }
 throw new Error('This map needs at least one walkable tile.');
}
// A* with a binary heap. Water is traversable with the traveler's folding skiff.
export function findRoute(world,start,end){
 if(!validPosition(world,start)||!validPosition(world,end))return null;
 const width=world.width, N=width*world.height, origin=start.y*width+start.x,goal=end.y*width+end.x;
 if(origin===goal)return [];
 const scores=new Float64Array(N).fill(Infinity),prev=new Int32Array(N).fill(-1),closed=new Uint8Array(N),heap=[];
 const push=(id,f)=>{let i=heap.length;heap.push({id,f});while(i>0){const p=(i-1)>>1;if(heap[p].f<=f)break;[heap[p],heap[i]]=[heap[i],heap[p]];i=p;}};
 const pop=()=>{const first=heap[0],last=heap.pop();if(heap.length){heap[0]=last;let i=0;while(true){let a=i*2+1,b=a+1,k=i;if(a<heap.length&&heap[a].f<heap[k].f)k=a;if(b<heap.length&&heap[b].f<heap[k].f)k=b;if(k===i)break;[heap[i],heap[k]]=[heap[k],heap[i]];i=k;}}return first.id;};
 scores[origin]=0;push(origin,0);
 while(heap.length){const id=pop();if(closed[id])continue;closed[id]=1;if(id===goal){const path=[];let curr=goal;while(curr!==origin){path.push({x:curr%width,y:Math.floor(curr/width)});curr=prev[curr];}return path.reverse();}
 const x=id%width,y=Math.floor(id/width);
 for(const [dx,dy] of [[0,1],[1,0],[0,-1],[-1,0]]){const nx=x+dx,ny=y+dy,cost=costAt(world,nx,ny);if(!Number.isFinite(cost))continue;const ni=ny*width+nx,score=scores[id]+cost;if(score<scores[ni]){scores[ni]=score;prev[ni]=id;push(ni,score+.8*(Math.abs(end.x-nx)+Math.abs(end.y-ny)));}}
 }
 return null;
}
export function sanitizeProgress(raw,world,metadata){
 const ids=new Set(metadata.places.map(p=>p.id)), beaconIds=new Set(metadata.places.filter(p=>p.kind==='beacon').map(p=>p.id));
 return {player:nearestWalkable(world,raw?.player||metadata.spawn),discovered:Array.isArray(raw?.discovered)?[...new Set(raw.discovered.filter(id=>ids.has(id)))]:[],lit:Array.isArray(raw?.lit)?[...new Set(raw.lit.filter(id=>beaconIds.has(id)))]:[],complete:raw?.complete===true&&new Set(Array.isArray(raw?.lit)?raw.lit.filter(id=>beaconIds.has(id)):[]).size===3};
}
