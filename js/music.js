// One shared audio graph. Track changes reuse the context; identical songs keep playing.
export class ChipPlayer{
 constructor(output){this.output=output;this.song=null;this.timer=null;this.nodes=new Set;this.step=0;this.next=0;}
 get ctx(){return this.output.ctx;}
 get master(){return this.output.musicBus;}
 init(){return this.output.unlock();}
 note(midi,time,duration,type='triangle',volume=.2){
  if(midi==null||!this.output.ready)return;const osc=this.ctx.createOscillator(),gain=this.ctx.createGain();osc.type=type;osc.frequency.value=440*Math.pow(2,(midi-69)/12);gain.gain.setValueAtTime(.0001,time);gain.gain.linearRampToValueAtTime(volume,time+.012);gain.gain.exponentialRampToValueAtTime(.0001,time+duration);osc.connect(gain);gain.connect(this.master);this.nodes.add(osc);osc.onended=()=>{osc.disconnect();gain.disconnect();this.nodes.delete(osc);};osc.start(time);osc.stop(time+duration+.02);
 }
 play(song){if(!this.output.ready||this.song===song)return;this.stop();this.song=song;this.step=0;this.next=this.ctx.currentTime+.04;this.timer=setInterval(()=>this.schedule(),40);this.schedule();}
 schedule(){
  if(!this.song||!this.output.ready)return;
  if(this.next<this.ctx.currentTime-.2)this.next=this.ctx.currentTime+.025;
  const song=this.song,dur=60/song.bpm/2;
  while(this.next<this.ctx.currentTime+.12){const i=this.step,chord=song.chords[Math.floor(i/8)%song.chords.length];this.note(song.melody[i%song.melody.length],this.next,dur*1.5,'triangle',.21);this.note(chord[i%chord.length]+12,this.next,dur*.7,'sine',.12);if(i%4===0)this.note(chord[0]-12,this.next,dur*3.5,'triangle',.18);this.next+=dur;this.step++;}
 }
 stop(){clearInterval(this.timer);this.timer=null;this.song=null;for(const n of this.nodes){try{n.stop();}catch{}}this.nodes.clear();}
 suspend(){this.output.suspend();}
 async resume(){await this.output.unlock();this.next=(this.ctx?.currentTime||0)+.03;}
 chime(){if(!this.ctx)return;[72,76,79,84].forEach((n,i)=>this.note(n,this.ctx.currentTime+i*.16,.65,'sine',.6));}
}
