import {FABLE_ART} from './fable-art.js?v=somnia-1';
import {DialoguePlayer} from './dialogue.js?v=somnia-1';

// This is the order's creation tale, not an omniscient statement of history.
export const FABLE=[
 {art:'01-creation',text:'Once, a goddess made a world. She set the rivers running, filled the fields with living things, and loved what she had made.'},
 {art:'02-ruin',text:'Her brother envied that love. He shattered her world and struck her down among its ruins.'},
 {art:'03-great-dream',text:'As she lay dying, she dreamed it whole again. The rivers ran. The dead woke. And within her dream, the world endured.'},
 {art:'04-keepers',text:'Her brother seeks a way inside, to finish what he began. Every night, when we dream, we open little doors.'},
 {art:'04-keepers',text:'The keepers of Somnia walk those passages. They mend what he tears, and close what he opens. Their work has no ending.'},
 {art:'03-great-dream',text:'Or so the tale is told. In Brackenport, a child has been asleep for six days.'}
];

export class FablePlayer{
 constructor({canvas,copy,accessible,next,sound,reduced=false,onEnd=()=>{}}){
  Object.assign(this,{canvas,copy,accessible,next,sound,reduced,onEnd});
  this.index=0;this.player=null;this.lastDraw='';this.active=false;this.entered=0;
  this.next.onclick=()=>this.advance();this.copy.onclick=()=>this.advance();
  this.canvas.onclick=()=>this.advance();
 }
 start(){this.active=true;this.index=0;this.show();}
 show(){
  this.player?.dispose();this.sound.stop();this.entered=performance.now();this.lastDraw='';
  const slide=FABLE[this.index];this.copy.textContent='';this.accessible.textContent=slide.text;
  this.next.textContent='Continue >';
  this.player=new DialoguePlayer({text:slide.text,reduced:this.reduced,
   onUpdate:visible=>{this.copy.textContent=visible;this.copy.dataset.typing=String(visible.length<slide.text.length);},
   onTick:(c,i)=>this.sound.tick(c,i),
   onComplete:()=>{this.next.textContent=this.index===FABLE.length-1?'Somnia >':'Continue >';}});
  this.player.start();
 }
 advance(){
  if(!this.active)return;this.sound.unlock();
  if(this.player.active){this.player.finish();this.sound.stop();return;}
  if(this.index<FABLE.length-1){this.index++;this.show();}
  else{this.stop();this.onEnd();}
 }
 previous(){if(!this.active||this.index===0)return;this.index--;this.show();}
 stop(){this.active=false;this.player?.dispose();this.sound.stop();}
 draw(time){
  if(!this.active)return;
  const canvas=this.canvas,r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);
  if(!r.width||!r.height)return;
  if(canvas.width!==Math.round(r.width*d)||canvas.height!==Math.round(r.height*d)){canvas.width=Math.round(r.width*d);canvas.height=Math.round(r.height*d);}
  const elapsed=time-this.entered,reveal=this.reduced?1:Math.min(1,elapsed/900),key=[this.index,r.width,r.height,d,Math.floor(reveal*100)].join(':');if(this.lastDraw===key)return;this.lastDraw=key;
  const c=canvas.getContext('2d'),lines=FABLE_ART[FABLE[this.index].art],cols=lines[0].length,rows=lines.length;
  c.setTransform(d,0,0,d,0,0);c.fillStyle='#000';c.fillRect(0,0,r.width,r.height);
  const size=Math.min(r.width/(cols*.6),r.height/rows),cw=size*.6,ox=(r.width-cols*cw)/2,oy=(r.height-rows*size)/2;
  c.font=size+'px "Fever Terminal",monospace';c.textAlign='left';c.textBaseline='top';
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
   const char=lines[y][x];if(char===' ')continue;
   // Stable character dissolve: no sliding pixels, flashes, or changing shapes.
   const threshold=((x*17+y*31)%101)/101;if(threshold>reveal)continue;
   c.fillStyle='#deded5';c.fillText(char,ox+x*cw,oy+y*size);
  }
 }
}
