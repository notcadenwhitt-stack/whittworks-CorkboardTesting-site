#!/usr/bin/env python3
"""Reproduce the straight-edged W trace and all website brand assets.

Coordinates are source pixel boundaries, fitted to the flat-color contours.
Requires Pillow (PIL 11 or later) and the Python standard library only.
"""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
BLUE, NAVY = '#004AAD', '#04367B'
# Blue regions first; the navy facets cover shared boundaries.
REGIONS = [
    (BLUE, [(537.057, 518.875), (839.68, 518.875), (970.641, 745.867), (1101.663, 518.875), (1404.208, 518.875), (1351.922, 609.857), (1153.19, 609.939), (970.381, 926.365), (787.692, 608.875), (589.03, 608.875)]),
    (BLUE, [(632.899, 684.875), (737.056, 684.875), (923.256, 1007.44), (886.348, 1072.875), (856.936, 1072.875)]),
    (BLUE, [(1204.243, 684.875), (1308.398, 684.875), (1169.385, 924.664), (1117.57, 834.986)]),
    (BLUE, [(1052.079, 887.07), (1121.601, 1007.42), (1084.371, 1072.875), (1055.348, 1072.875), (1000.088, 977.112)]),
    (NAVY, [(839.68, 518.875), (897.812, 518.875), (999.772, 695.451), (970.657, 745.895)]),
    (NAVY, [(1404.208, 518.875), (1462.361, 518.875), (1410.649, 608.875), (1352.487, 608.875)]),
    (NAVY, [(1153.236, 609.875), (1211.438, 609.875), (1081.048, 836.722), (1180.069, 1007.881), (1142.553, 1072.875), (1084.371, 1072.875), (1121.601, 1007.42), (1052.151, 887.196), (944.264, 1072.875), (886.348, 1072.875), (923.256, 1007.44), (737.056, 684.875), (793.54, 684.875), (939.803, 938.198), (973.367, 921.177)]),
    (NAVY, [(1308.398, 684.875), (1366.542, 684.875), (1199.123, 975.536), (1169.563, 924.356)]),
]

LEFT, TOP, WIDTH, HEIGHT = 537.057, 518.875, 925.304, 554
VIEWBOX = f"0 0 {WIDTH:g} {HEIGHT:g}"

def polygons(offset=(0,0), scale=1, colors=None):
    for color, points in REGIONS:
        yield (colors or {}).get(color,color), [((x-offset[0])*scale,(y-offset[1])*scale) for x,y in points]

def raster(size, fraction, background, colors=None):
    scale = size[0]*fraction/WIDTH
    ox = (size[0]-WIDTH*scale)/2
    oy = (size[1]-HEIGHT*scale)/2
    im = Image.new('RGBA', (size[0]*4,size[1]*4), background)
    draw=ImageDraw.Draw(im)
    for color, pts in polygons((LEFT,TOP),scale*4,colors):
        draw.polygon([(x+ox*4,y+oy*4) for x,y in pts],fill=color)
    return im.resize(size,Image.Resampling.LANCZOS)

def svg_shapes(square=False):
    scale = 1 if not square else 880/WIDTH
    ox = 0 if not square else 60
    oy = 0 if not square else (1000-HEIGHT*scale)/2
    def num(n): return f'{n:.3f}'.rstrip('0').rstrip('.')
    return '\n'.join('<polygon fill="'+color+'" points="'+' '.join(f'{num(x+ox)},{num(y+oy)}' for x,y in pts)+'"/>' for color,pts in polygons((LEFT,TOP),scale))

def main():
    source=Image.open(ROOT/'tools/brand/logo-source.png').convert('RGB')
    # Same source-space polygons, supersampled fourfold and reduced once.
    verify_left, verify_top, verify_right, verify_bottom = 536, 517, 1464, 1075
    expected=source.crop((verify_left,verify_top,verify_right,verify_bottom))
    rendered=Image.new('RGB',(expected.width*4,expected.height*4),'white')
    draw=ImageDraw.Draw(rendered)
    for color,pts in polygons((verify_left,verify_top),4):draw.polygon(pts,fill=color)
    rendered=rendered.resize(expected.size,Image.Resampling.LANCZOS)
    palette=[(255,255,255),(0,74,173),(4,54,123)]
    def classify(pixel):
        return min(range(3),key=lambda c:sum((pixel[j]-palette[c][j])**2 for j in range(3)))
    counts=[[0,0] for _ in palette]
    for a,b in zip(zip(*[iter(expected.tobytes())]*3),zip(*[iter(rendered.tobytes())]*3)):
        a,b=classify(a),classify(b)
        for c in range(3):
            counts[c][0]+=a==c and b==c
            counts[c][1]+=a==c or b==c
    for c,name in [(1,'Blue'),(2,'Navy')]:
        iou=counts[c][0]/counts[c][1]
        print(f'{name} IoU: {iou:.8f}')
        assert iou>=.99, f'{name} trace needs adjustment'
    brand=ROOT/'assets/brand';brand.mkdir(parents=True,exist_ok=True)
    (brand/'w-mark.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="'+VIEWBOX+'">\n<symbol id="w-mark" viewBox="'+VIEWBOX+'">\n'+svg_shapes()+'\n</symbol>\n<use href="#w-mark"/>\n</svg>\n')
    assets=ROOT/'assets'
    (assets/'favicon.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">\n'+svg_shapes(True)+'\n</svg>\n')
    for size in (32,512):raster((size,size),.88,(0,0,0,0)).save(assets/f'favicon-{size}.png')
    raster((180,180),.72,'white').convert('RGB').save(assets/'apple-touch-icon.png')
    # Non-white lockup pixels, including the thin gradient subtitle.
    ink=Image.eval(source.convert('L'),lambda p:255-p).point(lambda p:255 if p>15 else 0)
    box=ink.getbbox();margin=16
    box=(max(0,box[0]-margin),max(0,box[1]-margin),min(source.width,box[2]+margin),min(source.height,box[3]+margin))
    lockup=source.crop(box); height=round(630*.70)
    lockup=lockup.resize((round(lockup.width*height/lockup.height),height),Image.Resampling.LANCZOS)
    og=Image.new('RGB',(1200,630),'white');og.paste(lockup,((1200-lockup.width)//2,(630-height)//2))
    og.save(assets/'og-thumbnail.jpg',quality=86,progressive=True)
    # A 315 px mark height, with a matching width fraction for the renderer.
    fraction=(315*WIDTH/HEIGHT)/1200
    raster((1200,630),fraction,NAVY,{BLUE:'#FFFFFF',NAVY:'#9DB8E8'}).convert('RGB').save(assets/'og-thumbnail-navy.jpg',quality=86,progressive=True)
    readme=ROOT/'tools/brand/README.md'
    readme.write_text('logo-source.png is the original full WhittWorks logo lockup.\ntrace_mark.py traces the W with straight polygons, verifies blue and navy overlap, and generates the reusable mark SVG and browser and Apple icons.\nThe two JPEG share images show the full lockup on white and the traced mark with pale facets on navy.\nRegenerate every asset from the repository root with `python3 -I tools/brand/trace_mark.py` using Python 3 and Pillow 11 or later.\n')
    files=['tools/brand/logo-source.png','tools/brand/trace_mark.py','assets/brand/w-mark.svg','assets/favicon.svg','assets/favicon-32.png','assets/favicon-512.png','assets/apple-touch-icon.png','assets/og-thumbnail.jpg','assets/og-thumbnail-navy.jpg','tools/brand/README.md']
    for name in files:
        path=ROOT/name
        if path.suffix in ('.png','.jpg'):
            with Image.open(path) as im: detail=f'{im.width}x{im.height}, {im.mode}'
        elif path.suffix=='.svg':detail='viewBox '+(VIEWBOX if 'w-mark' in name else '0 0 1000 1000')
        else:detail='text, no pixel dimensions'
        print(f'{name}: {path.stat().st_size} bytes, {detail}')
    assert (brand/'w-mark.svg').stat().st_size<4096
    assert (assets/'favicon.svg').stat().st_size<3072
    assert (assets/'og-thumbnail.jpg').stat().st_size<80000
    assert (assets/'og-thumbnail-navy.jpg').stat().st_size<60000

if __name__=='__main__':main()
