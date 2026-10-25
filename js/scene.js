import {figureKind,figureGlyphs,figureHit,isFigure} from './figures.js?v=somnia-2';
const COLORS={'.':'#4e504a',',':'#62675b',"'":'#899897',':':'#777565','~':'#7b9da7','=':'#bfb7a0','+':'#dedacd',S:'#d4cc94',I:'#c9c3a0',Q:'#b9b5d4',M:'#fff',N:'#cfcfc4','>':'#ddd','$':'#dfcf9d',h:'#a9bbb3',B:'#e7a7a3','!':'#e0d9fc','%':'#b98585',k:'#dfcf9d',L:'#b7c6bf','?':'#bbb'};
export class SceneRenderer{
 constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.layout=null;this.overview=false;this.route=[];}
 draw(map,s,time=0){
  if(!map)return;const c=this.ctx,r=this.canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);
  if(this.canvas.width!==Math.round(r.width*d)||this.canvas.height!==Math.round(r.height*d)){this.canvas.width=Math.round(r.width*d);this.canvas.height=Math.round(r.height*d);}
  c.setTransform(d,0,0,d,0,0);const w=r.width,h=r.height;c.fillStyle='#000';c.fillRect(0,0,w,h);
  const font=this.overview?Math.min((w-4)/(map.width*.6),(h-8)/map.height):(w<550?16:20),cell=font*.6,ch=font;
  const cols=Math.min(map.width,Math.floor(w/cell)),rows=Math.min(map.height,Math.floor(h/ch));
  const vx=Math.max(0,Math.min(map.width-cols,s.local.x-Math.floor(cols/2))),vy=Math.max(0,Math.min(map.height-rows,s.local.y-Math.floor(rows/2)));
  const ox=(w-cols*cell)/2,oy=(h-rows*ch)/2;this.layout={cell,ch,ox,oy,vx,vy,cols,rows};
  c.font=font+'px "Fever Terminal",monospace';c.textAlign='center';c.textBaseline='middle';
  const dream=s.scene==='dream'||s.scene==='finale';
  const draw=(glyph,x,y,color,clear=false)=>{
   if(x<vx||x>=vx+cols||y<vy||y>=vy+rows)return;
   const px=ox+(x-vx+.5)*cell,py=oy+(y-vy+.5)*ch;
   if(clear){c.fillStyle='#000';c.fillRect(px-cell/2,py-ch/2,cell,ch);}
   c.fillStyle=color||COLORS[glyph]||'#c7c7bc';c.fillText(glyph,px,py);
  };
  for(let y=vy;y<vy+rows;y++)for(let x=vx;x<vx+cols;x++){
   let glyph=map.grid[y][x];if(glyph===' ')continue;
   if(glyph==='~'&&(x*5+y*11+Math.floor(time/900))%9<3)glyph='-';
   draw(glyph,x,y,glyph==='-'&&map.grid[y][x]==='~'?COLORS['~']:undefined);
  }
  for(const r of map.rooms||[]){const label=('['+r.name+']').slice(0,r.w);[...label].forEach((ch,i)=>draw(ch,r.x+i,r.y-1,'#ddd',true));}
  for(const p of this.route)draw(':',p.x,p.y,'#9d9d92');
  const figures=[];
  for(const o of map.objects){
   const defeated=o.type==='boss'&&s.defeated.includes(['nursery','school','house'][s.dream]);
   if(isFigure(o)&&!defeated){figures.push({...o,figure:figureKind(o),color:'#ddd'});continue;}
   let glyph=o.glyph||map.grid[o.y][o.x];
   if(o.type==='chest'&&s.opened.includes(s.dream+':'+o.x+','+o.y))glyph='.';
   if(defeated)glyph='.';
   if(o.type==='key'&&s.dreamFlags?.includes(o.flag))glyph='.';
   if(o.type==='lever'&&s.dreamFlags?.includes(o.flag))glyph='l';
   draw(glyph,o.x,o.y,undefined,true);
  }
  if(!dream)for(const a of map.animations||[])if(a.type==='smoke'){
   const phase=Math.floor(time/900)%3;draw(phase===0?'.':phase===1?'o':"'",a.x+(phase===2?1:0),a.y-phase,'#777');
  }
  if(s.stalker.active&&dream)figures.push({...s.stalker,figure:'visitor',color:s.stalker.chasing?'#ffb5b5':'#b19db5'});
  figures.push({...s.local,figure:'player',facing:s.facing,color:'#fff'});
  // Feet determine depth. A head may overlap scenery, never movement collision.
  figures.sort((a,b)=>a.y-b.y);
  for(const a of figures){const [head,body]=figureGlyphs(a.figure,a.facing);draw(head,a.x,a.y-1,a.color,true);draw(body,a.x,a.y,a.color,true);}
 }
 objectAt(map,px,py){
  if(!this.layout)return null;
  // Both cells belong to one person; check the nearest/frontmost figure first.
  const figures=map.objects.filter(isFigure).sort((a,b)=>b.y-a.y);
  for(const a of figures)if(figureHit(a,px,py,this.layout))return a;
  const {cell,ch,ox,oy,vx,vy,cols,rows}=this.layout;let closest=null,best=Math.max(8,cell*.8);
  for(const o of map.objects){
   if(o.x<vx||o.x>=vx+cols||o.y<vy||o.y>=vy+rows)continue;
   const distance=Math.hypot(px-(ox+(o.x-vx+.5)*cell),py-(oy+(o.y-vy+.5)*ch));
   if(distance<best){best=distance;closest=o;}
  }
  return closest;
 }
 tile(px,py){if(!this.layout)return null;const {cell,ch,ox,oy,vx,vy}=this.layout;return{x:Math.floor((px-ox)/cell)+vx,y:Math.floor((py-oy)/ch)+vy};}
}
export function drawIntro(canvas,time=0,reduced=false){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);if(canvas.width!==Math.round(r.width*d)||canvas.height!==Math.round(r.height*d)){canvas.width=Math.round(r.width*d);canvas.height=Math.round(r.height*d);}const c=canvas.getContext('2d');c.setTransform(d,0,0,d,0,0);const w=r.width,h=r.height,t=reduced?0:Math.floor(time/750);c.fillStyle='#000';c.fillRect(0,0,w,h);c.textAlign='center';c.textBaseline='middle';c.font='14px "Fever Terminal",monospace';for(let i=0;i<65;i++){const x=Math.floor((i*137.17)%w/9)*9,y=Math.floor(((i*73.31+t*(i%3+1)*5)%h)/14)*14;c.fillStyle=i%7?'#383c38':'#66695f';c.fillText(i%5===0?'+':i%3?"'":'.',x,y);}
 const village=['      .                 o                 ','      o                 .                 ','      |       /\\       |       /\\       ','   __/\\__   /__\\   __/\\__   /__\\      ','  /_______\\ |[] |  /_______\\ |[] |      ','  | [] [] | |   |  | [] [] | |   |      ','__|___+___|_|_+_|__|___+___|_|_+_|______','========================================','~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~'];const size=Math.min(20,(w-20)/44/.6);c.font=size+'px "Fever Terminal",monospace';const y=h*.79;village.forEach((line,i)=>{c.fillStyle=i===8?'#687983':'#858a7f';c.fillText(line,w/2,y+i*size);});c.fillStyle='#fff';c.fillText('>',w/2+((t%26)-13)*size*.6,y+5*size);c.fillText('X',w/2+((t%26)-13)*size*.6,y+6*size);c.fillStyle='#353a40';village.slice(3,7).reverse().forEach((line,i)=>c.fillText(line,w/2+(t%2?size*.6:0),y+(i+10)*size));}
