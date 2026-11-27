"""Writes src/game/modePictures.ts: the chain pictures of the bonus modes, as SVG. The drawing is the lobby tile's own (output/kilara-keno/tile/work/build_chain.py): square
links, each with a hard edge under it, rising to the right, a small gap where one link passes
under another.
Run: python3 scripts/mode_pictures.py  (from apps/keno-chain)"""
import pathlib

GREEN = ('#3fe082', '#1c9f55')
GOLD = ('#ffcf45', '#c2850a')
S = 96


def f(v):
    return f'{v:.2f}'.rstrip('0').rstrip('.')


def rect(x0, y0, x1, y1):
    return f'M{f(x0)} {f(y0)}H{f(x1)}V{f(y1)}H{f(x0)}Z'


def picture(colours, a):
    n = len(colours)
    t = a * 0.349
    lip = t * 0.55
    d = a * 0.98
    g = t * 0.2
    cs = [(S / 2 + d * (i - (n - 1) / 2), S / 2 - d * (i - (n - 1) / 2) - lip / 2) for i in range(n)]

    def ring(i):
        x, y = cs[i]
        top, edge = colours[i]
        parts = []
        for oy, fill in ((lip, edge), (0, top)):
            path = rect(x - a, y - a + oy, x + a, y + a + oy) + rect(x - a + t, y - a + t + oy, x + a - t, y + a - t + oy)
            parts.append(f'<path fill="{fill}" fill-rule="evenodd" d="{path}"/>')
        return ''.join(parts)

    defs = []

    def without(inner, hole):
        # what is drawn so far, with a hole cut in it
        name = f'm{len(defs)}'
        defs.append(f'<mask id="{name}"><path fill="#fff" d="{rect(0, 0, S, S)}"/><path fill="#000" fill-rule="evenodd" d="{hole}"/></mask>')
        return f'<g mask="url(#{name})">{inner}</g>'

    def within(inner, box):
        name = f'c{len(defs)}'
        defs.append(f'<clipPath id="{name}"><path d="{box}"/></clipPath>')
        return f'<g clip-path="url(#{name})">{inner}</g>'

    drawn = ring(0)
    for i in range(1, n):
        x, y = cs[i]
        grown = rect(x - a - g, y - a - g, x + a + g, y + a + lip + g) + rect(x - a + t + g, y - a + t + lip + g, x + a - t - g, y + a - t - g)
        drawn = without(drawn, grown) + ring(i)
    for i in range(n - 1):  # link i passes over link i+1 where its top bar meets the next one's left bar
        x = cs[i + 1][0] - a
        y = cs[i][1] - a
        box = rect(x - g, y - g, x + t + g, y + t + lip + g)
        drawn = without(drawn, box) + within(ring(i), rect(x, y, x + t, y + t + lip))
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {S} {S}"><defs>{"".join(defs)}</defs>{drawn}</svg>'


out = f'''// The chain pictures of the bonus modes: the lobby tile's own drawing
// (square links, each with a hard edge under it). Written by scripts/mode_pictures.py; change the
// drawing there, not here.
export const CHAIN_PICTURES = {{
	// Unbroken Chain: two links in the hit colour
	chain: '{picture([GREEN, GREEN], 30)}',
	// Golden Chain: three links in the win colour
	chainmax: '{picture([GOLD, GOLD, GOLD], 22.6)}',
}};
'''
pathlib.Path(__file__).parent.parent.joinpath('src/game/modePictures.ts').write_text(out)
