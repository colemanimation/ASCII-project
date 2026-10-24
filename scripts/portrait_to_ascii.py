#!/usr/bin/env python3
"""Image-to-ASCII portrait converter. Only printable ASCII; no Unicode blocks.
Pillow is the only runtime dependency. The bundled Fever Terminal font is CC0.
"""
import argparse, json, math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps, ImageFilter

ROOT=Path(__file__).resolve().parent
WEB=ROOT.parent/'dist' if (ROOT.parent/'dist/index.html').exists() else ROOT.parent
FONT=WEB/'fonts/fever-terminal.ttf'
RAMP=' .-:+=coXO*#@'

def read_image(path):
    im=Image.open(path).convert('RGBA')
    bg=Image.new('RGBA',im.size,'black');bg.alpha_composite(im)
    return ImageOps.grayscale(bg.convert('RGB'))

def pixel_portrait(image,size=64,levels=4):
    """Normalize an AI-rendered enlargement to a true small pixel asset."""
    if size<8 or not 2<=levels<=16:raise ValueError('Use a pixel grid of at least 8 and 2 to 16 gray levels.')
    im=image.resize((size,round(image.height/image.width*size)),Image.Resampling.BOX)
    palette=[round(i*255/(levels-1)) for i in range(levels)]
    return im.point([min(palette,key=lambda p:abs(p-v)) for v in range(256)])

def glyph_weights(ramp,font_path=FONT):
    """Calibrate brightness to the ink coverage of the actual display font."""
    font=ImageFont.truetype(str(font_path),100)
    weights=[]
    for c in ramp:
        mask=Image.new('L',(60,100),'black')
        ImageDraw.Draw(mask).text((0,80),c,font=font,fill=255,anchor='ls')
        weights.append(sum(mask.tobytes()))
    maximum=max(weights)
    if maximum==0:raise ValueError('The ramp needs at least one visible glyph.')
    return [w/maximum for w in weights]

def convert(image,columns=48,cell_aspect=.6,gamma=.8,black=.06,ramp=RAMP,style='density',font_path=FONT):
    if columns<8 or columns>200:raise ValueError('Columns must be between 8 and 200.')
    if not 0<cell_aspect<=2:raise ValueError('Cell aspect must be in (0, 2].')
    if gamma<=0 or not 0<=black<1:raise ValueError('Use gamma > 0 and a black point in [0, 1).')
    if len(ramp)<2 or any(ord(c)<32 or ord(c)>126 for c in ramp):raise ValueError('Use at least two printable ASCII characters in the ramp.')
    rows=max(1,round(image.height/image.width*columns*cell_aspect))
    small=image.resize((columns,rows),Image.Resampling.BOX)
    values=[[max(0,(small.getpixel((x,y))/255-black)/(1-black))**gamma for x in range(columns)] for y in range(rows)]
    weights=glyph_weights(ramp,font_path)
    out=[]
    for y in range(rows):
        line=[]
        for x in range(columns):
            v=values[y][x];ch=ramp[min(range(len(ramp)),key=lambda i:abs(weights[i]-v))]
            if style=='contour' and 0<x<columns-1 and 0<y<rows-1:
                dx=values[y][x+1]-values[y][x-1];dy=(values[y+1][x]-values[y-1][x])*cell_aspect
                edge=math.hypot(dx,dy)
                if edge>.32 and .08<v<.73:
                    angle=math.atan2(dy,dx)%math.pi
                    ch='|' if angle<math.pi/8 or angle>7*math.pi/8 else '/' if angle<3*math.pi/8 else '-' if angle<5*math.pi/8 else '\\'
            line.append(ch)
        out.append(''.join(line))
    return out

def render(lines,font_path=FONT,size=20,padding=18):
    font=ImageFont.truetype(str(font_path),size)
    cw=font.getlength('M');ch=size;ascent=font.getmetrics()[0]
    im=Image.new('RGB',(math.ceil(len(lines[0])*cw)+2*padding,len(lines)*ch+2*padding),'black')
    d=ImageDraw.Draw(im)
    for y,line in enumerate(lines):d.text((padding,padding+y*ch+ascent),line,font=font,fill='#eeeeea',anchor='ls')
    return im

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('input',type=Path);p.add_argument('--output',type=Path,default=Path('portrait'))
    p.add_argument('--columns',type=int,default=48);p.add_argument('--cell-aspect',type=float,default=.6)
    p.add_argument('--gamma',type=float,default=.8);p.add_argument('--black',type=float,default=.06)
    p.add_argument('--ramp',default=RAMP);p.add_argument('--style',choices=['density','contour'],default='density')
    p.add_argument('--pixel-grid',type=int,default=0,help='Optional pixel-art normalization before conversion.')
    p.add_argument('--levels',type=int,default=4);p.add_argument('--font',type=Path,default=FONT)
    args=p.parse_args();im=read_image(args.input)
    if args.pixel_grid:im=pixel_portrait(im,args.pixel_grid,args.levels)
    lines=convert(im,args.columns,args.cell_aspect,args.gamma,args.black,args.ramp,args.style,args.font)
    prefix=args.output;prefix.parent.mkdir(parents=True,exist_ok=True)
    prefix.with_suffix('.txt').write_text('\n'.join(lines)+'\n',encoding='ascii')
    prefix.with_suffix('.json').write_text(json.dumps({'columns':len(lines[0]),'rows':len(lines),'cellAspect':args.cell_aspect,'source':args.input.name,'style':args.style,'glyphs':lines},indent=2)+'\n')
    render(lines,args.font).save(prefix.with_suffix('.png'))
    print(f'{len(lines[0])} x {len(lines)} printable ASCII characters -> {prefix}.txt / .json / .png')
if __name__=='__main__':main()
