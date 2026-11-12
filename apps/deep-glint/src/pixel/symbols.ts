import { PixelCanvas } from './canvas.ts';
import { CLEAR, INK, LIGHTER, RAMPS, WHITE, color } from './palette.ts';
import { bevel, facetedGem, lightAt, outlined, part } from './shapes.ts';

// Reel symbols, drawn by code on a 40 × 40 art-pixel cell with a clear pixel round the edge for
// the outline. Low symbols are four cut gems told apart by cut and colour; high symbols are the
// hoard's prizes; the scatter is the dragon's eye.
export const SYMBOL_PIXELS = 40;

const cell = () => new PixelCanvas(SYMBOL_PIXELS, SYMBOL_PIXELS);

// Every gem can be drawn with the light turned part of the way round it (turn 0 is the art the
// reels show), so a run of turns makes the light travel round its facets.
export const GEM_TURNS = 8;

// L1: a round ruby
const ruby = (turn = 0) =>
	outlined(
		facetedGem(
			cell(),
			[
				[13, 3],
				[26, 3],
				[36, 13],
				[36, 26],
				[26, 36],
				[13, 36],
				[3, 26],
				[3, 13],
			],
			RAMPS.red,
			{ light: lightAt(turn, GEM_TURNS) },
		),
	);

// L2: a pear-cut sapphire
const sapphire = (turn = 0) =>
	outlined(
		facetedGem(
			cell(),
			[
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
			],
			RAMPS.blue,
			{ table: 0.5, lift: 2, light: lightAt(turn, GEM_TURNS) },
		),
	);

// L3: an emerald, step cut
const emerald = (turn = 0) => {
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
	return outlined(canvas);
};

// L4: an amethyst in the classic diamond profile
const amethyst = (turn = 0) => {
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
	return outlined(canvas);
};

// H1: the crown
const crown = () => {
	const canvas = cell();
	const g = RAMPS.gold;
	const r = RAMPS.red;
	// velvet behind the points
	canvas.poly(r[2], [7, 25], [7, 18], [12, 23], [19, 12], [20, 12], [27, 23], [32, 18], [32, 25]);
	canvas.poly(r[3], [8, 25], [8, 20], [12, 24], [18, 15], [18, 25]);
	canvas.dots(r[4], [10, 23], [15, 21], [16, 19]);
	const body = part(
		40,
		40,
		(c) => {
			// left half of the silhouette, mirrored: the band, a side point and half the centre point
			c.poly(g[4], [3, 34], [3, 10], [5, 10], [11, 26], [14, 26], [18, 5], [19, 5], [19, 34]);
			c.mirror();
		},
		bevel,
	);
	canvas.blit(body);
	// the faces turned from the light
	canvas.poly(g[3], [21, 8], [25, 25], [22, 25], [20, 12]);
	canvas.poly(g[3], [33, 15], [35, 12], [35, 25], [30, 25]);
	canvas.poly(g[3], [5, 14], [9, 25], [6, 25]);
	canvas.line(18, 7, 15, 25, g[5]);
	canvas.line(4, 12, 4, 25, g[5]);
	// the band: a bright upper lip, a shaded lower one
	canvas.rect(4, 26, 32, 1, g[5]);
	canvas.rect(4, 27, 32, 1, g[2]);
	canvas.rect(4, 32, 32, 2, g[3]);
	canvas.rect(4, 34, 32, 1, g[2]);
	canvas.rect(34, 27, 2, 7, g[3]);
	// pearls on the tips
	for (const [x, y] of [
		[4, 8],
		[19.5, 3.5],
		[35, 8],
	] as const) {
		canvas.ellipse(x, y, 2.3, 2.3, color(0xf9e6cf));
		canvas.set(x - 1, y - 1, WHITE);
		canvas.set(x + 1, y + 1, color(0xe69c69));
	}
	// jewels on the band: a ruby between two sapphires
	const jewel = (x: number, ramp: readonly number[], size: number) => {
		canvas.poly(ramp[3], [x, 30 - size], [x + size, 30], [x, 30 + size], [x - size, 30]);
		canvas.poly(ramp[1], [x, 30], [x + size, 30], [x, 30 + size]);
		canvas.set(x - 1, 29, ramp[5]);
		canvas.set(x, 30 - size, ramp[4]);
	};
	jewel(20, RAMPS.red, 3);
	jewel(10, RAMPS.blue, 2);
	jewel(30, RAMPS.blue, 2);
	return outlined(canvas);
};

// H2: the sword, point up and to the right
const sword = () => {
	const canvas = cell();
	const s = RAMPS.steel;
	const g = RAMPS.gold;
	// blade: a lit face and a shaded face either side of the ridge
	canvas.poly(s[5], [12, 22], [31, 3], [37, 2], [16, 24]);
	canvas.poly(s[3], [16, 24], [37, 2], [36, 8], [18, 27]);
	canvas.line(13, 22, 32, 3, WHITE);
	canvas.line(16, 24, 36, 4, s[4]);
	canvas.line(18, 27, 36, 9, s[2]);
	canvas.dots(WHITE, [36, 3], [35, 3]);
	// grip
	canvas.poly(RAMPS.wood[3], [11, 26], [14, 29], [8, 35], [5, 32]);
	canvas.line(11, 27, 6, 32, RAMPS.wood[4]);
	canvas.line(13, 29, 8, 34, RAMPS.wood[2]);
	canvas.line(10, 27, 12, 29, RAMPS.wood[1]);
	canvas.line(8, 29, 10, 31, RAMPS.wood[1]);
	// crossguard
	const guard = part(40, 40, (c) => c.poly(g[4], [6, 18], [9, 16], [24, 31], [21, 33]), bevel);
	canvas.blit(guard);
	canvas.ellipse(7, 17, 2.4, 2.4, g[4]);
	canvas.ellipse(22.5, 32, 2.4, 2.4, g[3]);
	canvas.set(6, 16, g[5]);
	// pommel with a ruby
	canvas.ellipse(5.5, 34.5, 3, 3, g[4]);
	canvas.ellipse(5.5, 34.5, 1.4, 1.4, RAMPS.red[3]);
	canvas.set(4, 33, g[5]);
	canvas.set(5, 34, RAMPS.red[5]);
	canvas.set(7, 36, g[2]);
	return outlined(canvas);
};

// H3: the shield
const shield = () => {
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
	// the right half sits in shadow
	field.paint((x) => x >= 20, b[2]);
	field.edge(0, -1, 'lighter');
	field.edge(1, 0, 'darker');
	canvas.blit(field);
	canvas.line(20, 7, 20, 31, b[1]);
	// a gold chevron and the boss
	canvas.poly(g[4], [8, 12], [20, 18], [20, 22], [8, 16]);
	canvas.poly(g[3], [20, 18], [31, 12], [31, 16], [20, 22]);
	canvas.line(8, 12, 20, 18, g[5]);
	canvas.ellipse(19.5, 12.5, 3.4, 3.4, g[4]);
	canvas.ellipse(19.5, 12.5, 1.6, 1.6, RAMPS.red[3]);
	canvas.set(18, 11, g[5]);
	canvas.set(19, 12, RAMPS.red[5]);
	canvas.dots(g[5], [7, 7], [31, 7]);
	canvas.dots(g[2], [8, 8], [32, 8]);
	canvas.line(9, 20, 9, 23, b[4]);
	return outlined(canvas);
};

// H4: the potion
const potion = () => {
	const canvas = cell();
	const p = RAMPS.pink;
	const s = RAMPS.steel;
	// glass: neck, lip and round body
	canvas.ellipse(19.5, 25, 12.5, 11.5, s[2]);
	canvas.rect(16, 8, 8, 9, s[2]);
	canvas.rect(14, 7, 12, 3, s[4]);
	canvas.rect(14, 7, 12, 1, s[5]);
	canvas.rect(24, 8, 2, 2, s[3]);
	// liquid
	const liquid = new PixelCanvas(40, 40);
	liquid.ellipse(19.5, 25, 10.5, 9.5, p[3]);
	liquid.paint((_, y) => y < 19, -1);
	liquid.paint((x, y) => x + y > 52, p[2]);
	liquid.paint((x, y) => x + y > 58, p[1]);
	canvas.blit(liquid);
	canvas.rect(10, 19, 20, 1, p[5]);
	canvas.rect(11, 20, 18, 1, p[4]);
	// neck glass and shine
	canvas.rect(17, 10, 6, 8, s[3]);
	canvas.rect(17, 10, 2, 8, s[4]);
	canvas.line(11, 22, 11, 28, p[5]);
	canvas.line(12, 21, 12, 24, WHITE);
	canvas.line(10, 17, 13, 14, s[5]);
	canvas.dots(p[5], [20, 26], [24, 23], [17, 30]);
	canvas.dots(WHITE, [22, 29]);
	// cork
	canvas.rect(16, 2, 8, 5, RAMPS.wood[4]);
	canvas.rect(16, 2, 8, 1, RAMPS.wood[5]);
	canvas.rect(22, 3, 2, 4, RAMPS.wood[3]);
	canvas.rect(16, 6, 8, 1, RAMPS.wood[2]);
	return outlined(canvas);
};

// S: the dragon's eye, set in gold
// lid: how far the lids have closed, 0 open, 1 half, 2 shut. alert: the eye has seen something:
// the pupil narrows to a line and the iris burns brighter.
const dragonEye = ({ lid = 0, alert = false }: { lid?: 0 | 1 | 2; alert?: boolean } = {}) => {
	const canvas = cell();
	const g = RAMPS.gold;
	const f = RAMPS.fire;
	const glow = alert ? 1 : 0;
	// horned setting
	const setting = part(
		40,
		40,
		(c) => {
			c.ellipse(19.5, 17.5, 16, 15, g[4]);
			c.poly(g[4], [3, 9], [9, 2], [11, 9]);
			c.poly(g[4], [36, 9], [30, 2], [28, 9]);
			c.poly(g[4], [16, 31], [23, 31], [19, 37]);
		},
		bevel,
	);
	canvas.blit(setting);
	canvas.ring(19.5, 17.5, 14, 13, 1, g[2]);
	// the eye: dark lids, a fiery iris and a slit pupil
	canvas.ellipse(19.5, 17.5, 12.5, 11.5, RAMPS.red[0]);
	canvas.ellipse(19.5, 17.5, 11.5, 9.5, f[3 + glow]);
	canvas.ellipse(19.5, 17.5, 9.5, 8, f[4 + glow]);
	canvas.ellipse(19.5, 17.5, 6.5, 6.5, f[5 + glow]);
	canvas.ellipse(19.5, 17.5, alert ? 1 : 2, 8, INK);
	canvas.rect(19, 9, 2, 1, RAMPS.red[0]);
	canvas.dots(WHITE, [15, 13], [16, 13], [15, 14]);
	canvas.dots(f[6], [23, 21]);
	// radial flecks in the iris
	canvas.dots(f[3 + glow], [12, 17], [27, 18], [14, 22], [25, 13], [13, 13], [26, 22]);
	// the lids: scaled red skin closing from above and below, a dark line where they meet
	if (lid) {
		const open = lid === 1 ? 4 : 0;
		const inEye = (x: number, y: number) =>
			((x - 19.5) / 12.5) ** 2 + ((y - 17.5) / 11.5) ** 2 <= 1;
		canvas.paint((x, y) => inEye(x, y) && Math.abs(y - 17.5) > open, RAMPS.red[2]);
		canvas.paint(
			(x, y) => inEye(x, y) && Math.abs(y - 17.5) > open && Math.abs(y - 17.5) <= open + 1,
			RAMPS.red[0],
		);
		canvas.paint((x, y) => inEye(x, y) && y < 17.5 - open - 1 && (x + y) % 5 === 0, RAMPS.red[3]);
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

export const SYMBOL_DRAWINGS = {
	symbolL1: ruby,
	symbolL2: sapphire,
	symbolL3: emerald,
	symbolL4: amethyst,
	symbolH1: crown,
	symbolH2: sword,
	symbolH3: shield,
	symbolH4: potion,
	symbolScatter: dragonEye,
	symbolWild: wild,
} as const;

export type SymbolKey = keyof typeof SYMBOL_DRAWINGS;

// Frame runs beside the still art, keyed like the symbols with a suffix: a gem's Turn (the light
// going once round it), and the scatter's Blink and Alert.
export const SYMBOL_FRAME_RUNS = (): Record<string, PixelCanvas[]> => {
	const turns = (draw: (turn: number) => PixelCanvas) =>
		Array.from({ length: GEM_TURNS }, (_, turn) => draw(turn));

	return {
		symbolL1Turn: turns(ruby),
		symbolL2Turn: turns(sapphire),
		symbolL3Turn: turns(emerald),
		symbolL4Turn: turns(amethyst),
		symbolScatterBlink: [dragonEye({ lid: 1 }), dragonEye({ lid: 2 }), dragonEye({ lid: 1 })],
		symbolScatterAlert: [dragonEye({ alert: true })],
	};
};
