import { PixelCanvas } from './canvas.ts';
import { CLEAR, INK, RAMPS, WHITE, color } from './palette.ts';

// Board, frame, panels, Glint Spots and particles, all drawn by code on the same art-pixel grid as
// the symbols (40 art pixels to a reel cell).
export const CELL = 40;

// a small deterministic generator, so the same art comes out on every device and every run
export const random = (seed: number) => () => {
	seed |= 0;
	seed = (seed + 0x6d2b79f5) | 0;
	let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
	t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
	return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const NIGHT = color(0x1a1932);
const DUSK = color(0x2a2f4e);
const SLATE = color(0x424c6e);
const STEEL = color(0x657392);

// The floor the symbols land on: dark flagstones, each with a lit top-left lip and a few chips.
export const boardFloor = (columns: number, rows: number) => {
	const canvas = new PixelCanvas(columns * CELL, rows * CELL);
	const next = random(7);
	canvas.rect(0, 0, canvas.width, canvas.height, NIGHT);
	for (let row = 0; row < rows; row++)
		for (let column = 0; column < columns; column++) {
			const x = column * CELL;
			const y = row * CELL;
			// seams
			canvas.rect(x, y, CELL, 1, INK);
			canvas.rect(x, y, 1, CELL, INK);
			canvas.rect(x + 1, y + 1, CELL - 1, 1, DUSK);
			canvas.rect(x + 1, y + 1, 1, CELL - 1, DUSK);
			// chips and specks
			for (let i = 0; i < 5; i++) {
				const cx = x + 4 + Math.floor(next() * (CELL - 8));
				const cy = y + 4 + Math.floor(next() * (CELL - 8));
				canvas.set(cx, cy, next() < 0.5 ? DUSK : INK);
				if (next() < 0.4) canvas.set(cx + 1, cy, INK);
			}
			if (next() < 0.35) {
				const cx = x + 6 + Math.floor(next() * 20);
				const cy = y + 8 + Math.floor(next() * 20);
				canvas.path(INK, [cx, cy], [cx + 3, cy + 2], [cx + 4, cy + 6]);
			}
		}
	canvas.rect(canvas.width - 1, 0, 1, canvas.height, INK);
	canvas.rect(0, canvas.height - 1, canvas.width, 1, INK);
	return canvas;
};

export const FRAME = { border: 14, corner: 22 };

// The frame round the board: dressed stone blocks with a gold inner trim and gem-set corner
// plates. It is drawn whole, at the board's size, so its blocks never stretch.
export const boardFrame = (columns: number, rows: number) => {
	const { border, corner } = FRAME;
	const width = columns * CELL + border * 2;
	const height = rows * CELL + border * 2;
	const canvas = new PixelCanvas(width, height);
	const g = RAMPS.gold;
	const next = random(21);

	canvas.rect(0, 0, width, height, SLATE);
	// the opening
	canvas.paint(
		(x, y) => x >= border && y >= border && x < width - border && y < height - border,
		CLEAR,
	);
	// stone: a lit outer lip, a shaded inner step
	canvas.rect(0, 0, width, 1, INK);
	canvas.rect(0, height - 1, width, 1, INK);
	canvas.rect(0, 0, 1, height, INK);
	canvas.rect(width - 1, 0, 1, height, INK);
	canvas.rect(1, 1, width - 2, 2, STEEL);
	canvas.rect(1, 1, 2, height - 2, STEEL);
	canvas.rect(1, height - 3, width - 2, 2, DUSK);
	canvas.rect(width - 3, 1, 2, height - 2, DUSK);
	// block seams along each side
	const seam = (x: number, y: number, vertical: boolean) => {
		if (vertical) {
			canvas.rect(x, y, 1, border - 6, DUSK);
			canvas.rect(x + 1, y, 1, border - 6, STEEL);
		} else {
			canvas.rect(x, y, border - 6, 1, DUSK);
			canvas.rect(x, y + 1, border - 6, 1, STEEL);
		}
	};
	for (let x = corner + 14; x < width - corner - 6; x += 24 + Math.floor(next() * 3) * 4) {
		seam(x, 3, true);
		seam(x + 9, height - border + 3, true);
	}
	for (let y = corner + 12; y < height - corner - 6; y += 22 + Math.floor(next() * 3) * 4) {
		seam(3, y, false);
		seam(width - border + 3, y + 7, false);
	}
	// stone specks
	for (let i = 0; i < 160; i++) {
		const x = 3 + Math.floor(next() * (width - 6));
		const y = 3 + Math.floor(next() * (height - 6));
		if (canvas.get(x, y) === SLATE) canvas.set(x, y, next() < 0.5 ? DUSK : STEEL);
	}
	// gold trim round the opening
	const trim = (inset: number, c: number) => {
		const left = border - inset;
		const top = border - inset;
		const w = width - left * 2;
		const h = height - top * 2;
		canvas.rect(left, top, w, 1, c);
		canvas.rect(left, top + h - 1, w, 1, c);
		canvas.rect(left, top, 1, h, c);
		canvas.rect(left + w - 1, top, 1, h, c);
	};
	trim(5, INK);
	trim(4, g[5]);
	trim(3, g[4]);
	trim(2, g[2]);
	trim(1, INK);
	// the trim's lower and right runs sit in shadow
	canvas.paint(
		(x, y, c) => c === g[5] && (y > height / 2 || x > width / 2) && x + y > (width + height) / 2,
		g[3],
	);
	// corner plates
	const plate = (x: number, y: number) => {
		canvas.rect(x, y, corner, corner, INK);
		canvas.rect(x + 1, y + 1, corner - 2, corner - 2, g[4]);
		canvas.rect(x + 1, y + 1, corner - 2, 1, g[5]);
		canvas.rect(x + 1, y + 1, 1, corner - 2, g[5]);
		canvas.rect(x + 1, y + corner - 3, corner - 2, 2, g[3]);
		canvas.rect(x + corner - 3, y + 1, 2, corner - 2, g[3]);
		canvas.rect(x + 4, y + 4, corner - 8, corner - 8, g[2]);
		canvas.rect(x + 5, y + 5, corner - 10, corner - 10, g[3]);
		// a ruby in the middle
		const cx = x + corner / 2 - 0.5;
		const cy = y + corner / 2 - 0.5;
		canvas.ellipse(cx, cy, 4.5, 4.5, INK);
		canvas.ellipse(cx, cy, 3.5, 3.5, RAMPS.red[3]);
		canvas.paint((px, py, c) => c === RAMPS.red[3] && px + py > cx + cy + 1, RAMPS.red[2]);
		canvas.set(cx - 1.5, cy - 1.5, RAMPS.red[5]);
		canvas.set(cx - 0.5, cy - 1.5, WHITE);
		// rivets
		canvas.dots(g[5], [x + 2, y + 2], [x + corner - 4, y + 2], [x + 2, y + corner - 4]);
		canvas.dots(
			g[2],
			[x + 3, y + 3],
			[x + corner - 3, y + 3],
			[x + 3, y + corner - 3],
			[x + corner - 3, y + corner - 3],
		);
	};
	plate(0, 0);
	plate(width - corner, 0);
	plate(0, height - corner);
	plate(width - corner, height - corner);
	// the plates stand clear of the opening
	canvas.paint(
		(x, y) => x >= border && y >= border && x < width - border && y < height - border,
		CLEAR,
	);
	return canvas;
};

export const PANEL_SLICE = 8;

// A nine-slice panel: night-blue face, gold double rule, studded corners.
export const panel = (accent: readonly number[] = RAMPS.gold) => {
	const size = PANEL_SLICE * 3;
	const canvas = new PixelCanvas(size, size);
	canvas.rect(0, 0, size, size, INK);
	canvas.rect(1, 1, size - 2, size - 2, accent[4]);
	canvas.rect(1, 1, size - 2, 1, accent[5]);
	canvas.rect(1, 1, 1, size - 2, accent[5]);
	canvas.rect(1, size - 2, size - 2, 1, accent[2]);
	canvas.rect(size - 2, 1, 1, size - 2, accent[2]);
	canvas.rect(2, 2, size - 4, size - 4, accent[3]);
	canvas.rect(3, 3, size - 6, size - 6, INK);
	canvas.rect(4, 4, size - 8, size - 8, NIGHT);
	canvas.rect(4, 4, size - 8, 1, DUSK);
	canvas.rect(4, 4, 1, size - 8, DUSK);
	// corner studs
	for (const [x, y] of [
		[1, 1],
		[size - 4, 1],
		[1, size - 4],
		[size - 4, size - 4],
	] as const) {
		canvas.rect(x, y, 3, 3, accent[5]);
		canvas.set(x + 2, y + 2, accent[2]);
		canvas.set(x + 1, y + 1, WHITE);
	}
	return canvas;
};

// The big win panels: one frame for each level from BIG to MAX, drawn whole at the panel's size so
// nothing in it stretches, all with the same 14-pixel border round the same night face, so a
// level that lands only turns the frame into a richer material: dressed stone (BIG), a gold bar
// on stone (SUPER), the bar set with the reels' gems (MEGA), red dragon scales (EPIC), gold dragon
// scales (MAX, which also burns). The corners carry a plate: stone, a ruby, a sapphire, then the
// dragon's eye.
export type WinPanelTier = 1 | 2 | 3 | 4 | 5;
export const WIN_PANEL_BORDER = 14;

const BAND = WIN_PANEL_BORDER - 4;
const FACES = { 1: NIGHT, 2: NIGHT, 3: NIGHT, 4: color(0x391f21), 5: color(0x1c121c) } as const;

// dressed stone: a lit lip, a shaded inner step, staggered seams and specks
const stone = (along: number, depth: number, lit: boolean, speck: number) => {
	if (depth === 0) return lit ? STEEL : DUSK;
	if (depth === BAND - 1) return DUSK;
	const seam = along % 22;
	if (seam === 0) return DUSK;
	if (seam === 1) return STEEL;
	return speck < 0.06 ? DUSK : speck < 0.1 ? STEEL : SLATE;
};

// a round bar seen from the side, light along its upper middle
const bar = (depth: number, from: number, ramp: readonly number[]) =>
	[ramp[3], ramp[5], ramp[5], ramp[4], ramp[4], ramp[4], ramp[3], ramp[3], ramp[2], ramp[2]][
		Math.min(9, Math.round(((depth - from) * 9) / Math.max(1, BAND - 1 - from)))
	];

// overlapping scales in rows, each a rounded tile with a dark rim and its lit edge to the top left
const scale = (along: number, depth: number, ramp: readonly number[]) => {
	const row = Math.floor((depth + 1) / 5);
	const u = (along + (row % 2) * 4) % 8;
	const v = (depth + 1) % 5;
	// each scale hangs from the row above: round at its foot, hidden at its top under that row
	const reach = Math.hypot(u - 3.5, v * 1.1);
	if (reach > 4.6) return ramp[1];
	if (reach > 3.8) return ramp[0];
	if (u <= 2 && v >= 1 && v <= 2) return ramp[5];
	return reach > 2.6 ? ramp[2] : ramp[3];
};

const GEMS = [RAMPS.red, RAMPS.blue, RAMPS.green] as const;

export const winPanel = (tier: WinPanelTier, width: number, height: number) => {
	const canvas = new PixelCanvas(width, height);
	const g = RAMPS.gold;
	const next = random(tier * 31 + width);
	const border = WIN_PANEL_BORDER;

	canvas.rect(0, 0, width, height, INK);
	canvas.rect(border, border, width - border * 2, height - border * 2, FACES[tier]);
	canvas.rect(border, border, width - border * 2, 1, tier >= 4 ? RAMPS.wood[2] : DUSK);
	canvas.rect(border, border, 1, height - border * 2, tier >= 4 ? RAMPS.wood[2] : DUSK);

	// the band, pixel by pixel: how deep into the border a pixel is, and how far along its run
	for (let y = 1; y < height - 1; y++)
		for (let x = 1; x < width - 1; x++) {
			const depth = Math.min(x, y, width - 1 - x, height - 1 - y) - 1;
			if (depth >= BAND) continue;
			const vertical = Math.min(x, width - 1 - x) - 1 === depth;
			const along = vertical ? y : x;
			const lit = y - 1 === depth || x - 1 === depth;
			const speck = next();
			const material =
				tier === 1
					? stone(along, depth, lit, speck)
					: tier <= 3
						? depth < 3
							? stone(along, depth, lit, speck)
							: bar(depth, 3, g)
						: scale(along, depth, tier === 4 ? RAMPS.red : g);
			canvas.set(x, y, material);
		}

	// the trim between band and face: polished stone, gold, or red under gold scales
	const trim = [
		[STEEL, SLATE],
		[g[5], g[3]],
		[g[5], g[3]],
		[g[4], g[2]],
		[RAMPS.red[3], RAMPS.red[1]],
	][tier - 1];
	const ring = (inset: number, c: number) => {
		canvas.rect(inset, inset, width - inset * 2, 1, c);
		canvas.rect(inset, height - 1 - inset, width - inset * 2, 1, c);
		canvas.rect(inset, inset, 1, height - inset * 2, c);
		canvas.rect(width - 1 - inset, inset, 1, height - inset * 2, c);
	};
	ring(BAND + 1, INK);
	ring(BAND + 2, trim[0]);
	ring(BAND + 3, trim[1]);
	ring(border - 1, INK);

	// rivets along the gold bar, gems set in it at MEGA
	if (tier === 2 || tier === 3) {
		const middle = Math.round(3 + (BAND - 3) / 2);
		const runs = [
			{
				length: width,
				place: (at: number) => [[at, middle] as const, [at, height - 1 - middle] as const],
			},
			{
				length: height,
				place: (at: number) => [[middle, at] as const, [width - 1 - middle, at] as const],
			},
		];
		for (const { length, place } of runs) {
			const gap = tier === 2 ? 16 : 22;
			const count = Math.floor((length - 40) / gap);
			const start = Math.round((length - (count - 1) * gap) / 2);
			for (let index = 0; index < count; index++)
				for (const [cx, cy] of place(start + index * gap)) {
					if (tier === 2) {
						canvas.rect(cx - 1, cy - 1, 2, 2, g[5]);
						canvas.dots(g[2], [cx + 1, cy], [cx, cy + 1], [cx + 1, cy + 1]);
						canvas.set(cx - 1, cy - 1, WHITE);
						continue;
					}
					const gem = GEMS[(index + cx + cy) % GEMS.length];
					canvas.ellipse(cx, cy, 4.2, 4.2, g[2]);
					canvas.ellipse(cx, cy, 3.3, 3.3, INK);
					canvas.ellipse(cx, cy, 2.5, 2.5, gem[3]);
					canvas.paint((px, py, c) => c === gem[3] && px + py > cx + cy + 1, gem[2]);
					canvas.set(cx - 1, cy - 1, gem[5]);
				}
		}
	}

	// corner plates
	const plate = 18 + (tier >= 3 ? 4 : 0);
	for (const [px, py] of [
		[0, 0],
		[width - plate, 0],
		[0, height - plate],
		[width - plate, height - plate],
	] as const) {
		const metal = tier === 1 ? RAMPS.steel : tier === 4 ? RAMPS.red : g;
		canvas.rect(px, py, plate, plate, INK);
		canvas.rect(px + 1, py + 1, plate - 2, plate - 2, metal[3]);
		canvas.rect(px + 1, py + 1, plate - 2, 1, metal[5]);
		canvas.rect(px + 1, py + 1, 1, plate - 2, metal[5]);
		canvas.rect(px + 1, py + plate - 3, plate - 2, 2, metal[2]);
		canvas.rect(px + plate - 3, py + 1, 2, plate - 2, metal[2]);
		const cx = px + plate / 2 - 0.5;
		const cy = py + plate / 2 - 0.5;
		if (tier === 1) {
			canvas.rect(px + 5, py + 5, plate - 10, plate - 10, metal[2]);
			canvas.rect(px + 6, py + 6, plate - 12, plate - 12, metal[4]);
			continue;
		}
		if (tier <= 3) {
			const gem = tier === 2 ? RAMPS.red : RAMPS.blue;
			const r = tier === 2 ? 4.5 : 6;
			canvas.ellipse(cx, cy, r, r, INK);
			canvas.ellipse(cx, cy, r - 1, r - 1, gem[3]);
			canvas.paint((x, y, c) => c === gem[3] && x + y > cx + cy + 1, gem[2]);
			canvas.set(cx - r / 2, cy - r / 2, gem[5]);
			canvas.set(cx - r / 2 + 1, cy - r / 2, WHITE);
			continue;
		}
		// the dragon's eye: a gold iris (an ember one on the gold plate) cut by a black slit
		const iris = tier === 4 ? g : RAMPS.fire;
		canvas.ellipse(cx, cy, 8, 4.6, INK);
		canvas.ellipse(cx, cy, 7, 3.6, iris[4]);
		canvas.paint((x, y, c) => c === iris[4] && y > cy + 1, iris[3]);
		canvas.rect(cx - 0.5, cy - 3, 2, 7, INK);
		canvas.set(cx - 3.5, cy - 2.5, iris[5]);
	}

	return canvas;
};

export const GLINT_TIER_RAMPS = [
	[color(0x00396d), color(0x0098dc), color(0x0cf1ff), color(0x94fdff)],
	[color(0x3003d9), color(0x7a09fa), color(0xdb3ffd), color(0xfdd2ed)],
	[color(0xc64524), color(0xff5000), color(0xffa214), color(0xffeb57)],
	[color(0x891e2b), color(0xff0040), color(0xf68187), color(0xffffff)],
] as const;

// A lit Glint Spot: a glowing rune frame on the flagstone, brighter and busier with each tier.
// The glow inside is an ordered dither, denser toward the frame.
export const glintTile = (tier: 1 | 2 | 3 | 4) => {
	const canvas = new PixelCanvas(CELL, CELL);
	const [deep, mid, bright, hot] = GLINT_TIER_RAMPS[tier - 1];
	const edge = (x: number, y: number) => Math.min(x, y, CELL - 1 - x, CELL - 1 - y);
	for (let y = 1; y < CELL - 1; y++)
		for (let x = 1; x < CELL - 1; x++) {
			const depth = edge(x, y);
			const reach = 5 + tier * 3;
			if (depth > reach) continue;
			// 4 × 4 Bayer threshold against how close the pixel is to the frame
			const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5][(y % 4) * 4 + (x % 4)];
			if ((1 - depth / reach) * 16 > bayer + 2) canvas.set(x, y, depth < 4 ? mid : deep);
		}
	// frame
	const frame = (inset: number, c: number) => {
		canvas.rect(inset, inset, CELL - inset * 2, 1, c);
		canvas.rect(inset, CELL - 1 - inset, CELL - inset * 2, 1, c);
		canvas.rect(inset, inset, 1, CELL - inset * 2, c);
		canvas.rect(CELL - 1 - inset, inset, 1, CELL - inset * 2, c);
	};
	frame(1, mid);
	frame(2, bright);
	if (tier >= 2) frame(3, mid);
	if (tier >= 4) frame(4, deep);
	// corner brackets, longer with each tier
	const arm = 4 + tier * 2;
	for (const [cx, cy, sx, sy] of [
		[2, 2, 1, 1],
		[CELL - 3, 2, -1, 1],
		[2, CELL - 3, 1, -1],
		[CELL - 3, CELL - 3, -1, -1],
	] as const) {
		canvas.line(cx, cy, cx + sx * arm, cy, hot);
		canvas.line(cx, cy, cx, cy + sy * arm, hot);
		if (tier >= 3) canvas.set(cx + sx * 2, cy + sy * 2, hot);
	}
	// rune ticks on each side from tier 2
	if (tier >= 2)
		for (const offset of tier >= 3 ? [-5, 0, 5] : [0]) {
			const m = CELL / 2 - 0.5 + offset;
			canvas.dots(hot, [m, 2], [m, CELL - 3], [2, m], [CELL - 3, m]);
		}
	return canvas;
};

// a spot that has been primed by an explosion: an ember waiting in the stone
export const glintPrimed = () => {
	const canvas = new PixelCanvas(9, 9);
	const f = RAMPS.fire;
	canvas.ellipse(4, 4, 3.6, 3.6, f[2]);
	canvas.ellipse(4, 4, 2.4, 2.4, f[3]);
	canvas.ellipse(4, 4, 1.2, 1.2, f[5]);
	canvas.set(4, 4, WHITE);
	return canvas.outline(INK);
};

// a full-cell flash, for the frames where a tile ignites
export const glintFlash = () => {
	const canvas = new PixelCanvas(CELL, CELL);
	canvas.rect(2, 2, CELL - 4, CELL - 4, WHITE);
	return canvas;
};

// a coin turning on its edge
export const coinFrames = () =>
	[5, 4, 2.4, 1, 2.4, 4].map((radius, index) => {
		const canvas = new PixelCanvas(12, 12);
		const g = RAMPS.gold;
		canvas.ellipse(5.5, 5.5, radius, 5, index > 3 ? g[3] : g[4]);
		if (radius > 2) {
			canvas.ellipse(5.5, 5.5, radius - 1.4, 3.4, index > 3 ? g[2] : g[3]);
			canvas.line(5 - radius * 0.4, 3, 5 - radius * 0.4, 6, g[5]);
		}
		canvas.set(5.5 - radius * 0.5, 2, g[5]);
		return canvas.outline(INK);
	});

// A torch flame as a loop of frames, on a canvas of the given size with its foot on the bottom
// edge. The flame is not a shape that is bent about: it is heat, worked out cell by cell the way
// fire burns. Heat is fed in along the foot, every cell takes the heat of the cells under it, and
// loses a little on the way up; how much it loses comes from a soft pattern of cooler and hotter
// air that drifts up through the flame, so tongues of fire form, rise and go out on their own,
// and nothing sways. The heat is then drawn in bands, dark red at the edge to a pale core. The
// drifting pattern repeats from top to bottom, so the last frame runs into the first.
export const FLAME_FRAMES = 24;

const FLAME_BANDS: [number, number][] = [
	[0.86, color(0xf9e6cf)],
	[0.7, RAMPS.fire[5]],
	[0.55, RAMPS.gold[4]],
	[0.4, RAMPS.fire[4]],
	[0.25, RAMPS.fire[3]],
	[0.12, RAMPS.fire[2]],
];

// The drifting air a fire burns in: soft blotches `grain` cells across, between 0 and 1, that
// repeat every `drift` rows, so a fire that climbs `drift` rows in one loop of frames loops. With
// `wrap` they also repeat every `width` cells across (a multiple of `grain`), for fire that tiles.
const driftingAir = (
	next: () => number,
	width: number,
	drift: number,
	grain: number,
	wrap = false,
) => {
	const columns = wrap ? width / grain : Math.ceil(width / grain) + 2;
	const rows = Math.max(2, Math.round(drift / (grain * 1.6)));
	const knots = Array.from({ length: rows }, () => Array.from({ length: columns }, next));
	const smooth = (t: number) => t * t * (3 - 2 * t);

	return (x: number, y: number) => {
		const u = x / grain;
		const v = ((((y % drift) + drift) % drift) / drift) * rows;
		const [i, j] = [Math.floor(u), Math.floor(v)];
		const [a, b] = [smooth(u - i), smooth(v - j)];
		const row = knots[j % rows];
		const below = knots[(j + 1) % rows];

		return (
			(row[i % columns] * (1 - a) + row[(i + 1) % columns] * a) * (1 - b) +
			(below[i % columns] * (1 - a) + below[(i + 1) % columns] * a) * b
		);
	};
};

const drawHeat = (heat: Float32Array[], width: number, height: number) => {
	const canvas = new PixelCanvas(width, height);
	for (let rise = 0; rise < height; rise++)
		for (let x = 0; x < width; x++) {
			const band = FLAME_BANDS.find(([floor]) => heat[rise][x] >= floor);
			if (band) canvas.set(x, height - 1 - rise, band[1]);
		}

	return canvas;
};

// turbulence: how uneven the air is, 0 a still candle flame, 1 a roaring one
export const flameFrames = (width: number, height: number, turbulence = 0.42) => {
	const next = random(width * 131 + height);
	// how many cells the heat climbs between frames: a tall flame climbs faster
	const climb = Math.max(2, Math.round(height / 20));
	const drift = FLAME_FRAMES * climb;
	const middle = (width - 1) / 2;

	// the drifting air: soft blotches about a fifth of the flame across
	const air = driftingAir(next, width, drift, Math.max(3, Math.round(width / 5)));

	// heat[rise][x], rise 0 being the foot
	let heat = Array.from({ length: height }, () => new Float32Array(width));
	// the fire is fed along the middle half of the foot, hottest in the middle
	const feed = (x: number) => Math.max(0, 1 - (Math.abs(x - middle) / (width * 0.46)) ** 2) * 1.05;
	// what a cell loses each step, so that the flame dies out near the top of the canvas
	const loss = 1.12 / height;
	const step = (time: number) => {
		const out = Array.from({ length: height }, () => new Float32Array(width));
		for (let x = 0; x < width; x++) out[0][x] = Math.min(1, feed(x));
		for (let rise = 1; rise < height; rise++)
			for (let x = 0; x < width; x++) {
				const under = heat[rise - 1];
				const drawn = ((under[x - 1] ?? 0) + under[x] * 2 + (under[x + 1] ?? 0)) / 4;
				// the flame narrows as it climbs: the air at its sides cools it more the higher it is
				const side = (Math.abs(x - middle) / (width / 2)) ** 2 * (rise / height) * 0.04;
				const uneven = 1 + turbulence * 2.4 * (air(x, rise - time) - 0.5);
				out[rise][x] = Math.max(0, drawn - loss * uneven - side);
			}
		heat = out;
	};

	// burn until the flame has settled into its loop, then keep one loop of frames
	let time = 0;
	for (; time < drift + height; time++) step(time);

	return Array.from({ length: FLAME_FRAMES }, () => {
		for (let steps = 0; steps < climb; steps++) step(time++);

		return drawHeat(heat, width, height);
	});
};

// Fire along an edge, as a loop of frames: the same heat as a torch flame, fed along the whole
// foot (the bottom edge of the canvas) and burning up to `depth` cells from it. `lean` tips the
// tongues toward the right as they rise (1 at most), and `rising` feeds the right end of the foot
// harder than the left, so heat gathers toward that end. With `wrap` the run's two ends meet, so
// copies of it laid side by side join up (length a multiple of 8).
export const EDGE_FIRE_FRAMES = 16;

export const edgeFireFrames = ({
	length,
	depth,
	lean = 0,
	rising = 0,
	seed = 1,
	wrap = false,
}: {
	length: number;
	depth: number;
	lean?: number;
	rising?: number;
	seed?: number;
	wrap?: boolean;
}) => {
	const climb = 2;
	const drift = EDGE_FIRE_FRAMES * climb;
	const air = driftingAir(random(seed * 977 + length), length, drift, wrap ? 8 : 5, wrap);
	const across = (x: number) =>
		wrap ? (x + length) % length : Math.max(0, Math.min(length - 1, x));
	// the air repeats every `drift` rows, so it is worked out once for each row of one repeat
	const still = Array.from({ length: drift }, (_, row) =>
		Float32Array.from({ length }, (__, x) => air(x, row)),
	);
	const airAt = (x: number, y: number) => still[((y % drift) + drift) % drift][x];
	const loss = 0.85 / depth;
	const [left, right] = [(1 + lean) / 4, (1 - lean) / 4];

	// two grids of heat, swapped each step
	let heat = Array.from({ length: depth }, () => new Float32Array(length));
	let next = Array.from({ length: depth }, () => new Float32Array(length));
	const step = (time: number) => {
		const out = next;
		for (let x = 0; x < length; x++) {
			// the foot burns unevenly, hotter where the air above it is still
			const along = 1 - rising + (rising * x) / length;
			out[0][x] = Math.min(1, along * (0.45 + 0.7 * airAt(x, drift / 2 - time)));
		}
		for (let rise = 1; rise < depth; rise++) {
			const under = heat[rise - 1];
			const row = out[rise];
			const airRow = still[(((rise - time) % drift) + drift) % drift];
			for (let x = 0; x < length; x++) {
				const drawn = under[across(x - 1)] * left + under[x] / 2 + under[across(x + 1)] * right;
				row[x] = Math.max(0, drawn - loss * (1 + 1.2 * (airRow[x] - 0.5)));
			}
		}
		next = heat;
		heat = out;
	};

	// heat climbs one row a step and leaves at the top, so after `depth` steps it holds nothing
	// from before: from there it runs in a loop of `drift` steps, as the air does
	let time = 0;
	for (; time < depth; time++) step(time);

	return Array.from({ length: EDGE_FIRE_FRAMES }, () => {
		for (let steps = 0; steps < climb; steps++) step(time++);

		return drawHeat(heat, length, depth);
	});
};

// a canvas turned a quarter to the left: its bottom edge becomes its right edge
export const turnLeft = (source: PixelCanvas) => {
	const canvas = new PixelCanvas(source.height, source.width);
	for (let y = 0; y < source.height; y++)
		for (let x = 0; x < source.width; x++) canvas.set(y, source.width - 1 - x, source.get(x, y));

	return canvas;
};

// Fire round a rectangle (the board frame in free spins, the MAX WIN panel): flames along its top
// and up both its sides, burning outward from it and never over it. The top run spans the
// rectangle and the sides' reach; each side run is the rectangle's height, its foot against it,
// its flames leaning up and growing toward the top. Sizes in art pixels.
export const FIRE_REACH = { top: 22, side: 12 };

export const fireAroundFrames = (width: number, height: number) => {
	const top = edgeFireFrames({
		length: width + FIRE_REACH.side * 2,
		depth: FIRE_REACH.top,
		seed: 3,
	});
	// drawn foot down and turned left: the foot ends up against the rectangle's left side, the
	// flames point away from it, and "right" along the run becomes "up"
	const side = edgeFireFrames({
		length: height,
		depth: FIRE_REACH.side,
		lean: 0.7,
		rising: 0.45,
		seed: 5,
	}).map(turnLeft);
	const mirrored = (canvas: PixelCanvas) =>
		new PixelCanvas(canvas.width, canvas.height).blit(canvas, 0, 0, true);

	return { top, left: side, right: side.map(mirrored) };
};

// The screen change: a wall of the dragon's fire that sweeps up the screen, with the dark of its
// smoke behind it, and a charred edge where the smoke ends. The front is a loop of frames of a
// run of flames that tiles side by side, over a band of embers that cools into the smoke; the
// tail is one ragged, smouldering edge that tiles the same way. Sizes in art pixels.
export const FIRE_WALL = { length: 160, flames: 40, embers: 12, tail: 10 };

export const fireWallFrames = () => {
	const { length, flames, embers } = FIRE_WALL;
	// under the flames the heat falls away unevenly into the smoke
	const air = driftingAir(random(17), length, 64, 8, true);
	const glow = new PixelCanvas(length, embers);
	for (let y = 0; y < embers; y++)
		for (let x = 0; x < length; x++) {
			const heat = (1 - y / embers) ** 1.4 + 0.5 * (air(x, y * 5) - 0.5);
			glow.set(x, y, FLAME_BANDS.find(([floor]) => heat >= floor)?.[1] ?? INK);
		}

	return edgeFireFrames({ length, depth: flames, wrap: true, seed: 9 }).map((front) => {
		const canvas = new PixelCanvas(length, flames + embers);
		canvas.blit(front);
		canvas.blit(glow, 0, flames);

		return canvas;
	});
};

export const fireWallTail = () => {
	const { length, tail } = FIRE_WALL;
	const canvas = new PixelCanvas(length, tail);
	const next = random(41);
	// a ragged edge: a few soft dips across the run, the ends meeting
	const knots = Array.from({ length: 10 }, next);
	const edge = (x: number) => {
		const u = (x / length) * knots.length;
		const i = Math.floor(u);
		const a = u - i;
		const t = a * a * (3 - 2 * a);

		return (knots[i % knots.length] * (1 - t) + knots[(i + 1) % knots.length] * t) * (tail - 3);
	};
	for (let x = 0; x < length; x++) {
		const bottom = Math.round(2 + edge(x) + (next() < 0.3 ? 1 : 0));
		canvas.rect(x, 0, 1, bottom, INK);
		canvas.set(x, bottom, RAMPS.fire[1]);
		if (next() < 0.35) canvas.set(x, bottom - 1, RAMPS.fire[2]);
	}

	return canvas;
};

// the light a flame throws on the wall: a plain disc, drawn white for the game to tint and to add
// to the picture behind it, a wide faint one under a smaller brighter one
export const flameGlow = (size = 48) => {
	const canvas = new PixelCanvas(size, size);
	canvas.ellipse((size - 1) / 2, (size - 1) / 2, size / 2 - 0.5, size / 2 - 0.5, WHITE);

	return canvas;
};

// the arc a sword leaves in the air: a quarter ring swept from straight up round to the right,
// about the grip at its bottom left corner; three frames, thinning out
export const slashFrames = () =>
	[
		{ thickness: 4, core: WHITE, edge: RAMPS.steel[5] },
		{ thickness: 3, core: RAMPS.steel[5], edge: RAMPS.steel[4] },
		{ thickness: 2, core: RAMPS.steel[4], edge: RAMPS.steel[3] },
	].map(({ thickness, core, edge }) => {
		const size = 30;
		const canvas = new PixelCanvas(size, size);
		const [cx, cy, radius] = [2, size - 3, size - 5];
		canvas.ring(cx, cy, radius, radius, thickness, core);
		canvas.ring(cx, cy, radius - thickness + 1, radius - thickness + 1, 1, edge);
		// keep the quarter between up and right, tapering to a point at both ends
		canvas.paint((x, y) => {
			const angle = Math.atan2(cy - y, x - cx);
			const along = angle / (Math.PI / 2);
			const taper = Math.min(along, 1 - along) * 5;
			const depth = radius - Math.hypot(x - cx, y - cy);

			return along < 0.04 || along > 0.96 || depth > thickness * Math.min(1, taper);
		}, CLEAR);

		return canvas;
	});

// a fireball flying left to right, with a flickering tail
export const fireballFrames = () =>
	[0, 1, 2, 3].map((frame) => {
		const canvas = new PixelCanvas(24, 14);
		const f = RAMPS.fire;
		const flicker = frame % 2;
		canvas.poly(f[2], [1 + flicker * 2, 6 + flicker], [14, 2], [20, 6], [14, 11]);
		canvas.poly(f[3], [5 + flicker, 6], [15, 3], [20, 6], [15, 10]);
		canvas.ellipse(17, 6.5, 5, 5, f[3]);
		canvas.ellipse(17.5, 6.5, 3.6, 3.6, f[4]);
		canvas.ellipse(18, 6.5, 2.2, 2.2, f[5]);
		canvas.set(19, 6, WHITE);
		canvas.set(19, 7, WHITE);
		canvas.dots(f[4], [3 + frame, 3 + flicker * 6], [7 - frame, 10 - flicker * 7]);
		return canvas;
	});

// a burst where something lands or breaks
export const burstFrames = () =>
	[3, 6, 9, 11, 12].map((radius, index) => {
		const canvas = new PixelCanvas(28, 28);
		const f = RAMPS.fire;
		if (index < 2) canvas.ellipse(13.5, 13.5, radius, radius, index === 0 ? WHITE : f[5]);
		else canvas.ring(13.5, 13.5, radius, radius, index === 4 ? 1 : 2, index === 4 ? f[3] : f[4]);
		for (let spoke = 0; spoke < 8; spoke++) {
			const angle = (spoke * Math.PI) / 4 + 0.3;
			const reach = radius + 1;
			canvas.set(13.5 + Math.cos(angle) * reach, 13.5 + Math.sin(angle) * reach, f[5]);
		}
		return canvas;
	});

// one solid art pixel, tinted by the game for shards and dust
export const pixel = () => {
	const canvas = new PixelCanvas(1, 1);
	canvas.set(0, 0, WHITE);
	return canvas;
};

// the loading bar: a stone trough, and the molten gold that fills it
export const loadingBar = (width: number) => {
	const height = 12;
	const trough = new PixelCanvas(width, height);
	trough.rect(0, 0, width, height, INK);
	trough.rect(1, 1, width - 2, height - 2, SLATE);
	trough.rect(1, 1, width - 2, 1, STEEL);
	trough.rect(2, 2, width - 4, height - 4, INK);
	trough.rect(3, 3, width - 6, height - 6, NIGHT);
	const fill = new PixelCanvas(width, height);
	const g = RAMPS.gold;
	fill.rect(3, 3, width - 6, height - 6, g[4]);
	fill.rect(3, 3, width - 6, 1, g[5]);
	fill.rect(3, 4, width - 6, 1, WHITE);
	fill.rect(3, height - 5, width - 6, 2, g[3]);
	for (let x = 6; x < width - 6; x += 7) fill.set(x, 6, g[5]);
	return { trough, fill };
};

// an arrow-slit beam of light for a column waiting on a scatter
export const anticipationBeam = () => {
	const canvas = new PixelCanvas(CELL, CELL);
	const f = RAMPS.fire;
	for (let y = 0; y < CELL; y++)
		for (let x = 0; x < CELL; x++) {
			const side = Math.min(x, CELL - 1 - x);
			const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5][(y % 4) * 4 + (x % 4)];
			if (side < 2) canvas.set(x, y, side === 0 ? f[4] : f[5]);
			else if ((1 - side / 12) * 16 > bayer + 4) canvas.set(x, y, f[3]);
		}
	return canvas;
};
