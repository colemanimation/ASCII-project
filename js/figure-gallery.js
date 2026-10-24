import {FIGURE_STYLES,FACINGS,figureGlyphs} from './figures.js?v=somnia-1';
import {terminalFrames} from './terminal.js?v=somnia-1';
const roster=document.querySelector('#roster');
for(const kind of ['player','keeper','traveler','fisher','worker','child','animal']){
 const row=document.createElement('tr'),label=document.createElement('th');label.scope='row';label.textContent=FIGURE_STYLES[kind].label;row.append(label);
 for(const facing of FACINGS){const cell=document.createElement('td'),art=document.createElement('pre');art.textContent=figureGlyphs(kind,facing).join('\n');art.setAttribute('aria-label',kind+' facing '+facing);cell.append(art);row.append(cell);}
 roster.append(row);
}
terminalFrames();
