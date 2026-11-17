import { PixelCanvas } from './canvas.ts';
import { RAMPS, WHITE, color } from './palette.ts';
import { tidy } from './anticipationArt.ts';

// The Dragon's Gaze (approved 2026-11-17): a thick beam of dragon-fire. Its flame edges are solid
// heat bands; inside, its light is banded and see-through, so the values it has already doubled
// stay readable; a white-hot thread runs down its middle. It narrows to a point at its front. On
// the symbols' grid, 64 art pixels to a cell; positions in art pixels from the board's top-left.
const FIRE = RAMPS.fire; // 571c27 8e251d c64524 ff5000 ffa214 ffeb57 ffffff

// how see-through the beam's light is, and the colours of its two bands
export const GAZE_LIGHT_ALPHA = 0.67;
const LIGHT = [color(0xff5000), color(0xffa214)];

// smooth value noise on an endless grid, from a hash of each knot
const knot = (i: number, j: number, seed: number) => {
	let h = Math.imul(i, 374761393) ^ Math.imul(j, 668265263) ^ Math.imul(seed, 2246822519);
	h = Math.imul(h ^ (h >>> 13), 1274126177);
	return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const noise = (u: number, v: number, seed: number) => {
	const [i, j] = [Math.floor(u), Math.floor(v)];
	const s = (t: number) => t * t * (3 - 2 * t);
	const [a, b] = [s(u - i), s(v - j)];
	return (
		(knot(i, j, seed) * (1 - a) + knot(i + 1, j, seed) * a) * (1 - b) +
		(knot(i, j + 1, seed) * (1 - a) + knot(i + 1, j + 1, seed) * a) * b
	);
};

export type Beam = {
	edge: PixelCanvas;
	light: PixelCanvas;
	// where the canvases' (0, 0) stands, in art pixels from the board's top-left
	x: number;
	y: number;
};

// One straight run of the beam from (x0, y0) to (x1, y1), its half-width going from half0 to half1.
// `head`: it narrows to a point at its far end. `flicker` moves the fire's pattern along it.
export const beamRun = ({
	x0,
	y0,
	x1,
	y1,
	half0,
	half1,
	head = false,
	flicker = 0,
	seed = 9,
}: {
	x0: number;
	y0: number;
	x1: number;
	y1: number;
	half0: number;
	half1: number;
	head?: boolean;
	flicker?: number;
	seed?: number;
}): Beam => {
	const reach = Math.max(half0, half1) * 1.6 + 2;
	const left = Math.floor(Math.min(x0, x1) - reach);
	const top = Math.floor(Math.min(y0, y1) - reach);
	const width = Math.ceil(Math.max(x0, x1) + reach) - left;
	const height = Math.ceil(Math.max(y0, y1) + reach) - top;
	const edge = new PixelCanvas(width, height);
	const light = new PixelCanvas(width, height);
	const length = Math.max(1, Math.hypot(x1 - x0, y1 - y0));
	const [dx, dy] = [(x1 - x0) / length, (y1 - y0) / length];
	for (let y = 0; y < height; y++)
		for (let x = 0; x < width; x++) {
			const px = left + x + 0.5 - x0;
			const py = top + y + 0.5 - y0;
			const along = px * dx + py * dy;
			const t = Math.max(0, Math.min(1, along / length));
			const across = px * -dy + py * dx;
			const off = Math.hypot(px - dx * t * length, py - dy * t * length);
			const half = half0 + (half1 - half0) * t;
			const air =
				0.6 * noise(across / 4, along / 14 - flicker * 0.7, seed) +
				0.4 * noise(across / 2, along / 6 - flicker * 1.3, seed + 3);
			let heat = 1.25 - off / half + 0.8 * (air - 0.5);
			if (along > length + 2) heat = -1;
			// the front narrows to a point
			if (head && along > length - 10) heat -= (along - (length - 10)) / 14;
			if (heat >= 1.18) edge.set(x, y, WHITE);
			else if (heat >= 1.08) edge.set(x, y, FIRE[5]);
			else if (heat >= 0.85) light.set(x, y, LIGHT[1]);
			else if (heat >= 0.68) light.set(x, y, LIGHT[0]);
			else if (heat >= 0.55) edge.set(x, y, FIRE[4]);
			else if (heat >= 0.42) edge.set(x, y, FIRE[3]);
			else if (heat >= 0.3) edge.set(x, y, FIRE[2]);
			else if (heat >= 0.18) edge.set(x, y, FIRE[1]);
		}
	return { edge: tidy(edge), light, x: left, y: top };
};

// the beam's measures: half-width where it leaves its source, and down the reel
export const GAZE_BEAM = { from: 8, reel: 22, top: -6, front: 8 } as const;
export const GAZE_FLICKERS = 2;

// The beam down a reel, its front at the top of `row` (0 to 4) or, past the last, on the floor.
export const reelBeam = (row: number, rows: number, flicker: number) =>
	beamRun({
		x0: 32,
		y0: GAZE_BEAM.top,
		x1: 32,
		y1: Math.min(row, rows) * 64 + GAZE_BEAM.front + (row >= rows ? -8 : 0),
		half0: GAZE_BEAM.reel,
		half1: GAZE_BEAM.reel,
		head: row < rows,
		flicker,
	});
