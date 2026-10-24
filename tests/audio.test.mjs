import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
const root=existsSync(new URL('../dist/index.html',import.meta.url))?'../dist/':'../';
const {AudioOutput}=await import(new URL(root+'js/audio-output.js',import.meta.url));
const {TextSound,chatterPitch}=await import(new URL(root+'js/text-sound.js',import.meta.url));
const {ChipPlayer}=await import(new URL(root+'js/music.js',import.meta.url));
function environment(stored=null){
 const contexts=[],nodes=[],events=[],storage=new Map(stored?[['feverwake-sound',stored]]:[]);
 const parameter=()=>({value:0,setValueAtTime(){},linearRampToValueAtTime(v){events.push(['gain',v]);},exponentialRampToValueAtTime(){}});
 class Context{
  constructor(){this.state='suspended';this.currentTime=1;this.sampleRate=44100;this.destination={};this.resumes=0;contexts.push(this);}
  createBuffer(){return {};}
  createBufferSource(){return {connect(){},disconnect(){},start(){events.push(['prime']);}};}
  createOscillator(){const n={frequency:{value:0},connect(){},disconnect(){},start(t){events.push(['start',t]);},stop(t){events.push(['stop',t]);}};nodes.push(n);return n;}
  createGain(){return {gain:parameter(),connect(){},disconnect(){}};}
  createBiquadFilter(){return {frequency:{},Q:{},connect(){},disconnect(){}};}
  resume(){this.resumes++;this.state='running';return Promise.resolve();}
  close(){this.state='closed';return Promise.resolve();}
  suspend(){this.state='suspended';return Promise.resolve();}
 }
 const globals={window:{AudioContext:Context},document:{hidden:false},navigator:{audioSession:{type:'auto'}},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)}};
 const original={};for(const [k,v] of Object.entries(globals)){original[k]=Object.getOwnPropertyDescriptor(globalThis,k);Object.defineProperty(globalThis,k,{value:v,configurable:true,writable:true});}
 return {contexts,nodes,events,storage,restore(){for(const k of Object.keys(globals)){if(original[k])Object.defineProperty(globalThis,k,original[k]);else delete globalThis[k];}}};
}
test('music and speech share a primed playback session and recover from interruption',async()=>{
 const e=environment();try{
  const output=new AudioOutput,speech=new TextSound(output),music=new ChipPlayer(output);
  assert.equal(output.ready,false);assert.equal(await output.unlock(),true);assert.equal(navigator.audioSession.type,'playback');assert.equal(e.contexts.length,1);assert.equal(music.ctx,speech.ctx);assert.equal(e.events[0][0],'prime');
  output.ctx.state='interrupted';assert.equal(await music.init(),true);assert.equal(output.ctx.resumes,2);assert.equal(e.contexts.length,1);
  speech.tick('a',2);music.note(72,1,.15);assert.equal(e.nodes.length,2);
 }finally{e.restore();}
});
test('muting silences the common output, remembers the choice, and enabling uses a fresh context',async()=>{
 const e=environment();try{
  const output=new AudioOutput;await output.unlock();const old=output.ctx,bus=output.master;
  await output.setEnabled(false);assert.equal(bus.gain.value,0);assert.equal(old.state,'closed');assert.equal(output.ready,false);assert.equal(navigator.audioSession.type,'auto');assert.equal(e.storage.get('feverwake-sound'),'off');
  const speech=new TextSound(output);speech.tick('a',2);assert.equal(e.nodes.length,0);
  await output.setEnabled(true);assert.notEqual(output.ctx,old);assert.equal(output.ready,true);speech.confirm();assert.equal(e.nodes.length,2);assert.equal(e.storage.get('feverwake-sound'),'on');
 }finally{e.restore();}
});
test('phone chatter is rate limited, audible-range, and cancelled on skip or background',async()=>{
 const e=environment();try{
  const output=new AudioOutput,speech=new TextSound(output);await output.unlock();speech.tick('a',2);speech.tick('b',4);assert.equal(e.nodes.length,1);assert.ok(chatterPitch('a',2)>=540);assert.ok(e.events.some(([name,v])=>name==='gain'&&v>=.1));
  const start=e.events.find(x=>x[0]==='start')[1],stop=e.events.find(x=>x[0]==='stop')[1];assert.ok(stop-start<.05);
  output.ctx.currentTime+=.1;document.hidden=true;speech.tick('c',6);assert.equal(e.nodes.length,1);speech.stop();assert.equal(speech.nodes.size,0);
 }finally{e.restore();}
});
test('stored mute does not create an audio context until explicitly enabled',async()=>{
 const e=environment('off');try{const output=new AudioOutput;assert.equal(await output.unlock(),false);assert.equal(e.contexts.length,0);await output.setEnabled(true);assert.equal(output.ready,true);}finally{e.restore();}
});
test('muting while resume is pending cannot turn sound back on',async()=>{
 const e=environment();try{
  let release;const original=window.AudioContext.prototype.resume;window.AudioContext.prototype.resume=function(){return new Promise(resolve=>release=()=>{this.state='running';resolve();});};
  const output=new AudioOutput,pending=output.unlock();await output.setEnabled(false);release();assert.equal(await pending,false);assert.equal(output.ready,false);window.AudioContext.prototype.resume=original;
 }finally{e.restore();}
});
