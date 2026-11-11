#!/usr/bin/env python3
"""Contact sheet of a frame sequence: sheet.py OUT.png STEM START END STEP [--cols N] [--width W] [--crop x0,y0,x1,y1 (fractions)]"""
import argparse, glob
from PIL import Image, ImageDraw
p = argparse.ArgumentParser()
p.add_argument('out'); p.add_argument('stem'); p.add_argument('start', type=int); p.add_argument('end', type=int); p.add_argument('step', type=int)
p.add_argument('--cols', type=int, default=8); p.add_argument('--width', type=int, default=220); p.add_argument('--crop')
a = p.parse_args()
tiles = []
for i in range(a.start, a.end, a.step):
    im = Image.open(f'{a.stem}-{i:03d}.png').convert('RGB')
    if a.crop:
        x0, y0, x1, y1 = (float(v) for v in a.crop.split(','))
        im = im.crop((int(x0 * im.width), int(y0 * im.height), int(x1 * im.width), int(y1 * im.height)))
    im = im.resize((a.width, round(im.height * a.width / im.width)), Image.LANCZOS)
    ImageDraw.Draw(im).text((4, 2), str(i), fill=(255, 255, 0))
    tiles.append(im)
rows = (len(tiles) + a.cols - 1) // a.cols
w, h = tiles[0].size
sheet = Image.new('RGB', (a.cols * w, rows * h), (20, 20, 20))
for n, im in enumerate(tiles):
    sheet.paste(im, ((n % a.cols) * w, (n // a.cols) * h))
sheet.save(a.out)
print(a.out, sheet.size)
