// Two printable characters, one column wide. The lower cell is the walk tile.
// Heads turn; the clothing/body stays recognizable in every direction.
export const FACINGS=['up','right','down','left'];
export const FIGURE_STYLES={
 player:{head:'O',body:'X',label:'You'},
 keeper:{head:'o',body:'A',label:'Keeper / Mara'},
 traveler:{head:'o',body:'R',label:'Traveler'},
 fisher:{head:'o',body:'J',label:'Fisher'},
 worker:{head:'o',body:'H',label:'Worker'},
 child:{head:'o',body:'x',label:'Child'},
 animal:{head:'.',body:'m',label:'Hound'},
 merchant:{head:'o',body:'W',label:'Merchant'},
 innkeeper:{head:'o',body:'U',label:'Innkeeper'},
 sleeper:{head:'o',body:'u',label:'Sleeper'},
 boss:{head:'O',body:'M',label:'Guardian'},
 visitor:{head:'0',body:'|',label:'Visitor'}
};
export function facingFrom(dx,dy,fallback='down'){
 if(!dx&&!dy)return FACINGS.includes(fallback)?fallback:'down';
 return Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');
}
export function figureKind(actor){
 if(actor.figure&&FIGURE_STYLES[actor.figure])return actor.figure;
 if(actor.type==='animal')return 'animal';
 return {npc:'keeper',rumor:'traveler',shop:'merchant',inn:'innkeeper',clinic:'sleeper',boss:'boss'}[actor.type]
  || {f:'fisher',w:'worker',c:'child',d:'animal'}[actor.glyph] || 'worker';
}
export function isFigure(actor){return ['npc','rumor','townsperson','animal','shop','inn','clinic','boss'].includes(actor.type);}
export function figureGlyphs(kind='worker',facing='down'){
 const style=FIGURE_STYLES[kind]||FIGURE_STYLES.worker;
 return [{up:'^',right:'>',left:'<'}[facing]||style.head,style.body];
}
export function figureHit(actor,px,py,layout){
 const {cell,ch,ox,oy,vx,vy}=layout,x=ox+(actor.x-vx)*cell,y=oy+(actor.y-vy-1)*ch;
 return px>=x&&px<x+cell&&py>=y&&py<y+2*ch;
}
