import { PixelCanvas } from './canvas.ts';
import { CLEAR, INK, RAMPS, WHITE, color } from './palette.ts';
import { random } from './ui.ts';
import { VALUE_GLYPHS } from './valueGlyphs.ts';

// The lit Glint Spot (approved 2026-11-17): the cell's whole floor lit as a panel in its tier's
// colour, a thick border with runes cut into it and square corner plates, heavier with each tier,
// and the value big in the game's gold face recoloured to the tier with a white-hot top. Drawn on
// the symbols' grid, 64 art pixels to a cell (reports/review/pratala-2026-11-17-fx-mockups).
export const GLINT_GRID = 64;
const N = GLINT_GRID;

export type Tier = 1 | 2 | 3 | 4;
const ramp = (...hexes: number[]) => hexes.map(color);
// each tier dark to light, seven steps, after the game's rarity colours
export const TIER_RAMP: Record<Tier, number[]> = {
	1: ramp(0x03193f, 0x00396d, 0x0069aa, 0x0098dc, 0x00cdf9, 0x0cf1ff, 0x94fdff),
	2: ramp(0x0c0293, 0x3003d9, 0x7a09fa, 0xdb3ffd, 0xf389f5, 0xfdd2ed, 0xffffff),
	3: ramp(0x571c27, 0x8e251d, 0xc64524, 0xed7614, 0xffa214, 0xffc825, 0xffeb57),
	4: ramp(0x571c27, 0x891e2b, 0xc42430, 0xff0040, 0xf5555d, 0xf68187, 0xfdd2ed),
};
export const tierOf = (value: number): Tier =>
	value >= 1024 ? 4 : value >= 128 ? 3 : value >= 16 ? 2 : 1;

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
// runes cut into the border, three across and four down (1 is cut)
const RUNES = [
	['101', '110', '101', '100'],
	['010', '111', '010', '010'],
	['110', '101', '110', '101'],
	['101', '010', '101', '010'],
	['111', '001', '010', '100'],
	['100', '110', '101', '111'],
];
export const borderWidth = (tier: Tier) => 6 + tier;

// a lit spot, 64 × 64; `hot` lights the border's face one step (the pulse)
export const glintPanel = (tier: Tier, hot = false) => {
	const r = TIER_RAMP[tier];
	const canvas = new PixelCanvas(N, N);
	const bw = borderWidth(tier);
	const depth = (x: number, y: number) => Math.min(x, y, N - 1 - x, N - 1 - y);
	const face = hot ? r[4] : r[3];
	for (let y = 0; y < N; y++)
		for (let x = 0; x < N; x++) {
			const d = depth(x, y);
			const b = BAYER[(y % 4) * 4 + (x % 4)];
			let c: number;
			if (d === 0) c = INK;
			else if (d === 1) c = hot ? r[6] : r[5];
			else if (d < bw - 2) c = face;
			else if (d === bw - 2) c = hot ? r[5] : r[4];
			else if (d === bw - 1) c = INK;
			else {
				// the floor: brightest under the border, stepping down in dithered bands
				const k = d - bw;
				c = k < 2 ? r[2] : k < 4 ? (b < 8 ? r[2] : r[1]) : k < 7 ? (b < 3 ? r[2] : r[1]) : r[1];
			}
			canvas.set(x, y, c);
		}
	// a bevel on the border's face: lit along the top, shaded along the bottom
	for (let x = 2; x < N - 2; x++) {
		canvas.set(x, 2, hot ? r[5] : r[4]);
		canvas.set(x, N - 3, r[2]);
	}
	// runes along each side; from the third tier they burn
	const cut = tier >= 3 ? r[6] : r[1];
	const rx0 = 12 + tier;
	const ry = 2 + Math.floor((bw - 4 - 4) / 2);
	let i = 0;
	for (let x = rx0; x < N - rx0 - 2; x += 6) {
		const glyph = RUNES[(i * 5 + tier) % RUNES.length];
		i++;
		glyph.forEach((row, gy) =>
			[...row].forEach((bit, gx) => {
				if (bit !== '1') return;
				canvas.set(x + gx, ry + gy, cut);
				canvas.set(x + gx, N - 1 - ry - gy, cut);
				canvas.set(ry + gy, x + gx, cut);
				canvas.set(N - 1 - ry - gy, x + gx, cut);
			}),
		);
	}
	// square corner plates, a cross cut into each
	const p = 9 + tier;
	for (const [cx, cy] of [
		[0, 0],
		[N - p, 0],
		[0, N - p],
		[N - p, N - p],
	]) {
		canvas.rect(cx, cy, p, p, r[4]);
		canvas.rect(cx, cy, p, 1, INK).rect(cx, cy + p - 1, p, 1, INK);
		canvas.rect(cx, cy, 1, p, INK).rect(cx + p - 1, cy, 1, p, INK);
		const lip = tier >= 2 || hot ? r[6] : r[5];
		canvas.rect(cx + 1, cy + 1, p - 2, 1, lip).rect(cx + 1, cy + 1, 1, p - 2, lip);
		canvas.rect(cx + 1, cy + p - 2, p - 2, 1, r[2]).rect(cx + p - 2, cy + 1, 1, p - 2, r[2]);
		const groove = tier < 3 ? r[1] : r[6];
		canvas.line(cx + 3, cy + 3, cx + p - 4, cy + p - 4, groove);
		canvas.line(cx + p - 4, cy + 3, cx + 3, cy + p - 4, groove);
	}
	// the mythic tier: a second, white-hot inner lip
	if (tier === 4)
		for (let y = 0; y < N; y++)
			for (let x = 0; x < N; x++) if (depth(x, y) === bw) canvas.set(x, y, r[6]);
	return canvas;
};

export const valueText = (value: number) => `×${value.toLocaleString('en-US')}`;

// the gold face's four fill colours, light to dark, and what each becomes
const GOLD_FILL = [0xffeb57, 0xffc825, 0xffa214, 0xed7614].map(color);

// a value in the game's gold face, its fill recoloured: by default the tier's, white-hot on top
export const valueArt = (value: number, fill?: number[]) => {
	const r = TIER_RAMP[tierOf(value)];
	const colours = fill ?? [WHITE, r[6], r[5], r[4]];
	const swap = new Map(GOLD_FILL.map((from, i) => [from, colours[i]]));
	const text = valueText(value);
	const width = [...text].reduce((sum, ch) => sum + VALUE_GLYPHS[ch].advance - 1, 1) + 6;
	const canvas = new PixelCanvas(width, 24);
	let pen = 0;
	for (const ch of text) {
		const glyph = VALUE_GLYPHS[ch];
		glyph.rows.forEach((row, y) =>
			row.forEach((c, x) => {
				if (c !== CLEAR) canvas.set(pen + glyph.x + 1 + x, glyph.y + y, swap.get(c) ?? c);
			}),
		);
		pen += glyph.advance - 1;
	}
	return trim(canvas);
};

// the value cooling as it breaks: its colours step down its tier's ramp
export const cooledValueArt = (value: number) => {
	const r = TIER_RAMP[tierOf(value)];
	return valueArt(value, [r[4], r[3], r[2], r[2]]);
};

const trim = (canvas: PixelCanvas) => {
	let [left, top, right, bottom] = [canvas.width, canvas.height, -1, -1];
	for (let y = 0; y < canvas.height; y++)
		for (let x = 0; x < canvas.width; x++)
			if (canvas.get(x, y) !== CLEAR) {
				left = Math.min(left, x);
				right = Math.max(right, x);
				top = Math.min(top, y);
				bottom = Math.max(bottom, y);
			}
	return new PixelCanvas(right - left + 1, bottom - top + 1).blit(canvas, -left, -top);
};

// the old value cracked in three: each piece on its own canvas, the cracks jagged
export const brokenValue = (value: number) => {
	const text = cooledValueArt(value);
	const w = text.width;
	const next = random(value * 7 + 3);
	const cuts = [
		0,
		Math.floor(w / 3) + Math.round(next() * 2 - 1),
		Math.floor((2 * w) / 3) + Math.round(next() * 2 - 1),
		w,
	];
	return [0, 1, 2].map((i) => {
		const piece = new PixelCanvas(cuts[i + 1] - cuts[i], text.height).blit(text, -cuts[i], 0);
		if (i) for (let y = 0; y < piece.height; y++) if (Math.floor(y / 3) % 2) piece.set(0, y, CLEAR);
		return { canvas: piece, x: cuts[i] - w / 2 };
	});
};

const FIRE = RAMPS.fire;

// a square ring round the cell, banded inside out; `gaps` breaks it into segments
export const strikeRing = (inner: number, colours: number[], gaps = 0, seed = 5) => {
	const t = colours.length;
	const size = inner + t * 2;
	const canvas = new PixelCanvas(size, size);
	colours.forEach((c, i) => {
		const at = t - 1 - i;
		const s = inner + i * 2;
		canvas.rect(at, at, s, 1, c).rect(at, at + s - 1, s, 1, c);
		canvas.rect(at, at, 1, s, c).rect(at + s - 1, at, 1, s, c);
	});
	const next = random(seed);
	for (let g = 0; g < gaps; g++) {
		const side = Math.floor(next() * 4);
		const pos = t + 8 + Math.floor(next() * Math.max(1, inner - 24));
		const length = 5 + Math.floor(next() * 6);
		if (side === 0) canvas.rect(pos, 0, length, t, CLEAR);
		else if (side === 1) canvas.rect(pos, size - t, length, t, CLEAR);
		else if (side === 2) canvas.rect(0, pos, t, length, CLEAR);
		else canvas.rect(size - t, pos, t, length, CLEAR);
	}
	return canvas;
};

// the rings of a strike: the doubling's white-hot ring, and a new tier's ring and its broken shock
// ring further out
export const STRIKE_RING = () => strikeRing(N, [FIRE[6], FIRE[5], FIRE[3], INK]);
export const tierRing = (tier: Tier) => {
	const r = TIER_RAMP[tier];
	return strikeRing(N + 4, [WHITE, r[5], r[4], r[3], INK]);
};
export const shockRing = (tier: Tier) => {
	const r = TIER_RAMP[tier];
	return strikeRing(N + 32, [r[6], r[4], r[3], INK], 7, tier * 13);
};

// A solid ember clump: a rough lump, ink outline, a dark rim banded to a hot middle; never under
// six art pixels across, so it never reads as a speck.
export const emberClump = (size: number, colours: number[], seed: number) => {
	const next = random(seed);
	const rough = Array.from({ length: 8 }, () => 0.82 + next() * 0.3);
	const r = size / 2;
	const canvas = new PixelCanvas(size + 4, size + 4);
	const c = canvas.width / 2;
	for (let y = 0; y < canvas.height; y++)
		for (let x = 0; x < canvas.width; x++) {
			const angle = Math.atan2(y + 0.5 - c, x + 0.5 - c);
			const k = Math.floor(((angle + Math.PI) / (2 * Math.PI)) * 8) % 8;
			const d = Math.hypot(x + 0.5 - c, y + 0.5 - c) / (r * rough[k] + 0.01);
			if (d <= 1) canvas.set(x, y, d > 0.7 ? colours[0] : d > 0.35 ? colours[1] : colours[2]);
		}
	return canvas.outline(INK);
};

export const CLUMP_SIZES = [6, 8, 10, 12, 14, 16];
export const CLUMP_FIRE = [
	[FIRE[2], FIRE[4], FIRE[5]],
	[FIRE[1], FIRE[3], FIRE[4]],
	[FIRE[3], FIRE[5], WHITE],
];
export const clumpColours = (tier: Tier) => {
	const r = TIER_RAMP[tier];
	return [r[2], r[4], r[6]];
};

// a chunk of a broken tile's border
export const tileChunk = (tier: Tier, size: number) => {
	const r = TIER_RAMP[tier];
	const canvas = new PixelCanvas(size + 2, size + 2);
	canvas.rect(0, 0, size + 2, size + 2, INK);
	canvas.rect(1, 1, size, size, r[3]);
	canvas.rect(1, 1, size, 1, r[5]);
	return canvas;
};

// A spot catching fire from inside, as a run of frames: the fire breaks out in the middle of the
// cell and spreads to its sides, red at its ragged front and pale behind it, leaving the lit
// panel. The last frame is the panel alone. Tier 0 is the fire's front alone, to pass over the
// symbol standing on the spot.
export const IGNITE_FRAMES = 8;

export const igniteFrames = (tier: 0 | Tier) => {
	const tile = tier ? glintPanel(tier) : new PixelCanvas(N, N);
	const next = random(57);
	const grain = 6;
	const knots = Array.from({ length: N / grain + 3 }, () =>
		Array.from({ length: N / grain + 3 }, next),
	);
	const uneven = (x: number, y: number) => {
		const [u, v] = [x / grain, y / grain];
		const [i, j] = [Math.floor(u), Math.floor(v)];
		const [a, b] = [u - i, v - j];
		return (
			(knots[j][i] * (1 - a) + knots[j][i + 1] * a) * (1 - b) +
			(knots[j + 1][i] * (1 - a) + knots[j + 1][i + 1] * a) * b
		);
	};
	const middle = (N - 1) / 2;
	const FRONT = [FIRE[2], FIRE[3], FIRE[3], FIRE[4], FIRE[4], FIRE[5], FIRE[5], color(0xf9e6cf)];

	return Array.from({ length: IGNITE_FRAMES }, (_, frame) => {
		if (frame === IGNITE_FRAMES - 1) return tile;
		const canvas = new PixelCanvas(N, N);
		const reach = 4 + ((frame + 1) / (IGNITE_FRAMES - 1)) * (middle + FRONT.length + 6);
		for (let y = 0; y < N; y++)
			for (let x = 0; x < N; x++) {
				const [dx, dy] = [Math.abs(x - middle), Math.abs(y - middle)];
				const distance = Math.hypot(dx, dy) * 0.45 + Math.max(dx, dy) * 0.55;
				const behind = reach - distance - uneven(x, y) * 8;
				if (behind < 0) continue;
				const c = behind < FRONT.length ? FRONT[Math.floor(behind)] : tile.get(x, y);
				if (c !== CLEAR) canvas.set(x, y, c);
			}
		return canvas;
	});
};

// every value a spot can hold: ×2 to ×4,096
export const GLINT_VALUES = Array.from({ length: 12 }, (_, i) => 2 ** (i + 1));
