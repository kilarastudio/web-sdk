import { PixelCanvas, type Point } from './canvas.ts';
import { CLEAR, INK, LIGHTER, RAMPS, WHITE, color, type RampName } from './palette.ts';
import { outlined } from './shapes.ts';
import { SYMBOL_ART, SYMBOL_ART_ALPHABET } from './symbolArt.ts';

// Reel symbols. The paying symbols are drawn art, 64 × 64 art pixels (art/symbols-64, baked into
// symbolArt.ts by scripts/bake-symbols.ts): high symbols are what the dragon's challengers left
// behind (a crowned skull, a clawed helm, a burnt wizard's hat, a bitten axe), low symbols four
// potions, and the scatter is the dragon's eye. The wild (the dragon's coin, never on the reels)
// is still drawn by code on a 40 × 40 cell with a clear pixel round the edge for the outline.
// Every symbol fills the same reel cell, so the drawn art sits on a finer grid than the
// code-drawn art.
export const SYMBOL_PIXELS = 40;

const cell = () => new PixelCanvas(SYMBOL_PIXELS, SYMBOL_PIXELS);

// a drawn symbol as a pixel canvas, read from its baked rows
const drawn = (key: keyof typeof SYMBOL_ART) => () => {
	const rows = SYMBOL_ART[key];
	const canvas = new PixelCanvas(rows[0].length, rows.length);
	rows.forEach((row, y) => {
		for (let x = 0; x < row.length; x++)
			if (row[x] !== '.') canvas.set(x, y, SYMBOL_ART_ALPHABET.indexOf(row[x]));
	});

	return canvas;
};

// S: the dragon's eye, drawn art with SCATTER lettered into the plate under it (every language
// shows the word as SCATTER, so it can live in the art). Its blink and its alert are worked out
// from the art itself: the eye is the run of fire colours above the plate, the pupil the dark
// between them.
export const dragonEye = drawn('symbolScatter');

// the iris's colours: the fire and gold steps of the art's eye, not its red rim, which the scales'
// cracks share
export const IRIS = new Set(
	[0xc64524, 0xff5000, 0xed7614, 0xffa214, 0xffc825, 0xea323c].map((hex) => color(hex)),
);

// The eye's opening, column by column: from the top to the bottom of the iris joined to the
// middle of the art, above the lettered plate. Each column's span holds the pupil too.
export const eyeOpening = (art: PixelCanvas) => {
	// the lettered plate starts three quarters down; its letters share the iris colours
	const plate = Math.round(art.height * 0.75);
	const seen = new Set<number>();
	const start: Point[] = [];
	for (let y = 0; y < plate; y++)
		for (let x = 0; x < art.width; x++) if (IRIS.has(art.get(x, y))) start.push([x, y]);
	// the biggest joined patch of iris is the eye; stray fire in the scales is not
	let best: Point[] = [];
	for (const [sx, sy] of start) {
		if (seen.has(sy * art.width + sx)) continue;
		const patch: Point[] = [];
		const queue: Point[] = [[sx, sy]];
		seen.add(sy * art.width + sx);
		while (queue.length) {
			const [x, y] = queue.pop()!;
			patch.push([x, y]);
			for (const [dx, dy] of [
				[1, 0],
				[-1, 0],
				[0, 1],
				[0, -1],
				[1, 1],
				[-1, -1],
				[1, -1],
				[-1, 1],
			]) {
				const nx = x + dx;
				const ny = y + dy;
				if (ny >= plate || seen.has(ny * art.width + nx) || !IRIS.has(art.get(nx, ny))) continue;
				seen.add(ny * art.width + nx);
				queue.push([nx, ny]);
			}
		}
		if (patch.length > best.length) best = patch;
	}
	const columns = new Map<number, { top: number; bottom: number }>();
	for (const [x, y] of best) {
		const span = columns.get(x);
		columns.set(x, { top: Math.min(span?.top ?? y, y), bottom: Math.max(span?.bottom ?? y, y) });
	}

	return columns;
};

// The lids come over the eye: the upper one down, the lower one up, each the colour of the dark
// scales round it with an INK edge where it ends. shut: how far, 0 open to 1 closed; the lids
// meet a little below the middle, as the v1 eye's did.
const SCALE = { upper: color(0x3d3d3d), lower: color(0x272727), fold: color(0x1b1b1b) };
export const eyeLids = (art: PixelCanvas, shut: number) => {
	const canvas = art.clone();
	for (const [x, { top, bottom }] of eyeOpening(art)) {
		const height = bottom - top + 1;
		const upper = top + Math.round(height * 0.62 * shut);
		const lower = bottom - Math.round(height * 0.38 * shut);
		for (let y = top; y <= bottom; y++) {
			if (y < upper)
				canvas.set(x, y, y === upper - 1 ? INK : y === upper - 2 ? SCALE.fold : SCALE.upper);
			else if (y > lower) canvas.set(x, y, y === lower + 1 ? INK : SCALE.lower);
		}
	}

	return canvas;
};

// The eye has seen something: the iris one step brighter, the slit a pixel narrower (its right
// side gives way to the iris beside it).
export const eyeAlert = (art: PixelCanvas) => {
	const canvas = art.clone();
	for (const [x, { top, bottom }] of eyeOpening(art))
		for (let y = top; y <= bottom; y++) {
			const c = art.get(x, y);
			if (IRIS.has(c) && LIGHTER[c] !== WHITE) canvas.set(x, y, LIGHTER[c]);
		}
	// the pupil on each row: a run of the art's dark between two iris pixels
	for (const [x, { top, bottom }] of eyeOpening(art))
		for (let y = top; y <= bottom; y++) {
			if (!IRIS.has(art.get(x - 1, y)) || IRIS.has(art.get(x, y)) || art.get(x, y) === CLEAR)
				continue;
			let end = x;
			while (art.get(end + 1, y) === art.get(x, y)) end++;
			if (end > x && IRIS.has(art.get(end + 1, y))) canvas.set(end, y, canvas.get(end + 1, y));
		}

	return canvas;
};

// W: the wild, the dragon's own coin
const wild = () => {
	const canvas = cell();
	const g = RAMPS.gold;
	canvas.ellipse(19.5, 19.5, 16.5, 16.5, g[4]);
	canvas.paint((x, y) => x + y > 46, g[3]);
	canvas.ring(19.5, 19.5, 16.5, 16.5, 2, g[5]);
	canvas.paint((x, y, c) => c === g[5] && x + y > 40, g[2]);
	canvas.ring(19.5, 19.5, 12.5, 12.5, 1, g[2]);
	// a heavy W
	for (const dx of [0, 1, 2]) {
		canvas.path(INK, [11 + dx, 12], [14 + dx, 27]);
		canvas.path(INK, [14 + dx, 27], [18 + dx, 17]);
		canvas.path(INK, [19 + dx, 17], [23 + dx, 27]);
		canvas.path(INK, [23 + dx, 27], [26 + dx, 12]);
	}
	return outlined(canvas);
};

// How a symbol leaves the board is drawn on a wider canvas, the symbol in its middle, so its
// pieces can fly past the cell's edges: 64 art pixels round a 40 pixel symbol, and as much more
// round a bigger one, so every symbol's pieces fly as far, measured in cells.
export const goneSize = (size: number) => size + 2 * Math.ceil((size * 12) / SYMBOL_PIXELS);

export const SYMBOL_DRAWINGS = {
	symbolL1: drawn('symbolL1'),
	symbolL2: drawn('symbolL2'),
	symbolL3: drawn('symbolL3'),
	symbolL4: drawn('symbolL4'),
	symbolH1: drawn('symbolH1'),
	symbolH2: drawn('symbolH2'),
	symbolH3: drawn('symbolH3'),
	symbolH4: drawn('symbolH4'),
	symbolScatter: dragonEye,
	symbolWild: wild,
} as const;

export type SymbolKey = keyof typeof SYMBOL_DRAWINGS;

// The colour of the light behind a symbol when it wins (pixel/ui.ts winGlow): the colour it is
// known by, so a win reads by colour before the shape: the skull's crown and the gold flask in
// gold, the helm's burning gashes and the dragon's eye in fire, the hat's purple, the red-hot axe,
// each potion its liquid.
export const SYMBOL_GLOW: Partial<Record<SymbolKey, RampName>> = {
	symbolH1: 'gold',
	symbolH2: 'fire',
	symbolH3: 'pink',
	symbolH4: 'red',
	symbolL1: 'red',
	symbolL2: 'blue',
	symbolL3: 'green',
	symbolL4: 'gold',
	symbolScatter: 'fire',
	symbolWild: 'gold',
};
