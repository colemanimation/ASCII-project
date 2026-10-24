import {canvasMap,put,rect,path,object} from './tilekit.js?v=compact-1';
export const DREAM_LAYOUTS=[
 {name:'The Endless Nursery',spawn:[8,34],stalker:[55,34],rooms:[['FOYER',2,27,15,11],['PLAYROOM',2,3,18,15],['CLOCKWORK',25,3,18,12],['NURSERY',47,4,15,16],['LANDING',24,19,18,13],['ATTIC',47,25,15,13]],
 links:[[[9,32],[9,10]],[[11,10],[34,10]],[[34,10],[34,25]],[[9,31],[28,31],[28,25]],[[34,28],[54,28]],[[38,23],[44,23],[44,16],[53,16]]],
 key:[15,10,'A tin horse','A small key is sewn into the toy horse. The tag reads: WIND THE CLOCK BEFORE BED.'],lever:[38,8,'The unwound clock','You turn the spring. The skittering floorboards settle. A latch clicks somewhere in the nursery.'],gate:[46,16,'The nursery door',['key','lever']],
 boss:[54,11],anchor:[58,7],chests:[[6,6],[54,33]],hides:[[26,27],[5,32]],notes:[[13,34,'A drawing on the wall','Theo has drawn the house from above. The playroom and clock workshop are circled. The nursery has no door handle.'],[29,6,'A torn bedtime rule','First, find the key in the toy horse. Then wind the clock. The nursery must be quiet before the door will open.']],
 furniture:[['crib',50,6],['crib',50,14],['blocks',5,12],['blocks',11,5],['shelf',27,9],['table',29,21],['crates',49,28]],hazards:[[9,23],[19,31],[37,28]],mechanism:'clock'},
 {name:'The School After Midnight',spawn:[7,18],stalker:[30,18],rooms:[['CLASSROOM',2,2,25,13],['LIBRARY',36,2,26,13],['ASSEMBLY',2,23,25,15],['HEADMASTER',42,22,20,16],['CLOAKROOM',3,16,16,6]],
 links:[[[8,18],[8,8]],[[15,8],[48,8]],[[8,18],[8,29]],[[18,29],[50,29]],[[29,8],[29,19],[20,19],[20,29]],[[48,8],[55,8],[55,29]]],
 key:[53,7,'The missing register page','You find Iven\'s name on a loose page. There is a line beside it: PRESENT WHEN THE BELL HAS RUNG.'],lever:[8,31,'The assembly bell','The bell rings once. Empty chairs scrape back across the floor. The attendance seal on the headmaster\'s door loosens.'],gate:[39,29,'The attendance seal',['key','lever']],secondGate:[55,18],
 boss:[53,28],anchor:[57,25],chests:[[6,5],[38,11]],hides:[[15,19],[23,34]],notes:[[12,18,'The lesson board','The register went missing in the library. Assembly cannot finish until everyone is accounted for.'],[25,8,'A chalk message','Find the missing name. Ring the assembly bell. The library stair is a second way to the headmaster.']],
 furniture:[['desk',5,7],['desk',12,7],['desk',19,7],['desk',5,11],['desk',12,11],['desk',19,11],['shelf',38,5],['shelf',45,10],['shelf',53,10],['desk',12,26],['desk',19,26],['desk',12,32],['desk',19,32],['table',46,32]],hazards:[[30,8],[29,16],[32,29]],mechanism:'bell'},
 {name:'The House Beneath the Tide',spawn:[8,33],stalker:[55,32],rooms:[['HALL',2,26,18,12],['CELLAR',2,2,18,15],['GALLERY',27,2,18,15],['GUEST ROOM',48,3,14,18],['DINING ROOM',24,24,20,14],['KITCHEN',48,27,14,11]],
 links:[[[9,33],[9,9]],[[10,10],[36,10]],[[36,10],[36,31]],[[9,33],[35,33]],[[36,31],[55,31]],[[36,12],[55,12]],[[55,12],[55,32]]],
 key:[36,7,'The family photograph','Behind the photograph is a small brass key. The guest has scratched its own face into the empty place at the table.'],lever:[12,7,'The cellar pump','You work the pump until the pipes shudder. Water drains out of the gallery passages. Somewhere upstairs, somebody starts breathing.'],gate:[46,12,'The guest-room lock',['key']],secondGate:[55,24],
 boss:[55,12],anchor:[58,7],chests:[[6,29],[55,33]],hides:[[17,32],[39,34]],notes:[[14,30,'A list in the hall','CELLAR: pump out the tide. GALLERY: find our photograph. GUEST ROOM: do not let it learn your name.'],[29,28,'A place at the table','There are three plates, four shadows, and one set of footprints under the table.']],
 furniture:[['barrels',5,4],['barrels',5,12],['portrait',30,4],['portrait',39,11],['table',29,30],['bed',50,5],['stove',50,29]],hazards:[[9,20],[23,33]],floods:[[21,9,5,3],[35,18,3,5]],mechanism:'pump'}
];
const FURNITURE={crib:['[===]','|   |'],bed:['[=]','|_|'],blocks:['a b',' c '],shelf:['|===|','|===|'],table:['.----.','|____|'],crates:['[x][x]','[x][x]'],desk:['[__]',' || '],barrels:['(o)(o)'],portrait:['[o]',' | '],stove:['[###]','|_O_|']};
function room(m,name,x,y,w,h){rect(m,x,y,w,h,'.',true);for(let xx=x;xx<x+w;xx++){put(m,xx,y,'-',false);put(m,xx,y+h-1,'-',false);}for(let yy=y;yy<y+h;yy++){put(m,x,yy,'|',false);put(m,x+w-1,yy,'|',false);}for(const [xx,yy] of [[x,y],[x+w-1,y],[x,y+h-1],[x+w-1,y+h-1]])put(m,xx,yy,'+',false);m.rooms.push({name,x:x+1,y:y+1,w:w-2,h:h-2});}
function corridor(m,points){for(let i=1;i<points.length;i++){let [x,y]=points[i-1];const [tx,ty]=points[i];while(x!==tx||y!==ty){rect(m,x-1,y-1,3,3,'.',true);if(x!==tx)x+=Math.sign(tx-x);else y+=Math.sign(ty-y);}rect(m,x-1,y-1,3,3,'.',true);}}
function gate(m,x,y,label,requires,index,horizontal=true,id='main'){const cells=horizontal?[[x,y-1],[x,y],[x,y+1]]:[[x-1,y],[x,y],[x+1,y]];for(const [xx,yy] of cells)put(m,xx,yy,'+',false);const g={x,y,type:'gate',glyph:'+',label,requires,cells,flag:index+':gate:'+id};m.gates.push(g);m.objects.push(g);}
export function makeDream(index=0,state={}){const b=DREAM_LAYOUTS[index],m=canvasMap(64,40,' ',false);m.kind='dream';m.index=index;m.name=b.name;m.spawn={x:b.spawn[0],y:b.spawn[1]};m.stalker={x:b.stalker[0],y:b.stalker[1]};m.mechanism=b.mechanism;
 for(const r of b.rooms)room(m,...r);for(const link of b.links)corridor(m,link);
 // Give corridors readable walls without filling the black void with noise.
 const original=m.grid.map(r=>[...r]);for(let y=1;y<39;y++)for(let x=1;x<63;x++)if(original[y][x]===' '&&[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>original[y+dy][x+dx]==='.'))put(m,x,y,'#',false);
 for(const [kind,x,y] of b.furniture)FURNITURE[kind].forEach((row,dy)=>[...row].forEach((ch,dx)=>{if(ch!==' ')put(m,x+dx,y+dy,ch,false);}));
 object(m,...b.spawn,'exit','>','Wake');object(m,b.key[0],b.key[1],'key','k',b.key[2],{description:b.key[3],flag:index+':key'});object(m,b.lever[0],b.lever[1],'lever','L',b.lever[2],{description:b.lever[3],flag:index+':lever'});
 object(m,...b.boss,'boss','B','Guardian');object(m,...b.anchor,'anchor','!','Memory anchor');for(const [x,y] of b.chests)object(m,x,y,'chest','$','Chest');for(const [x,y] of b.hides)object(m,x,y,'hide','h','Hide');for(const [x,y,label,description] of b.notes)object(m,x,y,'lore','?',label,{description});
 for(const [x,y] of b.hazards)put(m,x,y,'%',true);gate(m,b.gate[0],b.gate[1],b.gate[2],b.gate[3],index);
 if(b.secondGate)gate(m,...b.secondGate,'The other entrance',b.gate[3],index,false,'rear');
 m.floods=b.floods||[];m.baseGrid=m.grid.map(r=>[...r]);m.baseWalk=m.walk.map(r=>[...r]);syncDreamMap(m,state);return m;
}
export function syncDreamMap(m,s){if(m.kind!=='dream')return;const flags=s.dreamFlags||[];m.grid=m.baseGrid.map(r=>[...r]);m.walk=m.baseWalk.map(r=>[...r]);const lever=flags.includes(m.index+':lever');
 for(const [x,y,w,h] of m.floods)rect(m,x,y,w,h,lever?'.':'~',lever);
 for(const g of m.gates){const open=flags.includes(g.flag);for(const [x,y] of g.cells)put(m,x,y,open?'/':'+',open);g.open=open;g.glyph=open?'/':'+';}
 for(const o of m.objects){if(o.type==='key'&&flags.includes(o.flag))m.grid[o.y][o.x]='.';if(o.type==='lever'&&flags.includes(o.flag))m.grid[o.y][o.x]='l';}
 if(lever)for(let y=0;y<m.height;y++)for(let x=0;x<m.width;x++)if(m.grid[y][x]==='%')m.grid[y][x]='.';
 m.hazardsActive=!lever;
}
export function operateDream(s,m,o){s.dreamFlags=s.dreamFlags||[];if(o.type==='lore')return{ok:true,title:o.label,message:o.description};if(o.type==='key'||o.type==='lever'){
 if(s.dreamFlags.includes(o.flag))return{ok:false,title:o.label,message:o.type==='key'?'You already took the key.':'The mechanism is already running.'};s.dreamFlags.push(o.flag);syncDreamMap(m,s);return{ok:true,title:o.label,message:o.description};}
 if(o.type==='gate'){if(o.open)return{ok:true,title:o.label,message:'The passage is open.'};const missing=o.requires.filter(k=>!s.dreamFlags.includes(m.index+':'+k));if(missing.length)return{ok:false,title:o.label,message:missing.includes('key')?'Locked. Find the memory key marked k.':'The key fits, but something still holds the lock. Find and operate L.'};s.dreamFlags.push(o.flag);syncDreamMap(m,s);return{ok:true,title:o.label,message:'The lock gives. A new passage opens. Your key is not consumed.'};}
 return{ok:false,title:'Nothing happens',message:'There is nothing to use here.'};}
export function roomAt(m,p){return m.rooms?.find(r=>p.x>=r.x&&p.x<r.x+r.w&&p.y>=r.y&&p.y<r.y+r.h)?.name||'PASSAGE';}
