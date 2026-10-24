// Timed text and mouth poses share one clock. All portraits are literal text.
export function splitDialogue(text, limit=180){
 let rest=String(text).trim().replace(/\s+/g,' ');const pages=[];
 while(rest.length>limit){let cut=rest.lastIndexOf(' ',limit);if(cut<1)break;const sentence=rest.slice(0,cut).search(/[.!?][^.!?]*$/);if(sentence>=limit*.45)cut=sentence+1;pages.push(rest.slice(0,cut).trim());rest=rest.slice(cut).trim();}
 if(rest)pages.push(rest);return pages.length?pages:[''];
}
export function revealDelay(char){return /[.!?]/.test(char)?310:/[,;:]/.test(char)?160:/\s/.test(char)?24:34;}
export function mouthPose(char, index=0){
 if(!/[a-z0-9]/i.test(char)||/[bmp]/i.test(char))return 'closed';
 if(/[ou]/i.test(char))return 'round';
 if(/[aei]/i.test(char))return 'open';
 return index%3===0?'open':'parted';
}
export class DialoguePlayer{
 constructor({text,onUpdate=()=>{},onComplete=()=>{},onTick=()=>{},reduced=false,schedule=(fn,ms)=>setTimeout(fn,ms),cancel=id=>clearTimeout(id)}){
  Object.assign(this,{text,onUpdate,onComplete,onTick,reduced,schedule,cancel});this.index=0;this.timer=null;this.active=false;this.done=false;this.pose='closed';
 }
 start(){if(this.active||this.done)return;this.active=true;if(this.reduced||!this.text.length){this.finish();return;}this.onUpdate('', 'closed');this.queue(90);}
 queue(delay){this.timer=this.schedule(()=>this.step(),delay);}
 step(){if(!this.active)return;const char=this.text[this.index++];
  if(!/[a-z0-9]/i.test(char)||this.index%3===1)this.pose=mouthPose(char,this.index);
  this.onUpdate(this.text.slice(0,this.index),this.pose);
  if(/[a-z0-9]/i.test(char)&&this.index%2===0)this.onTick(char,this.index);
  if(this.index===this.text.length)this.finish();else this.queue(revealDelay(char));
 }
 finish(){if(this.done)return;this.cancel(this.timer);this.active=false;this.done=true;this.index=this.text.length;this.onUpdate(this.text,'closed');this.onComplete();}
 dispose(){this.cancel(this.timer);this.active=false;this.done=true;this.onUpdate(this.text.slice(0,this.index),'closed');}
}

// The invisible full line reserves its final size; revealing text never moves
// the portrait, frame, controls, or choices. Pages avoid scrolling on phones.
export function mountConversation({root,actions,text,portrait,frames,speaker,reduced,sound}){
 root.replaceChildren();const make=(tag,cls,value)=>{const n=document.createElement(tag);n.className=cls;if(value)n.textContent=value;return n;};
 const conversation=make('div','conversation'+(frames?' has-speaking-portrait':''));
 const face=make('div','speaker-panel'),art=make('pre','portrait'+(frames?' speaking-portrait':''),(frames?.closed||portrait).join('\n'));
 art.setAttribute('aria-hidden','true');art.dataset.pose='closed';face.append(art,make('div','speaker-label',speaker));
 const stack=make('div','speech-stack'),copy=make('div','speech-copy'),reserve=make('p','speech-reserve'),line=make('p','speech-line');
 reserve.setAttribute('aria-hidden','true');line.setAttribute('aria-hidden','true');copy.append(reserve,line);
 const accessible=make('p','visually-hidden');accessible.setAttribute('aria-live','polite');accessible.setAttribute('aria-atomic','true');
 const toolbar=make('div','speech-toolbar'),advance=make('button','speech-advance','Show line'),mute=make('button','speech-sound'),counter=make('span','speech-count');
 toolbar.append(advance,mute);stack.append(copy,accessible,toolbar,counter);conversation.append(face,stack);root.append(conversation);
 const small=innerWidth<=600,short=innerHeight<=620;
 const pages=splitDialogue(text,small?(short?115:165):210);let page=0,player=null,disposed=false;
 const labelSound=()=>{mute.textContent=sound.enabled?'Text sound on':'Text sound off';mute.setAttribute('aria-pressed',String(sound.enabled));};labelSound();
 mute.onclick=async()=>{await sound.toggle();if(!disposed)labelSound();};
 const showPage=()=>{
  player?.dispose();actions.style.visibility='hidden';actions.inert=true;const full=pages[page];reserve.textContent=full;accessible.textContent=full;advance.textContent='Show line';counter.textContent='LINE '+(page+1)+' / '+pages.length+'  /  SPACE: REVEAL';
  player=new DialoguePlayer({text:full,reduced,onTick:(c,i)=>sound.tick(c,i),onUpdate:(visible,pose)=>{line.textContent=visible;copy.dataset.typing=String(visible.length<full.length);if(frames&&art.dataset.pose!==pose){art.textContent=frames[pose].join('\n');art.dataset.pose=pose;}},onComplete:()=>{const last=page===pages.length-1;actions.style.visibility=last?'visible':'hidden';actions.inert=!last;advance.textContent=last?'Replay line':'Next line >';counter.textContent='LINE '+(page+1)+' / '+pages.length+(last?'  /  YOUR TURN':'  /  CONTINUE');}});player.start();
 };
 const reveal=()=>{if(player?.active){player.finish();sound.stop();return true;}return false;};
 advance.onclick=()=>{sound.unlock();if(reveal())return;if(page<pages.length-1)page++;showPage();};copy.onclick=reveal;
 const visibility=()=>{if(document.hidden){reveal();sound.stop();}};document.addEventListener('visibilitychange',visibility);
 showPage();sound.unlock().then(()=>{if(!disposed)labelSound();});
 return {reveal,dispose(){disposed=true;player?.dispose();sound.stop();document.removeEventListener('visibilitychange',visibility);}};
}
