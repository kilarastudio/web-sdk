import { PixelCanvas } from './canvas.ts';
import { CLEAR, PALETTE, color } from './palette.ts';
import { SYMBOL_DRAWINGS } from './symbols.ts';

// The potions are drawn full; in the game each holds only part of its liquid, and what is left
// lies level however the bottle turns, and sloshes (game/slosh.ts). The drawn art and every frame
// run keep the bottle full: the game hides the liquid above the surface with a mask of whole art
// pixels (components/PotionLiquid.svelte), so the glass, the cork and the outline are never
// redrawn, and bubbles, light and glow stay inside the liquid wherever its surface is. The glass
// above the surface is empty: see-through, its rim and its drawn highlights kept.
//
// The liquid is found by colour, below `from` (the gold's neck holds colours of its ramp).
// fill: how much of the liquid's height it fills at rest.
export const POTIONS = {
	symbolL1: {
		fill: 3 / 4,
		ramp: [0x571c27, 0x891e2b, 0xc42430, 0xea323c, 0xf5555d, 0xf68187],
		from: 0,
	},
	symbolL2: {
		fill: 1 / 2,
		ramp: [0x03193f, 0x00396d, 0x0069aa, 0x0098dc, 0x00cdf9, 0x0cf1ff, 0x94fdff],
		from: 0,
	},
	symbolL3: {
		fill: 2 / 3,
		ramp: [0x134c4c, 0x1e6f50, 0x33984b, 0x5ac54f, 0x99e65f, 0xd3fc7e],
		from: 0,
	},
	symbolL4: { fill: 1 / 2, ramp: [0x8a4836, 0xe07438, 0xedab50, 0xffc825, 0xffeb57], from: 28 },
} as const;

export type PotionKey = keyof typeof POTIONS;
export const isPotion = (key: string): key is PotionKey => key in POTIONS;

// the surface's ripple: this many art pixels from crest to crest
const WAVE_LENGTH = 18;
// the mask reaches this far past the art all round, over corks, steam and light above the neck
const REACH = 48;

type Body = {
	art: PixelCanvas;
	ramp: number[];
	// is (x, y) liquid in the drawn, full bottle
	has: (x: number, y: number) => boolean;
	left: number;
	right: number;
	top: number;
	bottom: number;
	// the top row of the liquid at rest, and how many pixels it fills
	rest: number;
	volume: number;
	// the middle of the surface at rest, which it tilts about
	middle: number;
};

const bodies = new Map<PotionKey, Body>();
export const potionBody = (key: PotionKey): Body => {
	const known = bodies.get(key);
	if (known) return known;
	const { fill, ramp: hexes, from } = POTIONS[key];
	const art = SYMBOL_DRAWINGS[key]();
	const ramp = hexes.map(color);
	const liquid = new Set(ramp);
	const inside = new Uint8Array(art.width * art.height);
	let [left, right, top, bottom] = [art.width, -1, art.height, -1];
	for (let y = from; y < art.height; y++)
		for (let x = 0; x < art.width; x++) {
			if (!liquid.has(art.get(x, y))) continue;
			inside[y * art.width + x] = 1;
			[left, right, top, bottom] = [
				Math.min(left, x),
				Math.max(right, x),
				Math.min(top, y),
				Math.max(bottom, y),
			];
		}
	const has = (x: number, y: number) => art.inside(x, y) && inside[y * art.width + x] === 1;
	const rest = Math.round(bottom + 1 - fill * (bottom - top + 1));
	let volume = 0;
	let [lo, hi] = [art.width, -1];
	for (let y = rest; y <= bottom; y++)
		for (let x = left; x <= right; x++)
			if (has(x, y)) {
				volume++;
				if (y === rest) [lo, hi] = [Math.min(lo, x), Math.max(hi, x)];
			}
	const body = {
		art,
		ramp,
		has,
		left,
		right,
		top,
		bottom,
		rest,
		volume,
		middle: (lo + hi + 1) / 2,
	};
	bodies.set(key, body);

	return body;
};

// the top row of the liquid at rest, for the frame runs (pixel/symbolRuns.ts)
export const restSurface = (key: PotionKey) => potionBody(key).rest;

// How the liquid lies: its surface tilted `tilt` radians against the bottle (clockwise, y down),
// `level` art pixels below where it rests, rippled `ripple` pixels high at `phase` (0 to 1).
export type Surface = { tilt: number; level: number; ripple: number; phase: number };
export const STILL_SURFACE: Surface = { tilt: 0, level: 0, ripple: 0, phase: 0 };

// What the mask keeps (everything but the empty glass above the surface), as rectangles in art
// pixels, and the surface's lit skin as pixels by palette colour.
export type LiquidShape = {
	keep: [x: number, y: number, width: number, height: number][];
	skin: Map<number, [x: number, y: number][]>;
};

const shapes = new Map<string, LiquidShape>();
const SHAPES_KEPT = 600;

export const liquidShape = (key: PotionKey, surface: Surface): LiquidShape => {
	const id = `${key}:${surface.tilt.toFixed(4)}:${surface.level}:${surface.ripple}:${surface.phase}`;
	const known = shapes.get(id);
	if (known) return known;
	const body = potionBody(key);
	const { art, has, left, right, top, bottom, ramp } = body;
	const slope = Math.tan(surface.tilt);
	const wave = (x: number) =>
		surface.ripple * Math.sin(2 * Math.PI * ((x + 0.5 - left) / WAVE_LENGTH + surface.phase));
	const height = (x: number, at: number) => at + slope * (x + 0.5 - body.middle) + wave(x);
	const wet = (x: number, y: number, at: number) => y + 0.5 >= height(x, at);
	const count = (at: number) => {
		let n = 0;
		for (let y = top; y <= bottom; y++)
			for (let x = left; x <= right; x++) if (has(x, y) && wet(x, y, at)) n++;
		return n;
	};
	// the surface's height that holds the same liquid as at rest, so tilted it neither gains nor
	// loses any
	let [high, low] = [top - 64, bottom + 64];
	for (let i = 0; i < 24; i++) {
		const mid = (high + low) / 2;
		if (count(mid) > body.volume) high = mid;
		else low = mid;
	}
	const at = (high + low) / 2 + surface.level;

	const keep: LiquidShape['keep'] = [
		[-REACH, -REACH, left + REACH, art.height + 2 * REACH],
		[right + 1, -REACH, art.width + REACH - right - 1, art.height + 2 * REACH],
	];
	const skin: LiquidShape['skin'] = new Map();
	const lighter = (c: number, steps: number) =>
		ramp[Math.min(ramp.length - 1, Math.max(0, ramp.indexOf(c)) + steps)];
	for (let x = left; x <= right; x++) {
		let from = -REACH;
		let lit = 0;
		for (let y = top; y <= bottom + 1; y++) {
			const empty = y <= bottom && has(x, y) && !wet(x, y, at);
			if (empty) {
				if (y > from) keep.push([x, from, 1, y - from]);
				from = y + 1;
				lit = 2;
				continue;
			}
			// the two rows under the empty glass are the surface, lit
			if (lit && y <= bottom && has(x, y)) {
				const c = lighter(art.get(x, y), lit);
				if (!skin.has(c)) skin.set(c, []);
				skin.get(c)!.push([x, y]);
				lit--;
			} else lit = 0;
		}
		keep.push([x, from, 1, art.height + REACH - from]);
	}
	const shape = { keep: merged(keep), skin };
	if (shapes.size >= SHAPES_KEPT) shapes.delete(shapes.keys().next().value!);
	shapes.set(id, shape);

	return shape;
};

// side by side columns with the same span become one rectangle
const merged = (rects: LiquidShape['keep']) => {
	const out: LiquidShape['keep'] = [];
	const open = new Map<string, LiquidShape['keep'][number]>();
	for (const rect of [...rects].sort((a, b) => a[0] - b[0])) {
		const id = `${rect[1]}:${rect[3]}`;
		const last = open.get(id);
		if (last && last[0] + last[2] === rect[0]) {
			last[2] += rect[2];
			continue;
		}
		const copy: LiquidShape['keep'][number] = [...rect];
		open.set(id, copy);
		out.push(copy);
	}

	return out;
};

// the bottle as it stands at rest: the glass above the surface emptied, the surface lit. What the
// pay table, the gallery and a bottle's shattering start from.
export const atRest = (key: PotionKey, canvas: PixelCanvas, margin = (canvas.width - 64) / 2) => {
	const out = canvas.clone();
	const { keep, skin } = liquidShape(key, STILL_SURFACE);
	const body = potionBody(key);
	for (let y = body.top; y <= body.bottom; y++)
		for (let x = body.left; x <= body.right; x++)
			if (
				body.has(x, y) &&
				!keep.some(([kx, ky, w, h]) => x >= kx && x < kx + w && y >= ky && y < ky + h)
			)
				out.set(x + margin, y + margin, CLEAR);
	for (const [c, pixels] of skin) for (const [x, y] of pixels) out.set(x + margin, y + margin, c);

	return out;
};

export const hexOf = (c: number) => PALETTE[c];
