// From linear RGB to palette pixels: tone mapping, ordered dither, nearest palette colour in a
// perceptual space, and ink along the jumps in depth so shapes read as drawn pixel art.
import { PixelCanvas } from '../canvas.ts';
import { CLEAR, DARKER, INK, PALETTE } from '../palette.ts';
import type { RenderResult } from './raymarch.ts';

const srgb = (v: number) => {
	const c = Math.max(0, Math.min(1, v));
	return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
};
export const linear = (v: number) =>
	v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);

// OKLab from linear RGB
const oklab = (r: number, g: number, b: number, out: number[]) => {
	const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
	const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
	const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
	out[0] = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
	out[1] = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
	out[2] = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
	return out;
};

// the palette in OKLab, once
const PALETTE_LAB = (() => {
	const lab = new Float32Array(PALETTE.length * 3);
	const tmp = [0, 0, 0];
	PALETTE.forEach((hex, i) => {
		oklab(linear((hex >> 16) / 255), linear(((hex >> 8) & 0xff) / 255), linear((hex & 0xff) / 255), tmp);
		lab[i * 3] = tmp[0];
		lab[i * 3 + 1] = tmp[1];
		lab[i * 3 + 2] = tmp[2];
	});
	return lab;
})();

// the palette colour nearest to a linear RGB colour, by OKLab distance (chroma weighted a little
// less than lightness, so shading steps stay in one ramp)
export const nearest = (r: number, g: number, b: number, allowed?: readonly number[]) => {
	const lab = oklab(r, g, b, [0, 0, 0]);
	let best = 0;
	let bestD = Infinity;
	const candidates = allowed ?? ALL;
	for (const i of candidates) {
		const dl = lab[0] - PALETTE_LAB[i * 3];
		const da = (lab[1] - PALETTE_LAB[i * 3 + 1]) * 0.9;
		const db = (lab[2] - PALETTE_LAB[i * 3 + 2]) * 0.9;
		const d = dl * dl + da * da + db * db;
		if (d < bestD) {
			bestD = d;
			best = i;
		}
	}
	return best;
};
// index 0 of Endesga 64 is its transparency key, never drawn
const ALL = PALETTE.map((_, i) => i).filter((i) => i !== 0);

const BAYER4 = [
	[0, 8, 2, 10],
	[12, 4, 14, 6],
	[3, 11, 1, 9],
	[15, 7, 13, 5],
];

export type QuantizeOptions = {
	// Reinhard white point; higher keeps more of the highlights
	white?: number;
	// dither amplitude in sRGB units (0 none, 0.06 gentle, 0.12 strong)
	dither?: number;
	// ink the far side of a depth jump larger than this share of the depth
	outline?: number;
	// darken instead of ink: how many ramp steps
	outlineDarken?: number;
	// restrict to these palette indices
	allowed?: readonly number[];
	// pixels with no hit become CLEAR (otherwise the background colour)
	clearBackground?: boolean;
};

const tonemap = (v: number, white: number) => (v * (1 + v / (white * white))) / (1 + v);

export const quantize = (result: RenderResult, options: QuantizeOptions = {}) => {
	const {
		white = 2.5,
		dither = 0.06,
		outline = 0,
		outlineDarken = 0,
		allowed,
		clearBackground = false,
	} = options;
	const { width, height, rgb, depth } = result;
	const canvas = new PixelCanvas(width, height);
	for (let y = 0; y < height; y++)
		for (let x = 0; x < width; x++) {
			const i = y * width + x;
			if (clearBackground && depth[i] === Infinity) continue;
			const threshold = (BAYER4[y & 3][x & 3] / 16 - 0.5) * dither;
			const safe = (v: number) => (Number.isFinite(v) ? v : 0);
			const r = linear(srgb(tonemap(safe(rgb[i * 3]), white)) + threshold);
			const g = linear(srgb(tonemap(safe(rgb[i * 3 + 1]), white)) + threshold);
			const b = linear(srgb(tonemap(safe(rgb[i * 3 + 2]), white)) + threshold);
			canvas.data[i] = nearest(r, g, b, allowed);
		}
	if (outline > 0 || outlineDarken > 0) {
		const marks = new Uint8Array(width * height);
		for (let y = 0; y < height; y++)
			for (let x = 0; x < width; x++) {
				const i = y * width + x;
				const d = depth[i];
				// a pixel is marked when a 4-neighbour is clearly nearer than it
				const near = (j: number) => {
					const dj = depth[j];
					if (dj === Infinity) return false;
					if (d === Infinity) return true;
					return (d - dj) / dj > (outline || outlineDarken > 0 ? Math.max(outline, 0.04) : 1);
				};
				if (
					(x > 0 && near(i - 1)) ||
					(x < width - 1 && near(i + 1)) ||
					(y > 0 && near(i - width)) ||
					(y < height - 1 && near(i + width))
				)
					marks[i] = 1;
			}
		for (let i = 0; i < marks.length; i++) {
			if (!marks[i] || canvas.data[i] === CLEAR) continue;
			if (outline > 0) canvas.data[i] = INK;
			else {
				let c = canvas.data[i];
				for (let k = 0; k < outlineDarken; k++) c = DARKER[c];
				canvas.data[i] = c;
			}
		}
	}
	return canvas;
};

// linear RGB from a hex colour
export const rgbOf = (hex: number): [number, number, number] => [
	linear((hex >> 16) / 255),
	linear(((hex >> 8) & 0xff) / 255),
	linear((hex & 0xff) / 255),
];
