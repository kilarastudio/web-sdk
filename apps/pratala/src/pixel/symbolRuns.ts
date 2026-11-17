import { PixelCanvas, type Point } from './canvas.ts';
import { CLEAR, INK, LIGHTER, color } from './palette.ts';
import { IRIS, SYMBOL_DRAWINGS, dragonEye, eyeLids, eyeOpening, goneSize } from './symbols.ts';

// What each reel symbol does in every state it goes through, as runs of frames worked out from
// its drawn art. Keyed like the symbols with a suffix:
//   Rest…  what it does now and then at rest on the board (a symbol may have more than one)
//   Land   what it does as it lands in its cell
//   Hurt   its win: what the dragon does to it; the last frame stays until it goes
//   Gone   how it leaves the board, on a wider canvas (goneSize), from where its win left it
// and for the dragon's eye: Narrow (falling), Wary (a column waits on a scatter, indexed by the
// beat), Flare (its win).
//
// The art is solid: nothing here bends, squashes or sways an outline. Things move by whole art
// pixels as solid parts (a jaw, a cork, a helm's half), colours step along the palette (embers,
// glow, light inside a liquid), and particles are solid clumps of pixels, never single specks.
// Fire is a small heat model drawn in colour bands, like the torches' (ui.ts flameFrames).
//
// A run may be drawn on a canvas bigger than the art, the art in its middle, when something
// rises past the art's edge (fumes, smoke); the game draws every frame at the art's own scale.

type Runs = Record<string, PixelCanvas[]>;
type Bands = readonly (readonly [floor: number, colour: number])[];

const c = color;
const SHADOW = c(0x131313);
const DARKS = new Set([INK, SHADOW, c(0x1b1b1b), c(0x272727)]);

const clamp = (value: number) => Math.max(0, Math.min(1, value));
// how far through the stretch from start to end t is
const span = (t: number, start: number, end: number) => clamp((t - start) / (end - start));

// a fixed number between 0 and 1 for a cell and a seed, so the art comes out the same on every
// load: what makes one ember hotter than its neighbour, and the next frame different
const hash = (x: number, y: number, seed: number) => {
	let h =
		(Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 1442695041)) |
		0;
	h = Math.imul(h ^ (h >>> 13), 1274126177);

	return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
// the same, held over 2 × 2 cells, so heat flickers in clumps and never in single specks
const blotch = (x: number, y: number, seed: number) => hash(x >> 1, y >> 1, seed);

const randomFrom = (seed: number) => {
	let state = seed;

	return () => (state = (state * 16807) % 2147483647) / 2147483647;
};

// ---------------------------------------------------------------------------------------------
// Finding parts of the art

const key = (x: number, y: number) => y * 256 + x;

const pick = (art: PixelCanvas, test: (x: number, y: number, c: number) => boolean) => {
	const found: Point[] = [];
	for (let y = 0; y < art.height; y++)
		for (let x = 0; x < art.width; x++) {
			const at = art.get(x, y);
			if (at !== CLEAR && test(x, y, at)) found.push([x, y]);
		}

	return found;
};

const colours = (...hexes: number[]) => new Set(hexes.map(c));

// the drawn pixels next to (8 ways) a set of pixels, outside it, that pass the test
const around = (
	art: PixelCanvas,
	pixels: readonly Point[],
	test: (x: number, y: number, c: number) => boolean = () => true,
) => {
	const inside = new Set(pixels.map(([x, y]) => key(x, y)));
	const seen = new Set<number>();
	const found: Point[] = [];
	for (const [x, y] of pixels)
		for (let dy = -1; dy <= 1; dy++)
			for (let dx = -1; dx <= 1; dx++) {
				const nx = x + dx;
				const ny = y + dy;
				const k = key(nx, ny);
				const at = art.get(nx, ny);
				if (inside.has(k) || seen.has(k) || at === CLEAR || !test(nx, ny, at)) continue;
				seen.add(k);
				found.push([nx, ny]);
			}

	return found;
};

const middleOf = (pixels: readonly Point[]): Point => [
	pixels.reduce((sum, [x]) => sum + x, 0) / pixels.length,
	pixels.reduce((sum, [, y]) => sum + y, 0) / pixels.length,
];

// which side of a line drawn downward from a to b a pixel lies on: 0 left of it, 1 right
const sideOf = (a: Point, b: Point) => (x: number, y: number) =>
	(b[0] - a[0]) * (y + 0.5 - a[1]) - (b[1] - a[1]) * (x + 0.5 - a[0]) < 0 ? 1 : 0;

// ---------------------------------------------------------------------------------------------
// Moving parts and drawing over the art

// The part is lifted out of the art and set down dx, dy whole pixels away; what it uncovers
// takes the colour `under` gives (clear unless told otherwise).
const moved = (
	art: PixelCanvas,
	part: readonly Point[],
	dx: number,
	dy: number,
	under: (x: number, y: number) => number = () => CLEAR,
	onto = art.clone(),
) => {
	if (!dx && !dy) return onto;
	for (const [x, y] of part) onto.set(x, y, under(x, y));
	for (const [x, y] of part) onto.set(x + dx, y + dy, art.get(x, y));

	return onto;
};

// the whole art moved by whole pixels on a canvas the same size
const shifted = (art: PixelCanvas, dx: number, dy: number) =>
	new PixelCanvas(art.width, art.height).blit(art, dx, dy);

// the art in the middle of a bigger canvas, pad pixels clear round it
const padded = (art: PixelCanvas, pad: number) =>
	new PixelCanvas(art.width + pad * 2, art.height + pad * 2).blit(art, pad, pad);

// A cut edge reads as an edge: a drawn pixel next to clear that is not already dark takes the
// art's outline colour. Unlike an outline drawn round it, the shape stays its own size.
const rimmed = (canvas: PixelCanvas) =>
	canvas.paint(
		(x, y, at) =>
			!DARKS.has(at) &&
			(canvas.get(x - 1, y) === CLEAR ||
				canvas.get(x + 1, y) === CLEAR ||
				canvas.get(x, y - 1) === CLEAR ||
				canvas.get(x, y + 1) === CLEAR),
		SHADOW,
	);

// a piece with its outermost pixels gone, its new edge dark again
const worn = (canvas: PixelCanvas) =>
	rimmed(
		canvas
			.clone()
			.paint(
				(x, y) =>
					canvas.get(x - 1, y) === CLEAR ||
					canvas.get(x + 1, y) === CLEAR ||
					canvas.get(x, y - 1) === CLEAR ||
					canvas.get(x, y + 1) === CLEAR,
				CLEAR,
			),
	);

// lone pixels go: what is left of a burning or wearing thing stays in clumps, never specks
const despeckled = (canvas: PixelCanvas) =>
	canvas.clone().paint((x, y) => {
		let near = 0;
		for (let dy = -1; dy <= 1; dy++)
			for (let dx = -1; dx <= 1; dx++)
				if ((dx || dy) && canvas.get(x + dx, y + dy) !== CLEAR) near++;

		return near < 3;
	}, CLEAR);

// Bits smaller than `least` pixels (counted 8 ways) go: at phone size a two or three pixel crumb
// reads as dirt on the board, not as a piece of anything.
const cleaned = (canvas: PixelCanvas, least = 6) => {
	const out = canvas.clone();
	const seen = new Set<number>();
	for (let y = 0; y < canvas.height; y++)
		for (let x = 0; x < canvas.width; x++) {
			if (canvas.get(x, y) === CLEAR || seen.has(key(x, y))) continue;
			const patch: Point[] = [];
			const queue: Point[] = [[x, y]];
			seen.add(key(x, y));
			while (queue.length) {
				const [px, py] = queue.pop()!;
				patch.push([px, py]);
				for (let dy = -1; dy <= 1; dy++)
					for (let dx = -1; dx <= 1; dx++) {
						const k = key(px + dx, py + dy);
						if (seen.has(k) || canvas.get(px + dx, py + dy) === CLEAR) continue;
						seen.add(k);
						queue.push([px + dx, py + dy]);
					}
			}
			if (patch.length < least) for (const [px, py] of patch) out.set(px, py, CLEAR);
		}

	return out;
};

const stepped = (
	at: number,
	table: readonly number[] | ((at: number) => number),
	steps: number,
) => {
	let out = at;
	for (let i = 0; i < steps; i++) out = typeof table === 'function' ? table(out) : table[out];

	return out;
};

// ---------------------------------------------------------------------------------------------
// Heat: embers, burning edges and glowing eyes are drawn by how hot each pixel is, in bands of
// fire colours, the way the torches are. Below the lowest band a pixel keeps its own colour.

const EMBER: Bands = [
	[0.9, c(0xffeb57)],
	[0.74, c(0xffa214)],
	[0.56, c(0xff5000)],
	[0.4, c(0xc64524)],
	[0.24, c(0x8e251d)],
];

const burn = (
	canvas: PixelCanvas,
	pixels: readonly Point[],
	heat: (x: number, y: number) => number,
	bands: Bands = EMBER,
) => {
	for (const [x, y] of pixels) {
		const band = bands.find(([floor]) => heat(x, y) >= floor);
		if (band) canvas.set(x, y, band[1]);
	}

	return canvas;
};

// One step hotter along the fire colours, for an eye or a seam that heats: reds climb to orange
// and gold, never to pink or white.
const HOTTER = (() => {
	const table = Array.from({ length: 64 }, (_, index) => index);
	const climb = [
		[0x571c27, 0x891e2b],
		[0x891e2b, 0xc42430],
		[0xc42430, 0xea323c],
		[0xea323c, 0xff5000],
		[0x8e251d, 0xc64524],
		[0xc64524, 0xff5000],
		[0xff5000, 0xed7614],
		[0xed7614, 0xffa214],
		[0xffa214, 0xffc825],
		[0xffc825, 0xffeb57],
	];
	for (const [from, to] of climb) table[c(from)] = c(to);

	return table;
})();

// Flames standing on a foot (an eye socket's rim, a burnt hole): the torch's heat model in small,
// drawn in the fire bands. Heat is strongest at the foot and fades with the height; the flame
// narrows as it climbs; the flicker is held in 2 × 2 clumps that climb two rows a frame, so
// tongues rise without any outline swaying. strength 0 draws nothing, 1 is a full blaze.
type Foot = { x: number; y: number; width: number; height: number };
const flames = (
	canvas: PixelCanvas,
	feet: readonly Foot[],
	strength: number,
	time: number,
	seed: number,
) => {
	if (strength <= 0) return canvas;
	for (const { x: fx, y: fy, width, height } of feet)
		for (let rise = 0; rise < height; rise++) {
			const half = (width / 2) * (1 - 0.55 * (rise / height));
			for (let x = Math.floor(fx - half); x <= Math.ceil(fx + half); x++) {
				const y = fy - rise;
				const across = 1 - ((x - fx) / (half + 0.5)) ** 2;
				if (across <= 0) continue;
				const heat =
					strength * (1 - rise / height) * (0.55 + 0.45 * across) +
					0.34 * (blotch(x, y + time * 2, seed) - 0.5);
				const band = EMBER.find(([floor]) => heat >= floor);
				if (band) canvas.set(x, y, band[1]);
			}
		}

	return canvas;
};

// ---------------------------------------------------------------------------------------------
// Particles: solid clumps of pixels, a lighter row on top when they have one

const clump = (
	canvas: PixelCanvas,
	x: number,
	y: number,
	width: number,
	height: number,
	body: number,
	top = body,
	only?: (x: number, y: number) => boolean,
) => {
	x = Math.round(x);
	y = Math.round(y);
	for (let j = 0; j < height; j++)
		for (let i = 0; i < width; i++) {
			// a clump three or more across loses its corners, so it reads round
			const corner =
				width >= 3 && height >= 3 && (i === 0 || i === width - 1) && (j === 0 || j === height - 1);
			if (corner || (only && !only(x + i, y + j))) continue;
			canvas.set(x + i, y + j, j === 0 ? top : body);
		}

	return canvas;
};

// ---------------------------------------------------------------------------------------------
// Cracks: a dark line grows along a path, with a lip a step lighter beside it, inside what is
// drawn only

const crack = (
	canvas: PixelCanvas,
	path: readonly Point[],
	amount: number,
	line: number | ((x: number, y: number) => number) = INK,
) => {
	if (amount <= 0) return canvas;
	const lengths = path
		.slice(1)
		.map((point, index) => Math.hypot(point[0] - path[index][0], point[1] - path[index][1]));
	let left = lengths.reduce((sum, length) => sum + length, 0) * amount;
	const marks = new PixelCanvas(canvas.width, canvas.height);
	for (let index = 0; index < lengths.length && left > 0; index++) {
		const [x0, y0] = path[index];
		const [x1, y1] = path[index + 1];
		const part = Math.min(1, left / lengths[index]);
		marks.line(x0, y0, x0 + (x1 - x0) * part, y0 + (y1 - y0) * part, 0);
		left -= lengths[index];
	}
	const before = canvas.clone();
	for (let y = 0; y < canvas.height; y++)
		for (let x = 0; x < canvas.width; x++) {
			if (marks.get(x, y) === CLEAR || before.get(x, y) === CLEAR) continue;
			canvas.set(x, y, typeof line === 'number' ? line : line(x, y));
			const lip = before.get(x - 1, y);
			if (marks.get(x - 1, y) === CLEAR && lip !== CLEAR && !DARKS.has(lip))
				canvas.set(x - 1, y, LIGHTER[lip]);
		}

	return canvas;
};

// ---------------------------------------------------------------------------------------------
// Breaking apart: every pixel belongs to a piece; each piece flies its own way and falls, a solid
// shard that wears away at the edges near the end. Drawn on the wider gone canvas.

type Flight = { x: number; y: number; start?: number; fall?: number; wear?: number };

const breakApart = (
	art: PixelCanvas,
	owner: (x: number, y: number) => number,
	flights: readonly Flight[],
	{
		frames,
		size = goneSize(SIZE),
		from = 0,
		edges = true,
	}: { frames: number; size?: number; from?: number; edges?: boolean },
) => {
	const margin = (size - art.width) / 2;
	const pieces: PixelCanvas[] = [];
	for (const [x, y] of pick(art, () => true)) {
		const index = owner(x, y);
		pieces[index] ??= new PixelCanvas(size, size);
		pieces[index].set(x + margin, y + margin, art.get(x, y));
	}
	// a solid piece gets a dark edge where it was cut; a liquid's blobs do not
	const edged = pieces.map((piece) => piece && (edges ? rimmed(piece) : piece));
	// every piece falls past the bottom of the canvas by the last frame, however far it was told
	// to fall: nothing may hang in the air and then blink out when the run ends
	const tops = pieces.map(
		(piece) => piece && pick(piece, () => true).reduce((m, [, y]) => Math.min(m, y), size),
	);

	return Array.from({ length: frames }, (_, frame) => {
		const t = from + ((frame + 1) / frames) * (1 - from);
		const canvas = new PixelCanvas(size, size);
		edged.forEach((piece, index) => {
			if (!piece) return;
			const flight = flights[index] ?? { x: 0, y: 0 };
			const { x, y, start = 0, wear = 0.55 } = flight;
			const fall = Math.max(flight.fall ?? 30, size + 1 - tops[index] - y);
			const local = span(t, start, 1);
			const out = 1 - (1 - local) ** 2;
			let shard = piece;
			// a few pixels off its edges, not down to slivers: it falls out of sight first
			const wears = Math.floor(span(local, wear, 1) * 3.5);
			for (let step = 0; step < wears && edges; step++) shard = worn(shard);
			canvas.blit(shard, Math.round(x * out), Math.round(y * out + fall * local * local));
		});

		return canvas;
	});
};

// a polygon test, for pieces cut by hand or by radial cracks
const within = (polygon: readonly Point[], x: number, y: number) => {
	let inside = false;
	for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
		const [xi, yi] = polygon[i];
		const [xj, yj] = polygon[j];
		if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
	}

	return inside;
};

// Glass breaks the way a struck plate does: cracks run from a point out past the edge, a bend
// halfway; the shards are the wedges between them. Returns each pixel's shard, the cracks as
// paths, and each shard's way out.
const struck = (middle: Point, reach: number, { spokes = 6, seed = 7 } = {}) => {
	const random = randomFrom(seed);
	const turn = (Math.PI * 2) / spokes;
	const start = -Math.PI / 2 + (random() - 0.5) * turn;
	const at = (angle: number, far: number): Point => [
		Math.round(middle[0] + Math.cos(angle) * far),
		Math.round(middle[1] + Math.sin(angle) * far),
	];
	const angles = Array.from(
		{ length: spokes },
		(_, index) => start + turn * index + (random() - 0.5) * 0.4 * turn,
	);
	const bends = angles.map((angle) => at(angle + (random() - 0.5) * 0.4, reach * 0.5));
	const ends = angles.map((angle) => at(angle, reach * 1.8));
	const wedges = angles.map((_, index) => {
		const next = (index + 1) % spokes;

		return [middle, bends[index], ends[index], ends[next], bends[next]] as Point[];
	});
	const paths = angles.map((_, index) => [middle, bends[index], ends[index]] as Point[]);
	const owner = (x: number, y: number) => {
		const inside = wedges.findIndex((wedge) => within(wedge, x + 0.5, y + 0.5));

		return inside >= 0 ? inside : 0;
	};
	const ways = angles.map((angle) => angle + turn / 2 + (random() - 0.5) * 0.3);

	return { owner, paths, ways };
};

// ---------------------------------------------------------------------------------------------
// Liquid in a bottle: its surface rows move inside the glass, the glass itself never moves.

type Liquid = {
	pixels: Point[];
	has: (x: number, y: number) => boolean;
	// for each column, its top liquid pixel, when the glass above it can take the surface
	surface: Map<number, number>;
	middle: Point;
	// what the surface may rise into
	glass: Set<number>;
	left: number;
	right: number;
	bottom: number;
};

const liquidOf = (
	art: PixelCanvas,
	liquid: Set<number>,
	glass: Set<number>,
	keep: (x: number, y: number) => boolean = () => true,
): Liquid => {
	const pixels = pick(art, (x, y, at) => liquid.has(at) && keep(x, y));
	const inside = new Set(pixels.map(([x, y]) => key(x, y)));
	const has = (x: number, y: number) => inside.has(key(x, y));
	const surface = new Map<number, number>();
	for (const [x, y] of pixels) if (!has(x, y - 1) && (surface.get(x) ?? 99) > y) surface.set(x, y);
	// a column whose top meets the cork, a tag or the outline has no free surface
	for (const [x, y] of surface)
		if (!glass.has(art.get(x, y - 1)) || !glass.has(art.get(x, y - 2))) surface.delete(x);
	const xs = pixels.map(([x]) => x);

	return {
		pixels,
		has,
		surface,
		middle: middleOf(pixels),
		glass,
		left: Math.min(...xs),
		right: Math.max(...xs),
		bottom: Math.max(...pixels.map(([, y]) => y)),
	};
};

// The surface rises or falls by whole pixels, column by column: lift(x) is how far (up is
// negative). The top two rows (its lit skin) go with the surface; glass shows where it left.
const SKIN = 2;
const lifted = (
	art: PixelCanvas,
	liquid: Liquid,
	lift: (x: number) => number,
	onto = art.clone(),
) => {
	for (const [x, top] of liquid.surface) {
		let d = Math.round(lift(x));
		// it may only rise into the glass over it, two pixels at most
		while (
			d < 0 &&
			![...Array(-d).keys()].every((up) => liquid.glass.has(art.get(x, top - 1 - up)))
		)
			d++;
		if (!d) continue;
		const glass = art.get(x, top - 1);
		const newTop = top + d;
		for (let y = Math.min(top, newTop); y <= top + SKIN + 2; y++) {
			if (y < newTop) onto.set(x, y, glass);
			else if (y < newTop + SKIN) onto.set(x, y, art.get(x, top + (y - newTop)));
			else if (liquid.has(x, y)) onto.set(x, y, art.get(x, Math.max(y, top + SKIN)));
		}
	}

	return onto;
};

// A liquid's own colours, dark to light. Light steps along it and stops at its top, so even the
// gold, whose colours sit at the light end of the shared ramps, still has steps to climb; a
// negative step darkens.
type Ramp = readonly number[];
const along = (ramp: Ramp, steps: number) => (at: number) => {
	const index = ramp.indexOf(at);

	return index < 0 ? at : ramp[Math.max(0, Math.min(ramp.length - 1, index + steps))];
};

// the liquid `steps` along its ramp, where `where` says
const lit = (
	canvas: PixelCanvas,
	liquid: Liquid,
	ramp: Ramp,
	steps: number,
	where: (x: number, y: number) => boolean = () => true,
) => {
	if (!steps) return canvas;
	const to = along(ramp, steps);
	for (const [x, y] of liquid.pixels) if (where(x, y)) canvas.set(x, y, to(canvas.get(x, y)));

	return canvas;
};

// A bubble five pixels round: a ring and a core in the liquid's colours, `ring` and `core` steps
// along its ramp from what is under them, inside the liquid only. Big enough to read as a bubble
// in a cell 60 px across; never three across, where a round clump turns into a plus.
const BUBBLE = ['.###.', '#ooo#', '#ooo#', '#ooo#', '.###.'];
type Tones = { ring: number; core: number };
const bubble = (
	canvas: PixelCanvas,
	art: PixelCanvas,
	liquid: Liquid,
	ramp: Ramp,
	[x, y]: Point,
	{ ring, core }: Tones,
) => {
	BUBBLE.forEach((row, j) =>
		[...row].forEach((at, i) => {
			const px = Math.round(x) + i;
			const py = Math.round(y) + j;
			if (at === '.' || !liquid.has(px, py)) return;
			canvas.set(px, py, along(ramp, at === '#' ? ring : core)(art.get(px, py)));
		}),
	);

	return canvas;
};

// the highest the liquid reaches over five columns from x, where a bubble comes up
const surfaceAt = (liquid: Liquid, x: number) =>
	Math.max(
		...[0, 1, 2, 3, 4].map((i) => liquid.surface.get(Math.round(x) + i) ?? liquid.middle[1] - 99),
	);

// Bubbles rise one after another, stepping a pixel sideways now and then, and pop at the surface:
// the surface over a pop jumps a pixel for a frame. starts: each bubble's column and first frame.
const risingBubbles = (
	art: PixelCanvas,
	liquid: Liquid,
	ramp: Ramp,
	{
		starts,
		frames,
		speed,
		tones,
	}: { starts: readonly [x: number, frame: number][]; frames: number; speed: number; tones: Tones },
) =>
	Array.from({ length: frames }, (_, frame) => {
		const shown: Point[] = [];
		const popping = new Set<number>();
		for (const [x0, from] of starts) {
			const age = frame - from;
			if (age < 0) continue;
			const x = x0 + (Math.floor(age / 3) % 2);
			const y = liquid.bottom - 7 - age * speed;
			const top = surfaceAt(liquid, x);
			if (y > top + 1) shown.push([x, y]);
			else if (y > top + 1 - speed) for (let i = 0; i < 5; i++) popping.add(x + i);
		}
		const canvas = lifted(art, liquid, (x) => (popping.has(x) ? -1 : 0));
		for (const at of shown) bubble(canvas, art, liquid, ramp, at, tones);

		return canvas;
	});

// Light fills the liquid from the bottom, a brighter band at its rising edge, holds full, and
// sinks back out. Large and slow, so it reads on a phone, and only colour moves.
const lightRise = (art: PixelCanvas, liquid: Liquid, ramp: Ramp) => {
	const top = Math.min(...liquid.pixels.map(([, y]) => y));
	const height = liquid.bottom - top + 1;
	// how far up the light reaches (0 to 1), and whether its edge carries the brighter band
	const steps: [number, boolean][] = [
		[0.2, true],
		[0.4, true],
		[0.6, true],
		[0.8, true],
		[1, true],
		[1, false],
		[1, false],
		[1, false],
		[1, false],
		[0.75, false],
		[0.5, false],
		[0.25, false],
	];

	return steps.map(([reach, band]) => {
		const line = liquid.bottom + 1 - Math.round(reach * height);
		const canvas = lit(art.clone(), liquid, ramp, 1, (_, y) => y >= line);

		return band ? lit(canvas, liquid, ramp, 1, (_, y) => y >= line && y < line + 4) : canvas;
	});
};

// Every bottle's land: it comes down two pixels and back as a whole, and the liquid in it keeps
// going a moment longer, down, then up past where it rests, then home.
const plop = (art: PixelCanvas, liquid: Liquid) =>
	[
		[2, 1],
		[1, -2],
		[0, -1],
		[0, 1],
	].map(([drop, lift]) =>
		shifted(
			lifted(art, liquid, () => lift),
			0,
			drop,
		),
	);

// A part of the art picked by a box: a bottle's cork, an axe's blade.
const inBox = (box: readonly [number, number, number, number]) => (x: number, y: number) =>
	x >= box[0] && y >= box[1] && x <= box[2] && y <= box[3];

// The cork rises off the neck, a solid piece; the neck it leaves stands open, its rim dark.
const uncorked = (art: PixelCanvas, cork: readonly Point[], up: number) => {
	if (!up) return art.clone();
	const canvas = moved(art, cork, 0, -up);
	const left = new Set(cork.map(([x, y]) => key(x, y)));
	for (const [x, y] of cork) {
		if (canvas.get(x, y) !== CLEAR) continue;
		// the open mouth of the neck: dark where something of the bottle is beside or under it
		const below = art.get(x, y + 1) !== CLEAR && !left.has(key(x, y + 1));
		if (below) canvas.set(x, y, SHADOW);
	}

	return canvas;
};

// A glass shard: a small solid polygon, turned, in the glass greys, lit along its top left edge
// and dark along its bottom right, so it reads as a thick piece of glass and not a thin rim.
const SHARDS: readonly (readonly Point[])[] = [
	[
		[-4, -3],
		[4, -2],
		[1, 4],
	],
	[
		[-3, -4],
		[3, -3],
		[4, 3],
		[-2, 2],
	],
	[
		[-5, 0],
		[0, -3],
		[4, 1],
		[-1, 3],
	],
	[
		[-3, -4],
		[3, -1],
		[-1, 4],
	],
	[
		[-4, -2],
		[2, -3],
		[3, 2],
		[-3, 3],
	],
];
const GLASS = { light: c(0xc7cfdd), body: c(0xb4b4b4), dark: c(0x5d5d5d) };

const shard = (canvas: PixelCanvas, shape: readonly Point[], [x, y]: Point, turn: number) => {
	// the shapes are drawn half as big again: a shard must read as a piece on a phone
	const piece = new PixelCanvas(19, 19);
	piece.poly(
		0,
		...shape.map(([px, py]): Point => [
			9 + 1.5 * (px * Math.cos(turn) - py * Math.sin(turn)),
			9 + 1.5 * (px * Math.sin(turn) + py * Math.cos(turn)),
		]),
	);
	for (const [px, py] of pick(piece, () => true)) {
		const lightSide = piece.get(px - 1, py) === CLEAR || piece.get(px, py - 1) === CLEAR;
		const darkSide = piece.get(px + 1, py) === CLEAR || piece.get(px, py + 1) === CLEAR;
		canvas.set(
			Math.round(x) - 9 + px,
			Math.round(y) - 9 + py,
			darkSide ? GLASS.dark : lightSide ? GLASS.light : GLASS.body,
		);
	}

	return canvas;
};

// a part of the art turned a quarter at a time about its middle: whole-pixel turns only, so the
// cork stays the same solid piece
const quarterTurned = (art: PixelCanvas, part: readonly Point[], turns: number) => {
	const [mx, my] = middleOf(part).map(Math.round);
	const piece = new PixelCanvas(SIZE, SIZE);
	for (const [x, y] of part) {
		let [dx, dy] = [x - mx, y - my];
		for (let i = 0; i < ((turns % 4) + 4) % 4; i++) [dx, dy] = [-dy, dx];
		piece.set(mx + dx, my + dy, art.get(x, y));
	}

	return piece;
};

// How every bottle goes. The glass cracks, then bursts: five thick shards fly out to the sides
// and fall away, the cork tumbles off. The liquid is the hero: it drops as one mass, hits the
// floor of the cell in a dome, splashes out into a wide puddle with a few big drops thrown up out
// of it, and drains away to nothing. Everything has left or drained by the last frame, which is
// empty. ramp: the liquid's colours, dark to light.
const bottleGone = (
	art: PixelCanvas,
	liquid: Liquid,
	ramp: Ramp,
	cork: readonly Point[],
	{ seed }: { seed: number },
) => {
	const size = goneSize(SIZE);
	const margin = (size - SIZE) / 2;
	const middle: Point = [Math.round(liquid.middle[0]), Math.round(liquid.middle[1])];
	const top = Math.min(...liquid.pixels.map(([, y]) => y));
	const width = liquid.right - liquid.left + 1;
	const height = liquid.bottom - top + 1;
	const [dark, mid, light] = [ramp[1], ramp[Math.floor(ramp.length / 2)], ramp.at(-2)!];
	const hit = along(ramp, 1);

	// the cracks: a few bold lines from the middle, the liquid lit up behind them
	const strike = struck(middle, 18, { spokes: 5, seed });
	const cracked = (amount: number) => {
		const canvas = lit(art.clone(), liquid, ramp, 1);
		for (const path of strike.paths) {
			crack(canvas, path, amount);
			crack(
				canvas,
				path.map(([x, y]): Point => [x + 1, y]),
				amount,
			);
		}

		return padded(canvas, margin);
	};

	// the mass: the liquid and whatever the glass held inside its rows (a label), as one body
	const mass = new PixelCanvas(SIZE, SIZE);
	for (let y = top; y <= liquid.bottom; y++) {
		const row = liquid.pixels.filter(([, py]) => py === y).map(([x]) => x);
		if (!row.length) continue;
		for (let x = Math.min(...row); x <= Math.max(...row); x++)
			mass.set(x, y, liquid.has(x, y) ? hit(art.get(x, y)) : mid);
	}

	const floor = liquid.bottom + margin + 2;
	const cx = middle[0] + margin;
	// the splash after the burst: half width and height of the dome on the floor, per frame
	const splash: (readonly [number, number])[] = [
		[0.6 * width, 0.6 * height],
		[0.75 * width, 0.42 * height],
		[0.88 * width, 0.28 * height],
		[0.95 * width, 7],
		[0.92 * width, 6],
		[0.8 * width, 5],
		[0.6 * width, 4],
		[0.36 * width, 3],
	];
	const dome = (canvas: PixelCanvas, half: number, rise: number) => {
		for (let x = Math.round(-half); x <= Math.round(half); x++) {
			const tall = Math.round(rise * Math.sqrt(Math.max(0, 1 - (x / (half + 0.5)) ** 2)));
			for (let row = 0; row < Math.max(1, tall); row++)
				canvas.set(
					cx + x,
					floor - row,
					row === Math.max(1, tall) - 1 ? light : row === 0 && tall > 2 ? dark : mid,
				);
		}

		return canvas;
	};
	// drops thrown up out of the dome as it hits: big clumps that arc and fall back into the puddle
	const drops = [-1, 1, -1, 1].map((side, index) => ({
		x: side * (3 + index * 2),
		up: 4.4 - 0.4 * index + hash(index, 4, seed),
		out: side * (1.4 + 0.5 * index),
		w: index < 2 ? 5 : 4,
		h: index < 2 ? 4 : 3,
	}));
	// the shards leave from round the glass, out to the sides, and fall out of the cell
	const shards = SHARDS.map((shape, index) => {
		const angle = -Math.PI + (index * Math.PI) / 4 + (hash(index, 5, seed) - 0.5) * 0.4;
		const side = Math.cos(angle) < 0 ? -1 : 1;

		return {
			shape,
			from: [
				cx + Math.cos(angle) * width * 0.45,
				middle[1] + margin + Math.sin(angle) * height * 0.45,
			] as Point,
			vx: side * (3.6 + 1.8 * hash(index, 6, seed)),
			vy: -1.2 - 1.6 * hash(index, 7, seed),
			spin: (hash(index, 8, seed) - 0.5) * 1.4,
		};
	});
	const corkSide = hash(1, 9, seed) < 0.5 ? -1 : 1;
	const GRAVITY = 3;

	const burst = Array.from({ length: GONE_FRAMES - 2 }, (_, index) => {
		// time since the burst, in frames
		const t = index;
		const out = new PixelCanvas(size, size);
		if (t === 0) out.blit(mass, margin, margin + 1);
		else if (splash[t - 1]) dome(out, ...splash[t - 1]);
		if (t >= 1)
			for (const { x, up, out: drift, w, h } of drops) {
				const age = t - 1;
				const y = floor - splash[0][1] * 0.85 - up * age + 1.5 * age * age;
				// back in the puddle: gone into it
				if (age > 0 && y >= floor - 1) continue;
				clump(out, cx + x + drift * age - w / 2, y, w, h, mid, light);
			}
		for (const { shape, from, vx, vy, spin } of shards)
			shard(out, shape, [from[0] + vx * t, from[1] + vy * t + 0.5 * GRAVITY * t * t], spin * t);
		const turned = quarterTurned(art, cork, corkSide * Math.floor((t + 1) / 2));
		out.blit(turned, margin + corkSide * 2 * t, margin - 2 * t + 0.5 * GRAVITY * t * t);
		return out;
	});

	return [cracked(0.5), cracked(1), ...burst.slice(0, -1), new PixelCanvas(size, size)];
};

// ---------------------------------------------------------------------------------------------
// Drips: a two-pixel run creeps down from where a melt or wax meets what is under it, and its
// end lets go as a drop that slides on down over the art.

const drip = (
	canvas: PixelCanvas,
	[x, y]: Point,
	length: number,
	[light, dark]: readonly [number, number],
	on: (x: number, y: number) => boolean,
) => {
	for (let row = 0; row < length; row++) {
		const tip = row === length - 1 && length > 1;
		if (on(x, y + row)) canvas.set(x, y + row, light);
		if (!tip && on(x + 1, y + row)) canvas.set(x + 1, y + row, dark);
	}

	return canvas;
};

const drop = (
	canvas: PixelCanvas,
	[x, y]: Point,
	[light, dark]: readonly [number, number],
	on: (x: number, y: number) => boolean,
) => clump(canvas, x, y, 2, 3, dark, light, on);

// a drip's whole life in frames: it creeps to its length and hangs there swelling, its drop lets
// go and slides down, the stub draws back in. Long enough to read on a phone.
const DRIP = [
	{ length: 1 },
	{ length: 2 },
	{ length: 4 },
	{ length: 5 },
	{ length: 7 },
	{ length: 8 },
	{ length: 9 },
	{ length: 9 },
	{ length: 9 },
	{ length: 5, drop: 9 },
	{ length: 3, drop: 13 },
	{ length: 2, drop: 17 },
	{ length: 1, drop: 21 },
	{ length: 0 },
];

const dripFrame = (
	canvas: PixelCanvas,
	at: Point,
	frame: number,
	tones: readonly [number, number],
	on: (x: number, y: number) => boolean,
) => {
	const step = DRIP[frame];
	if (!step) return canvas;
	drip(canvas, at, step.length, tones, on);
	if (step.drop !== undefined) drop(canvas, [at[0], at[1] + step.drop], tones, on);

	return canvas;
};

// ---------------------------------------------------------------------------------------------

const SIZE = 64;
const HURT_FRAMES = 12;
const GONE_FRAMES = 12;

// H1: the king's skull, the gold of his crown melted onto it. Its eye sockets hold embers and its
// jaw is a solid piece that clacks.
const skull = (): Runs => {
	const art = SYMBOL_DRAWINGS.symbolH1();
	const gold = colours(0xedab50, 0xbf6f4a, 0x8a4836, 0xe69c69, 0xffc825, 0x5d2c28);
	const bone = colours(0xf9e6cf, 0xf6ca9f, 0xb4b4b4);
	const sockets = [
		{ box: [10, 26, 17, 36], reach: 2.5 },
		{ box: [23, 27, 41, 38], reach: 3.5 },
	].map(({ box, reach }) => {
		const pixels = pick(
			art,
			(x, y, at) => at === SHADOW && inBox(box as [number, number, number, number])(x, y),
		);

		return { pixels, middle: middleOf(pixels), reach };
	});
	// heat in the sockets: hottest at the middle of each, flickering in clumps
	const eyes = (canvas: PixelCanvas, level: number, seed: number) => {
		if (level <= 0) return canvas;
		for (const { pixels, middle, reach } of sockets)
			burn(canvas, pixels, (x, y) => {
				const far = Math.hypot(x - middle[0], y - middle[1]);

				return level * (1 - far / (reach + 1.2)) + 0.12 * (blotch(x, y, seed) - 0.5);
			});

		return canvas;
	};
	// the jaw: everything under the mouth's middle row, left of the back of the skull
	const jaw = pick(art, (x, y) => x <= 44 && y >= 53);
	// what shows where the jaw has dropped away: the dark of the open mouth only across the mouth
	// (the dark gap between the teeth runs from the skull's left edge to x 32); behind it the bone
	// of the jaw's hinge carries on, and outside the head nothing, so no black bar cuts the cheek
	// or sticks out past the skull
	const MOUTH_END = 32;
	const gap = (x: number) => {
		const above = art.get(x, 52);
		if (above === CLEAR) return CLEAR;

		return x <= MOUTH_END ? SHADOW : above;
	};
	const clacked = (canvas: PixelCanvas, open: number) => moved(canvas, jaw, 0, open, gap);
	// where the melted crown meets bare bone below it: the drips start there
	const lips = pick(
		art,
		(x, y, at) =>
			gold.has(at) &&
			[1, 2, 3, 4, 5].every(
				(down) => bone.has(art.get(x, y + down)) && bone.has(art.get(x + 1, y + down)),
			),
	).map(([x, y]): Point => [x, y + 1]);
	const drips = [
		lips.find(([x]) => x === 25) ?? lips[0],
		lips.find(([x]) => x <= 21) ?? lips.at(-1)!,
	];
	// the darker golds: the pale ones vanish against the bone at phone size
	const molten = [c(0xbf6f4a), c(0x8a4836)] as const;
	const onSkull = (x: number, y: number) => bone.has(art.get(x, y));

	// the embers in the sockets swell to a full burn, hold it, and sink
	const glowRest = [0.35, 0.6, 0.85, 1, 1, 1, 1, 1, 0.85, 0.6, 0.35].map((level, frame) =>
		eyes(art.clone(), level, frame + 1),
	);
	const dripRest = DRIP.map((_, frame) => dripFrame(art.clone(), drips[0], frame, molten, onSkull));

	// win: it ducks a pixel with its sockets dark, then the sockets burst into flame that climbs
	// over its brow while the jaw drops wide and clacks, a laugh; the fire burns down to embers
	// and gold runs from the crown
	const feet = sockets.map(({ middle, reach }) => ({
		x: middle[0],
		y: middle[1] + 1,
		width: reach * 3.2,
		height: 15,
	}));
	const opens = [0, 0, 4, 1, 4, 1, 3, 0, 2, 0, 0, 0];
	const levels = [0, 0.3, 1, 1, 1, 1, 0.95, 0.9, 0.85, 0.8, 0.75, 0.7];
	const fire = [0, 0, 0.85, 1, 1, 0.95, 0.85, 0.7, 0.55, 0.4, 0.25, 0];
	const duck = [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	const hurt = opens.map((open, frame) => {
		const canvas = eyes(art.clone(), levels[frame], 20 + frame);
		dripFrame(canvas, drips[0], frame - 1, molten, onSkull);
		dripFrame(canvas, drips[1], frame - 3, molten, onSkull);
		const laughing = flames(clacked(canvas, open), feet, fire[frame], frame, 5);

		return duck[frame] ? shifted(laughing, 0, duck[frame]) : laughing;
	});

	// gone: a crack splits the skull, the crown melts down over it, and it drops away in halves
	const last = hurt.at(-1)!;
	const split: Point[] = [
		[36, 15],
		[30, 26],
		[24, 40],
		[22, 50],
		[24, 62],
	];
	// the crown: its gold, the light catching its top (the same tone as the bone's) and the dark
	// outline round it, two pixels thick, where that outline is the crown's own and not the skull's
	const crown = (canvas: PixelCanvas) => {
		const metal = pick(canvas, (_, y, at) => gold.has(at) || (y < 16 && at === c(0xf6ca9f)));
		const nearBone = (x: number, y: number) =>
			[-1, 0, 1].some((dy) => [-1, 0, 1].some((dx) => bone.has(canvas.get(x + dx, y + dy))));
		const outline = (pixels: Point[]) =>
			around(canvas, pixels, (x, y, at) => DARKS.has(at) && (y < 16 || !nearBone(x, y)));
		const inner = outline(metal);

		return [...metal, ...inner, ...outline([...metal, ...inner])];
	};
	const melt = (canvas: PixelCanvas, depth: number) => {
		const parts = crown(canvas);
		const out = canvas.clone();
		// uncovered: nothing on the crown's top, bare skull where it ran down the back
		for (const [x, y] of parts) out.set(x, y, y < 16 ? CLEAR : c(0xb4b4b4));
		for (const [x, y] of parts) {
			const down = depth + Math.floor(hash(x, 0, 9) * Math.min(depth, 3));
			out.set(x, y + down, canvas.get(x, y));
		}

		return despeckled(rimmed(out));
	};
	const cracked = [0.4, 0.8, 1].map((amount) => crack(last.clone(), split, amount));
	const melting = [1, 2, 4, 6].map((depth) => melt(cracked[2], depth));
	const margin = (goneSize(SIZE) - SIZE) / 2;
	const owner = sideOf(split[1], split[3]);
	const falling = breakApart(
		melting.at(-1)!,
		owner,
		[
			{ x: -6, y: -2, fall: 30, wear: 0.5 },
			{ x: 5, y: -1, fall: 34, start: 0.05, wear: 0.5 },
		],
		{ frames: GONE_FRAMES - 7 },
	);

	return {
		symbolH1RestGlow: glowRest,
		symbolH1RestDrip: dripRest,
		// it lands a pixel low with its jaw knocked open three, the jaw shutting as it settles
		symbolH1Land: [shifted(clacked(art, 3), 0, 1), clacked(art, 2), clacked(art, 1)],
		symbolH1Hurt: hurt,
		symbolH1Gone: [...cracked, ...melting].map((canvas) => padded(canvas, margin)).concat(falling),
	};
};

// H2: the knight's dome helm, three claw gashes in it still glowing.
const helm = (): Runs => {
	const art = SYMBOL_DRAWINGS.symbolH2();
	// the gashes: the burnt browns and the ember orange, right of the brass trim and below the
	// crest that runs over the dome
	const base = new Map([
		[c(0x5d2c28), 0.2],
		[c(0x8a4836), 0.34],
		[c(0xe07438), 0.6],
	]);
	const gashes = pick(art, (x, y, at) => base.has(at) && x >= 17 && !(x <= 28 && y <= 27));
	const bands: Bands = [
		[0.92, c(0xffeb57)],
		[0.78, c(0xffa214)],
		[0.58, c(0xe07438)],
		[0.44, c(0xc64524)],
		[0.3, c(0x8a4836)],
		[0, c(0x5d2c28)],
	];
	const heated = (canvas: PixelCanvas, extra: number, seed: number, flicker = 0.14) =>
		burn(
			canvas,
			gashes,
			(x, y) => (base.get(art.get(x, y)) ?? 0) + extra + flicker * (blotch(x, y, seed) - 0.5),
			bands,
		);
	// the eye slit: the long dark band across the visor
	const slit = pick(art, (x, y, at) => at === SHADOW && y >= 30 && y <= 35 && x >= 9 && x <= 40);
	const [slitX] = middleOf(slit);

	// rest: the heat in the gashes breathes, a slow swell to a glow held a moment, and a fall
	const breath = [0, 0.1, 0.2, 0.3, 0.38, 0.42, 0.42, 0.42, 0.36, 0.26, 0.14, 0];
	const rest = breath.map((extra, frame) => heated(art.clone(), extra, frame + 3));

	// The eyes in the dark of the slit: two points, one in each half, where a fire behind the visor
	// shows through when it wins.
	const eyePoints = [slit.filter(([x]) => x < slitX), slit.filter(([x]) => x >= slitX)].map(
		middleOf,
	);
	const eyesLit = (canvas: PixelCanvas, level: number, seed: number) =>
		burn(canvas, slit, (x, y) => {
			const near = Math.min(...eyePoints.map(([ex, ey]) => Math.hypot(x - ex, (y - ey) * 1.6)));

			return level * (1.05 - near / 7) + 0.18 * (blotch(x, y, seed) - 0.5);
		});

	// win: the helm sinks a pixel with its gashes gone cold and dark, then jolts up as they flare
	// white-hot and eyes of fire light in the slit, and it all cools back down to embers. (Smoke
	// was tried here: grey over a grey helm does not read on a phone.)
	const flare = [-0.2, -0.12, 0.62, 0.6, 0.52, 0.46, 0.4, 0.35, 0.3, 0.26, 0.22, 0.2];
	const glare = [0, 0, 1, 1, 0.92, 0.82, 0.72, 0.62, 0.5, 0.38, 0.24, 0];
	const jolt = [1, 1, -1, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	const hurt = flare.map((extra, frame) => {
		const canvas = eyesLit(heated(art.clone(), extra, 40 + frame), glare[frame], frame);

		return jolt[frame] ? shifted(canvas, 0, jolt[frame]) : canvas;
	});

	// gone: the gashes blaze, the helm splits along the middle one and the halves fall apart
	const last = heated(art.clone(), 0.2, 99, 0);
	const blazing = [0.5, 0.7].map((extra, frame) => heated(art.clone(), extra, 70 + frame, 0.1));
	const owner = sideOf([44, 22], [26, 60]);
	const margin = (goneSize(SIZE) - SIZE) / 2;
	const halves = breakApart(
		heated(art.clone(), 0.5, 72, 0.1),
		owner,
		[
			{ x: -9, y: -3, fall: 28 },
			{ x: 9, y: -2, fall: 30, start: 0.04 },
		],
		{ frames: GONE_FRAMES - 2 },
	);

	return {
		symbolH2Rest: rest,
		// a heavy clank: two pixels down and back, the gashes jolted hot
		symbolH2Land: [
			shifted(heated(art.clone(), 0.3, 1), 0, 2),
			shifted(heated(art.clone(), 0.2, 2), 0, 1),
			heated(art.clone(), 0.1, 3),
		],
		symbolH2Hurt: [...hurt.slice(0, -1), last],
		symbolH2Gone: [...blazing.map((canvas) => padded(canvas, margin)), ...halves],
	};
};

// H3: the wizard's hat, burnt through in two holes whose edges still smoulder.
const hat = (): Runs => {
	const art = SYMBOL_DRAWINGS.symbolH3();
	const dark = colours(0x131313, 0x0e071b, 0x272727, 0x3d3d3d, 0x2a2f4e, 0x1a1932);
	const holes = [
		[18, 26, 29, 38],
		[28, 33, 40, 44],
	].flatMap((box) =>
		pick(art, (x, y, at) => dark.has(at) && inBox(box as [number, number, number, number])(x, y)),
	);
	const cloth = (_: number, __: number, at: number) => !dark.has(at);
	const rings: Point[][] = [];
	let reached = holes;
	for (let ring = 0; ring < 3; ring++) {
		const next = around(art, reached, cloth).filter(
			([x, y]) => !rings.some((done) => done.some(([dx, dy]) => dx === x && dy === y)),
		);
		rings.push(next);
		reached = [...reached, ...next];
	}
	const smoulder = (canvas: PixelCanvas, pixels: readonly Point[], level: number, seed: number) =>
		burn(canvas, pixels, (x, y) => level + 0.3 * (blotch(x, y, seed) - 0.5));
	const tipPart = pick(art, (x, y) => x >= 45 && y >= 12 && y <= 26);

	// rest: the holes' edges smoulder in patches; another time a thin curl of smoke rises from
	// the lower hole
	// the edges catch: two rings round the holes glow up to orange, hold, and die back
	const glowing = [0.3, 0.45, 0.6, 0.72, 0.8, 0.8, 0.8, 0.8, 0.7, 0.55, 0.4, 0.28].map(
		(level, frame) =>
			smoulder(
				smoulder(art.clone(), rings[1], level - 0.25, frame + 50),
				rings[0],
				level,
				frame + 5,
			),
	);
	const pad = 8;
	const [holeX, holeY] = middleOf(holes.filter(([, y]) => y >= 33));
	const curl = [0, 0, 1, 1, 1, 0, -1, -1, -1, 0, 1, 1];
	// dark smoke: it rises over the bright purple of the hat, where a dark clump reads and a pale
	// grey one does not
	const smoke = [c(0x272727), c(0x3d3d3d)];
	const smoking = Array.from({ length: 14 }, (_, frame) => {
		const canvas = padded(smoulder(art.clone(), rings[0], 0.4, frame + 30), pad);
		// three clumps one behind another, stepping sideways by whole pixels as they climb, worn
		// smaller near the top and gone before the last frame
		for (let index = 0; index < 3; index++) {
			const rise = frame * 2 - index * 4;
			if (rise < 0 || rise > 18) continue;
			const [w, h] = rise > 11 ? [4, 2] : [5, 3];
			clump(
				canvas,
				holeX + pad - 1 + curl[Math.floor(rise / 2) % curl.length],
				holeY + pad - 6 - rise,
				w,
				h,
				smoke[0],
				smoke[1],
			);
		}

		return canvas;
	});

	// win: the holes go dark a beat, then flames burst out of them and climb over the hat while
	// the burn eats a ring outward, a glowing front ahead of it, the burnt ring left dark; the
	// flames die down to the glowing edge
	const char = SHADOW;
	// the front is ragged: the next ring, and the one past it where the cloth is thinnest
	const ragged = [...rings[1], ...rings[2].filter(([x, y]) => blotch(x, y, 7) > 0.55)];
	const feet = [
		[18, 26, 29, 38],
		[28, 33, 40, 44],
	].map(([left, top, right, bottom]) => ({
		x: (left + right) / 2,
		y: (top + bottom) / 2 + 2,
		width: right - left,
		height: 16,
	}));
	const fire = [0, 0, 0.9, 1, 1, 0.95, 0.85, 0.7, 0.55, 0.4, 0.22, 0];
	const hurt = Array.from({ length: HURT_FRAMES }, (_, frame) => {
		const canvas = art.clone();
		if (frame < 2) return canvas;
		if (frame < 4) smoulder(canvas, rings[0], 0.8, 60 + frame);
		else {
			for (const [x, y] of rings[0]) canvas.set(x, y, char);
			const cooling = 0.95 - (frame - 4) * 0.06;
			burn(
				canvas,
				ragged,
				(x, y) =>
					cooling -
					(rings[1].some(([rx, ry]) => rx === x && ry === y) ? 0 : 0.22) +
					0.3 * (blotch(x, y, 60 + frame) - 0.5),
			);
		}

		return flames(canvas, feet, fire[frame], frame, 9);
	});

	// gone: it burns to ash from the holes outward
	const last = hurt.at(-1)!;
	const distance = new Map<number, number>();
	let front = holes;
	for (let step = 0; front.length; step++) {
		for (const [x, y] of front) distance.set(key(x, y), step);
		front = around(last, front).filter(([x, y]) => !distance.has(key(x, y)));
	}
	const farthest = Math.max(...distance.values());
	const margin = (goneSize(SIZE) - SIZE) / 2;
	const ash = c(0x5d5d5d);
	// behind the burning front: fire, then char, then ash, then nothing, each a band a few pixels
	// deep; the front's edge is uneven in clumps
	// the burn has passed everything by the second to last frame and the last is empty; bits
	// too small to read as burning cloth are swept away as it goes
	const gone = Array.from({ length: GONE_FRAMES }, (_, frame) => {
		const reach = ((frame + 1) / (GONE_FRAMES - 1)) * (farthest + 11) - 2;
		const canvas = last.clone();
		for (const [x, y] of pick(last, () => true)) {
			const far = (distance.get(key(x, y)) ?? 0) + 3 * (blotch(x, y, 3) - 0.5);
			const behind = reach - far;
			if (behind > 7) canvas.set(x, y, CLEAR);
			else if (behind > 5) canvas.set(x, y, ash);
			else if (behind > 3) canvas.set(x, y, char);
			else if (behind >= 0)
				burn(canvas, [[x, y]], () => 0.42 + behind * 0.17 + 0.2 * (blotch(x, y, frame) - 0.5));
		}
		// near the end only real pieces of the brim may still be burning: nothing small lingers
		return padded(cleaned(despeckled(canvas), frame >= 7 ? 30 : 12), margin);
	});

	return {
		symbolH3RestSmoulder: glowing,
		symbolH3RestSmoke: smoking,
		// the hat drops two pixels onto its brim and its bent tip flops on after it, a pixel
		// later and a pixel further, then settles
		symbolH3Land: [
			[2, 0],
			[1, 2],
			[0, 1],
		].map(([drop, flop]) =>
			moved(
				shifted(art, 0, drop),
				tipPart.map(([x, y]): Point => [x, y + drop]),
				0,
				flop,
				() => SHADOW,
			),
		),
		symbolH3Hurt: hurt,
		symbolH3Gone: gone,
	};
};

// H4: the double axe, a dragon's bite out of one blade, still hot.
const axe = (): Runs => {
	const art = SYMBOL_DRAWINGS.symbolH4();
	const base = new Map([
		[c(0x8e251d), 0.32],
		[c(0xbf6f4a), 0.42],
	]);
	const bite = pick(art, (x, y, at) => base.has(at) && x >= 44 && y >= 10 && y <= 42);
	const heated = (canvas: PixelCanvas, extra: number, seed: number) =>
		burn(
			canvas,
			bite,
			(x, y) => (base.get(art.get(x, y)) ?? 0) + extra + 0.1 * (blotch(x, y, seed) - 0.5),
		);
	// the new crack: from the bite in through the blade
	const fault: Point[] = [
		[48, 30],
		[45, 36],
		[46, 41],
		[42, 48],
	];

	// the steel round the bite, ring by ring outward (up to seven): how far heat has to travel
	const steel = (_: number, __: number, at: number) => !DARKS.has(at) && !base.has(at);
	const reached = new Map<number, number>();
	let front: Point[] = bite;
	for (let ring = 1; ring <= 7; ring++) {
		front = around(art, front, (x, y, at) => x >= 38 && steel(x, y, at) && !reached.has(key(x, y)));
		for (const [x, y] of front) reached.set(key(x, y), ring);
	}
	const hotSteel = [...reached.keys()].map((k): Point => [k % 256, Math.floor(k / 256)]);
	// heat spread into the blade from the bite: the steel glows red to orange near it
	const glowing = (canvas: PixelCanvas, level: number, seed: number) =>
		level > 0
			? burn(
					canvas,
					hotSteel,
					(x, y) =>
						level * (1 - (reached.get(key(x, y)) ?? 9) / 8.5) + 0.16 * (blotch(x, y, seed) - 0.5),
				)
			: canvas;

	// rest: the bite's heat swells, holds and fades, reaching a ring or two into the steel
	const rest = [0, 0.12, 0.24, 0.36, 0.45, 0.48, 0.48, 0.48, 0.42, 0.3, 0.16, 0].map(
		(extra, frame) => glowing(heated(art.clone(), extra, frame + 2), extra * 1.1, frame + 2),
	);
	// win: the axe rises a pixel with its bite cold, comes down hard (a pixel low), the bite
	// blazes, heat floods into the blade and a crack runs hot through it; the steel cools from the
	// outside in and the crack goes dark behind its head
	const lift = [-1, -1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	const bites = [-0.15, -0.15, 0.7, 0.66, 0.58, 0.5, 0.42, 0.36, 0.3, 0.26, 0.22, 0.2];
	const spread = [0, 0, 1, 1, 0.92, 0.82, 0.7, 0.58, 0.46, 0.34, 0.2, 0];
	const hurt = Array.from({ length: HURT_FRAMES }, (_, frame) => {
		const canvas = glowing(
			heated(art.clone(), bites[frame], 50 + frame),
			spread[frame],
			50 + frame,
		);
		// the crack runs hot and cools to dark behind its head
		const amount = span(frame, 1, 4);
		const head = amount * (fault.length - 1);
		crack(canvas, fault, amount, (x, y) => {
			const along = fault.findIndex(([, fy]) => fy >= y);
			return frame < 8 && Math.abs(along - head) < 1.5
				? c(0xffa214)
				: frame < 10 && along > head - 2
					? c(0xc64524)
					: INK;
		});

		return lift[frame] ? shifted(canvas, 0, lift[frame]) : canvas;
	});

	// gone: the blades snap off the haft: the cracked one first, then the other; the haft drops
	const last = hurt.at(-1)!;
	const owner = (x: number, y: number) => (x < 22 && y < 52 ? 0 : x > 37 ? 2 : 1);
	const snap = (amount: number) =>
		crack(
			crack(
				last.clone(),
				[
					[38, 8],
					[37, 30],
					[38, 52],
				],
				amount,
				c(0xff5000),
			),
			[
				[21, 10],
				[22, 30],
				[21, 50],
			],
			amount * 0.7,
		);
	const margin = (goneSize(SIZE) - SIZE) / 2;
	const falling = breakApart(
		snap(1),
		owner,
		[
			{ x: -8, y: -2, fall: 30, start: 0.12 },
			{ x: 0, y: 2, fall: 34, start: 0.2 },
			{ x: 9, y: -4, fall: 30 },
		],
		{ frames: GONE_FRAMES - 2 },
	);

	return {
		symbolH4Rest: rest,
		// a heavy thud: two pixels down, back by one, home; the bite flares with the blow
		symbolH4Land: [
			shifted(heated(art.clone(), 0.25, 1), 0, 2),
			shifted(heated(art.clone(), 0.2, 2), 0, 2),
			shifted(heated(art.clone(), 0.1, 3), 0, 1),
		],
		symbolH4Hurt: hurt,
		symbolH4Gone: [snap(0.5), snap(1)].map((canvas) => padded(canvas, margin)).concat(falling),
	};
};

// The potions. Their liquids are found by colour; the glass never moves, corks lift
// off as solid pieces.
const glassColours = colours(
	0xf6ca9f,
	0xb4b4b4,
	0xf9e6cf,
	0x858585,
	0xc7cfdd,
	0x5d5d5d,
	0xffffff,
	0x272727,
	0x3d3d3d,
);

// A potion's win plays over the art on a canvas this much bigger all round, so corks, steam,
// light and spray can rise past the top of the cell.
const POTION_PAD = 16;

// the art on the padded canvas, its cork lifted `up` pixels
const corkedOff = (art: PixelCanvas, cork: readonly Point[], up: number) =>
	uncorked(
		padded(art, POTION_PAD),
		cork.map(([x, y]): Point => [x + POTION_PAD, y + POTION_PAD]),
		up,
	);

// where the liquid leaves the bottle: the middle of the cork's foot, on the padded canvas
const mouthOf = (cork: readonly Point[]): Point => [
	Math.round(middleOf(cork)[0]) + POTION_PAD,
	Math.max(...cork.map(([, y]) => y)) + POTION_PAD,
];

// L1: the round red flask, a potion of life. At rest it beats like a heart, or big bubbles rise;
// when it wins it boils, its cork shoots up on a burst of red steam and drops back.
const redFlask = (): Runs => {
	const art = SYMBOL_DRAWINGS.symbolL1();
	const ramp = [0x571c27, 0x891e2b, 0xc42430, 0xea323c, 0xf5555d, 0xf68187].map(c);
	const red = new Set(ramp);
	const liquid = liquidOf(art, red, glassColours);
	const cork = pick(art, inBox([31, 5, 50, 12]));
	const [mx, my] = liquid.middle;
	const reach = (liquid.right - liquid.left) / 2;
	const core = (x: number, y: number) => Math.hypot(x - mx, y - my) < reach * 0.62;

	// a heartbeat: two beats, lub-dub, the middle of the liquid two steps bright on each, held
	// apart by a rest so the rhythm reads
	const beats = [1, 2, 2, 1, 0, 1, 2, 2, 1, 0, 0];
	const beat = beats.map((steps) =>
		lit(lit(art.clone(), liquid, ramp, steps ? 1 : 0), liquid, ramp, steps - 1, core),
	);
	const rising = risingBubbles(art, liquid, ramp, {
		starts: [
			[22, 0],
			[30, 4],
			[17, 8],
		],
		frames: 20,
		speed: 2,
		tones: { ring: 3, core: 1 },
	});

	// win: it gathers (the liquid darkens and sinks, the cork rattles), the cork shoots up on a
	// burst of steam while the liquid boils bright, and drops back home
	const corkUp = [0, 1, 2, 9, 13, 14, 13, 10, 5, 0, 0, 0];
	const glow = [-1, -1, 0, 2, 2, 2, 2, 1, 1, 1, 1, 1];
	const steam = [c(0xf5555d), c(0xf68187)];
	const [neckX, neckY] = mouthOf(cork);
	const hurt = corkUp.map((up, frame) => {
		const boiling = frame >= 2 && frame <= 9;
		const lift = (x: number) =>
			frame < 2 ? 1 : boiling ? Math.round((blotch(x, 0, frame + 9) - 0.5) * 3) : 0;
		const body = lifted(art, liquid, lift);
		lit(body, liquidOf(body, red, glassColours), ramp, glow[frame]);
		if (boiling)
			for (let index = 0; index < 5; index++) {
				const x = liquid.left + 4 + hash(index, 0, 17) * (liquid.right - liquid.left - 10);
				const y = liquid.bottom - 4 - ((frame * 3 + index * 7) % 22);
				if (y > surfaceAt(liquid, x) + 1)
					bubble(body, art, liquid, ramp, [x, y], { ring: 3, core: 1 });
			}
		const canvas = corkedOff(body, cork, up);
		// the steam: clouds that burst from the open neck and climb, wearing down
		for (let index = 0; index < 4; index++) {
			const age = span(frame, 3 + index * 0.6, 8.5 + index * 0.4);
			const [w, h] =
				age <= 0 || age >= 1 ? [0, 0] : age < 0.4 ? [7, 5] : age < 0.75 ? [6, 4] : [4, 3];
			if (!w) continue;
			const side = index % 2 ? 1 : -1;
			clump(
				canvas,
				neckX + side * (2 + 6 * age) - w / 2,
				neckY - 4 - 16 * age,
				w,
				h,
				steam[0],
				steam[1],
			);
		}

		return canvas;
	});
	const last = lit(art.clone(), liquid, ramp, 1);

	return {
		symbolL1RestBeat: beat,
		symbolL1RestBubble: rising,
		symbolL1Land: plop(art, liquid),
		symbolL1Hurt: [...hurt.slice(0, -1), padded(last, POTION_PAD)],
		symbolL1Gone: bottleGone(last, liquidOf(last, red, glassColours), ramp, cork, { seed: 11 }),
	};
};

// L2: the tall blue bottle. At rest light fills it from the bottom and sinks away, or bubbles
// rise; when it wins its cork pops and a column of light shoots out of the neck.
const blueBottle = (): Runs => {
	const art = SYMBOL_DRAWINGS.symbolL2();
	const ramp = [0x03193f, 0x00396d, 0x0069aa, 0x0098dc, 0x00cdf9, 0x0cf1ff, 0x94fdff].map(c);
	const blue = new Set(ramp);
	const liquid = liquidOf(art, blue, glassColours);
	const cork = pick(art, inBox([27, 5, 38, 12]));
	const rising = risingBubbles(art, liquid, ramp, {
		starts: [
			[30, 0],
			[25, 3],
			[29, 7],
		],
		frames: 18,
		speed: 2,
		tones: { ring: 3, core: 1 },
	});

	// win: the light gathers low (the liquid dims, a band climbs), the cork pops and a column of
	// light stands out of the neck, its top cooling down the blues as it lets go and rises away
	const [neckX, neckY] = mouthOf(cork);
	const corkUp = [0, 0, 1, 5, 8, 9, 8, 6, 3, 0, 0, 0];
	const glow = [-1, -1, 0, 2, 2, 2, 1, 1, 1, 1, 1, 1];
	// the column's foot and head, in pixels above the neck
	const beam: [number, number][] = [
		[0, 0],
		[0, 0],
		[0, 0],
		[0, 10],
		[0, 18],
		[0, 22],
		[4, 24],
		[10, 26],
		[18, 28],
		[25, 28],
		[0, 0],
		[0, 0],
	];
	const core = ramp.at(-1)!;
	const hurt = corkUp.map((up, frame) => {
		const body = lit(art.clone(), liquid, ramp, glow[frame]);
		if (frame === 1 || frame === 2)
			lit(body, liquid, ramp, 2, (_, y) => Math.abs(y - (liquid.bottom - 8 * frame)) < 3);
		const canvas = corkedOff(body, cork, up);
		const [foot, head] = beam[frame];
		for (let rise = foot; rise < head; rise++) {
			const y = neckY - 2 - rise;
			// the head of the column a step cooler, its edges two
			const fromHead = head - rise;
			const tone = fromHead <= 2 ? ramp[4] : core;
			for (let dx = -2; dx <= 2; dx++)
				canvas.set(
					neckX + dx,
					y,
					Math.abs(dx) === 2 ? ramp[4] : Math.abs(dx) === 1 ? ramp[5] : tone,
				);
		}

		return canvas;
	});
	const last = lit(art.clone(), liquid, ramp, 1);

	return {
		symbolL2RestLight: lightRise(art, liquid, ramp),
		symbolL2RestBubble: rising,
		symbolL2Land: plop(art, liquid),
		symbolL2Hurt: [...hurt.slice(0, -1), padded(last, POTION_PAD)],
		symbolL2Gone: bottleGone(last, liquidOf(last, blue, glassColours), ramp, cork, { seed: 23 }),
	};
};

// L3: the square green poison bottle under a wax-sealed cap. At rest poison seeps out under the
// cap and runs down the glass, or bubbles rise; when it wins the cap lifts and green fumes boil
// out of the neck.
const poisonBottle = (): Runs => {
	const art = SYMBOL_DRAWINGS.symbolL3();
	const ramp = [0x134c4c, 0x1e6f50, 0x33984b, 0x5ac54f, 0x99e65f, 0xd3fc7e].map(c);
	const green = new Set(ramp);
	// no label: the whole green body is liquid, like the other potions
	const liquid = liquidOf(art, green, glassColours);
	const cap = pick(art, inBox([20, 5, 43, 13]));

	// the seep: a bright green run creeps down the glass from under the cap and lets a drop go
	const onBottle = (x: number, y: number) => art.get(x, y) !== CLEAR && art.get(x, y) !== INK;
	// down the pale glass of its left edge, where green stands out: a dark green line on the
	// pale edge and a light one on the glass beside it
	const seepTones = [c(0x33984b), c(0x99e65f)] as const;
	const SEEP: { length: number; drop?: number }[] = [
		...[1, 2, 4, 6, 8, 10, 12, 14, 15, 15].map((length) => ({ length })),
		{ length: 10, drop: 18 },
		{ length: 6, drop: 22 },
		{ length: 3, drop: 26 },
		{ length: 1, drop: 30 },
		{ length: 0 },
	];
	const seeping = SEEP.map(({ length, drop: falling }) => {
		const canvas = art.clone();
		for (let row = 0; row < length; row++)
			for (const [dx, tone] of [
				[0, seepTones[0]],
				[1, seepTones[1]],
			] as const)
				if (onBottle(13 + dx, 25 + row)) canvas.set(13 + dx, 25 + row, tone);
		if (falling !== undefined)
			clump(canvas, 13, 25 + falling, 2, 3, seepTones[0], seepTones[1], onBottle);

		return canvas;
	});
	const rising = risingBubbles(art, liquid, ramp, {
		// in the dark green of its side, where a bubble shows best
		starts: [
			[43, 0],
			[44, 6],
			[43, 11],
		],
		frames: 22,
		speed: 1.6,
		tones: { ring: 3, core: 1 },
	});

	// win: the cap rattles, then lifts and the fumes boil out in big clouds that climb and part;
	// the cap settles back as they thin
	const fume = [c(0x33984b), c(0x5ac54f), c(0x99e65f)];
	const [neckX, neckY] = mouthOf(cap);
	const capUp = [0, 1, 0, 4, 6, 6, 6, 5, 3, 1, 0, 0];
	const glow = [-1, -1, 0, 2, 2, 2, 1, 1, 1, 1, 1, 1];
	const fumeSize = (age: number) =>
		age <= 0 || age >= 1
			? [0, 0]
			: age < 0.3
				? [8, 6]
				: age < 0.6
					? [6, 5]
					: age < 0.85
						? [5, 4]
						: [4, 3];
	const hurt = capUp.map((up, frame) => {
		const canvas = corkedOff(lit(art.clone(), liquid, ramp, glow[frame]), cap, up);
		for (let index = 0; index < 7; index++) {
			const age = span(frame, 3 + index * 0.6, 7.5 + index * 0.35);
			const [w, h] = fumeSize(age);
			if (!w) continue;
			const side = index % 2 ? 1 : -1;
			clump(
				canvas,
				neckX + side * (1 + 9 * age) + ((index % 3) - 1) - w / 2,
				neckY - 10 - 16 * age,
				w,
				h,
				age < 0.5 ? fume[1] : fume[0],
				age < 0.5 ? fume[2] : fume[1],
			);
		}

		return canvas;
	});
	const last = lit(art.clone(), liquid, ramp, 1);

	return {
		symbolL3RestSeep: seeping,
		symbolL3RestBubble: rising,
		symbolL3Land: plop(art, liquid),
		symbolL3Hurt: [...hurt.slice(0, -1), padded(last, POTION_PAD)],
		symbolL3Gone: bottleGone(last, liquidOf(last, green, glassColours), ramp, cap, { seed: 31 }),
	};
};

// L4: the triangular gold flask. At rest light fills it or slow bubbles climb; when it wins its
// cork pops and the gold leaps out of the neck in a fountain whose head breaks into drops that
// rain back down into the flask before the cork drops home.
const goldFlask = (): Runs => {
	const art = SYMBOL_DRAWINGS.symbolL4();
	const ramp = [0x8a4836, 0xe07438, 0xedab50, 0xffc825, 0xffeb57].map(c);
	const gold = new Set(ramp);
	const liquid = liquidOf(art, gold, glassColours, (_, y) => y >= 28);
	const cork = pick(art, inBox([26, 8, 40, 14]));
	// gold has no lighter colours to show a bubble with, so its bubbles are rings of the dark
	const rising = risingBubbles(art, liquid, ramp, {
		starts: [
			[22, 0],
			[34, 4],
			[28, 8],
		],
		frames: 18,
		speed: 1.4,
		tones: { ring: -2, core: 1 },
	});

	const [neckX, neckY] = mouthOf(cork);
	const corkUp = [0, 1, 2, 12, 19, 22, 23, 22, 18, 11, 0, 0];
	const glow = [-1, -1, 0, 2, 2, 2, 2, 1, 1, 1, 1, 1];
	// the level sinks as it gathers, and a little while the gold is out of the flask
	const level = [1, 1, 0, -1, 0, 1, 1, 1, 1, 0, 0, 0];
	// the spout: a column out of the neck, its foot and head in pixels above it
	const spout: [number, number][] = [
		[0, 0],
		[0, 0],
		[0, 0],
		[0, 7],
		[0, 12],
		[3, 14],
		[9, 14],
		[0, 0],
		[0, 0],
		[0, 0],
		[0, 0],
		[0, 0],
	];
	const [, , mid, light, top] = ramp;
	const hurt = corkUp.map((up, frame) => {
		const body = lifted(art, liquid, () => level[frame]);
		lit(
			body,
			liquidOf(body, gold, glassColours, (_, y) => y >= 26),
			ramp,
			glow[frame],
		);
		const canvas = corkedOff(body, cork, up);
		const [foot, head] = spout[frame];
		// six wide, its head a step wider still: a gush, not a rod
		for (let rise = foot; rise < head; rise++) {
			const head2 = rise >= head - 3;
			for (let dx = head2 ? -4 : -3; dx <= (head2 ? 3 : 2); dx++)
				canvas.set(
					neckX + dx,
					neckY - 2 - rise,
					dx <= -3 || rise === foot ? mid : rise === head - 1 ? top : light,
				);
		}
		// the head breaks into drops that fly out a little and rain back into the neck
		for (let index = 0; index < 4; index++) {
			const age = frame - 6 - (index >> 1) * 0.5;
			if (age < 0) continue;
			const side = index % 2 ? 1 : -1;
			const out = (2.4 + (index >> 1)) * age - 0.75 * age * age;
			const y = neckY - 15 - 2 * age + 2.2 * age * age;
			if (y >= neckY - 3 || out < 0) continue;
			clump(canvas, neckX + side * out - 2, y, index < 2 ? 4 : 3, index < 2 ? 3 : 2, mid, top);
		}

		return canvas;
	});
	const last = lit(art.clone(), liquid, ramp, 1);

	return {
		symbolL4RestLight: lightRise(art, liquid, ramp),
		symbolL4RestBubble: rising,
		symbolL4Land: plop(art, liquid),
		symbolL4Hurt: [...hurt.slice(0, -1), padded(last, POTION_PAD)],
		symbolL4Gone: bottleGone(
			last,
			liquidOf(last, gold, glassColours, (_, y) => y >= 26),
			ramp,
			cork,
			{ seed: 41 },
		),
	};
};

// The scatter: the dragon's eye. Its pupil is the dark run between iris pixels on each row; it
// moves, narrows and heats by whole pixels and colour steps. The lettered plate under it is never
// touched, so SCATTER always reads.
const scatter = (): Runs => {
	const eye = dragonEye();
	const opening = eyeOpening(eye);
	const xs = [...opening.keys()];
	const centre = (Math.min(...xs) + Math.max(...xs)) / 2;
	const pupil = new Map<number, [number, number]>();
	const rows = new Set(
		[...opening.values()].flatMap(({ top, bottom }) =>
			Array.from({ length: bottom - top + 1 }, (_, i) => top + i),
		),
	);
	for (const y of rows) {
		let best: [number, number] | undefined;
		for (let x = Math.min(...xs); x <= Math.max(...xs); x++) {
			if (IRIS.has(eye.get(x, y)) || !IRIS.has(eye.get(x - 1, y)) || eye.get(x, y) === CLEAR)
				continue;
			let end = x;
			while (!IRIS.has(eye.get(end + 1, y)) && eye.get(end + 1, y) !== CLEAR && end - x < 6) end++;
			if (!IRIS.has(eye.get(end + 1, y))) continue;
			if (!best || Math.abs((x + end) / 2 - centre) < Math.abs((best[0] + best[1]) / 2 - centre))
				best = [x, end];
		}
		if (best) pupil.set(y, best);
	}
	const iris = [...opening].flatMap(([x, { top, bottom }]) =>
		Array.from({ length: bottom - top + 1 }, (_, i): Point => [x, top + i]).filter(([px, py]) =>
			IRIS.has(eye.get(px, py)),
		),
	);
	const seamColours = colours(0xc42430, 0x8e251d, 0x571c27);
	const plateTop = 44;
	const seams = pick(eye, (x, y, at) => seamColours.has(at) && y < plateTop && !opening.has(x));

	// the pupil moved by `by` pixels and `narrow` pixels thinner on each side; the iris closes
	// over what it leaves
	const looked = (canvas: PixelCanvas, by: number, narrow = 0) => {
		const out = canvas.clone();
		for (const [y, [x0, x1]] of pupil) {
			const leftIris = canvas.get(x0 - 1, y);
			const rightIris = canvas.get(x1 + 1, y);
			for (let x = x0; x <= x1; x++)
				out.set(x, y, x - x0 < (x1 - x0 + 1) / 2 ? leftIris : rightIris);
			const width = x1 - x0 + 1;
			const keep = Math.max(1, width - narrow * 2);
			const from = x0 + Math.floor((width - keep) / 2) + by;
			for (let i = 0; i < keep; i++)
				out.set(from + i, y, canvas.get(x0 + Math.floor((width - keep) / 2) + i, y));
		}

		return out;
	};
	const heated = (canvas: PixelCanvas, irisSteps: number, seamSteps: number) => {
		const out = canvas.clone();
		for (const [x, y] of iris)
			if (IRIS.has(canvas.get(x, y))) out.set(x, y, stepped(canvas.get(x, y), HOTTER, irisSteps));
		for (const [x, y] of seams) out.set(x, y, stepped(canvas.get(x, y), HOTTER, seamSteps));

		return out;
	};

	// a look to one side, held, then the other, held: three pixels each way, enough to read
	const glance = [-1, -2, -3, -3, -3, -3, -3, -2, 0, 1, 2, 3, 3, 3, 3, 2, 0].map((by) =>
		looked(eye, by),
	);
	const wary = [0, 1, 2, 3, 4, 5].map((level) =>
		looked(heated(eye, Math.round(level * 0.4), Math.round(level * 0.7)), 0, 1),
	);
	// it narrows to a squint, then snaps wide with its slit pinched thin and the iris and seams
	// at their hottest, and cools
	const flare = [
		heated(eyeLids(eye, 0.5), 1, 1),
		heated(eyeLids(eye, 0.35), 2, 2),
		...[
			[3, 4, 2],
			[3, 4, 2],
			[3, 4, 2],
			[3, 4, 1],
			[2, 3, 1],
			[2, 3, 1],
			[2, 2, 1],
			[1, 2, 0],
		].map(([irisSteps, seamSteps, narrow]) => looked(heated(eye, irisSteps, seamSteps), 0, narrow)),
	];

	return {
		symbolScatterBlink: [eyeLids(eye, 0.5), eyeLids(eye, 1), eyeLids(eye, 0.5)],
		symbolScatterRestGlance: glance,
		symbolScatterNarrow: [eyeLids(eye, 0.55)],
		// it snaps open from narrowed, its iris a step hot for a moment
		symbolScatterLand: [
			eyeLids(eye, 0.55),
			eyeLids(eye, 0.3),
			heated(eye, 2, 1),
			heated(eye, 1, 0),
		],
		symbolScatterWary: wary,
		symbolScatterFlare: flare,
	};
};

export const SYMBOL_FRAME_RUNS = (): Runs => ({
	...skull(),
	...helm(),
	...hat(),
	...axe(),
	...redFlask(),
	...blueBottle(),
	...poisonBottle(),
	...goldFlask(),
	...scatter(),
});
