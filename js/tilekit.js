import {HARBOR_STAMPS} from './building-art.js?v=somnia-2';
// Printable-ASCII construction kit. Art and collision are separate layers.
// Spaces in a stamp are transparent; every other cell is solid unless specified.
export const STAMPS={
 ...HARBOR_STAMPS,
 pine:{art:['  ^  ',' /A\\ ','/AAA\\','  |  ']},
 tree:{art:[' .oo. ','(oooo)',' `||` ','  ||  ']},
 cottage:{art:['    /\\    ',' __/  \\__ ','/________\\','| []  [] |','|___++___|'],doors:[[4,4],[5,4]]},
 shop:{art:['    _______    ','   /__/__ /\\  ','  /__/___/  \\ ',' /___________\\',' | SUPPLIES  |',' | []  S  [] |',' |_____+_____|'],doors:[[7,6]],service:[7,6,'shop','Supply counter']},
 inn:{art:['       _n_       ','  ____/___\\____  ',' /__/__/__/__/\\ ','/____________/  \\','|  THE DRY NET  |','| [] [] I [] [] |','|______++_______|'],doors:[[7,6],[8,6]],service:[7,6,'inn','The Dry Net']},
 clinic:{art:['     _______     ',' ___/__/__/\\___ ','/______________\\','|  SLEEP WARD   |','| []   Q   []   |','|______++______|'],doors:[[7,5],[8,5]],service:[7,5,'clinic','Sleep ward']},
 well:{art:[' .---. ',' | o | ',' /===\\ ']},
 stall:{art:[' /======\\ ','/________\\','| $  $  | ','+-------+ ']},
 cart:{art:['  ______ ',' /_____/|',' O-----O ']},
 boat:{art:['      |\\     ','  ____|_\\___ ','  \\________/ ']},
 laundry:{art:['|-----------|','| [] [] []  |','|           |']},
 garden:{art:['+-----------+','|" " " " " "|','| " " " " " |','+-----------+']},
 bench:{art:['[=======]',' |     | ']},
 fountain:{art:['   .^.   ','  ( | )  ',' (_____) ','  \\___/  ']},
 tent:{art:['    /\\    ','   /==\\   ','  /====\\  ',' /__++__\\ '],doors:[[4,3],[5,3]]},
 tower:{art:['|_||_||_|','|       |','|  [_]  |','|       |','|___+___|'],doors:[[4,4]]}
};
export function canvasMap(width,height,fill=' ',walk=true){return {width,height,grid:Array.from({length:height},()=>Array(width).fill(fill)),walk:Array.from({length:height},()=>Array(width).fill(walk)),objects:[],actors:[],rooms:[],animations:[],gates:[]};}
export function put(map,x,y,glyph,walk){if(x<0||y<0||x>=map.width||y>=map.height)throw new Error('Stamp outside map: '+x+','+y);if(!/^[\x20-\x7e]$/.test(glyph))throw new Error('Non-ASCII tile');map.grid[y][x]=glyph;if(walk!==undefined)map.walk[y][x]=walk;}
export function rect(map,x,y,w,h,glyph='.',walk=true){for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)put(map,xx,yy,glyph,walk);}
export function path(map,points,glyph='.',width=1){for(let i=1;i<points.length;i++){let [x,y]=points[i-1];const [tx,ty]=points[i];while(x!==tx||y!==ty){rect(map,x,y,width,width,glyph,true);if(x!==tx)x+=Math.sign(tx-x);else y+=Math.sign(ty-y);}rect(map,x,y,width,width,glyph,true);}}
export function stamp(map,name,x,y,options={}){const tile=STAMPS[name];if(!tile)throw new Error('Unknown stamp '+name);tile.art.forEach((row,dy)=>[...row].forEach((ch,dx)=>{if(ch!==' ')put(map,x+dx,y+dy,ch,false);}));
 // Interior spaces are solid too: a roof is a building, not a dotted shortcut.
 const width=Math.max(...tile.art.map(r=>r.length));for(let dy=0;dy<tile.art.length;dy++){const row=tile.art[dy],first=row.search(/\S/),last=row.trimEnd().length-1;for(let dx=first;dx<=last;dx++)if(dx>=0){map.walk[y+dy][x+dx]=false;if(row[dx]===' ')map.grid[y+dy][x+dx]=' ';}}
 for(const [dx,dy] of tile.doors||[])put(map,x+dx,y+dy,'+',true);
 if(tile.service&&!options.noService){const [dx,dy,type,label]=tile.service;map.objects.push({x:x+dx,y:y+dy,type,label:options.label||label,glyph:type==='shop'?'S':type==='inn'?'I':'Q'});}
 return {x,y,width,height:tile.art.length};
}
export function object(map,x,y,type,glyph,label,extra={}){put(map,x,y,glyph,extra.walk!==false);const o={x,y,type,glyph,label,...extra};map.objects.push(o);return o;}
export function actor(map,x,y,glyph,name,route,type='townsperson',line='Good day to you.'){const a={x,y,glyph,name,label:name,type,route:route.map(([x,y])=>({x,y})),waypoint:0,pause:0,facing:'down',line,mobile:true};map.objects.push(a);map.actors.push(a);return a;}
export function textMap(map,includeActors=true){const grid=map.grid.map(row=>[...row]);for(const o of map.objects)if(!o.mobile||includeActors)grid[o.y][o.x]=o.glyph||grid[o.y][o.x];if(map.spawn)grid[map.spawn.y][map.spawn.x]='@';return grid.map(r=>r.join('')).join('\n')+'\n';}
export function validateMap(map){if(map.grid.some(r=>r.length!==map.width)||map.grid.length!==map.height)throw new Error('Map dimensions differ');if(!/^[\x20-\x7e\n]+$/.test(textMap(map)))throw new Error('ASCII only');for(const o of map.objects)if(!map.grid[o.y]?.[o.x])throw new Error('Object outside map');return true;}
