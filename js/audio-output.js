// One output for music and speech. Unlock it from a real tap/key interaction.
// Safari's default ambient session can be silenced by the iPhone ringer switch:
// https://bugs.webkit.org/show_bug.cgi?id=237322#c6
export class AudioOutput{
 constructor(){
  this.ctx=null;this.master=null;this.musicBus=null;this.pending=null;this.onchange=()=>{};
  this.enabled=true;try{this.enabled=(localStorage.getItem('feverwake-sound')??localStorage.getItem('feverwake-text-sound'))!=='off';}catch{}
 }
 get ready(){return !!(this.enabled&&this.ctx?.state==='running');}
 session(type){try{if(navigator.audioSession)navigator.audioSession.type=type;}catch{}}
 unlock(){
  if(!this.enabled||document.hidden)return Promise.resolve(false);
  this.session('playback');
  try{
   if(!this.ctx||this.ctx.state==='closed'){
    const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return Promise.resolve(false);
    const ctx=this.ctx=new AC;this.master=ctx.createGain();this.master.gain.value=.8;this.master.connect(ctx.destination);
    this.musicBus=ctx.createGain();this.musicBus.gain.value=.12;this.musicBus.connect(this.master);
    ctx.onstatechange=()=>{if(this.ctx===ctx)this.onchange();};
    // Prime the output inside the gesture, before waiting for resume().
    const prime=ctx.createBufferSource();prime.buffer=ctx.createBuffer(1,1,ctx.sampleRate);prime.connect(this.master);prime.onended=()=>prime.disconnect();prime.start();
   }
   if(this.ready)return Promise.resolve(true);
   if(this.pending)return this.pending;
   const ctx=this.ctx;
   // Safari also uses "interrupted" after a call/app switch, not just suspended.
   const resume=ctx.resume();let timeout;
   const task=Promise.race([Promise.resolve(resume),new Promise(resolve=>{timeout=setTimeout(resolve,1200);})])
    .then(()=>this.ctx===ctx&&this.ready,()=>false)
    .finally(()=>{clearTimeout(timeout);if(this.pending===task)this.pending=null;this.onchange();});
   this.pending=task;return task;
  }catch{this.onchange();return Promise.resolve(false);}
 }
 setEnabled(enabled){
  this.enabled=enabled;try{localStorage.setItem('feverwake-sound',enabled?'on':'off');}catch{}
  if(!enabled){this.reset();this.session('auto');this.onchange();return Promise.resolve(false);}
  this.onchange();return this.unlock();
 }
 reset(){
  const ctx=this.ctx;this.pending=null;this.ctx=null;
  if(this.master)this.master.gain.value=0;this.master=null;this.musicBus=null;
  if(ctx){ctx.onstatechange=null;try{Promise.resolve(ctx.close()).catch(()=>{});}catch{}}
 }
 suspend(){if(this.ctx?.state==='running')this.ctx.suspend().catch(()=>{});}
}
