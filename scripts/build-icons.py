"""Render the home-screen icon from the game's original ASCII font outlines."""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from PIL import Image, ImageDraw, ImageFont
base=Path('dist') if Path('dist/index.html').exists() else Path('.')
font=TTFont(base/'fonts/fever-terminal.ttf');glyphs=font.getGlyphSet();cmap=font.getBestCmap()
raster=Image.new('RGB',(512,512),'black');draw=ImageDraw.Draw(raster)
parts=['<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" fill="#000"/>']
def glyph(char,x,y,size,color='#ddd'):
 draw.text((x,y),char,font=ImageFont.truetype(str(base/'fonts/fever-terminal.ttf'),size),fill=color,anchor='ls')
 p=SVGPathPen(glyphs);glyphs[cmap[ord(char)]].draw(p);parts.append(f'<path d="{p.getCommands()}" transform="translate({x} {y}) scale({size/1000} {-size/1000})" fill="{color}"/>')
for i,char in enumerate('+---------+'):
 glyph(char,78+i*33,103,55,'#999');glyph(char,78+i*33,447,55,'#999')
for y in [151,199,247,295,343,391]:
 glyph('|',78,y,55,'#999');glyph('|',408,y,55,'#999')
glyph('S',191,358,280)
parts.append('</svg>');svg=''.join(parts);(base/'icons/icon.svg').write_text(svg)
for name,size in [('icon-192.png',192),('icon-512.png',512),('apple-touch-icon.png',180)]:raster.resize((size,size),Image.Resampling.NEAREST).save(base/'icons'/name)
