import {TILES,isWater} from './atlas.js?v=feverwake-20261024-1';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export class AtlasRenderer{
 constructor(canvas,world,meta){
  this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.world=world;this.meta=meta;this.zoom=1;this.cx=world.width/2;this.cy=world.height/2;this.labels=true;this.mode='atlas';this.selected='bracken';this.route=[];this.player=meta.spawn;this.lit=new Set;this.discovered=new Set;this.complete=false;this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  this.cache=document.createElement('canvas');this.buildCache();this.resize();
 }
 buildCache(){
  const paint=(canvas,step)=>{
   const cw=10,ch=16;canvas.width=Math.ceil(this.world.width/step)*cw;canvas.height=Math.ceil(this.world.height/step)*ch;
   const c=canvas.getContext('2d',{alpha:false});c.fillStyle='#0a1013';c.fillRect(0,0,canvas.width,canvas.height);c.font=`14px "Liberation Mono",Consolas,monospace`;c.textAlign='center';c.textBaseline='middle';
   for(let y=0;y<this.world.height;y+=step)for(let x=0;x<this.world.width;x+=step){
    let glyph=this.world.grid[y][x];
    if(step>1){
     const chars=[];for(let yy=y;yy<Math.min(y+step,this.world.height);yy++)for(let xx=x;xx<Math.min(x+step,this.world.width);xx++)chars.push(this.world.grid[yy][xx]);
     const tally=new Map;chars.forEach(t=>tally.set(t,(tally.get(t)||0)+1));glyph=[...tally].sort((a,b)=>b[1]-a[1])[0][0];
     for(const special of ['+','=','^','A','T','Y'])if((tally.get(special)||0)>=2){glyph=special;break;}
    }
    const color=TILES[glyph]?.color||'#a2b3a2';
    if(!isWater(glyph)){c.fillStyle=color;c.globalAlpha=.075;c.fillRect(x/step*cw,y/step*ch,cw,ch);}
    if(glyph==='~'&&(x*11+y*7)%9!==0)continue;
    if(glyph==='-'&&step===1&&(x+y)%2)continue;
    if(glyph==='.'&&step===1&&(x*7+y*13)%4===0)continue;
    c.fillStyle=color;c.globalAlpha=glyph==='~'?.75:1;c.fillText(glyph,x/step*cw+cw/2,y/step*ch+ch/2);
   }c.globalAlpha=1;
  };
  paint(this.cache,1);this.overview=this.overview||document.createElement('canvas');paint(this.overview,2);this.smallOverview=this.smallOverview||document.createElement('canvas');paint(this.smallOverview,4);
 }
 resize(){
  const r=this.canvas.getBoundingClientRect();this.width=r.width;this.height=r.height;const d=Math.min(devicePixelRatio||1,2);this.canvas.width=Math.round(r.width*d);this.canvas.height=Math.round(r.height*d);this.ctx.setTransform(d,0,0,d,0,0);this.fitScale=Math.min((this.width-34)/(this.world.width*10),(this.height-65)/(this.world.height*16));this.fitScale=Math.max(.025,this.fitScale);this.draw();
 }
 fit(){this.zoom=1;this.cx=this.world.width/2;this.cy=this.world.height/2;this.draw();}
 center(player){this.cx=player.x;this.cy=player.y;this.draw();}
 get scale(){return this.fitScale*this.zoom;}
 point(x,y){return{x:(x-this.cx)*10*this.scale+this.width/2,y:(y-this.cy)*16*this.scale+this.height/2+25};}
 tile(px,py){return {x:Math.floor((px-this.width/2)/(10*this.scale)+this.cx),y:Math.floor((py-this.height/2-25)/(16*this.scale)+this.cy)};}
 pan(dx,dy){this.cx=clamp(this.cx-dx/(10*this.scale),-5,this.world.width+5);this.cy=clamp(this.cy-dy/(16*this.scale),-5,this.world.height+5);this.draw();}
 zoomBy(factor,px=this.width/2,py=this.height/2){
  const before={x:(px-this.width/2)/(10*this.scale)+this.cx,y:(py-this.height/2-25)/(16*this.scale)+this.cy};
  this.zoom=clamp(this.zoom*factor,.8,12);
  this.cx=before.x-(px-this.width/2)/(10*this.scale);this.cy=before.y-(py-this.height/2-25)/(16*this.scale);this.draw();
 }
 draw(time=0){
  const c=this.ctx;if(!this.width)return;c.fillStyle='#0a1013';c.fillRect(0,0,this.width,this.height);
  const s=this.scale,origin=this.point(0,0);c.imageSmoothingEnabled=true;const source=s<.18?this.smallOverview:s<.48?this.overview:this.cache;c.drawImage(source,origin.x,origin.y,this.world.width*10*s,this.world.height*16*s);
  // Fine coordinate graticule remains behind the cartographer's annotations.
  c.strokeStyle='#466878';c.globalAlpha=.10;c.lineWidth=.5;
  for(let x=0;x<=this.world.width;x+=20){const p=this.point(x,0);c.beginPath();c.moveTo(p.x,0);c.lineTo(p.x,this.height);c.stroke();}
  for(let y=0;y<=this.world.height;y+=20){const p=this.point(0,y);c.beginPath();c.moveTo(0,p.y);c.lineTo(this.width,p.y);c.stroke();}c.globalAlpha=1;
  if(this.labels&&this.zoom<2.7){
   for(const r of this.meta.regions){const p=this.point(r.x,r.y);if(p.x<0||p.y<0||p.x>this.width||p.y>this.height)continue;
    const sea=/SEA|STRAIT/.test(r.name);if(this.width<550&&this.zoom<1.8&&!sea)continue;c.font=(sea?'italic ':'')+`${Math.max(7,Math.min(11,8*this.zoom))}px ${sea?'Georgia':'monospace'}`;c.textAlign='center';c.textBaseline='middle';c.fillStyle=sea?'#6b8a95':'#a9b49a';c.globalAlpha=sea?.6:.75;
    c.shadowColor='#0a1013';c.shadowBlur=5;c.fillText(r.name,p.x,p.y);c.shadowBlur=0;c.globalAlpha=1;
   }
  }
  // All ocean ornaments are drawn as characters, at fixed map coordinates.
  if(this.zoom<2.8&&this.labels){this.art(13,20,['    |\\','  __|_\\__','  \\_____/',' ~ ~ ~ ~'],'#4c707b');this.art(268,102,[' .     .','    +',' .     .'],'#597d85');}
  if(this.route.length){c.strokeStyle='#dfd6ae';c.lineWidth=1.2;c.globalAlpha=.65;c.setLineDash([2,5]);c.beginPath();const start=this.point(this.player.x+.5,this.player.y+.5);c.moveTo(start.x,start.y);for(const p of this.route){const q=this.point(p.x+.5,p.y+.5);c.lineTo(q.x,q.y);}c.stroke();c.setLineDash([]);c.globalAlpha=1;}
  if(this.complete){
   const lights=this.meta.places.filter(p=>p.kind==='beacon'||p.kind==='observatory');c.strokeStyle='#c6d8c8';c.globalAlpha=.4;c.setLineDash([2,5]);c.beginPath();lights.forEach((p,i)=>{const a=this.point(p.x+.5,p.y+.5);i?c.lineTo(a.x,a.y):c.moveTo(a.x,a.y)});c.stroke();c.setLineDash([]);c.globalAlpha=1;
  }
  const labelBoxes=[];const priorities={beacon:1,observatory:2,harbor:3};const ordered=[...this.meta.places].sort((a,b)=>(a.id===this.selected?-1:priorities[a.kind]||4)-(b.id===this.selected?-1:priorities[b.kind]||4));
  if(this.mode!=='workshop')for(const p of ordered){
   const a=this.point(p.x+.5,p.y+.5);if(a.x<0||a.y<0||a.x>this.width||a.y>this.height)continue;
   const selected=p.id===this.selected,lit=this.lit.has(p.id),beacon=p.kind==='beacon';
   if(lit){const glow=c.createRadialGradient(a.x,a.y,1,a.x,a.y,selected?28:19);glow.addColorStop(0,'#dfca7545');glow.addColorStop(1,'#dfca7500');c.fillStyle=glow;c.fillRect(a.x-28,a.y-28,56,56);}
   c.fillStyle='#0b1316';c.beginPath();c.arc(a.x,a.y,selected?6:4,0,Math.PI*2);c.fill();c.strokeStyle=selected?'#f3e6bc':beacon?'#c2ad7e':'#96a29b';c.lineWidth=selected?1.5:1;c.stroke();
   c.fillStyle=lit?'#f3dc9b':selected?'#e4d9b5':'#bbc0a9';if(lit||this.discovered.has(p.id)){c.beginPath();c.arc(a.x,a.y,1.5,0,Math.PI*2);c.fill();}
   if(this.labels&&(selected||this.zoom>1.25||['bracken','frostspire','bell','cedar','observatory','wayfarer'].includes(p.id))){
    if(this.width<550&&this.zoom<1.8&&!selected&&p.kind!=='beacon'&&p.kind!=='observatory')continue;
    const label=p.name;c.font=`${selected?'bold ':''}${selected?11:9}px monospace`;c.textBaseline='middle';
    let lx=a.x+10,ly=a.y-8;let align='left';if(a.x>this.width-125){lx=a.x-10;align='right';}if(p.id==='observatory'||p.id==='cedar')ly=a.y+13;
    const m=c.measureText(label);const box={x:align==='left'?lx-3:lx-m.width-3,y:ly-7,w:m.width+9,h:17};if(!selected&&labelBoxes.some(b=>box.x<b.x+b.w&&box.x+box.w>b.x&&box.y<b.y+b.h&&box.y+box.h>b.y))continue;labelBoxes.push(box);c.fillStyle='#0a1013e8';c.fillRect(align==='left'?lx-3:lx-m.width-3,ly-7,m.width+6,14);c.textAlign=align;c.fillStyle=selected?'#eee4c9':'#b3c2bb';c.fillText(label,lx,ly);
   }
  }
  if(this.mode==='explore'){
   const a=this.point(this.player.x+.5,this.player.y+.5),water=isWater(this.world.grid[this.player.y]?.[this.player.x]);
   c.fillStyle='#f7eee0';c.strokeStyle='#0a1013';c.lineWidth=3;c.font=`bold ${Math.max(15,Math.min(22,16*s))}px monospace`;c.textAlign='center';c.textBaseline='middle';c.strokeText(water?'V':'@',a.x,a.y);c.fillText(water?'V':'@',a.x,a.y);
   c.strokeStyle='#d4d6b2';c.globalAlpha=this.reduced?.5:.3+.15*Math.sin(time/500);c.lineWidth=1;c.beginPath();c.arc(a.x,a.y,13,0,Math.PI*2);c.stroke();c.globalAlpha=1;
  }
 }
 art(x,y,lines,color){const p=this.point(x,y);const c=this.ctx;c.fillStyle=color;c.font=`${Math.min(12,9*this.zoom)}px monospace`;c.textAlign='center';lines.forEach((l,i)=>c.fillText(l,p.x,p.y+i*10*this.zoom));}
 landmarkAt(px,py){let closest=null,d=21;for(const p of this.meta.places){const s=this.point(p.x+.5,p.y+.5),v=Math.hypot(px-s.x,py-s.y);if(v<d){closest=p;d=v;}}return closest;}
}
