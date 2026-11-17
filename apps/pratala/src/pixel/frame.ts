import { PixelCanvas } from './canvas.ts';
import { CLEAR, INK, RAMPS, color } from './palette.ts';
import { random } from './ui.ts';

// The board's frame (v2, approved 2026-11-17): heavy, dark, iron-banded stone round the board, a
// molten inner edge whose banded light spills over the cells, and carved stone corners in the manner of a candi's relief:
// stepped blocks with sulur (tendril) scrollwork and pointed antefix crowns. Free spins: red-hot
// stone, heated iron, cracks glowing from the edge out. Drawn on the symbols' grid, 64 art pixels
// to a cell, in parts: the stone, the molten edge (its own frames, so it breathes) and the
// corners. The horned crest with an eye over the top middle was removed on 2026-11-17 (the user
// asked what it was and wanted it gone). See reports/review/pratala-2026-11-17-fx-mockups.

export const FRAME_GRID = 64;
export type FrameVariant = 'base' | 'fs';

// band thicknesses round the opening, in art pixels
export const FRAME_BAND = { top: 34, bottom: 40, side: 26 } as const;
// how far the corners stand past the bands
export const FRAME_PAD = { top: 40, bottom: 24, side: 5 } as const;
// how many art pixels of molten edge there are, and how far its light spills over the cells
export const EMBER_DEPTH = { base: 11, fs: 12 } as const;
export const EDGE_FRAMES = 4;
// the light the molten edge throws over the cells: [inset from the opening's edge, alpha, colour]
export const FRAME_SPILL = {
	base: [
		[3, 0.5, 0xff5000],
		[6, 0.32, 0xc64524],
		[10, 0.18, 0xc64524],
	],
	fs: [
		[4, 0.6, 0xffa214],
		[8, 0.4, 0xff5000],
		[13, 0.22, 0xc64524],
	],
} as const;

const FIRE = RAMPS.fire; // 571c27 8e251d c64524 ff5000 ffa214 ffeb57 ffffff
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const bayer = (x: number, y: number) => BAYER[(((y % 4) + 4) % 4) * 4 + (((x % 4) + 4) % 4)];

// ink, deep, dark, body, lit, high: darker than v1, so the fire carries it
const STONE = {
	base: [INK, color(0x0e071b), color(0x1a1932), color(0x2a2f4e), color(0x424c6e), color(0x657392)],
	fs: [INK, color(0x1c121c), color(0x391f21), color(0x571c27), color(0x8e251d), color(0xc64524)],
};
const IRON = {
	base: [0x131313, 0x272727, 0x3d3d3d, 0x5d5d5d, 0x858585, 0xb4b4b4].map(color),
	fs: [0x131313, 0x1c121c, 0x391f21, 0x5d2c28, 0x8a4836, 0xbf6f4a].map(color),
};
// the molten edge from the opening outward
const EMBER = {
	base: [
		INK,
		FIRE[4],
		FIRE[5],
		FIRE[5],
		FIRE[4],
		FIRE[3],
		FIRE[3],
		FIRE[2],
		FIRE[2],
		FIRE[1],
		FIRE[0],
	],
	fs: [
		INK,
		FIRE[5],
		FIRE[6],
		FIRE[6],
		FIRE[5],
		FIRE[4],
		FIRE[4],
		FIRE[3],
		FIRE[3],
		FIRE[2],
		FIRE[1],
		FIRE[0],
	],
};

type Mask = Uint8Array;

// A shape banded by its rough normal against a top-left light: the distance to its outside, then
// that distance's slope, as the mockups' shaded().
const shaded = (mask: Mask, width: number, height: number, ramp: readonly number[]) => {
	const d = new Float32Array(width * height);
	for (let i = 0; i < d.length; i++) d[i] = mask[i] ? 99 : 0;
	const at = (x: number, y: number) => d[y * width + x];
	for (let pass = 0; pass < 2; pass++) {
		for (let y = 0; y < height; y++)
			for (let x = 0; x < width; x++)
				if (at(x, y))
					d[y * width + x] = Math.min(at(x, y), y ? at(x, y - 1) + 1 : 1, x ? at(x - 1, y) + 1 : 1);
		for (let y = height - 1; y >= 0; y--)
			for (let x = width - 1; x >= 0; x--)
				if (at(x, y))
					d[y * width + x] = Math.min(
						at(x, y),
						y < height - 1 ? at(x, y + 1) + 1 : 1,
						x < width - 1 ? at(x + 1, y) + 1 : 1,
					);
	}
	const slope = (x: number, y: number, dx: number, dy: number) => {
		const back = [x - dx, y - dy];
		const ahead = [x + dx, y + dy];
		const inside = (p: number[]) => p[0] >= 0 && p[1] >= 0 && p[0] < width && p[1] < height;
		if (inside(back) && inside(ahead)) return (at(ahead[0], ahead[1]) - at(back[0], back[1])) / 2;
		if (inside(ahead)) return at(ahead[0], ahead[1]) - at(x, y);
		if (inside(back)) return at(x, y) - at(back[0], back[1]);
		return 0;
	};
	const out = new PixelCanvas(width, height);
	for (let y = 0; y < height; y++)
		for (let x = 0; x < width; x++) {
			if (!mask[y * width + x]) continue;
			const gx = slope(x, y, 1, 0);
			const gy = slope(x, y, 0, 1);
			const lit = -(gx * -0.6 + gy * -0.8);
			const flat = Math.min(1, Math.max(0, at(x, y) / 4));
			const v = 0.5 + 0.45 * Math.max(-1, Math.min(1, lit)) * (1 - flat) + 0.08 * flat;
			out.set(x, y, ramp[Math.max(0, Math.min(ramp.length - 1, Math.floor(v * ramp.length)))]);
		}
	return out;
};

const maskOf = (width: number, height: number, test: (x: number, y: number) => boolean) => {
	const mask = new Uint8Array(width * height);
	for (let y = 0; y < height; y++)
		for (let x = 0; x < width; x++) mask[y * width + x] = test(x, y) ? 1 : 0;
	return mask;
};

const rivet = (canvas: PixelCanvas, x: number, y: number, variant: FrameVariant) => {
	const i = IRON[variant];
	canvas
		.set(x, y, i[5])
		.set(x + 1, y, i[3])
		.set(x, y + 1, i[3])
		.set(x + 1, y + 1, i[1]);
};

const box = (canvas: PixelCanvas, x: number, y: number, w: number, h: number, c: number) => {
	canvas.rect(x, y, w, 1, c);
	canvas.rect(x, y + h - 1, w, 1, c);
	canvas.rect(x, y, 1, h, c);
	canvas.rect(x + w - 1, y, 1, h, c);
};

// an iron band over the stone, bevelled, riveted at both ends
const ironStrap = (
	canvas: PixelCanvas,
	x: number,
	y: number,
	w: number,
	h: number,
	variant: FrameVariant,
) => {
	const i = IRON[variant];
	canvas.rect(x, y, w, h, i[2]);
	canvas.rect(x, y, w, 1, i[4]);
	canvas.rect(x, y, 1, h, i[4]);
	canvas.rect(x, y + h - 1, w, 1, i[0]);
	canvas.rect(x + w - 1, y, 1, h, i[0]);
	box(canvas, x - 1, y - 1, w + 2, h + 2, INK);
	if (w <= h) {
		rivet(canvas, x + Math.floor(w / 2) - 1, y + 3, variant);
		rivet(canvas, x + Math.floor(w / 2) - 1, y + h - 5, variant);
	} else {
		rivet(canvas, x + 3, y + Math.floor(h / 2) - 1, variant);
		rivet(canvas, x + w - 5, y + Math.floor(h / 2) - 1, variant);
	}
};

// the whole frame's measures, in art pixels, on a canvas whose (0, 0) is its top-left corner
export const frameGeometry = (columns: number, rows: number, variant: FrameVariant) => {
	const width = columns * FRAME_GRID;
	const height = rows * FRAME_GRID;
	const ox = FRAME_BAND.side + FRAME_PAD.side;
	const oy = FRAME_BAND.top + FRAME_PAD.top;

	return {
		width,
		height,
		// the opening's top-left
		ox,
		oy,
		// the stone's outer box
		fx0: ox - FRAME_BAND.side,
		fy0: oy - FRAME_BAND.top,
		fx1: ox + width + FRAME_BAND.side,
		fy1: oy + height + FRAME_BAND.bottom,
		canvasWidth: width + ox * 2,
		canvasHeight: oy + height + FRAME_BAND.bottom + FRAME_PAD.bottom,
		ember: EMBER_DEPTH[variant],
	};
};

// how far a pixel is outside the opening: -1 inside, 0 on the first ring out
const outside = (g: ReturnType<typeof frameGeometry>, x: number, y: number) => {
	const dx = Math.max(g.ox - 1 - x, x - (g.ox + g.width), -1);
	const dy = Math.max(g.oy - 1 - y, y - (g.oy + g.height), -1);
	return Math.max(dx, dy);
};

const MOULD = 3;

// The stone: dressed blocks, an iron lip between them and the fire, iron straps across, and in free
// spins the cracks. The molten edge is drawn by moltenEdge(), the corners on their own.
export const frameStone = (columns: number, rows: number, variant: FrameVariant) => {
	const g = frameGeometry(columns, rows, variant);
	const [ink, deep, dark, body, lit, high] = STONE[variant];
	const canvas = new PixelCanvas(g.canvasWidth, g.canvasHeight);
	const next = random(21);
	const int = (low: number, high: number) => low + Math.floor(next() * (high - low + 1));
	const E = g.ember;
	const { fx0, fy0, fx1, fy1, ox, oy } = g;
	const bt = FRAME_BAND.top;
	const bb = FRAME_BAND.bottom;
	const bs = FRAME_BAND.side;

	const block = (x: number, y: number, w: number, h: number) => {
		if (w <= 0 || h <= 0) return;
		canvas.rect(x, y, w, h, body);
		canvas.rect(x, y, w, 1, high);
		canvas.rect(x, y, 1, h, high);
		canvas.rect(x + 1, y + 1, w - 1, 1, lit);
		canvas.rect(x + 1, y + 1, 1, h - 1, lit);
		canvas.rect(x, y + h - 3, w, 3, dark);
		canvas.rect(x + w - 3, y, 3, h, dark);
		canvas.rect(x, y + h - 1, w, 1, deep);
		canvas.rect(x + w - 1, y, 1, h, deep);
		for (let i = 0; i < Math.max(1, Math.floor((w * h) / 60)); i++) {
			const cx = x + int(3, Math.max(3, w - 4));
			const cy = y + int(3, Math.max(3, h - 4));
			canvas.set(cx, cy, dark);
			if (next() < 0.6) canvas.set(cx + 1, cy, deep).set(cx, cy - 1, lit);
		}
	};

	canvas.rect(fx0, fy0, fx1 - fx0, fy1 - fy0, ink);
	for (const side of ['top', 'bottom'] as const) {
		const depth = (side === 'top' ? bt : bb) - E - MOULD - 1;
		const y = side === 'top' ? fy0 : oy + g.height + E + MOULD + 1;
		let x = fx0 - int(4, 16);
		while (x < fx1) {
			const w = int(34, 50);
			block(Math.max(fx0, x), y, Math.min(x + w, fx1) - Math.max(fx0, x) - 1, depth - 1);
			x += w;
		}
	}
	for (const side of ['left', 'right'] as const) {
		const depth = bs - E - MOULD - 1;
		const x = side === 'left' ? fx0 : ox + g.width + E + MOULD + 1;
		let y = oy - E - MOULD - 1;
		while (y < oy + g.height + E + MOULD) {
			const h = int(30, 44);
			block(x, y, depth - 1, Math.min(h, oy + g.height + E + MOULD + 1 - y) - 1);
			y += h;
		}
	}
	// a narrow iron lip between the blocks and the fire
	const iron = IRON[variant];
	for (let y = fy0; y < fy1; y++)
		for (let x = fx0; x < fx1; x++) {
			const k = outside(g, x, y) - E;
			if (k >= 0 && k < MOULD) canvas.set(x, y, [iron[1], iron[3], ink][k]);
		}
	canvas.rect(fx0, fy0, fx1 - fx0, 1, high);
	canvas.rect(fx0, fy0, 1, fy1 - fy0, high);
	box(canvas, fx0 - 1, fy0 - 1, fx1 - fx0 + 2, fy1 - fy0 + 2, ink);
	// iron straps across the bands
	for (let x = ox + 46; x < ox + g.width - 30; x += 76) {
		ironStrap(canvas, x, fy0 + 1, 8, bt - E - MOULD - 1, variant);
		ironStrap(canvas, x + 20, oy + g.height + E + MOULD + 1, 8, bb - E - MOULD - 2, variant);
	}
	for (let y = oy + 50; y < oy + g.height - 30; y += 92) {
		ironStrap(canvas, fx0 + 1, y, bs - E - MOULD - 1, 8, variant);
		ironStrap(canvas, ox + g.width + E + MOULD + 1, y + 30, bs - E - MOULD - 2, 8, variant);
	}
	// under the molten edge the stone is bare: the edge frames cover it
	for (let y = fy0; y < fy1; y++)
		for (let x = fx0; x < fx1; x++) {
			const d = outside(g, x, y);
			if (d < E + 2) canvas.set(x, y, CLEAR);
		}
	// free spins: cracks open from the molten edge out through the stone
	if (variant === 'fs') {
		const pick = <T>(list: readonly T[]) => list[Math.floor(next() * list.length)];
		for (let crack = 0; crack < 110; crack++) {
			const side = pick(['top', 'top', 'bottom', 'bottom', 'left', 'right'] as const);
			let x: number;
			let y: number;
			let step: [number, number];
			if (side === 'top' || side === 'bottom') {
				x = int(ox + 2, ox + g.width - 3);
				y = side === 'top' ? oy - E - 2 : oy + g.height + E + 1;
				step = [0, side === 'top' ? -1 : 1];
			} else {
				y = int(oy + 2, oy + g.height - 3);
				x = side === 'left' ? ox - E - 2 : ox + g.width + E + 1;
				step = [side === 'left' ? -1 : 1, 0];
			}
			const band = side === 'top' ? bt : side === 'bottom' ? bb : bs;
			const path: [number, number][] = [];
			const length = int(6, band - E + 2);
			for (let i = 0; i < length; i++) {
				path.push([x, y]);
				const wander = pick([-1, 0, 0, 1]);
				if (step[0] === 0) {
					x += wander;
					y += step[1];
				} else {
					y += wander;
					x += step[0];
				}
				if (!(fx0 < x && x < fx1 - 1 && fy0 < y && y < fy1 - 1)) break;
			}
			path.forEach(([cx, cy], j) => {
				if (canvas.get(cx, cy) === CLEAR) return;
				const t = j / Math.max(1, path.length - 1);
				canvas.set(cx, cy, t < 0.35 ? FIRE[5] : t < 0.7 ? FIRE[4] : FIRE[3]);
				const sx = Math.abs(step[1]);
				const sy = Math.abs(step[0]);
				for (const [nx, ny] of [
					[cx + sx, cy + sy],
					[cx - sx, cy - sy],
				]) {
					const c = canvas.get(nx, ny);
					if (c !== CLEAR && c !== FIRE[3] && c !== FIRE[4] && c !== FIRE[5])
						canvas.set(nx, ny, t < 0.5 ? FIRE[2] : FIRE[1]);
				}
			});
		}
	}
	return canvas;
};

// One frame of the molten edge, on the frame's whole canvas: the heat bands step in and out by a
// pixel here and there along the edge, so it breathes in colour steps and nothing moves.
export const moltenEdge = (columns: number, rows: number, variant: FrameVariant, frame: number) => {
	const g = frameGeometry(columns, rows, variant);
	const ember = EMBER[variant];
	const E = g.ember;
	const canvas = new PixelCanvas(g.canvasWidth, g.canvasHeight);
	// a soft pattern along the edge's length, one per frame, giving each run of pixels a shift
	const next = random(300 + frame * 17);
	const knots = Array.from({ length: 64 }, next);
	const along = (u: number) => {
		const v = u / 9;
		const i = Math.floor(v);
		const a = v - i;
		const s = a * a * (3 - 2 * a);
		return knots[i % 64] * (1 - s) + knots[(i + 1) % 64] * s;
	};
	const perimeter = (x: number, y: number) => {
		// the distance round the opening, so neighbouring pixels share their shift
		if (y < g.oy) return x - g.ox;
		if (x >= g.ox + g.width) return g.width + (y - g.oy);
		if (y >= g.oy + g.height) return g.width + g.height + (g.ox + g.width - x);
		return 2 * g.width + g.height + (g.oy + g.height - y);
	};
	for (let y = g.fy0; y < g.fy1; y++)
		for (let x = g.fx0; x < g.fx1; x++) {
			const d = outside(g, x, y);
			if (d < 0 || d >= E + 2) continue;
			if (d === 0) {
				canvas.set(x, y, INK);
				continue;
			}
			const n = along(perimeter(x, y) + frame * 23);
			const shift = n > 0.72 ? -1 : n < 0.22 ? 1 : 0;
			const k = d + shift;
			if (k >= 1 && k < E) canvas.set(x, y, ember[k]);
			else if (k < 1) canvas.set(x, y, ember[1]);
			else if (bayer(x, y) < (k === E ? 8 : 4) && k < E + 2)
				canvas.set(x, y, variant === 'fs' ? FIRE[2] : FIRE[1]);
			else canvas.set(x, y, STONE[variant][1]);
		}
	return canvas;
};

// A carved corner in the manner of a candi's stone relief: a stepped block, its face cut with a
// double sulur volute (two tendrils curling into each other), crowned by a pointed antefix with
// curled feet and a carved rib. The same dark stone as the frame, cut in low relief lit from the
// top left; the edges facing the board catch the molten edge's glow. The bottom corners hang a
// shorter antefix downward. Drawn for the left corners; the right ones are drawn mirrored and lit
// again, so the light stays top-left.
export const CORNER = { width: 48, block: 42, crown: 18, pendant: 12 } as const;

const spiral = (
	raised: Uint8Array,
	w: number,
	h: number,
	cx: number,
	cy: number,
	turns: number,
	r0: number,
	r1: number,
	start: number,
	direction: 1 | -1,
	thick = 2,
) => {
	const steps = Math.round(turns * 120);
	for (let i = 0; i <= steps; i++) {
		const t = i / steps;
		const angle = start + direction * t * turns * Math.PI * 2;
		const r = r1 + (r0 - r1) * t;
		const x = Math.round(cx + Math.cos(angle) * r);
		const y = Math.round(cy + Math.sin(angle) * r);
		for (let dy = 0; dy < thick; dy++)
			for (let dx = 0; dx < thick; dx++)
				if (x + dx >= 0 && y + dy >= 0 && x + dx < w && y + dy < h)
					raised[(y + dy) * w + x + dx] = 1;
	}
};

// low relief: the raised carving lit on its top and left and shaded on its bottom and right, its
// shadow cast down and right onto the stone it is cut from
const relief = (
	canvas: PixelCanvas,
	raised: Uint8Array,
	w: number,
	h: number,
	stone: readonly number[],
) => {
	const [, deep, dark, , lit, high] = stone;
	const r = (x: number, y: number) => (x >= 0 && y >= 0 && x < w && y < h ? raised[y * w + x] : 0);
	const next = canvas.clone();
	for (let y = 0; y < h; y++)
		for (let x = 0; x < w; x++) {
			if (canvas.get(x, y) === CLEAR) continue;
			if (r(x, y)) {
				const topLeft = !r(x - 1, y) || !r(x, y - 1);
				const bottomRight = !r(x + 1, y) || !r(x, y + 1);
				next.set(x, y, topLeft ? high : bottomRight ? dark : lit);
			} else if (r(x - 1, y - 1) || r(x - 1, y) || r(x, y - 1)) next.set(x, y, deep);
		}
	canvas.data.set(next.data);
};

const cornerCanvas = (variant: FrameVariant, top: boolean) => {
	const st = STONE[variant];
	const [, deep, dark, body, lit, high] = st;
	const { width: bw, block: bh, crown: ch } = CORNER;
	// a pixel of room round the block for its outline
	const w = bw + 2;
	const h = ch + bh + 1;
	// the shapes are laid out crown-up; a bottom corner reads them turned over, its antefix a
	// shorter pendant, and is lit as it stands, from the top left
	const cut = top ? 0 : CORNER.crown - CORNER.pendant;
	const height = h - cut;
	const ty = (y: number) => (top ? y : h - 1 - y);
	const canvas = new PixelCanvas(w, height);
	const by = ch;
	const mid = w / 2;
	// the block: its corners stepped in twice, and two tiers stepping in toward its face
	const notch = (x: number, y: number, inset: number, ww: number, hh: number) => {
		const ix = Math.min(x - inset, inset + ww - 1 - x);
		const iy = Math.min(y - by - inset, by + inset + hh - 1 - y);
		return (ix < 2 && iy < 2) || (ix < 4 && iy < 0) || (ix < 0 && iy < 4)
			? false
			: ix >= 0 && iy >= 0;
	};
	[1, 4, 7].forEach((inset, tier) => {
		const ww = bw + 2 - inset * 2;
		const hh = bh - (inset - 1) * 2;
		const inside = (x: number, y: number) => y >= 0 && y < height && notch(x, ty(y), inset, ww, hh);
		const face = tier === 0 ? dark : body;
		for (let y = 0; y < height; y++)
			for (let x = 0; x < w; x++) {
				if (!inside(x, y)) continue;
				// a bevel: lit where the step faces up or left, shaded where it faces down or right
				const up = !inside(x, y - 1) || !inside(x, y - 2);
				const left = !inside(x - 1, y) || !inside(x - 2, y);
				const down = !inside(x, y + 1) || !inside(x, y + 2);
				const right = !inside(x + 1, y) || !inside(x + 2, y);
				const outer = !inside(x, y - 1) || !inside(x - 1, y);
				const c =
					(up || left) && !(down && !up) && !(right && !left)
						? outer
							? high
							: lit
						: down || right
							? !inside(x, y + 1) || !inside(x + 1, y)
								? deep
								: dark
							: face;
				canvas.set(x, y, c);
			}
	});
	// the antefix: a pointed stone flame with a waist, on two curled feet, rising from the block
	const crownMask = maskOf(w, height, (x, y) => {
		const up = by - 1 - ty(y);
		if (up < 0 || up >= ch) return false;
		const dx = Math.abs(x + 0.5 - mid);
		const t = Math.max(0, (up - 5) / (ch - 5));
		const half = up < 5 ? 9 : Math.max(0.6, 10 * (1 - t) ** 0.85);
		const stepped = Math.floor(half / 1.5) * 1.5 + 0.6;
		const foot = Math.hypot(dx - 11, up - 3.5) <= 4;
		return dx <= stepped || foot;
	});
	canvas.blit(shaded(crownMask, w, height, [deep, dark, body, lit, high]));
	// carving: on the face a double volute (two sulur curls joined by a tendril), on the antefix
	// a curl at each foot and a rib up its middle
	const template = new Uint8Array(w * h);
	const fy = by + bh / 2;
	spiral(template, w, h, mid - 9, fy - 2, 1.3, 1, 6.5, Math.PI * 0.5, 1);
	spiral(template, w, h, mid + 8, fy + 1, 1.3, 1, 6.5, -Math.PI * 0.5, 1);
	for (let x = Math.floor(mid - 9); x <= mid + 8; x++) {
		const t = (x - (mid - 9)) / 17;
		const y = Math.round(fy + 4.5 - t * 12);
		template[y * w + x] = 1;
		template[(y + 1) * w + x] = 1;
	}
	spiral(template, w, h, mid - 12, by - 4, 1, 0.5, 2.5, 0, -1, 1);
	spiral(template, w, h, mid + 11, by - 4, 1, 0.5, 2.5, Math.PI, 1, 1);
	for (let y = by - ch + 4; y < by - 1; y++) template[y * w + Math.floor(mid) - 1] = 1;
	const raised = new Uint8Array(w * height);
	for (let y = 0; y < height; y++)
		for (let x = 0; x < w; x++) raised[y * w + x] = template[ty(y) * w + x];
	relief(canvas, raised, w, height, st);
	return canvas.outline(INK);
};

// the corner's carving lit again after a mirror, so the light still comes from the top left
const mirrored = (canvas: PixelCanvas, variant: FrameVariant) => {
	const [, , dark, , , high] = STONE[variant];
	const flipped = new PixelCanvas(canvas.width, canvas.height).blit(canvas, 0, 0, true);
	// a lit left edge became a right one: swap the highlight and the shade across vertical edges
	return flipped.clone().paint(
		(x, y, c) =>
			(c === high && flipped.get(x + 1, y) !== high && flipped.get(x - 1, y) !== CLEAR) ||
			(c === dark && flipped.get(x + 1, y) !== dark && flipped.get(x - 1, y) !== CLEAR),
		(c) => (c === high ? dark : c === dark ? high : c),
	);
};

export type FrameCorner = { canvas: PixelCanvas; x: number; y: number };

// the four corners and where they stand on the frame's canvas; the outline facing the board glows
export const frameCorners = (columns: number, rows: number, variant: FrameVariant) => {
	const g = frameGeometry(columns, rows, variant);
	const glow = variant === 'fs' ? FIRE[3] : FIRE[2];
	const corners: FrameCorner[] = [];
	for (const top of [true, false]) {
		const left = cornerCanvas(variant, top);
		const right = mirrored(left, variant);
		const blockTop = top ? CORNER.crown : 0;
		const blockBottom = blockTop + CORNER.block;
		const y = top ? g.fy0 - 14 - CORNER.crown : g.fy1 - CORNER.block + 10;
		for (const [canvas, x, inward] of [
			[left, g.fx0 - FRAME_PAD.side - 1, 1],
			[right, g.fx1 + FRAME_PAD.side + 1 - left.width, -1],
		] as const) {
			const lit = canvas.clone();
			const side = inward > 0 ? canvas.width - 1 : 0;
			for (let yy = blockTop; yy <= blockBottom; yy++)
				if (canvas.get(side, yy) === INK) lit.set(side, yy, glow);
			const edge = top ? blockBottom : blockTop;
			for (let xx = 0; xx < canvas.width; xx++)
				if (canvas.get(xx, edge) === INK && (inward > 0 ? xx > 3 : xx < canvas.width - 4))
					lit.set(xx, edge, glow);
			corners.push({ canvas: lit, x, y });
		}
	}
	return corners;
};
