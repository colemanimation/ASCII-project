// Midrange chatter survives small phone speakers; no recorded speech or files.
export function chatterPitch(char,index){return 540+(char.toLowerCase().charCodeAt(0)%7)*31+(index%3)*13;}
export class TextSound{
 constructor(output){this.output=output;this.nodes=new Set;this.last=-1;}
 get ctx(){return this.output.ctx;}
 get enabled(){return this.output.enabled;}
 unlock(){return this.output.unlock();}
 tone(frequency,time,duration=.043,volume=.11){
  if(!this.output.ready)return;const ctx=this.ctx;
  const osc=ctx.createOscillator(),gain=ctx.createGain(),filter=ctx.createBiquadFilter();osc.type='triangle';osc.frequency.value=frequency;filter.type='lowpass';filter.frequency.value=2400;filter.Q.value=.45;
  gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(volume,time+.004);gain.gain.exponentialRampToValueAtTime(.0001,time+duration);
  osc.connect(filter);filter.connect(gain);gain.connect(this.output.master);this.nodes.add(osc);osc.onended=()=>{osc.disconnect();filter.disconnect();gain.disconnect();this.nodes.delete(osc);};osc.start(time);osc.stop(time+duration+.005);
 }
 tick(char,index){
  if(!this.output.ready||document.hidden)return;const now=this.ctx.currentTime;
  if(now-this.last<.055)return;this.last=now;this.tone(chatterPitch(char,index),now);
 }
 confirm(){if(!this.output.ready||document.hidden)return;this.stop();const now=this.ctx.currentTime;this.tone(660,now,.09,.16);this.tone(880,now+.11,.12,.16);}
 stop(){for(const node of this.nodes){try{node.stop();}catch{}}this.nodes.clear();this.last=-1;}
}
