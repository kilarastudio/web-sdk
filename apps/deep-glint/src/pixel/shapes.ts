import { PixelCanvas, type Point } from './canvas.ts';
import { CLEAR, DARKER, INK, LIGHTER, WHITE } from './palette.ts';

// light falls from the top left on everything
export const LIGHT: Point = [-0.6, -0.8];

// the light turned part of the way round a gem, for the frames where it runs round the facets
export const lightAt = (turn: number, turns: number): Point => {
	const angle = Math.atan2(LIGHT[1], LIGHT[0]) + (Math.PI * 2 * turn) / turns;

	return [Math.cos(angle), Math.sin(angle)];
};

// a ramp colour for a surface facing the light (1) or away from it (-1), keeping the ramp's ends
// for outlines and sparkles
export const tone = (ramp: readonly number[], brightness: number) => {
	const span = ramp.length - 3;
	const at = 1 + Math.round(((Math.max(-1, Math.min(1, brightness)) + 1) / 2) * span);
	return ramp[at];
};

const centre = (points: readonly Point[]): Point => [
	points.reduce((sum, [x]) => sum + x, 0) / points.length,
	points.reduce((sum, [, y]) => sum + y, 0) / points.length,
];

// A cut gem seen from above: a ring of facets, each lit by how it faces the light, round a flat
// table with a hard highlight.
export const facetedGem = (
	canvas: PixelCanvas,
	outer: readonly Point[],
	ramp: readonly number[],
	{ table = 0.52, lift = 0, light = LIGHT }: { table?: number; lift?: number; light?: Point } = {},
) => {
	const [cx, cy] = centre(outer);
	const inner = outer.map(([x, y]): Point => [
		Math.round(cx + (x - cx) * table),
		Math.round(cy + (y - cy) * table + lift),
	]);
	outer.forEach((point, index) => {
		const next = outer[(index + 1) % outer.length];
		const mx = (point[0] + next[0]) / 2 - cx;
		const my = (point[1] + next[1]) / 2 - cy;
		const length = Math.hypot(mx, my) || 1;
		const brightness = (mx / length) * light[0] + (my / length) * light[1];
		canvas.poly(
			tone(ramp, brightness),
			point,
			next,
			inner[(index + 1) % outer.length],
			inner[index],
		);
	});
	// facet lines, one step darker than the darker facet beside them
	outer.forEach((point, index) => {
		const [ix, iy] = inner[index];
		const c = canvas.get(Math.round((point[0] + ix) / 2), Math.round((point[1] + iy) / 2));
		if (c !== CLEAR) canvas.line(point[0], point[1], ix, iy, DARKER[c]);
	});
	canvas.poly(ramp[ramp.length - 3], ...inner);
	// the table's highlight: a short diagonal streak toward the light
	const [tx, ty] = centre(inner);
	const reach = Math.min(...inner.map(([x, y]) => Math.hypot(x - tx, y - ty))) * 0.55;
	const hx = Math.round(tx + light[0] * reach);
	const hy = Math.round(ty + light[1] * reach);
	canvas.line(hx - 1, hy + 2, hx + 2, hy - 1, ramp[ramp.length - 2]);
	canvas.line(hx - 1, hy + 1, hx + 1, hy - 1, WHITE);
	return canvas;
};

const shade = (canvas: PixelCanvas, source: PixelCanvas) => {
	for (let y = 0; y < source.height; y++)
		for (let x = 0; x < source.width; x++) {
			const c = source.get(x, y);
			if (c === CLEAR) continue;
			const lit = source.get(x - 1, y) === CLEAR || source.get(x, y - 1) === CLEAR;
			const dark = source.get(x + 1, y) === CLEAR || source.get(x, y + 1) === CLEAR;
			if (lit && !dark) canvas.set(x, y, LIGHTER[c]);
			else if (dark && !lit) canvas.set(x, y, DARKER[c]);
		}
	return canvas;
};

// lights the top and left edges of a flat shape and shades its bottom and right ones
export const bevel = (canvas: PixelCanvas) => shade(canvas, canvas.clone());

// a part drawn on its own canvas, so shading that follows its edges cannot leak into its neighbours
export const part = (
	width: number,
	height: number,
	draw: (canvas: PixelCanvas) => void,
	finish?: (canvas: PixelCanvas) => void,
) => {
	const canvas = new PixelCanvas(width, height);
	draw(canvas);
	finish?.(canvas);
	return canvas;
};

// a small four-point sparkle
export const sparkle = (canvas: PixelCanvas, x: number, y: number, size: number, c = WHITE) => {
	canvas.line(x - size, y, x + size, y, c);
	canvas.line(x, y - size, x, y + size, c);
	return canvas;
};

export const outlined = (canvas: PixelCanvas) => canvas.outline(INK);
