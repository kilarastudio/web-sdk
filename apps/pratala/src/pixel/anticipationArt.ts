import { PixelCanvas } from './canvas.ts';
import { CLEAR, RAMPS, WHITE } from './palette.ts';
import { random } from './ui.ts';

// Anticipation (approved 2026-11-17): the column waiting on a scatter is walled in by fire on both
// sides. Each wall is a field of heat, hottest on the column's edge, broken up by a pattern of
// cooler and hotter air that climbs through it, so tongues of fire form, rise and go out on their
// own and nothing sways: the torch flames' heat model (ui.ts flameFrames), banded into the fire
// ramp. The stronger level, for the 4th and 5th scatter, burns wider and taller with a white-hot
// core. On the symbols' grid, 64 art pixels to a cell.
const FIRE = RAMPS.fire; // 571c27 8e251d c64524 ff5000 ffa214 ffeb57 ffffff

export const WALL_FRAMES = 16;

export const WALL_LEVELS = {
	1: {
		half: 11,
		tip: 14,
		feed: 1,
		core: [FIRE[5], FIRE[4], FIRE[4], FIRE[3], FIRE[2], FIRE[1]],
		cuts: [0.92, 0.78, 0.6, 0.42, 0.27, 0.12],
		dim: 0.62,
		light: [
			[0.42, 0xff5000],
			[0.3, 0xc64524],
			[0.22, 0x8e251d],
		],
	},
	2: {
		half: 17,
		tip: 28,
		feed: 1.18,
		core: [WHITE, FIRE[5], FIRE[5], FIRE[4], FIRE[3], FIRE[2], FIRE[1]],
		cuts: [1.08, 0.92, 0.78, 0.6, 0.42, 0.27, 0.12],
		dim: 0.75,
		light: [
			[0.55, 0xffa214],
			[0.42, 0xff5000],
			[0.32, 0xc64524],
		],
	},
} as const;
export type WallLevel = keyof typeof WALL_LEVELS;

// Smooth value noise on a grid `sx` across and `sy` down (taller than wide: rising tongues) that
// repeats every `period` rows, so a fire climbing `period` rows in one loop of frames loops.
const climbingAir = (width: number, period: number, sx: number, sy: number, seed: number) => {
	const next = random(seed);
	const rows = Math.max(2, Math.round(period / sy));
	const columns = Math.ceil(width / sx) + 2;
	const knots = Array.from({ length: rows }, () => Array.from({ length: columns }, next));
	const smooth = (t: number) => t * t * (3 - 2 * t);
	return (x: number, y: number) => {
		const u = x / sx;
		const v = ((((y % period) + period) % period) / period) * rows;
		const [i, j] = [Math.floor(u), Math.floor(v)];
		const [a, b] = [smooth(u - i), smooth(v - j)];
		const row = knots[j % rows];
		const below = knots[(j + 1) % rows];
		return (
			(row[i] * (1 - a) + row[i + 1] * a) * (1 - b) + (below[i] * (1 - a) + below[i + 1] * a) * b
		);
	};
};

// no loose pixels: any with fewer than two drawn neighbours would read as a speck
export const tidy = (canvas: PixelCanvas) => {
	for (let pass = 0; pass < 2; pass++) {
		const drop: [number, number][] = [];
		for (let y = 0; y < canvas.height; y++)
			for (let x = 0; x < canvas.width; x++) {
				if (canvas.get(x, y) === CLEAR) continue;
				const around = [
					[x - 1, y],
					[x + 1, y],
					[x, y - 1],
					[x, y + 1],
				].filter(([nx, ny]) => canvas.get(nx, ny) !== CLEAR).length;
				if (around < 2) drop.push([x, y]);
			}
		for (const [x, y] of drop) canvas.set(x, y, CLEAR);
	}
	return canvas;
};

// One wall as a loop of frames: `height` art pixels of column (the board's), its tongues rising
// `tip` over it. As in a torch flame, heat climbs a row a step, drawn from the cells under it and
// losing a little on the way, more where the air is cooler; here it is fed all the way up the
// column's edge (down the canvas's middle), unevenly, so tongues break off it and rise, and over
// the board they go out. Row 0 of the heat is the canvas's bottom, the column's foot.
export const wallFrames = (level: WallLevel, height: number) => {
	const { half, tip, core, cuts, feed: strength } = WALL_LEVELS[level];
	const width = half * 4;
	const middle = (width - 1) / 2;
	const total = height + tip;
	const climb = 8;
	const drift = WALL_FRAMES * climb;
	const fed = climbingAir(width, drift, 4, 12, level * 41 + 7);
	const air = climbingAir(width, drift, 3, 7, level * 41 + 8);
	// how wide the wall is fed at each height, breathing between about two thirds and one and a
	// third of its half-width as the air climbs
	const reach = climbingAir(2, drift, 1, 22, level * 41 + 9);
	const loss = 0.9 / tip;

	// the air repeats every `drift` rows, so it is worked out once for each row of one repeat
	const table = (noise: (x: number, y: number) => number) =>
		Array.from({ length: drift }, (_, row) =>
			Float32Array.from({ length: width }, (__, x) => noise(x, row)),
		);
	const airAt = table(air);
	const fedAt = table(fed);
	const reachAt = Float32Array.from({ length: drift }, (_, row) => reach(0, row));
	const sideAt = Float32Array.from(
		{ length: width },
		(_, x) => (Math.abs(x - middle) / (width / 2)) ** 2 * 0.05,
	);

	// two grids of heat, swapped each step
	let heat = Array.from({ length: total }, () => new Float32Array(width));
	let spare = Array.from({ length: total }, () => new Float32Array(width));
	const step = (time: number) => {
		const out = spare;
		for (let rise = 0; rise < total; rise++) {
			const row = (((rise - time) % drift) + drift) % drift;
			const airRow = airAt[row];
			const fedRow = fedAt[row];
			const wide = half * (0.6 + 0.8 * reachAt[row]);
			const under = rise ? heat[rise - 1] : undefined;
			const line = out[rise];
			for (let x = 0; x < width; x++) {
				const drawn = under
					? ((x ? under[x - 1] : 0) + under[x] * 2 + (x < width - 1 ? under[x + 1] : 0)) / 4
					: 0;
				const carried = drawn - loss * (1 + 1.2 * (airRow[x] - 0.5)) - sideAt[x];
				const across = Math.abs(x - middle) / wide;
				const feed =
					rise < height && across < 1
						? (1 - across * across) * strength * (0.74 + 0.95 * (fedRow[x] - 0.5))
						: 0;
				line[x] = Math.max(0, feed, carried);
			}
		}
		spare = heat;
		heat = out;
	};
	// heat climbs a row a step, so after `total` steps nothing is left from before
	let time = 0;
	for (; time < total; time++) step(time);

	return Array.from({ length: WALL_FRAMES }, () => {
		for (let s = 0; s < climb; s++) step(time++);
		const canvas = new PixelCanvas(width, total);
		for (let rise = 0; rise < total; rise++)
			for (let x = 0; x < width; x++) {
				const band = cuts.findIndex((cut) => heat[rise][x] >= cut);
				if (band >= 0) canvas.set(x, total - 1 - rise, core[band]);
			}
		return tidy(canvas);
	});
};
