import { PixelCanvas, type Point } from './canvas.ts';
import { CLEAR, INK, LIGHTER, RAMPS, WHITE, color } from './palette.ts';
import { bevel, facetedGem, lightAt, outlined, part } from './shapes.ts';

// Reel symbols, drawn by code on a 40 × 40 art-pixel cell with a clear pixel round the edge for
// the outline. Low symbols are four cut gems told apart by cut and colour; high symbols are
// what the dragon's challengers left behind, whole until they win: then the dragon marks each
// (Hurt) and takes it (Gone): the crown melts, the sword is bitten through, the shield is clawed
// apart, the helm burns to ash, a gem cracks along its facets and breaks. The scatter is the
// dragon's eye.
export const SYMBOL_PIXELS = 40;

const cell = () => new PixelCanvas(SYMBOL_PIXELS, SYMBOL_PIXELS);

// Every gem can be drawn with the light turned part of the way round it (turn 0 is the art the
// reels show), so a run of turns makes the light travel round its facets.
export const GEM_TURNS = 8;

const BONE = color(0xf9e6cf);
const BONE_SHADE = color(0xe69c69);

// L1: a round ruby
const RUBY: Point[] = [
	[13, 3],
	[26, 3],
	[36, 13],
	[36, 26],
	[26, 36],
	[13, 36],
	[3, 26],
	[3, 13],
];
const rubyArt = (turn = 0) =>
	facetedGem(cell(), RUBY, RAMPS.red, { light: lightAt(turn, GEM_TURNS) });
const ruby = (turn = 0) => outlined(rubyArt(turn));

// L2: a pear-cut sapphire
const SAPPHIRE: Point[] = [
	[20, 2],
	[27, 10],
	[33, 19],
	[34, 27],
	[29, 34],
	[20, 37],
	[10, 34],
	[5, 27],
	[6, 19],
	[12, 10],
];
const SAPPHIRE_CUT = { table: 0.5, lift: 2 };
const sapphireArt = (turn = 0) =>
	facetedGem(cell(), SAPPHIRE, RAMPS.blue, { ...SAPPHIRE_CUT, light: lightAt(turn, GEM_TURNS) });
const sapphire = (turn = 0) => outlined(sapphireArt(turn));

// L3: an emerald, step cut
const emeraldArt = (turn = 0) => {
	const canvas = cell();
	// the step cut has four sides: the light moves on a side every second turn
	const side = Math.floor(turn / 2) % 4;
	const turned = <T>(sides: T[]) => sides.map((_, index) => sides[(index + 4 - side) % 4]);
	const ring = (inset: number, lit: number[]) => {
		const bright = turned(lit);
		const [left, top, right, bottom] = [5 + inset, 3 + inset, 34 - inset, 36 - inset];
		const cut = Math.max(1, 5 - Math.round(inset * 0.6));
		const g = RAMPS.green;
		// top, right, bottom, left bands and the four cut corners between them
		canvas.poly(
			g[bright[0]],
			[left + cut, top],
			[right - cut, top],
			[right, top + cut],
			[left, top + cut],
		);
		canvas.poly(
			g[bright[1]],
			[right, top + cut],
			[right, bottom - cut],
			[right - cut, bottom],
			[right - cut, top],
		);
		canvas.poly(
			g[bright[2]],
			[left, bottom - cut],
			[right, bottom - cut],
			[right - cut, bottom],
			[left + cut, bottom],
		);
		canvas.poly(
			g[bright[3]],
			[left, top + cut],
			[left + cut, top],
			[left + cut, bottom],
			[left, bottom - cut],
		);
	};
	ring(0, [4, 2, 1, 3]);
	ring(4, [5, 3, 2, 4]);
	// the table
	canvas.rect(14, 12, 12, 16, RAMPS.green[4]);
	canvas.rect(14, 12, 12, 1, RAMPS.green[5]);
	canvas.rect(14, 12, 1, 16, RAMPS.green[5]);
	canvas.line(16, 18, 20, 14, WHITE);
	canvas.line(16, 19, 21, 14, RAMPS.green[5]);
	// corner lines
	canvas.line(6, 6, 13, 12, RAMPS.green[1]);
	canvas.line(33, 6, 26, 12, RAMPS.green[1]);
	canvas.line(6, 33, 13, 27, RAMPS.green[0]);
	canvas.line(33, 33, 26, 27, RAMPS.green[0]);
	return canvas;
};
const emerald = (turn = 0) => outlined(emeraldArt(turn));

// L4: an amethyst in the classic diamond profile
const amethystArt = (turn = 0) => {
	const canvas = cell();
	const v = RAMPS.violet;
	// crown: three facets across the top
	canvas.poly(v[4], [11, 5], [20, 5], [14, 15], [3, 15]);
	canvas.poly(v[5], [20, 5], [28, 5], [25, 15], [14, 15]);
	canvas.poly(v[3], [28, 5], [36, 15], [25, 15]);
	canvas.poly(v[5], [11, 5], [20, 5], [14, 15]);
	canvas.poly(v[3], [20, 5], [28, 5], [25, 15]);
	canvas.poly(v[4], [20, 5], [25, 15], [14, 15]);
	// pavilion: facets running to the point
	canvas.poly(v[3], [3, 15], [14, 15], [20, 37]);
	canvas.poly(v[4], [14, 15], [25, 15], [20, 37]);
	canvas.poly(v[1], [25, 15], [36, 15], [20, 37]);
	canvas.poly(v[2], [25, 15], [31, 15], [20, 37]);
	// girdle and facet lines
	canvas.line(3, 15, 36, 15, v[1]);
	canvas.line(14, 15, 20, 37, v[2]);
	canvas.line(25, 15, 20, 37, v[1]);
	canvas.line(11, 5, 14, 15, v[2]);
	canvas.line(28, 5, 25, 15, v[2]);
	canvas.line(20, 5, 14, 15, v[3]);
	canvas.line(20, 5, 25, 15, v[2]);
	// highlights
	canvas.line(8, 12, 12, 7, WHITE);
	canvas.line(9, 12, 13, 7, v[5]);
	canvas.line(10, 19, 15, 29, v[4]);
	// the light crosses its three facets from left to right, one facet every second turn
	const facet = Math.floor(turn / 2) - 1;
	const edges = [3, 14, 25, 37];
	if (facet >= 0)
		canvas.paint(
			(x, _, c) => c !== CLEAR && c !== WHITE && x >= edges[facet] && x < edges[facet + 1],
			(c) => LIGHTER[c],
		);
	return canvas;
};
const amethyst = (turn = 0) => outlined(amethystArt(turn));

// H1: the crown, whole
const CROWN_DROP = 4;
const crownArt = () => {
	const canvas = cell();
	const g = RAMPS.gold;
	const r = RAMPS.red;
	// velvet behind the points
	canvas.poly(r[2], [6, 22], [6, 15], [11, 20], [18, 9], [20, 9], [27, 20], [32, 15], [32, 22]);
	canvas.poly(r[3], [7, 22], [7, 17], [11, 21], [17, 12], [19, 12], [19, 22]);
	const body = part(
		40,
		40,
		(c) =>
			// the band and its three points
			c.poly(
				g[4],
				[3, 30],
				[3, 8],
				[5, 8],
				[11, 22],
				[14, 22],
				[18, 4],
				[20, 4],
				[24, 22],
				[27, 22],
				[33, 8],
				[35, 8],
				[35, 30],
			),
		bevel,
	);
	canvas.blit(body);
	// faces turned from the light
	canvas.poly(g[3], [5, 12], [9, 21], [6, 21]);
	canvas.poly(g[3], [20, 7], [23, 21], [21, 21]);
	canvas.poly(g[3], [34, 11], [34, 21], [31, 21]);
	canvas.line(17, 7, 15, 21, g[5]);
	canvas.line(32, 11, 28, 21, g[5]);
	// the band's lips
	canvas.rect(4, 22, 31, 1, g[5]);
	canvas.rect(4, 23, 31, 1, g[2]);
	canvas.rect(4, 28, 31, 2, g[3]);
	// a pearl on each tip
	for (const [x, y] of [
		[4, 6],
		[19, 3],
		[34, 6],
	] as const) {
		canvas.ellipse(x, y, 2.3, 2.3, BONE);
		canvas.set(x - 1, y - 1, WHITE);
		canvas.set(x + 1, y + 1, BONE_SHADE);
	}
	// the band is plain gold, chased with a row of small pits (no gems set into anything)
	for (const x of [6, 10, 14, 18, 22, 26, 30]) canvas.rect(x, 25, 2, 2, g[2]);
	// drawn from the top of the cell, then set down in its middle
	return cell().blit(canvas, 0, CROWN_DROP);
};
const crown = () => outlined(crownArt());

// a point along the sword (a, from the pommel toward the tip) and across it (b, toward the
// lower right), the sword lying from the lower left to the upper right
const along = (a: number, b: number): Point => [
	Math.round(4 + (a + b) * 0.7071),
	Math.round(36 - (a - b) * 0.7071),
];

// H2: the sword. bite: how far the dragon's bite has gone through the blade (0 to 1). Bitten
// through (snapped), the point hangs away from the half still on the hilt by drop pixels.
const swordArt = ({ bite = 0, snapped = false, drop = 0 } = {}) => {
	const canvas = cell();
	const s = RAMPS.steel;
	const g = RAMPS.gold;
	const f = RAMPS.fire;
	const blade = (points: [number, number][], fall: number) => {
		const at = ([a, b]: [number, number]) => along(a, b + fall);
		canvas.poly(s[3], ...points.map(at));
		canvas.poly(s[5], ...points.map(([a, b]): [number, number] => [a, Math.min(b, 0)]).map(at));
	};
	const teeth: [number, number][] = [
		[23, -4],
		[26, -2],
		[23.5, 0],
		[27, 2],
		[24, 4],
	];
	if (snapped) {
		// the half still on the hilt, and the point
		blade([[10, -4], ...teeth, [10, 4]], 0);
		blade(
			[
				[30, -4],
				[32.5, -1.5],
				[30, 0.5],
				[33, 4],
				[39, 4],
				[45, 0],
				[39, -4],
			],
			drop,
		);
		canvas.line(...along(10, -4), ...along(23, -4), WHITE);
		canvas.line(...along(10, 0), ...along(24, 0), s[4]);
		canvas.line(...along(31, -4 + drop), ...along(39, -4 + drop), WHITE);
		canvas.line(...along(31, drop), ...along(44, drop), s[4]);
		// the bitten edges, still hot
		canvas.path(f[3], ...teeth.map(([a, b]) => along(a, b)));
		canvas.path(
			f[3],
			along(30, -4 + drop),
			along(32.5, -1.5 + drop),
			along(30, 0.5 + drop),
			along(33, 4 + drop),
		);
		canvas.dots(f[5], along(26, -2), along(27, 2), along(32.5, -1.5 + drop));
	} else {
		blade(
			[
				[10, -4],
				[39, -4],
				[45, 0],
				[39, 4],
				[10, 4],
			],
			0,
		);
		canvas.line(...along(10, -4), ...along(39, -4), WHITE);
		canvas.line(...along(10, 0), ...along(44, 0), s[4]);
		// the bite goes through from the back of the blade
		const through = Math.round(bite * (teeth.length - 1));
		if (through > 0) {
			const edge = teeth.slice(0, through + 1).map(([a, b]) => along(a + 1.5, b));
			canvas.path(f[3], ...edge);
			canvas.dots(f[5], edge[edge.length - 1]);
		}
	}
	// grip
	canvas.poly(RAMPS.wood[3], along(1, -2.2), along(8, -2.2), along(8, 2.2), along(1, 2.2));
	canvas.line(...along(1, -2), ...along(8, -2), RAMPS.wood[4]);
	canvas.line(...along(3, -2), ...along(3, 2), RAMPS.wood[1]);
	canvas.line(...along(5.5, -2), ...along(5.5, 2), RAMPS.wood[1]);
	// crossguard
	const guard = part(
		40,
		40,
		(c) => c.poly(g[4], along(7.5, -9), along(10.5, -9), along(10.5, 9), along(7.5, 9)),
		bevel,
	);
	canvas.blit(guard);
	// a plain round pommel
	const [px, py] = along(-1, 0);
	canvas.ellipse(px, py, 3, 3, g[4]);
	canvas.paint(
		(x, y, c) => c === g[4] && Math.hypot(x - px, y - py) < 3.5 && x + y > px + py + 1,
		g[3],
	);
	canvas.set(px - 1, py - 2, g[5]);
	canvas.set(px + 2, py + 2, g[2]);
	return canvas;
};
const sword = () => outlined(swordArt());

// the three claw marks across the shield, from the upper right to the lower left
const GASHES = [
	[30, 3, 10, 21],
	[33, 10, 13, 28],
	[32, 18, 19, 31],
] as const;

// H3: the shield. gashes: how far each claw has raked across it (0 to 1).
const shieldArt = (gashes: readonly number[] = []) => {
	const canvas = cell();
	const g = RAMPS.gold;
	const b = RAMPS.blue;
	const outlinePoints = (inset: number) =>
		[
			[4 + inset, 4 + inset],
			[19, 3 + inset],
			[19, 37 - inset * 1.5],
			[12 + inset * 0.4, 32 - inset],
			[6 + inset, 25 - inset * 0.5],
			[4 + inset, 16],
		] as const;
	const rim = part(
		40,
		40,
		(c) => {
			c.poly(g[4], ...outlinePoints(0));
			c.mirror();
		},
		bevel,
	);
	canvas.blit(rim);
	const field = new PixelCanvas(40, 40);
	field.poly(b[3], ...outlinePoints(3));
	field.mirror();
	field.paint((x) => x >= 20, b[2]);
	field.edge(0, -1, 'lighter');
	field.edge(1, 0, 'darker');
	canvas.blit(field);
	// a gold chevron
	canvas.poly(g[4], [8, 11], [20, 17], [20, 21], [8, 15]);
	canvas.poly(g[3], [20, 17], [31, 11], [31, 15], [20, 21]);
	canvas.line(8, 11, 20, 17, g[5]);
	canvas.dots(g[5], [7, 7], [31, 7]);
	// each gash goes down to the wood, with a lit lip above it; the first cuts the rim
	const w = RAMPS.wood;
	GASHES.forEach(([x0, y0, toX, toY], index) => {
		const amount = gashes[index] ?? 0;
		if (amount <= 0) return;
		const x1 = Math.round(x0 + (toX - x0) * amount);
		const y1 = Math.round(y0 + (toY - y0) * amount);
		const mx = (x0 + x1) / 2;
		const my = (y0 + y1) / 2;
		const girth = 1.6 * Math.min(1, amount * 2);
		canvas.poly(
			w[0],
			[x0, y0],
			[Math.round(mx + girth), Math.round(my + girth)],
			[x1, y1],
			[Math.round(mx - girth * 0.75), Math.round(my - girth * 0.75)],
		);
		canvas.line(x0, y0, x1, y1, w[2]);
		canvas.line(x0 - 1, y0, Math.round(mx - 2), Math.round(my - 2), b[4]);
	});
	const whole = new PixelCanvas(40, 40);
	whole.poly(1, ...outlinePoints(0));
	whole.mirror();
	canvas.paint((x, y) => whole.get(x, y) === CLEAR, CLEAR);
	return canvas;
};
const shield = () => outlined(shieldArt());

// H4: the helm. burn: how far the scorch has spread from its upper right, in pixels. glow: how
// hot it is inside, seen through the visor (0 to 1).
const helmArt = ({ burn = 0, glow = 0 } = {}) => {
	const canvas = cell();
	const s = RAMPS.steel;
	const g = RAMPS.gold;
	const st = RAMPS.stone;
	const f = RAMPS.fire;
	const body = part(
		40,
		40,
		(c) => {
			c.ellipse(19.5, 18, 14.5, 15, s[4]);
			c.paint((_, y) => y > 18, CLEAR);
			c.poly(s[4], [5, 18], [34, 18], [34, 30], [29, 35], [10, 35], [5, 30]);
		},
		bevel,
	);
	canvas.blit(body);
	canvas.paint((x, y, c) => c === s[4] && x + y * 0.4 > 30, s[3]);
	canvas.paint((x, y, c) => c === s[4] && x + y < 22 && y < 16, s[5]);
	// crest, brow band, visor slits, cheek rivets
	canvas.rect(19, 3, 2, 14, s[5]);
	canvas.rect(21, 4, 1, 13, s[2]);
	canvas.rect(5, 17, 30, 3, g[4]);
	canvas.rect(5, 17, 30, 1, g[5]);
	canvas.rect(5, 19, 30, 1, g[2]);
	for (const x of [9, 14, 19, 24, 29]) {
		canvas.rect(x, 22, 2, 9, INK);
		canvas.rect(x + 2, 22, 1, 9, s[5]);
	}
	canvas.rect(10, 34, 20, 1, s[2]);
	canvas.dots(s[6], [7, 23], [7, 29]);
	if (burn >= 1) {
		// soot spreading from the upper right, embers along its edge
		const reach = (x: number, y: number) =>
			Math.hypot(x - 33, y - 6) + ((x * 7 + y * 13) % 5) * 0.7;
		canvas.paint(
			(x, y) => reach(x, y) < burn,
			(c) => (c === INK ? INK : st[1]),
		);
		canvas.paint((x, y, c) => c === st[1] && (x * 5 + y * 3) % 11 === 0, st[2]);
		canvas.paint((x, y, c) => c !== INK && reach(x, y) >= burn && reach(x, y) < burn + 1.2, f[2]);
		canvas.paint((x, y, c) => c === f[2] && (x * 3 + y) % 3 === 0, f[4]);
	}
	if (glow > 0) {
		// the fire inside shows through the visor, from the bottom of each slit up
		const rise = Math.round(9 * Math.min(1, glow * 1.4));
		for (const x of [9, 14, 19, 24, 29]) {
			canvas.rect(x, 31 - rise, 2, rise, glow > 0.6 ? f[4] : f[3]);
			if (glow > 0.6) canvas.rect(x, 31 - Math.round(rise * 0.5), 1, Math.round(rise * 0.5), f[5]);
		}
	}
	return canvas;
};
const helm = () => outlined(helmArt());

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

// How a symbol leaves the board is drawn on a wider canvas, the cell in its middle, so its
// pieces can fly past the cell's edges.
export const GONE_PIXELS = 64;
const GONE_MARGIN = (GONE_PIXELS - SYMBOL_PIXELS) / 2;
const HURT_FRAMES = 8;
const GONE_FRAMES = 10;

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const span = (t: number, start: number, end: number) => clamp((t - start) / (end - start));
const wide = (canvas: PixelCanvas) =>
	new PixelCanvas(GONE_PIXELS, GONE_PIXELS).blit(canvas, GONE_MARGIN, GONE_MARGIN);

// a soft band of light sliding over one material of a symbol, from the top left to the bottom
// right: what metal does at rest. One ramp step lighter, no white.
const glide = (art: PixelCanvas, ramp: readonly number[], frames = 8) =>
	Array.from({ length: frames }, (_, frame) => {
		const at = -4 + ((art.width + art.height + 8) * frame) / (frames - 1);
		const lit = art.clone();
		lit.paint(
			(x, y, c) => ramp.includes(c) && Math.abs(x + y - at) <= 2,
			(c) => LIGHTER[c],
		);

		return outlined(lit);
	});

// --- the crown melts
// the floor the gold runs down to
const MELT_FLOOR = 37;
const DRIPS = [
	{ x: 8, width: 3, length: 4 },
	{ x: 20, width: 3, length: 6 },
	{ x: 29, width: 2, length: 3 },
];

// heat: how far down the crown glows (0 to 1). sag: how far it has sunk toward the floor (0 to
// 1). drip: how far the drips have run. pool: how wide the gold lies on the floor. cool: how far
// the pool has gone dark.
const meltedCrown = ({
	heat = 0,
	sag = 0,
	drip = 0,
	pool = 0,
	cool = 0,
}: {
	heat?: number;
	sag?: number;
	drip?: number;
	pool?: number;
	cool?: number;
}) => {
	const g = RAMPS.gold;
	const f = RAMPS.fire;
	const art = crownArt();
	// gold glows from the tips down, with a ragged edge; at full heat the velvet and pearls go
	// the way of the gold
	const line = 2 + 30 * heat;
	const hot = (x: number, y: number) => y < line + ((x * 7 + y * 3) % 3);
	art.paint(
		(x, y, c) => g.includes(c) && hot(x, y),
		(c) => f[g.indexOf(c)],
	);
	if (heat >= 1) art.paint((_, __, c) => !f.includes(c), f[3]);
	// every column sinks toward the floor, a little unevenly
	const canvas = cell();
	for (let x = 0; x < 40; x++) {
		const keep = clamp(1 - sag * (0.95 + 0.07 * Math.sin(x * 0.45 + 1)));
		if (keep <= 0.02) continue;
		for (let y = MELT_FLOOR; y >= 0; y--) {
			const from = Math.round(MELT_FLOOR - (MELT_FLOOR - y) / keep);
			if (from < 0) break;
			const c = art.get(x, from);
			if (c !== CLEAR) canvas.set(x, y, c);
		}
	}
	// far gone, it is one soft mass: lit along its top, dark along its foot
	if (sag > 0.45) {
		const mass = canvas.clone();
		canvas.paint(
			() => true,
			(c) => (c === WHITE || c === BONE ? f[5] : f[4]),
		);
		canvas.paint((x, y) => mass.get(x, y - 1) === CLEAR, f[5]);
		canvas.paint((x, y) => mass.get(x, y + 1) === CLEAR || mass.get(x + 1, y) === CLEAR, f[3]);
	}
	// molten gold runs off the band
	const molten = cool > 0.66 ? f[2] : cool > 0.33 ? f[3] : f[4];
	if (drip > 0 && sag < 0.85)
		for (const { x, width, length } of DRIPS) {
			let foot = 0;
			for (let y = 0; y < 40; y++) if (canvas.get(x, y) !== CLEAR) foot = y;
			if (!foot) continue;
			const reach = Math.min(MELT_FLOOR - foot, Math.round(length * drip));
			if (reach <= 0) continue;
			canvas.rect(x, foot + 1, width, reach, molten);
			canvas.rect(x, foot + 1, 1, reach, LIGHTER[molten]);
			canvas.set(x + width - 1, foot + reach, CLEAR);
		}
	if (pool > 0) {
		const reach = 17 * pool;
		canvas.ellipse(19, MELT_FLOOR - 0.5, reach, 1.6, molten);
		if (cool < 0.5)
			canvas.line(
				19 - reach * 0.6,
				MELT_FLOOR - 2,
				19 + reach * 0.2,
				MELT_FLOOR - 2,
				LIGHTER[molten],
			);
	}

	return canvas;
};

// winning: the crown glows from its tips down, then softens, sinks and starts to run
const crownHurt = () =>
	Array.from({ length: HURT_FRAMES }, (_, frame) => {
		const t = (frame + 1) / HURT_FRAMES;

		return outlined(
			meltedCrown({
				heat: span(t, 0, 0.7) * 0.8,
				sag: 0.26 * span(t, 0.5, 1),
				drip: span(t, 0.55, 1),
			}),
		);
	});

// going: it melts down into a pool on the floor, which darkens and is gone
const crownGone = () =>
	Array.from({ length: GONE_FRAMES }, (_, frame) => {
		const t = (frame + 1) / GONE_FRAMES;
		const left = 1 - span(t, 0.6, 1);

		return wide(
			outlined(
				meltedCrown({
					heat: 0.8 + span(t, 0, 0.2),
					sag: 0.26 + 0.74 * span(t, 0, 0.6) ** 0.8,
					drip: 1 + 3 * span(t, 0, 0.4),
					pool: span(t, 0.05, 0.55) * left,
					cool: span(t, 0.55, 1),
				}),
			),
		);
	});

// --- things crack and break into pieces
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

// a faceted gem: its table breaks in four and its ring into its facets. Cracks run from the
// middle of the table to its corners, then out along the facet lines, then round the table.
const gemBreakage = (outer: readonly Point[], { table = 0.52, lift = 0 } = {}): Breakage => {
	const cx = outer.reduce((sum, [x]) => sum + x, 0) / outer.length;
	const cy = outer.reduce((sum, [, y]) => sum + y, 0) / outer.length;
	const inner = outer.map(([x, y]): Point => [
		Math.round(cx + (x - cx) * table),
		Math.round(cy + (y - cy) * table + lift),
	]);
	const count = outer.length;
	const middle: Point = [Math.round(cx), Math.round(cy + lift)];
	const pieces: Point[][] = [];
	const cracks: Crack[] = [];
	const step = Math.ceil(count / 4);
	for (let index = 0; index < count; index += step) {
		const corners = Math.min(step, count - index) + 1;
		pieces.push([
			middle,
			...Array.from({ length: corners }, (_, at) => inner[(index + at) % count]),
		]);
		cracks.push({ from: middle, to: inner[index], start: 0.1, end: 0.45 });
	}
	outer.forEach((point, index) => {
		const next = (index + 1) % count;
		pieces.push([point, outer[next], inner[next], inner[index]]);
		cracks.push({ from: inner[index], to: point, start: 0.4, end: 0.8 });
		cracks.push({ from: inner[index], to: inner[next], start: 0.75, end: 1 });
	});

	return { cracks, owner: byPieces(pieces), middle };
};

// the emerald breaks along its steps: the table in two, each side of the ring in two
const EMERALD_BREAKAGE = ((): Breakage => {
	const table: Point[] = [
		[14, 12],
		[26, 12],
		[26, 28],
		[14, 28],
	];
	const corners: Point[] = [
		[7, 5],
		[32, 5],
		[32, 34],
		[7, 34],
	];
	const middle: Point = [20, 20];
	// where each side of the ring breaks, on the table's edge and on the gem's
	const breaks: [Point, Point][] = [
		[
			[20, 12],
			[20, 3],
		],
		[
			[26, 20],
			[34, 20],
		],
		[
			[20, 28],
			[20, 36],
		],
		[
			[14, 20],
			[5, 20],
		],
	];
	const pieces: Point[][] = [
		[table[0], table[1], table[2]],
		[table[0], table[2], table[3]],
	];
	const cracks: Crack[] = [
		{ from: middle, to: table[0], start: 0.1, end: 0.4 },
		{ from: middle, to: table[2], start: 0.1, end: 0.4 },
	];
	table.forEach((corner, index) => {
		const next = (index + 1) % 4;
		const [inside, outside] = breaks[index];
		pieces.push([corner, corners[index], outside, inside]);
		pieces.push([inside, outside, corners[next], table[next]]);
		cracks.push({ from: corner, to: corners[index], start: 0.35, end: 0.7 });
		cracks.push({ from: inside, to: outside, start: 0.5, end: 0.8 });
		cracks.push({ from: corner, to: table[next], start: 0.75, end: 1 });
	});

	return { cracks, owner: byPieces(pieces), middle };
})();

// the amethyst breaks along its girdle and facet lines, and once more across its pavilion
const AMETHYST_BREAKAGE = ((): Breakage => {
	const pieces: Point[][] = [
		[
			[11, 5],
			[20, 5],
			[14, 15],
			[3, 15],
		],
		[
			[20, 5],
			[28, 5],
			[25, 15],
			[14, 15],
		],
		[
			[28, 5],
			[36, 15],
			[25, 15],
		],
		[
			[3, 15],
			[14, 15],
			[17, 26],
			[11, 26],
		],
		[
			[14, 15],
			[25, 15],
			[23, 26],
			[17, 26],
		],
		[
			[25, 15],
			[36, 15],
			[28, 26],
			[23, 26],
		],
		[
			[11, 26],
			[17, 26],
			[20, 37],
		],
		[
			[17, 26],
			[23, 26],
			[20, 37],
		],
		[
			[23, 26],
			[28, 26],
			[20, 37],
		],
	];
	const cracks: Crack[] = [
		{ from: [20, 15], to: [3, 15], start: 0.1, end: 0.4 },
		{ from: [20, 15], to: [36, 15], start: 0.1, end: 0.4 },
		{ from: [14, 15], to: [20, 5], start: 0.35, end: 0.6 },
		{ from: [25, 15], to: [28, 5], start: 0.35, end: 0.6 },
		{ from: [14, 15], to: [20, 37], start: 0.4, end: 0.8 },
		{ from: [25, 15], to: [20, 37], start: 0.4, end: 0.8 },
		{ from: [20, 26], to: [11, 26], start: 0.75, end: 1 },
		{ from: [20, 26], to: [28, 26], start: 0.75, end: 1 },
	];

	return { cracks, owner: byPieces(pieces), middle: [20, 18] };
})();

const partLine = (canvas: PixelCanvas, from: Point, to: Point, amount: number, c: number) =>
	canvas.line(
		from[0],
		from[1],
		from[0] + (to[0] - from[0]) * amount,
		from[1] + (to[1] - from[1]) * amount,
		c,
	);

// winning: the cracks open one after another, each with a lit lip; at the end every piece
// stands apart
const cracking = (art: PixelCanvas, { cracks }: Breakage, ramp: readonly number[]) =>
	Array.from({ length: HURT_FRAMES }, (_, frame) => {
		const t = (frame + 1) / HURT_FRAMES;
		const canvas = art.clone();
		for (const { from, to, start, end } of cracks) {
			const amount = span(t, start, end);
			if (amount <= 0) continue;
			const lip = new PixelCanvas(40, 40);
			partLine(lip, [from[0] - 1, from[1]], [to[0] - 1, to[1]], amount, ramp[5]);
			canvas.paint((x, y) => lip.get(x, y) !== CLEAR, ramp[5]);
			const dark = new PixelCanvas(40, 40);
			partLine(dark, from, to, amount, INK);
			canvas.paint((x, y) => dark.get(x, y) !== CLEAR, INK);
		}

		return outlined(canvas);
	});

// going: the pieces fly out from the middle and fall, each a solid shard that wears away.
// reach: how far they fly, in pixels.
const shattering = (
	art: PixelCanvas,
	{ owner, middle }: Breakage,
	{ seed = 5, reach = 9 } = {},
) => {
	const parts: PixelCanvas[] = [];
	const sums: { x: number; y: number; count: number }[] = [];
	for (let y = 0; y < art.height; y++)
		for (let x = 0; x < art.width; x++) {
			const c = art.get(x, y);
			if (c === CLEAR) continue;
			const index = owner(x, y);
			parts[index] ??= new PixelCanvas(GONE_PIXELS, GONE_PIXELS);
			sums[index] ??= { x: 0, y: 0, count: 0 };
			parts[index].set(x + GONE_MARGIN, y + GONE_MARGIN, c);
			sums[index].x += x;
			sums[index].y += y;
			sums[index].count++;
		}
	let state = seed;
	const random = () => (state = (state * 16807) % 2147483647) / 2147483647;
	const flights = sums.map((sum) => {
		const angle =
			Math.atan2(sum.y / sum.count - middle[1], sum.x / sum.count - middle[0]) +
			(random() - 0.5) * 0.5;
		const far = reach * (1 + random());

		return { x: Math.cos(angle) * far, y: Math.sin(angle) * far - 4, wear: 0.45 + random() * 0.2 };
	});
	// a piece with its outermost pixels gone
	const worn = (canvas: PixelCanvas) =>
		canvas
			.clone()
			.paint(
				(x, y) =>
					canvas.get(x - 1, y) === CLEAR ||
					canvas.get(x + 1, y) === CLEAR ||
					canvas.get(x, y - 1) === CLEAR ||
					canvas.get(x, y + 1) === CLEAR,
				CLEAR,
			);

	return Array.from({ length: GONE_FRAMES }, (_, frame) => {
		const t = (frame + 1) / GONE_FRAMES;
		const canvas = new PixelCanvas(GONE_PIXELS, GONE_PIXELS);
		parts.forEach((piece, index) => {
			const flight = flights[index];
			const out = 1 - (1 - t) ** 2;
			let shard = piece;
			const wears = Math.floor(span(t, flight.wear, 1) * 5);
			for (let wear = 0; wear < wears; wear++) shard = worn(shard);
			canvas.blit(
				outlined(shard.clone()),
				Math.round(flight.x * out),
				Math.round(flight.y * out + 16 * t * t),
			);
		});

		return canvas;
	});
};

// --- the sword is bitten through
// winning: the bite goes through the blade, glowing; then the point comes away
const swordHurt = () =>
	Array.from({ length: HURT_FRAMES }, (_, frame) => {
		const t = (frame + 1) / HURT_FRAMES;
		if (t <= 0.6) return outlined(swordArt({ bite: span(t, 0.05, 0.55) }));

		return outlined(swordArt({ snapped: true, drop: Math.round(4 * span(t, 0.6, 1)) }));
	});
// going: the hilt, the two halves of the blade and its tip fall apart
const SWORD_BREAKAGE: Breakage = {
	cracks: [],
	owner: (x, y) => {
		const a = (x - 4 + (36 - y)) / 1.4142;

		return a < 11 ? 0 : a < 28.5 ? 1 : a < 37 ? 2 : 3;
	},
	middle: along(27, 1),
};

// --- the shield is clawed apart
// winning: three claws rake across it, one after another
const shieldHurt = () =>
	Array.from({ length: HURT_FRAMES }, (_, frame) => {
		const t = (frame + 1) / HURT_FRAMES;

		return outlined(
			shieldArt(GASHES.map((_, index) => span(t, 0.05 + index * 0.28, 0.33 + index * 0.28))),
		);
	});
// going: it comes apart along the claw marks
const SHIELD_BREAKAGE: Breakage = {
	cracks: [],
	owner: (x, y) =>
		GASHES.filter(([x0, y0, x1, y1]) => (x - x0) * (y1 - y0) - (y - y0) * (x1 - x0) > 0).length,
	middle: [20, 20],
};

// --- the helm burns to ash
const HELM_BURN = 15;
// winning: the scorch spreads over it from the upper right, then the fire shows inside
const helmHurt = () =>
	Array.from({ length: HURT_FRAMES }, (_, frame) => {
		const t = (frame + 1) / HURT_FRAMES;

		return outlined(helmArt({ burn: HELM_BURN * span(t, 0, 0.6), glow: span(t, 0.5, 1) }));
	});
// going: the burn takes all of it, and it falls to ash from the top down while smoke rises
const helmGone = () => {
	const st = RAMPS.stone;
	const grain = (x: number, y: number) => ((((x * 73856093) ^ (y * 19349663)) >>> 0) % 1000) / 1000;

	return Array.from({ length: GONE_FRAMES }, (_, frame) => {
		const t = (frame + 1) / GONE_FRAMES;
		const art = helmArt({ burn: HELM_BURN + 45 * span(t, 0, 0.3), glow: 1 - span(t, 0.1, 0.4) });
		const standing = cell();
		const ash: [number, number, number][] = [];
		for (let y = 0; y < 40; y++)
			for (let x = 0; x < 40; x++) {
				const c = art.get(x, y);
				if (c === CLEAR) continue;
				const falls = 0.08 + 0.5 * (y / 40) + 0.2 * grain(x, y);
				if (t < falls) {
					standing.set(x, y, c);
					continue;
				}
				const age = t - falls;
				const to = y + 6 * age + 110 * age * age;
				// most of it is gone as it falls; what is left is soot, with an ember here and there
				if (age > 0.32 || to > 38 || grain(y, x) < 0.45) continue;
				ash.push([
					x,
					to,
					grain(x + 7, y) < 0.06 ? RAMPS.fire[3] : st[1 + Math.floor(grain(y, x) * 3)],
				]);
			}
		const canvas = new PixelCanvas(GONE_PIXELS, GONE_PIXELS);
		// smoke rising off it, in three slow puffs
		[
			[13, 0.15],
			[25, 0.3],
			[19, 0.45],
		].forEach(([x, from], index) => {
			const life = span(t, from, from + 0.55);
			if (life <= 0 || life >= 1) return;
			const size = 2 + 3 * life;
			canvas.ellipse(
				x + GONE_MARGIN + (index - 1) * 3 * life,
				22 - 22 * life,
				size,
				size * 0.8,
				st[life > 0.6 ? 2 : 3],
			);
		});
		canvas.blit(outlined(standing), GONE_MARGIN, GONE_MARGIN);
		for (const [x, y, c] of ash) canvas.set(x + GONE_MARGIN, y + GONE_MARGIN, c);

		return canvas;
	});
};

export const SYMBOL_DRAWINGS = {
	symbolL1: ruby,
	symbolL2: sapphire,
	symbolL3: emerald,
	symbolL4: amethyst,
	symbolH1: crown,
	symbolH2: sword,
	symbolH3: shield,
	symbolH4: helm,
	symbolScatter: dragonEye,
	symbolWild: wild,
} as const;

export type SymbolKey = keyof typeof SYMBOL_DRAWINGS;

// Frame runs beside the still art, keyed like the symbols with a suffix: a gem's Turn (the light
// going once round it), the scatter's Blink and Alert, a symbol's Rest (what it does now and then
// on the board), its Hurt (what the dragon does to it as it wins; the last frame stays until it
// goes) and its Gone (how it leaves the board, on a wider canvas of GONE_PIXELS).
export const SYMBOL_FRAME_RUNS = (): Record<string, PixelCanvas[]> => {
	const turns = (draw: (turn: number) => PixelCanvas) =>
		Array.from({ length: GEM_TURNS }, (_, turn) => draw(turn));
	const rubyBreakage = gemBreakage(RUBY);
	const sapphireBreakage = gemBreakage(SAPPHIRE, SAPPHIRE_CUT);

	return {
		symbolL1Turn: turns(ruby),
		symbolL2Turn: turns(sapphire),
		symbolL3Turn: turns(emerald),
		symbolL4Turn: turns(amethyst),
		symbolScatterBlink: [dragonEye({ lid: 1 }), dragonEye({ lid: 2 }), dragonEye({ lid: 1 })],
		symbolScatterAlert: [dragonEye({ alert: true })],
		symbolH1Rest: glide(crownArt(), RAMPS.gold),
		symbolH1Hurt: crownHurt(),
		symbolH1Gone: crownGone(),
		symbolH2Rest: glide(swordArt(), RAMPS.steel),
		symbolH2Hurt: swordHurt(),
		symbolH2Gone: shattering(swordArt({ snapped: true, drop: 4 }), SWORD_BREAKAGE, { reach: 9 }),
		symbolH3Rest: glide(shieldArt(), RAMPS.gold),
		symbolH3Hurt: shieldHurt(),
		symbolH3Gone: shattering(shieldArt([1, 1, 1]), SHIELD_BREAKAGE, { reach: 10 }),
		symbolH4Rest: glide(helmArt(), RAMPS.steel),
		symbolH4Hurt: helmHurt(),
		symbolH4Gone: helmGone(),
		symbolL1Hurt: cracking(rubyArt(), rubyBreakage, RAMPS.red),
		symbolL1Gone: shattering(rubyArt(), rubyBreakage),
		symbolL2Hurt: cracking(sapphireArt(), sapphireBreakage, RAMPS.blue),
		symbolL2Gone: shattering(sapphireArt(), sapphireBreakage),
		symbolL3Hurt: cracking(emeraldArt(), EMERALD_BREAKAGE, RAMPS.green),
		symbolL3Gone: shattering(emeraldArt(), EMERALD_BREAKAGE),
		symbolL4Hurt: cracking(amethystArt(), AMETHYST_BREAKAGE, RAMPS.violet),
		symbolL4Gone: shattering(amethystArt(), AMETHYST_BREAKAGE),
	};
};
