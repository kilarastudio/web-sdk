import { PixelCanvas, type Point } from './canvas.ts';
import { CLEAR, INK, LIGHTER, RAMPS, WHITE } from './palette.ts';
import { outlined } from './shapes.ts';
import { SYMBOL_ART, SYMBOL_ART_ALPHABET } from './symbolArt.ts';

// Reel symbols. The paying symbols are drawn art, 64 × 64 art pixels (art/symbols-64, baked into
// symbolArt.ts by scripts/bake-symbols.ts): high symbols are what the dragon's challengers left
// behind (a crowned skull, a clawed helm, a burnt wizard's hat, a bitten axe), low symbols four
// potions. The scatter (the dragon's eye) and the wild (its coin) are still drawn by code on a
// 40 × 40 cell with a clear pixel round the edge for the outline. Every symbol fills the same reel
// cell, so the drawn art sits on a finer grid than the code-drawn art.
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

// S: the dragon's eye
// The eye in the hall's wall, small and clean: nothing but the eye and its lids. An almond opening
// that tilts up to its outer corner, the iris filling it, a slit pupil drawn to a point at both
// ends, a heavy upper lid and a thinner lower one. lid: how far the upper lid has come down, 0
// open, 1 half, 2 shut. alert: the eye has seen something: the pupil narrows to a line and the
// iris burns brighter.
const EYE = { x: 19.5, y: 20.5, half: 15.5, up: 9.5, down: 7.5, tilt: 0.08, lids: [3.5, 3, 2.5] };
const dragonEye = ({ lid = 0, alert = false }: { lid?: 0 | 1 | 2; alert?: boolean } = {}) => {
	const canvas = cell();
	const s = RAMPS.steel;
	const f = RAMPS.fire;
	const glow = alert ? 1 : 0;
	// the opening's middle line and its two lids at a column; grow is how far outside the opening
	const middle = (x: number) => EYE.y - (x - EYE.x) * EYE.tilt;
	const arch = (x: number, half: number) => Math.max(0, 1 - ((x - EYE.x) / half) ** 2);
	const upper = (x: number, grow = 0) =>
		middle(x) - (EYE.up + grow * EYE.lids[0]) * arch(x, EYE.half + grow * EYE.lids[1]) ** 0.8;
	const lower = (x: number, grow = 0) =>
		middle(x) + (EYE.down + grow * EYE.lids[2]) * arch(x, EYE.half + grow * EYE.lids[1]);
	const within = (x: number, y: number, grow = 0) =>
		Math.abs(x - EYE.x) < EYE.half + grow * EYE.lids[1] &&
		y >= upper(x, grow) &&
		y <= lower(x, grow);
	const open = (x: number, y: number) => within(x, y);

	// the lids: the upper one lit along its top, the lower one in shadow
	for (let y = 0; y < 40; y++)
		for (let x = 0; x < 40; x++) {
			if (!within(x, y, 1)) continue;
			const top = y < middle(x);
			const rim = top ? y - upper(x, 1) : lower(x, 1) - y;
			canvas.set(
				x,
				y,
				top ? (rim < 1.2 && x < 27 ? s[5] : x > 30 ? s[3] : s[4]) : rim < 1.2 ? s[1] : s[2],
			);
		}

	// the eye: the iris fills the opening, hot at the pupil and dark under the upper lid
	for (let y = 0; y < 40; y++)
		for (let x = 0; x < 40; x++) {
			if (!open(x, y)) continue;
			const heat = Math.hypot((x - EYE.x) / 14, (y - middle(x) + 0.5) / 8.5);
			let step = heat < 0.36 ? 5 : heat < 0.66 ? 4 : heat < 0.9 ? 3 : 2;
			if (y < upper(x) + 2) step -= 1;
			canvas.set(x, y, f[Math.max(1, step) + glow]);
		}
	// the pupil: a slit, widest in the middle, drawn to a point at each lid
	const slit = alert ? 0.6 : 2.4;
	canvas.paint(
		(x, y) =>
			open(x, y) &&
			Math.abs(x - EYE.x + (y - EYE.y) * 0.06) <=
				slit * Math.max(0, 1 - ((y - EYE.y + 1) / 9.5) ** 2) + 0.5,
		INK,
	);
	// a dark line where the eye meets its lids
	canvas.paint(
		(x, y, c) => open(x, y) && c !== INK && (y < upper(x) + 1 || y > lower(x) - 1),
		RAMPS.red[0],
	);
	// the wet of the eye: one block of light, up and to the left of the pupil
	canvas.dots(WHITE, [13, 15], [14, 15], [13, 16]);

	// the upper lid comes down over the eye, a dark line along its edge
	if (lid) {
		const edge = (x: number) => (lid === 1 ? middle(x) + 1 : lower(x) - 0.5);
		for (let y = 0; y < 40; y++)
			for (let x = 0; x < 40; x++) {
				if (!open(x, y) || y >= edge(x)) continue;
				const fold = edge(x) - y;
				canvas.set(x, y, fold < 1 ? INK : fold < 2.2 ? s[2] : x > 30 ? s[3] : s[4]);
			}
	}
	return outlined(canvas);
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
const goneSize = (size: number) => size + 2 * Math.ceil((size * 12) / SYMBOL_PIXELS);
const HURT_FRAMES = 8;
const GONE_FRAMES = 10;

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const span = (t: number, start: number, end: number) => clamp((t - start) / (end - start));

// a pixel on the rim of what is drawn: the drawn art's own dark outline is there
const onRim = (canvas: PixelCanvas, x: number, y: number) =>
	canvas.get(x - 1, y) === CLEAR ||
	canvas.get(x + 1, y) === CLEAR ||
	canvas.get(x, y - 1) === CLEAR ||
	canvas.get(x, y + 1) === CLEAR;

// a pseudo-random run from a seed, so the art comes out the same on every load
const randomFrom = (seed: number) => {
	let state = seed;

	return () => (state = (state * 16807) % 2147483647) / 2147483647;
};

// What a symbol does at rest now and then: a soft band of light slides over it from the top left
// to the bottom right, one ramp step lighter, no white, its outline left dark. Generic for now;
// each drawn symbol is to get its own.
const glide = (art: PixelCanvas, frames = 8) =>
	Array.from({ length: frames }, (_, frame) => {
		const at = -4 + ((art.width + art.height + 8) * frame) / (frames - 1);

		return art.clone().paint(
			(x, y, c) => c !== INK && !onRim(art, x, y) && Math.abs(x + y - at) <= 2,
			(c) => LIGHTER[c],
		);
	});

// a crack opens from one point to another, between start and end of the win (0 to 1)
type Crack = { from: Point; to: Point; start: number; end: number };
// how a symbol breaks: its cracks, which piece each of its pixels belongs to, and the point the
// pieces fly from
type Breakage = { cracks: Crack[]; owner: (x: number, y: number) => number; middle: Point };

const within = (polygon: readonly Point[], x: number, y: number) => {
	let inside = false;
	for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
		const [xi, yi] = polygon[i];
		const [xj, yj] = polygon[j];
		if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
	}

	return inside;
};

// a pixel belongs to the piece it lies in, or the nearest
const byPieces = (pieces: Point[][]) => {
	const centres = pieces.map((piece): Point => [
		piece.reduce((sum, [x]) => sum + x, 0) / piece.length,
		piece.reduce((sum, [, y]) => sum + y, 0) / piece.length,
	]);

	return (x: number, y: number) => {
		const inside = pieces.findIndex((piece) => within(piece, x + 0.5, y + 0.5));
		if (inside >= 0) return inside;

		return centres.reduce(
			(best, [px, py], index) =>
				Math.hypot(px - x, py - y) < Math.hypot(centres[best][0] - x, centres[best][1] - y)
					? index
					: best,
			0,
		);
	};
};

// Any symbol breaks the way a struck plate does, whatever its shape: cracks run from the middle of
// what is drawn out to a bend halfway, then on past its edge, and last round between the bends.
// The pieces are what the cracks cut out: a ring of wedges in the middle, a ring of shards
// round them. Generic for now; each drawn symbol is to get its own way of being hurt.
const struckBreakage = (art: PixelCanvas, { spokes = 5, seed = 7 } = {}): Breakage => {
	let sumX = 0;
	let sumY = 0;
	let count = 0;
	for (let y = 0; y < art.height; y++)
		for (let x = 0; x < art.width; x++)
			if (art.get(x, y) !== CLEAR) {
				sumX += x;
				sumY += y;
				count++;
			}
	const middle: Point = [Math.round(sumX / count), Math.round(sumY / count)];
	let reach = 0;
	for (let y = 0; y < art.height; y++)
		for (let x = 0; x < art.width; x++)
			if (art.get(x, y) !== CLEAR)
				reach = Math.max(reach, Math.hypot(x - middle[0], y - middle[1]));

	const random = randomFrom(seed);
	const turn = (Math.PI * 2) / spokes;
	const start = -Math.PI / 2 + (random() - 0.5) * turn;
	const at = (angle: number, far: number): Point => [
		Math.round(middle[0] + Math.cos(angle) * far),
		Math.round(middle[1] + Math.sin(angle) * far),
	];
	const angles = Array.from(
		{ length: spokes },
		(_, index) => start + turn * index + (random() - 0.5) * 0.5 * turn,
	);
	const bends = angles.map((angle) => at(angle + (random() - 0.5) * 0.3, reach * 0.5));
	// past the edge, so the outer shards hold every drawn pixel
	const ends = angles.map((angle) => at(angle, reach * 1.6));

	const pieces: Point[][] = [];
	const cracks: Crack[] = [];
	angles.forEach((_, index) => {
		const next = (index + 1) % spokes;
		pieces.push([middle, bends[index], bends[next]]);
		pieces.push([bends[index], ends[index], ends[next], bends[next]]);
		cracks.push({ from: middle, to: bends[index], start: 0.1, end: 0.45 });
		cracks.push({ from: bends[index], to: ends[index], start: 0.4, end: 0.8 });
		cracks.push({ from: bends[index], to: bends[next], start: 0.75, end: 1 });
	});

	return { cracks, owner: byPieces(pieces), middle };
};

const partLine = (canvas: PixelCanvas, from: Point, to: Point, amount: number, c: number) =>
	canvas.line(
		from[0],
		from[1],
		from[0] + (to[0] - from[0]) * amount,
		from[1] + (to[1] - from[1]) * amount,
		c,
	);

// winning: the cracks open one after another, each with a lip two steps lighter than what it
// splits; at the end every piece stands apart
const cracking = (art: PixelCanvas, { cracks }: Breakage) =>
	Array.from({ length: HURT_FRAMES }, (_, frame) => {
		const t = (frame + 1) / HURT_FRAMES;
		const canvas = art.clone();
		for (const { from, to, start, end } of cracks) {
			const amount = span(t, start, end);
			if (amount <= 0) continue;
			const lip = new PixelCanvas(art.width, art.height);
			partLine(lip, [from[0] - 1, from[1]], [to[0] - 1, to[1]], amount, INK);
			canvas.paint(
				(x, y, c) => lip.get(x, y) !== CLEAR && c !== INK && !onRim(art, x, y),
				(c) => LIGHTER[LIGHTER[c]],
			);
			const dark = new PixelCanvas(art.width, art.height);
			partLine(dark, from, to, amount, INK);
			canvas.paint((x, y) => dark.get(x, y) !== CLEAR, INK);
		}

		return canvas;
	});

// going: the pieces fly out from the middle and fall, each a solid shard that wears away. Distances
// are given for a 40 pixel symbol and grow with a bigger one. reach: how far they fly, in pixels.
const shattering = (
	art: PixelCanvas,
	{ owner, middle }: Breakage,
	{ seed = 5, reach = 9 } = {},
) => {
	const size = goneSize(art.width);
	const margin = (size - art.width) / 2;
	const grow = art.width / SYMBOL_PIXELS;
	const parts: PixelCanvas[] = [];
	const sums: { x: number; y: number; count: number }[] = [];
	for (let y = 0; y < art.height; y++)
		for (let x = 0; x < art.width; x++) {
			const c = art.get(x, y);
			if (c === CLEAR) continue;
			const index = owner(x, y);
			parts[index] ??= new PixelCanvas(size, size);
			sums[index] ??= { x: 0, y: 0, count: 0 };
			parts[index].set(x + margin, y + margin, c);
			sums[index].x += x;
			sums[index].y += y;
			sums[index].count++;
		}
	const random = randomFrom(seed);
	const flights = sums.map((sum) => {
		const angle =
			Math.atan2(sum.y / sum.count - middle[1], sum.x / sum.count - middle[0]) +
			(random() - 0.5) * 0.5;
		const far = reach * grow * (1 + random());

		return {
			x: Math.cos(angle) * far,
			y: Math.sin(angle) * far - 4 * grow,
			wear: 0.45 + random() * 0.2,
		};
	});
	// a piece with its outermost pixels gone
	const worn = (canvas: PixelCanvas) => canvas.clone().paint((x, y) => onRim(canvas, x, y), CLEAR);
	const wearSteps = Math.round(5 * grow);

	return Array.from({ length: GONE_FRAMES }, (_, frame) => {
		const t = (frame + 1) / GONE_FRAMES;
		const canvas = new PixelCanvas(size, size);
		parts.forEach((piece, index) => {
			const flight = flights[index];
			const out = 1 - (1 - t) ** 2;
			let shard = piece;
			const wears = Math.floor(span(t, flight.wear, 1) * wearSteps);
			for (let wear = 0; wear < wears; wear++) shard = worn(shard);
			canvas.blit(
				outlined(shard.clone()),
				Math.round(flight.x * out),
				Math.round(flight.y * out + 16 * grow * t * t),
			);
		});

		return canvas;
	});
};

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

const PAYING = [
	'symbolH1',
	'symbolH2',
	'symbolH3',
	'symbolH4',
	'symbolL1',
	'symbolL2',
	'symbolL3',
	'symbolL4',
] as const;

// Frame runs beside the still art, keyed like the symbols with a suffix: the scatter's Blink and
// Alert, a symbol's Rest (what it does now and then on the board), its Hurt (what the dragon does
// to it as it wins; the last frame stays until it goes) and its Gone (how it leaves the board, on
// a wider canvas, goneSize). A symbol may lack any run: the game then shows its still art.
export const SYMBOL_FRAME_RUNS = (): Record<string, PixelCanvas[]> => {
	const runs: Record<string, PixelCanvas[]> = {
		symbolScatterBlink: [dragonEye({ lid: 1 }), dragonEye({ lid: 2 }), dragonEye({ lid: 1 })],
		symbolScatterAlert: [dragonEye({ alert: true })],
	};
	PAYING.forEach((key, index) => {
		const art = SYMBOL_DRAWINGS[key]();
		const breakage = struckBreakage(art, { seed: 7 + index * 13 });
		runs[`${key}Rest`] = glide(art);
		runs[`${key}Hurt`] = cracking(art, breakage);
		// it breaks from where the win left it: cracked through
		runs[`${key}Gone`] = shattering(runs[`${key}Hurt`].at(-1) ?? art, breakage, {
			seed: 5 + index,
		});
	});

	return runs;
};
