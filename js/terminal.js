// The window borders are text, too. Resize them to the actual character grid.
export function terminalFrames(root=document){
 const observer=new ResizeObserver(entries=>{for(const {target:el} of entries)paint(el);});
 const paint=el=>{let art=el.querySelector(':scope > .ascii-frame');if(!art){art=document.createElement('pre');art.className='ascii-frame';art.setAttribute('aria-hidden','true');el.append(art);}const r=el.getBoundingClientRect();if(!r.width||!r.height)return;const size=parseFloat(getComputedStyle(el).getPropertyValue('--frame-font'))||16,cw=size*.6,cols=Math.max(2,Math.floor(r.width/cw)),rows=Math.max(2,Math.round(r.height/size)),line=r.height/rows;art.style.fontSize=size+'px';art.style.lineHeight=line+'px';art.style.left=(r.width-cols*cw)/2+'px';const edge='+'+'-'.repeat(cols-2)+'+';art.textContent=[edge,...Array(rows-2).fill('|'+' '.repeat(cols-2)+'|'),edge].join('\n');};
 root.querySelectorAll('.frame').forEach(el=>observer.observe(el));return observer;
}
export function bar(value,max,length=8){const n=Math.max(0,Math.min(length,Math.round(value/max*length)));return '['+'#'.repeat(n)+'-'.repeat(length-n)+']';}
