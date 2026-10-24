import {TOWN_BLUEPRINTS,buildTown} from './towns.js?v=terminal-1';
import {STAMPS,textMap} from './tilekit.js?v=terminal-1';
import {approachRoute,localRoute} from './rpg.js?v=terminal-1';
import {terminalFrames} from './terminal.js?v=terminal-1';
const $=id=>document.getElementById(id);let map,blueprint,collision=false;
terminalFrames();
for(const [id,b] of Object.entries(TOWN_BLUEPRINTS)){const o=document.createElement('option');o.value=id;o.textContent=b.name;$('village').append(o);}
for(const name of Object.keys(STAMPS)){const o=document.createElement('option');o.value=name;o.textContent=name;$('tile').append(o);}
function draw(){$('preview').textContent=collision?map.walk.map(row=>row.map(c=>c?'.':'#').join('')).join('\n'):textMap(map);$('toggle-collision').textContent=collision?'Show artwork':'Show collision';}
function compile(){try{const candidate=JSON.parse($('blueprint').value),built=buildTown(candidate);for(const o of built.objects){if(!approachRoute(built,built.spawn,o))throw new Error('No route to '+o.label);for(const p of o.route||[])if(!localRoute(built,o,p))throw new Error('Blocked waypoint for '+o.label);}blueprint=candidate;map=built;draw();$('status').textContent='OK / '+map.width+' x '+map.height+' characters. Printable ASCII, services and resident routes verified.';}catch(e){$('status').textContent='ERROR / '+e.message+' The last valid map is still shown.';}}
function reset(){$('blueprint').value=JSON.stringify(TOWN_BLUEPRINTS[$('village').value],null,2);compile();}
function tile(){const t=STAMPS[$('tile').value];$('tile-art').textContent=t.art.join('\n');}
function download(name,content,type='text/plain'){const url=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('compile').onclick=compile;$('reset').onclick=reset;$('village').onchange=reset;$('tile').onchange=tile;$('toggle-collision').onclick=()=>{collision=!collision;draw();};$('export-text').onclick=()=>download('village.txt',textMap(map));$('export-blueprint').onclick=()=>download('village.blueprint.json',JSON.stringify(blueprint,null,2),'application/json');$('export-map').onclick=()=>download('village.json',JSON.stringify({blueprint,grid:map.grid.map(r=>r.join('')),collision:map.walk.map(r=>r.map(v=>v?'0':'1').join('')),spawn:map.spawn,objects:map.objects},null,2),'application/json');reset();tile();
