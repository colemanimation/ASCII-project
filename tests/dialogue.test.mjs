import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
const root=existsSync(new URL('../dist/index.html',import.meta.url))?'../dist/':'../';
const {DialoguePlayer,splitDialogue,revealDelay,mouthPose}=await import(new URL(root+'js/dialogue.js',import.meta.url));
const {MARA}=await import(new URL(root+'js/portraits.js',import.meta.url));
const {TextSound}=await import(new URL(root+'js/text-sound.js',import.meta.url));
function clock(){let serial=0;const tasks=new Map;return {schedule(fn,delay){tasks.set(++serial,{fn,delay});return serial;},cancel(id){tasks.delete(id);},step(){const [id,task]=tasks.entries().next().value||[];if(!task)return;tasks.delete(id);task.fn();return task.delay;},get size(){return tasks.size;}};}
test('four distinct printable ASCII mouth poses keep every other character fixed',()=>{
 const {columns,rows,frames,mouthBounds:[x0,y0,x1,y1]}=MARA;assert.equal(new Set(Object.values(frames).map(a=>a.join('\n'))).size,4);
 for(const lines of Object.values(frames)){assert.equal(lines.length,rows);for(let y=0;y<rows;y++){assert.equal(lines[y].length,columns);assert.match(lines[y],/^[\x20-\x7e]+$/);for(let x=0;x<columns;x++)if(x<x0||x>=x1||y<y0||y>=y1)assert.equal(lines[y][x],frames.closed[y][x]);}}
});
test('small dialogue pages retain all words and their order',()=>{
 const text='Theo has been asleep for six days. He keeps calling for a door that does not exist. Come find me in Brackenport. I think you can reach him.';
 for(const size of [115,165,210]){const pages=splitDialogue(text,size);assert.equal(pages.join(' '),text);assert.ok(pages.every(p=>p.length<=size));}assert.ok(revealDelay('.')>revealDelay(','));assert.ok(revealDelay(',')>revealDelay('a'));assert.equal(mouthPose(' '),'closed');assert.equal(mouthPose('o'),'round');
});
test('skipping a line closes the mouth, reveals everything, and cancels all later ticks',()=>{
 const c=clock(),updates=[],ticks=[];let complete=0;const p=new DialoguePlayer({text:'A door, breathing.',schedule:c.schedule,cancel:c.cancel,onUpdate:(t,pose)=>updates.push([t,pose]),onTick:x=>ticks.push(x),onComplete:()=>complete++});
 p.start();for(let i=0;i<6;i++)c.step();assert.ok(ticks.length>0);assert.ok(updates.some(([t,pose])=>pose!=='closed'));p.finish();const before=ticks.length;for(let i=0;i<20;i++)c.step();p.finish();assert.deepEqual(updates.at(-1),['A door, breathing.','closed']);assert.equal(ticks.length,before);assert.equal(c.size,0);assert.equal(complete,1);
});
test('closing a speaking window and reduced motion leave no running animation',()=>{
 const c=clock();let ended=0,ticks=0;const make=reduced=>new DialoguePlayer({text:'A voice.',schedule:c.schedule,cancel:c.cancel,reduced,onTick:()=>ticks++,onComplete:()=>ended++});const p=make(false);p.start();c.step();p.dispose();assert.equal(c.size,0);assert.equal(ended,0);const q=make(true);q.start();assert.equal(c.size,0);assert.equal(ended,1);assert.equal(ticks,0);
});
test('text sound is brief, rate limited, and stops when muted or hidden',async()=>{
 const nodes=[],values=[];class Context{constructor(){this.state='running';this.currentTime=1;this.destination={};}createOscillator(){const n={frequency:{value:0},connect(){},disconnect(){},start(t){values.push(['start',t]);},stop(t){values.push(['stop',t]);}};nodes.push(n);return n;}createGain(){return {gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}};}createBiquadFilter(){return {frequency:{},Q:{},connect(){},disconnect(){}};}}
 globalThis.window={AudioContext:Context};globalThis.document={hidden:false};globalThis.localStorage={getItem:()=>null,setItem(){}};
 try{const s=new TextSound;await s.unlock();s.tick('a',2);s.tick('b',4);assert.equal(nodes.length,1);assert.ok(values[1][1]-values[0][1]<=.031);s.ctx.currentTime+=.1;document.hidden=true;s.tick('c',6);assert.equal(nodes.length,1);document.hidden=false;await s.toggle();assert.equal(s.nodes.size,0);s.tick('d',8);assert.equal(nodes.length,1);}finally{delete globalThis.window;delete globalThis.document;delete globalThis.localStorage;}
});
