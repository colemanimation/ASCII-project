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
  while(this.next<this.ctx.currentTime+.12){if(song.arranged){this.arrangedStep(song,this.step,this.next,dur);this.next+=dur;this.step++;continue;}const i=this.step,chord=song.chords[Math.floor(i/8)%song.chords.length];this.note(song.melody[i%song.melody.length],this.next,dur*1.5,'triangle',.21);this.note(chord[i%chord.length]+12,this.next,dur*.7,'sine',.12);if(i%4===0)this.note(chord[0]-12,this.next,dur*3.5,'triangle',.18);this.next+=dur;this.step++;}
 }
 arrangedStep(song,step,time,dur){
  const pos=step%song.barSteps,bar=Math.floor(step/song.barSteps)%song.chords.length,chord=song.chords[bar];
  const event=song.events.find(e=>e.at===step%song.length);
  if(event){
   this.note(event.note,time,dur*event.length*.94,'triangle',song.leadVolume);
   this.note(event.note+12,time,dur*Math.min(2,event.length),'sine',song.leadVolume*.12);
   this.note(event.note,time+dur*1.5,dur*Math.min(3,event.length),'sine',song.leadVolume*.19);
  }
  const pattern=bar%2?[2,1,3,0,2,1]:[0,2,1,3,2,1];
  if(pos%2===0&&!(bar===7&&pos>=10))this.note(chord[pattern[pos/2]]+12,time,dur*.88,'sine',song.arpVolume);
  if(pos===0||pos===6)this.note(chord[pos===0?0:2]-12,time,dur*5.3,'triangle',.22);
  if(pos===0)for(const n of chord.slice(1,3))this.note(n,time,dur*9,'sine',.035);
  // A quiet answering voice enters on every other pass through the melody.
  if(song.counter!==false&&Math.floor(step/song.length)%2===1&&(pos===3||pos===9))
   this.note(chord[pos===3?1:2]+24,time,dur*2.5,'sine',.07);
 }
 stop(){clearInterval(this.timer);this.timer=null;this.song=null;for(const n of this.nodes){try{n.stop();}catch{}}this.nodes.clear();}
 suspend(){this.output.suspend();}
 async resume(){await this.output.unlock();this.next=(this.ctx?.currentTime||0)+.03;}
 chime(){if(!this.ctx)return;[72,76,79,84].forEach((n,i)=>this.note(n,this.ctx.currentTime+i*.16,.65,'sine',.6));}
}
