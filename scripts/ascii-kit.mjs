#!/usr/bin/env node
// Blueprint -> printable mockup + collision/object data. The game uses this compiler too.
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
const base=existsSync(new URL('../dist/index.html',import.meta.url))?'../dist/':'../';
const {TOWN_BLUEPRINTS,buildTown}=await import(new URL(base+'js/towns.js',import.meta.url));
const {STAMPS,textMap,validateMap}=await import(new URL(base+'js/tilekit.js',import.meta.url));
const {approachRoute,localRoute}=await import(new URL(base+'js/rpg.js',import.meta.url));
function build(blueprint,prefix){const map=buildTown(blueprint);validateMap(map);for(const o of map.objects){if(!approachRoute(map,map.spawn,o))throw Error('Unreachable: '+o.label);for(const p of o.route||[])if(!localRoute(map,o,p))throw Error('Blocked waypoint: '+o.label);}mkdirSync(dirname(prefix),{recursive:true});writeFileSync(prefix+'.txt',textMap(map));writeFileSync(prefix+'.json',JSON.stringify({blueprint,grid:map.grid.map(r=>r.join('')),collision:map.walk.map(r=>r.map(c=>c?'0':'1').join('')),spawn:map.spawn,objects:map.objects},null,2)+'\n');console.log('Built '+prefix+' (.txt + .json); ASCII, collision and service access verified.');}
const [command,file,out]=process.argv.slice(2);
if(command==='compile'){if(!file||!out)throw Error('Usage: node scripts/ascii-kit.mjs compile blueprint.json output-prefix');build(JSON.parse(readFileSync(file,'utf8')),resolve(out));}
else if(command==='export'){const root=new URL(base+'data/towns/',import.meta.url);mkdirSync(root,{recursive:true});for(const [id,b] of Object.entries(TOWN_BLUEPRINTS)){writeFileSync(new URL(id+'.blueprint.json',root),JSON.stringify(b,null,2)+'\n');build(b,new URL(id,root).pathname);}const sheet=Object.entries(STAMPS).map(([name,s])=>'['+name.toUpperCase()+']\n'+s.art.join('\n')).join('\n\n');writeFileSync(new URL(base+'data/towns/tileset.txt',import.meta.url),sheet+'\n');}
else{console.log('Feverwake ASCII kit\n  export                              Build the shipped towns and tile sheet\n  compile blueprint.json output-name  Compile an edited mockup\n\nEdit stamp placements, roads, water, and NPC walking routes in a blueprint.');}
