#!/usr/bin/env python3
"""Turn an image into true pixel art on a fixed grid, locked to a palette.

Every output pixel is the most common palette colour of the source block it covers, so edges stay
hard and no colour outside the palette survives. Run with:

  uv run --no-project --with pillow --with numpy python pixelize.py IN.png OUT.png --size 120x160

Options:
  --size WxH        logical size in art pixels (required)
  --fit contain|cover|stretch   how the source fills the size (default contain)
  --anchor X,Y      where the source sits inside the size for contain, 0..1 (default 0.5,1 =
                    centred on the bottom edge)
  --no-trim         keep the transparent margin of the source (default trims to the opaque box)
  --box L,T,R,B     use this source rectangle instead of trimming (source pixels)
  --scale N         also write OUT upscaled N times with nearest neighbour (default 1)
  --logical PATH    also write the 1x logical image here
  --alpha T         a block is opaque when more than T of it is opaque (default 0.5)
  --opaque          ignore source alpha (backgrounds)
  --palette PATH    the game's palette as a paint.net palette file (required), e.g.
                    apps/<game>/art/palette.txt
  --keep            do not despeckle (default removes single stray pixels inside flat areas)
"""
import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent


def load_palette(path):
    colours = []
    for line in Path(path).read_text().splitlines():
        line = line.strip()
        if not line or line.startswith(';'):
            continue
        colours.append([int(line[2:4], 16), int(line[4:6], 16), int(line[6:8], 16)])
    return np.array(colours, dtype=np.uint8)


def srgb_to_oklab(rgb):
    c = rgb.astype(np.float64) / 255.0
    lin = np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    l = 0.4122214708 * lin[..., 0] + 0.5363325363 * lin[..., 1] + 0.0514459929 * lin[..., 2]
    m = 0.2119034982 * lin[..., 0] + 0.6806995451 * lin[..., 1] + 0.1073969566 * lin[..., 2]
    s = 0.0883024619 * lin[..., 0] + 0.2817188376 * lin[..., 1] + 0.6299787005 * lin[..., 2]
    l, m, s = np.cbrt(l), np.cbrt(m), np.cbrt(s)
    return np.stack(
        [
            0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
            1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
            0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
        ],
        axis=-1,
    )


def nearest_index(rgb, palette):
    """Palette index of every pixel, by OKLab distance."""
    lab = srgb_to_oklab(rgb.reshape(-1, 3))
    pal = srgb_to_oklab(palette)
    out = np.empty(len(lab), dtype=np.int16)
    step = 200000
    for start in range(0, len(lab), step):
        chunk = lab[start : start + step]
        distance = ((chunk[:, None, :] - pal[None, :, :]) ** 2).sum(axis=2)
        out[start : start + step] = distance.argmin(axis=1)
    return out.reshape(rgb.shape[:2])


def block_mode(indexes, opaque, width, height, alpha_threshold):
    """The most common palette index of each block; -1 where the block is mostly clear."""
    src_h, src_w = indexes.shape
    out = np.full((height, width), -1, dtype=np.int16)
    xs = np.linspace(0, src_w, width + 1).round().astype(int)
    ys = np.linspace(0, src_h, height + 1).round().astype(int)
    for y in range(height):
        for x in range(width):
            block = indexes[ys[y] : max(ys[y + 1], ys[y] + 1), xs[x] : max(xs[x + 1], xs[x] + 1)]
            mask = opaque[ys[y] : max(ys[y + 1], ys[y] + 1), xs[x] : max(xs[x + 1], xs[x] + 1)]
            if mask.mean() <= alpha_threshold:
                continue
            values = block[mask]
            out[y, x] = np.bincount(values, minlength=64).argmax()
    return out


def despeckle(grid):
    """Replace a pixel that differs from all four neighbours when at least three of them agree."""
    out = grid.copy()
    h, w = grid.shape
    for y in range(1, h - 1):
        for x in range(1, w - 1):
            value = grid[y, x]
            around = [grid[y - 1, x], grid[y + 1, x], grid[y, x - 1], grid[y, x + 1]]
            if value in around:
                continue
            counts = {}
            for n in around:
                counts[n] = counts.get(n, 0) + 1
            best, count = max(counts.items(), key=lambda item: item[1])
            if count >= 3 and best != -1 and value != -1:
                out[y, x] = best
    return out


def to_image(grid, palette):
    h, w = grid.shape
    rgba = np.zeros((h, w, 4), dtype=np.uint8)
    mask = grid >= 0
    rgba[mask, :3] = palette[grid[mask]]
    rgba[mask, 3] = 255
    return Image.fromarray(rgba, 'RGBA')


def pixelize(image, size, palette, fit='contain', anchor=(0.5, 1.0), trim=True, box=None,
             alpha_threshold=0.5, opaque=False, keep=False):
    width, height = size
    image = image.convert('RGBA')
    if box:
        image = image.crop(box)
    elif trim and not opaque:
        bbox = image.getchannel('A').point(lambda a: 255 if a > 40 else 0).getbbox()
        if bbox:
            image = image.crop(bbox)
    data = np.array(image)
    is_opaque = np.ones(data.shape[:2], dtype=bool) if opaque else data[..., 3] > 127
    indexes = nearest_index(data[..., :3], palette)
    src_h, src_w = indexes.shape

    if fit == 'stretch':
        return to_image(_finish(block_mode(indexes, is_opaque, width, height, alpha_threshold), keep), palette)

    scale = min(width / src_w, height / src_h) if fit == 'contain' else max(width / src_w, height / src_h)
    if fit == 'cover':
        # crop the source to the target ratio, centred
        crop_w, crop_h = int(round(width / scale)), int(round(height / scale))
        left, top = (src_w - crop_w) // 2, (src_h - crop_h) // 2
        indexes = indexes[top : top + crop_h, left : left + crop_w]
        is_opaque = is_opaque[top : top + crop_h, left : left + crop_w]
        return to_image(_finish(block_mode(indexes, is_opaque, width, height, alpha_threshold), keep), palette)

    inner_w, inner_h = max(1, int(round(src_w * scale))), max(1, int(round(src_h * scale)))
    inner = _finish(block_mode(indexes, is_opaque, inner_w, inner_h, alpha_threshold), keep)
    grid = np.full((height, width), -1, dtype=np.int16)
    left = int(round((width - inner_w) * anchor[0]))
    top = int(round((height - inner_h) * anchor[1]))
    grid[top : top + inner_h, left : left + inner_w] = inner
    return to_image(grid, palette)


def _finish(grid, keep):
    return grid if keep else despeckle(grid)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('source')
    parser.add_argument('out')
    parser.add_argument('--size', required=True)
    parser.add_argument('--fit', default='contain', choices=['contain', 'cover', 'stretch'])
    parser.add_argument('--anchor', default='0.5,1')
    parser.add_argument('--no-trim', action='store_true')
    parser.add_argument('--box')
    parser.add_argument('--scale', type=int, default=1)
    parser.add_argument('--logical')
    parser.add_argument('--alpha', type=float, default=0.5)
    parser.add_argument('--opaque', action='store_true')
    parser.add_argument('--palette', required=True)
    parser.add_argument('--keep', action='store_true')
    args = parser.parse_args()

    width, height = (int(v) for v in args.size.lower().split('x'))
    palette = load_palette(args.palette)
    result = pixelize(
        Image.open(args.source),
        (width, height),
        palette,
        fit=args.fit,
        anchor=tuple(float(v) for v in args.anchor.split(',')),
        trim=not args.no_trim,
        box=tuple(int(v) for v in args.box.split(',')) if args.box else None,
        alpha_threshold=args.alpha,
        opaque=args.opaque,
        keep=args.keep,
    )
    if args.logical:
        result.save(args.logical)
    if args.scale > 1:
        result = result.resize((width * args.scale, height * args.scale), Image.NEAREST)
    result.save(args.out, optimize=True)
    print(f'{args.out}: {result.size[0]}x{result.size[1]} (logical {width}x{height})', file=sys.stderr)


if __name__ == '__main__':
    main()
