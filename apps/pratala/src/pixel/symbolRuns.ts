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

// a smoke or fume clump that wears down as it rises: big, then smaller, then gone
const puffSize = (age: number, large = false) => {
	const sizes = large
		? [
				[5, 4],
				[4, 3],
				[3, 2],
			]
		: [
				[4, 3],
				[3, 2],
				[2, 2],
			];

	return age <= 0 || age >= 1 ? [0, 0] : sizes[age < 0.4 ? 0 : age < 0.75 ? 1 : 2];
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

	return Array.from({ length: frames }, (_, frame) => {
		const t = from + ((frame + 1) / frames) * (1 - from);
		const canvas = new PixelCanvas(size, size);
		edged.forEach((piece, index) => {
			if (!piece) return;
			const { x, y, start = 0, fall = 30, wear = 0.55 } = flights[index] ?? { x: 0, y: 0 };
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

// the surface tipped: its ends tilt pixels up and down, the middle stays
const tilted = (art: PixelCanvas, liquid: Liquid, tilt: number) => {
	const half = Math.max(1, (liquid.right - liquid.left) / 2);
	const middle = (liquid.left + liquid.right) / 2;

	return lifted(art, liquid, (x) => {
		const lean = (tilt * (x - middle)) / half;

		return Math.sign(lean) * Math.round(Math.abs(lean));
	});
};

// a bubble: a 2 × 2 clump of the liquid two steps lighter, only inside the liquid
const bubble = (canvas: PixelCanvas, art: PixelCanvas, liquid: Liquid, x: number, y: number) => {
	for (let j = 0; j < 2; j++)
		for (let i = 0; i < 2; i++) {
			const px = Math.round(x) + i;
			const py = Math.round(y) + j;
			if (!liquid.has(px, py)) continue;
			const under = art.get(px, py);
			canvas.set(px, py, j === 0 ? LIGHTER[LIGHTER[under]] : LIGHTER[under]);
		}

	return canvas;
};

// one step lighter, but never to the near-whites at the end of a ramp, which read as glare
const PALE = colours(0xffffff, 0xf9e6cf, 0xfdd2ed, 0xf6ca9f);
const lighter = (at: number) => (PALE.has(LIGHTER[at]) ? at : LIGHTER[at]);

// the liquid's own colours one or more steps lighter, where `where` says
const brightened = (
	canvas: PixelCanvas,
	liquid: Liquid,
	steps: number,
	where: (x: number, y: number) => boolean = () => true,
) => {
	for (const [x, y] of liquid.pixels)
		if (where(x, y)) canvas.set(x, y, stepped(canvas.get(x, y), lighter, steps));

	return canvas;
};

// Every bottle's land: the liquid sloshes, its surface tipping one way, then the other, settling.
const slosh = (art: PixelCanvas, liquid: Liquid) =>
	[2, -2, 1, -1].map((tilt) => tilted(art, liquid, tilt));

// A rest for every bottle: the surface sways a pixel each way and back.
const sway = (art: PixelCanvas, liquid: Liquid) =>
	[1, 1, 1, 0, -1, -1, -1, 0].map((tilt) => tilted(art, liquid, tilt));

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

// How every bottle goes: the glass cracks from the middle and bursts into shards that fly and
// fall; the liquid, its glass gone, breaks into blobs of itself that fly a little way and drop,
// and gathers in a puddle under where the bottle stood, which spreads and drains away. A poison
// also lets out a puff. ramp: the liquid's colours from dark to light.
const bottleGone = (
	art: PixelCanvas,
	liquid: Liquid,
	ramp: readonly number[],
	{
		seed = 3,
		frames = 12,
		puff,
	}: { seed?: number; frames?: number; puff?: readonly number[] } = {},
) => {
	const size = goneSize(SIZE);
	const margin = (size - SIZE) / 2;
	const middle: Point = [Math.round(liquid.middle[0]), Math.round(liquid.middle[1])];
	const glassBreak = struck(middle, 26, { spokes: 6, seed });
	const glass = art.clone().paint((x, y) => liquid.has(x, y), CLEAR);
	const body = new PixelCanvas(SIZE, SIZE);
	for (const [x, y] of liquid.pixels) body.set(x, y, art.get(x, y));
	// the liquid shows through the cracks first, then the shards go
	const cracked = (amount: number) => {
		const canvas = art.clone();
		for (const path of glassBreak.paths) crack(canvas, path, amount);

		return padded(canvas, margin);
	};
	const flying = frames - 2;
	const shards = breakApart(
		glass,
		glassBreak.owner,
		glassBreak.ways.map((way, index) => ({
			x: Math.cos(way) * (14 + 6 * hash(index, 1, seed)),
			y: Math.sin(way) * (10 + 4 * hash(index, 2, seed)) - 7,
			fall: 48,
			wear: 0.35,
		})),
		{ frames: flying },
	);
	// the liquid parts in a few blobs that hardly spread before they pour down into the puddle
	const blobBreak = struck(middle, 20, { spokes: 5, seed: seed + 5 });
	const blobs = breakApart(
		body,
		blobBreak.owner,
		blobBreak.ways.map((way, index) => ({
			x: Math.cos(way) * (3 + 2 * hash(index, 3, seed)),
			y: -2,
			fall: 46,
		})),
		{ frames: flying, edges: false },
	);
	// and throws drops out sideways as it lands
	const splashes = [-1, 1, -1, 1].map((side, index) => ({
		side,
		far: 10 + index * 4,
		high: 7 - index,
	}));
	const floor = liquid.bottom + margin + 3;
	const half = (liquid.right - liquid.left) / 2;
	const cx = middle[0] + margin;
	const [dark, mid, light] = [
		ramp[1],
		ramp[Math.min(ramp.length - 1, 2)],
		ramp[Math.min(ramp.length - 1, 3)],
	];

	return [
		cracked(0.5),
		cracked(1),
		...shards.map((canvas, frame) => {
			const t = (frame + 1) / flying;
			const out = new PixelCanvas(size, size);
			// the puddle: it gathers from the third frame, spreads, then drains to nothing
			const gathered = span(t, 0.15, 0.45);
			const drained = span(t, 0.55, 1);
			const width = Math.round(half * (0.5 + 0.9 * gathered) * (1 - 0.7 * drained));
			const depth = drained >= 1 ? 0 : Math.max(1, Math.round(3 * gathered * (1 - drained)));
			if (gathered > 0 && depth > 0)
				for (let row = 0; row < depth; row++) {
					const inset = row === 0 && depth > 1 ? 2 : 0;
					for (let x = cx - width + inset; x <= cx + width - inset; x++)
						out.set(
							x,
							floor - depth + 1 + row,
							row === 0 ? light : row === depth - 1 && depth > 2 ? dark : mid,
						);
				}
			// the blobs fall into it: nothing of them shows below its top
			const falling = blobs[frame];
			for (const [x, y] of pick(falling, () => true))
				if (y < floor - depth + 1) out.set(x, y, falling.get(x, y));
			const thrown = span(t, 0.25, 0.75);
			if (thrown > 0 && thrown < 1)
				for (const { side, far, high } of splashes)
					clump(
						out,
						cx + side * (half * 0.6 + far * thrown) - 1,
						floor - 3 - high * 4 * thrown * (1 - thrown),
						3,
						2,
						mid,
						light,
					);
			out.blit(canvas);
			// a poison's puff hangs over the breaking, in front of its shards
			if (puff)
				for (let index = 0; index < 6; index++) {
					const age = span(t, index * 0.05, 0.75 + index * 0.05);
					const [w, h] =
						age <= 0 || age >= 1 ? [0, 0] : age < 0.35 ? [6, 5] : age < 0.7 ? [5, 4] : [3, 3];
					if (!w) continue;
					const angle = -Math.PI / 2 + (index - 2.5) * 0.55;
					const far = 4 + 18 * age;
					clump(
						out,
						cx + Math.cos(angle) * far - w / 2,
						middle[1] + margin + Math.sin(angle) * far - 6 * age,
						w,
						h,
						puff[0],
						puff[1],
					);
				}

			return out;
		}),
	];
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
) => clump(canvas, x, y, 2, 2, dark, light, on);

// a drip's whole life in frames: it creeps to its length, its drop lets go and slides down, the
// stub draws back in
const DRIP = [
	{ length: 1 },
	{ length: 2 },
	{ length: 3 },
	{ length: 4 },
	{ length: 5 },
	{ length: 6 },
	{ length: 6 },
	{ length: 3, drop: 5 },
	{ length: 2, drop: 8 },
	{ length: 1, drop: 11 },
	{ length: 1, drop: 14 },
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

// the art itself, moved down by whole pixels and back: how something heavy lands
const thud = (art: PixelCanvas, drops: readonly number[]) => drops.map((dy) => shifted(art, 0, dy));

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
	const clacked = (canvas: PixelCanvas, open: number) => moved(canvas, jaw, 0, open, () => SHADOW);
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
	const molten = [c(0xedab50), c(0xbf6f4a)] as const;
	const onSkull = (x: number, y: number) => bone.has(art.get(x, y));

	const glowRest = [0.3, 0.45, 0.6, 0.7, 0.7, 0.6, 0.45, 0.3].map((level, frame) =>
		eyes(art.clone(), level, frame + 1),
	);
	const dripRest = DRIP.map((_, frame) => dripFrame(art.clone(), drips[0], frame, molten, onSkull));

	// win: the jaw opens and shuts twice, a laugh, while the sockets take fire and gold runs
	const opens = [1, 2, 2, 0, 2, 2, 0, 1, 0, 0, 0, 0];
	const levels = [0.35, 0.55, 0.72, 0.82, 0.88, 0.88, 0.82, 0.76, 0.7, 0.66, 0.62, 0.6];
	const hurt = opens.map((open, frame) => {
		const canvas = eyes(art.clone(), levels[frame], 20 + frame);
		dripFrame(canvas, drips[0], frame - 1, molten, onSkull);
		dripFrame(canvas, drips[1], frame - 3, molten, onSkull);

		return clacked(canvas, open);
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
		symbolH1Land: [clacked(art, 1), clacked(art, 1), art.clone()],
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
	const [slitX, slitY] = middleOf(slit);

	// rest: the heat in the gashes breathes, a slow swell and fall
	const breath = [0, 0.06, 0.12, 0.17, 0.2, 0.17, 0.12, 0.06, 0, -0.04];
	const rest = breath.map((extra, frame) => heated(art.clone(), extra, frame + 3));

	// win: the gashes flare white-hot and a puff of dark smoke leaves the eye slit
	const flare = [0.15, 0.32, 0.45, 0.45, 0.4, 0.35, 0.3, 0.27, 0.24, 0.22, 0.2, 0.2];
	const pad = 8;
	const smoke = [c(0x3d3d3d), c(0x5d5d5d)];
	const hurt = flare.map((extra, frame) => {
		const canvas = padded(heated(art.clone(), extra, 40 + frame), pad);
		// the puff leaves the slit along its front half and climbs, drifting forward (left)
		for (let index = 0; index < 5; index++) {
			const age = span(frame, 2 + index, 9 + index);
			const [w, h] = puffSize(age, true);
			if (!w) continue;
			const x = slitX - 14 + index * 5 - 7 * age;
			const y = slitY - 2 - 16 * age;
			clump(canvas, x + pad - w / 2, y + pad, w, h, smoke[0], smoke[1]);
		}

		return canvas;
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
		symbolH2Land: thud(art, [1, 1, 0]),
		symbolH2Hurt: [...hurt.slice(0, -1), padded(last, pad)],
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
	const glowing = [0.22, 0.32, 0.4, 0.44, 0.4, 0.34, 0.28, 0.2].map((level, frame) =>
		smoulder(art.clone(), rings[0], level, frame + 5),
	);
	const pad = 8;
	const [holeX, holeY] = middleOf(holes.filter(([, y]) => y >= 33));
	const curl = [0, 0, 1, 1, 1, 0, -1, -1, -1, 0, 1, 1];
	// grey enough to read over the dark cloth
	const smoke = [c(0x858585), c(0xb4b4b4)];
	const smoking = Array.from({ length: 12 }, (_, frame) => {
		const canvas = padded(smoulder(art.clone(), rings[0], 0.3, frame + 30), pad);
		// three clumps one behind another, stepping sideways by whole pixels as they climb
		for (let index = 0; index < 3; index++) {
			const rise = frame * 2 - index * 3;
			if (rise < 0 || rise > 20) continue;
			const [w, h] = rise > 13 ? [2, 2] : [3, 2];
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

	// win: the burn eats outward a ring, a glowing front ahead of it, the burnt ring left dark
	const char = SHADOW;
	// the front is ragged: the next ring, and the one past it where the cloth is thinnest
	const ragged = [...rings[1], ...rings[2].filter(([x, y]) => blotch(x, y, 7) > 0.55)];
	const hurt = Array.from({ length: HURT_FRAMES }, (_, frame) => {
		const canvas = art.clone();
		if (frame < 4) return smoulder(canvas, rings[0], 0.5 + frame * 0.12, 60 + frame);
		for (const [x, y] of rings[0]) canvas.set(x, y, char);
		const cooling = 0.95 - (frame - 4) * 0.06;

		return burn(
			canvas,
			ragged,
			(x, y) =>
				cooling -
				(rings[1].some(([rx, ry]) => rx === x && ry === y) ? 0 : 0.22) +
				0.3 * (blotch(x, y, 60 + frame) - 0.5),
		);
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
	const gone = Array.from({ length: GONE_FRAMES }, (_, frame) => {
		const reach = ((frame + 1) / GONE_FRAMES) * (farthest + 9) - 2;
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
		return padded(despeckled(canvas), margin);
	});

	return {
		symbolH3RestSmoulder: glowing,
		symbolH3RestSmoke: smoking,
		// the hat drops a pixel onto its brim, its bent tip a pixel further, and settles
		symbolH3Land: [
			moved(
				shifted(art, 0, 1),
				tipPart.map(([x, y]): Point => [x, y + 1]),
				0,
				1,
				() => SHADOW,
			),
			shifted(art, 0, 1),
			art.clone(),
		],
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

	const rest = [0, 0.1, 0.2, 0.28, 0.3, 0.26, 0.18, 0.08, 0, -0.06].map((extra, frame) =>
		heated(art.clone(), extra, frame + 2),
	);
	const hurt = Array.from({ length: HURT_FRAMES }, (_, frame) => {
		const flash = [0.55, 0.62, 0.5, 0.4, 0.34, 0.3, 0.28, 0.26, 0.24, 0.22, 0.2, 0.2][frame];
		const canvas = heated(art.clone(), flash, 50 + frame);
		// the crack runs hot and cools to dark behind its head
		const amount = span(frame, 1, 6);
		const head = amount * (fault.length - 1);
		return crack(canvas, fault, amount, (x, y) => {
			const along = fault.findIndex(([, fy]) => fy >= y);
			return frame < 8 && Math.abs(along - head) < 1.5
				? c(0xff5000)
				: frame < 10 && along > head - 2
					? c(0x8e251d)
					: INK;
		});
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

// The potions. Their liquids are found by colour; the glass, corks and labels never move.
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

// L1: the round red flask. A bubble rises now and then; it boils when it wins and its cork pops.
const redFlask = (): Runs => {
	const art = SYMBOL_DRAWINGS.symbolL1();
	const liquid = liquidOf(
		art,
		colours(0xf5555d, 0xea323c, 0xc42430, 0x891e2b, 0x571c27),
		glassColours,
	);
	const cork = pick(art, inBox([31, 5, 50, 12]));
	const bubbles = (
		canvas: PixelCanvas,
		frame: number,
		count: number,
		speed: number,
		seed: number,
	) => {
		for (let index = 0; index < count; index++) {
			const x = liquid.left + 6 + hash(index, 0, seed) * (liquid.right - liquid.left - 12);
			const start = liquid.bottom - 4 - hash(index, 1, seed) * 6;
			const y = start - (frame - index * 1.5) * speed;
			const top = liquid.surface.get(Math.round(x)) ?? liquid.middle[1] - 10;
			if (frame - index * 1.5 >= 0 && y > top + 1) bubble(canvas, art, liquid, x, y);
		}

		return canvas;
	};
	const rising = Array.from({ length: 10 }, (_, frame) => bubbles(art.clone(), frame, 1, 2.4, 4));

	const pops = [0, 0, 1, 3, 4, 4, 3, 3, 3, 3, 3, 3];
	const hurt = pops.map((up, frame) => {
		const boil = (x: number) =>
			frame < 10 ? Math.round((blotch(x, 0, frame + 9) - 0.5) * 2.4) : 0;
		const canvas = lifted(art, liquid, boil);
		bubbles(canvas, frame + 2, 6, 3, 17);

		return uncorked(canvas, cork, up);
	});

	return {
		symbolL1RestSway: sway(art, liquid),
		symbolL1RestBubble: rising,
		symbolL1Land: slosh(art, liquid),
		symbolL1Hurt: hurt,
		symbolL1Gone: bottleGone(
			hurt.at(-1)!,
			liquidOf(
				hurt.at(-1)!,
				colours(0xf5555d, 0xea323c, 0xc42430, 0x891e2b, 0x571c27),
				glassColours,
			),
			[c(0x571c27), c(0x891e2b), c(0xc42430), c(0xea323c), c(0xf5555d)],
			{ seed: 11 },
		),
	};
};

// L2: the tall blue bottle. Light swirls slowly inside it; when it wins, bands of brighter light
// rise through it.
const blueBottle = (): Runs => {
	const art = SYMBOL_DRAWINGS.symbolL2();
	const blue = colours(0x94fdff, 0x00cdf9, 0x0098dc, 0x0069aa);
	const liquid = liquidOf(art, blue, glassColours);
	const [cx, cy] = liquid.middle;
	// the swirl: an arc of the liquid a step lighter, turning about the middle, wider than tall
	const swirl = Array.from({ length: 12 }, (_, frame) => {
		const turn = (frame / 12) * Math.PI * 2;

		return brightened(art.clone(), liquid, 1, (x, y) => {
			const dx = (x - cx) / 7;
			const dy = (y - cy) / 12;
			const far = Math.hypot(dx, dy);
			const angle = Math.atan2(dy, dx);
			const gap = Math.abs(((angle - turn + Math.PI * 3) % (Math.PI * 2)) - Math.PI);

			return far > 0.35 && far < 0.95 && gap < 0.55;
		});
	});
	const top = Math.min(...liquid.surface.values());
	const hurt = Array.from({ length: HURT_FRAMES }, (_, frame) => {
		const canvas = art.clone();
		const glow = frame >= 3 ? 1 : 0;
		if (glow) brightened(canvas, liquid, 1, (x, y) => liquid.has(x, y));
		// three bands, two rows each, climb from the bottom to the surface
		for (let band = 0; band < 3; band++) {
			const y = liquid.bottom - (frame - band * 2.5) * 3.2;
			if (y < top || y > liquid.bottom) continue;
			brightened(canvas, liquid, 1, (_, py) => py >= Math.round(y) - 1 && py <= Math.round(y));
		}

		return canvas;
	});

	return {
		symbolL2RestSwirl: swirl,
		symbolL2RestSway: sway(art, liquid),
		symbolL2Land: slosh(art, liquid),
		symbolL2Hurt: hurt,
		symbolL2Gone: bottleGone(
			hurt.at(-1)!,
			liquidOf(hurt.at(-1)!, blue, glassColours),
			[c(0x03193f), c(0x00396d), c(0x0069aa), c(0x0098dc), c(0x00cdf9)],
			{ seed: 23 },
		),
	};
};

// L3: the square green poison bottle under a wax seal. Wax runs down from the seal; when it wins,
// green fumes rise from the neck.
const poisonBottle = (): Runs => {
	const art = SYMBOL_DRAWINGS.symbolL3();
	const green = colours(0x5ac54f, 0x33984b, 0x1e6f50);
	// the label's drop is the liquid's colour too, but stays on the label
	const label = inBox([18, 34, 34, 47]);
	const liquid = liquidOf(art, green, glassColours, (x, y) => !label(x, y));
	const wax = colours(0x8a4836, 0x5d2c28, 0x391f21);
	const seals = pick(
		art,
		(x, y, at) =>
			wax.has(at) &&
			y <= 13 &&
			[1, 2, 3].every(
				(down) =>
					!wax.has(art.get(x, y + down)) &&
					!wax.has(art.get(x + 1, y + down)) &&
					art.get(x, y + down) !== CLEAR &&
					art.get(x + 1, y + down) !== CLEAR,
			),
	);
	const seal = seals.find(([x]) => x >= 26 && x <= 34) ?? seals[0];
	const waxTones = [c(0x8a4836), c(0x5d2c28)] as const;
	const onBottle = (x: number, y: number) => art.get(x, y) !== CLEAR && art.get(x, y) !== INK;
	const running = DRIP.map((_, frame) =>
		dripFrame(art.clone(), [seal[0], seal[1] + 1], frame, waxTones, onBottle),
	);

	const pad = 8;
	const fume = [c(0x33984b), c(0x5ac54f), c(0x99e65f)];
	// the fumes: a column of big clumps that leave the neck one after another, climb, part to
	// either side and wear down, fresh green turning darker as they go
	const fumeSize = (age: number) =>
		age <= 0 || age >= 1
			? [0, 0]
			: age < 0.3
				? [6, 5]
				: age < 0.6
					? [5, 4]
					: age < 0.85
						? [4, 3]
						: [3, 2];
	const hurt = Array.from({ length: HURT_FRAMES }, (_, frame) => {
		const canvas = padded(brightened(art.clone(), liquid, frame >= 2 ? 1 : 0), pad);
		for (let index = 0; index < 8; index++) {
			const age = span(frame, index * 0.9, 5.5 + index * 0.9);
			const [w, h] = fumeSize(age);
			if (!w) continue;
			const side = index % 2 ? 1 : -1;
			const x = 32 + side * (1 + 6 * age) + ((index % 3) - 1);
			const y = 8 - 14 * age;
			clump(
				canvas,
				x + pad - w / 2,
				y + pad - h,
				w,
				h,
				age < 0.5 ? fume[1] : fume[0],
				age < 0.5 ? fume[2] : fume[1],
			);
		}

		return canvas;
	});

	const last = brightened(art.clone(), liquid, 1);

	return {
		symbolL3RestDrip: running,
		symbolL3RestSway: sway(art, liquid),
		symbolL3Land: slosh(art, liquid),
		symbolL3Hurt: [...hurt.slice(0, -1), padded(last, pad)],
		symbolL3Gone: bottleGone(
			last,
			liquidOf(last, colours(0x99e65f, 0x5ac54f, 0x33984b), glassColours, (x, y) => !label(x, y)),
			[c(0x134c4c), c(0x1e6f50), c(0x33984b), c(0x5ac54f), c(0x99e65f)],
			{
				seed: 31,
				puff: [fume[1], fume[2]],
			},
		),
	};
};

// L4: the triangular gold flask. Slow bubbles climb in it; when it wins, it surges and glows.
const goldFlask = (): Runs => {
	const art = SYMBOL_DRAWINGS.symbolL4();
	const gold = colours(0xffeb57, 0xffc825, 0xedab50, 0xe07438);
	const liquid = liquidOf(art, gold, glassColours, (_, y) => y >= 28);
	const slow = Array.from({ length: 14 }, (_, frame) => {
		const canvas = art.clone();
		[
			[24, 0],
			[34, 4],
			[29, 8],
		].forEach(([x, start]) => {
			const rise = frame - start;
			const y = liquid.bottom - 3 - rise * 1.5;
			if (rise >= 0 && y > (liquid.surface.get(x) ?? 30) + 1) bubble(canvas, art, liquid, x, y);
		});

		return canvas;
	});
	const surge = [0, -1, -2, -2, -1, -1, 0, 0, 0, 0, 0, 0];
	const glow = [0, 1, 1, 2, 2, 2, 1, 1, 1, 1, 1, 1];
	const half = (liquid.right - liquid.left) / 2;
	const middle = (liquid.left + liquid.right) / 2;
	const hurt = surge.map((up, frame) => {
		// the middle of the surface heaves up; its ends stay
		const canvas = lifted(art, liquid, (x) =>
			Math.abs(x - middle) < half * 0.5
				? up
				: Math.abs(x - middle) < half * 0.8
					? Math.trunc(up / 2)
					: 0,
		);

		return brightened(
			canvas,
			liquidOf(canvas, gold, glassColours, (_, y) => y >= 26),
			glow[frame],
		);
	});
	const last = hurt.at(-1)!;

	return {
		symbolL4RestBubbles: slow,
		symbolL4RestSway: sway(art, liquid),
		symbolL4Land: slosh(art, liquid),
		symbolL4Hurt: hurt,
		symbolL4Gone: bottleGone(
			last,
			liquidOf(
				last,
				colours(0xffeb57, 0xffc825, 0xedab50, 0xe07438, 0xf9e6cf),
				glassColours,
				(_, y) => y >= 26,
			),
			[c(0x8a4836), c(0xe07438), c(0xffc825), c(0xffeb57)],
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

	const glance = [-1, -1, -2, -2, -2, -2, -1, 0, 0, 1, 1, 1, 0].map((by) => looked(eye, by));
	const wary = [0, 1, 2, 3, 4, 5].map((level) =>
		looked(heated(eye, Math.round(level * 0.4), Math.round(level * 0.7)), 0, 1),
	);
	const flare = [
		[1, 2],
		[2, 3],
		[3, 4],
		[3, 4],
		[3, 4],
		[2, 4],
		[2, 3],
		[2, 3],
		[1, 2],
		[1, 2],
	].map(([irisSteps, seamSteps], frame) =>
		looked(heated(eye, irisSteps, seamSteps), 0, frame < 7 ? 1 : 0),
	);

	return {
		symbolScatterBlink: [eyeLids(eye, 0.5), eyeLids(eye, 1), eyeLids(eye, 0.5)],
		symbolScatterRestGlance: glance,
		symbolScatterNarrow: [eyeLids(eye, 0.55)],
		// it snaps open from narrowed, its iris a step hot for a moment
		symbolScatterLand: [eyeLids(eye, 0.3), heated(eye, 1, 1), heated(eye, 1, 0)],
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
