// A short, quiet console chatter, synthesized locally with no audio downloads.
// Independent of the music switch; initialized only by a player's interaction.
export function chatterPitch(char,index){return 175+(char.toLowerCase().charCodeAt(0)%7)*17+(index%3)*9;}
export class TextSound{
 constructor(){this.ctx=null;this.nodes=new Set;this.last=-1;this.enabled=true;try{this.enabled=localStorage.getItem('feverwake-text-sound')!=='off';}catch{}}
 async unlock(){
  if(!this.enabled)return false;
  try{if(!this.ctx){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)throw new Error('Audio unavailable');this.ctx=new AC;}
   if(this.ctx.state==='suspended')await this.ctx.resume();return this.ctx.state==='running';
  }catch{this.enabled=false;return false;}
 }
 async toggle(){this.enabled=!this.enabled;this.stop();if(this.enabled)await this.unlock();try{localStorage.setItem('feverwake-text-sound',this.enabled?'on':'off');}catch{}}
 tick(char,index){
  const ctx=this.ctx;if(!this.enabled||!ctx||ctx.state!=='running'||document.hidden)return;
  const now=ctx.currentTime;if(now-this.last<.055)return;this.last=now;
  const osc=ctx.createOscillator(),gain=ctx.createGain(),filter=ctx.createBiquadFilter();osc.type='square';osc.frequency.value=chatterPitch(char,index);filter.type='lowpass';filter.frequency.value=1000;filter.Q.value=.45;
  gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(.032,now+.003);gain.gain.exponentialRampToValueAtTime(.0001,now+.027);
  osc.connect(filter);filter.connect(gain);gain.connect(ctx.destination);this.nodes.add(osc);osc.onended=()=>{osc.disconnect();filter.disconnect();gain.disconnect();this.nodes.delete(osc);};osc.start(now);osc.stop(now+.03);
 }
 stop(){for(const node of this.nodes){try{node.stop();}catch{}}this.nodes.clear();this.last=-1;}
}
