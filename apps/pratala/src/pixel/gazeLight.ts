import * as PIXI from 'pixi.js';

import { PALETTE, RAMPS } from './palette.ts';

// The dragon's gaze as light, painted again on every frame into a grid of art pixels: a slit of
// light the shape of its pupil standing on the board (the lit band, drawn like the Dragon's Gaze,
// gazeBeamFrames), and the sheet of light that joins it to the pupil, faint, straight-edged. The
// game adds it over the board. Everything is in the grid's art pixels.
export type GazeLight = {
	// where the gaze leaves the pupil, and the pupil's half-width there
	pupil: { x: number; y: number; half: number };
	// the board's top and bottom rows; the grid is as wide as the board
	top: number;
	bottom: number;
	// the middle of the lit band, its half-width, and the row its light has come down to
	x: number;
	half: number;
	front: number;
	// how many steps down the fire ramp the band has cooled
	cool: number;
	// 0 to 1: how strong the light is
	strength: number;
	// 0 or 2: moves the dither, so the light shimmers on the pixel clock
	shimmer: number;
};

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
// the sheet is faint: this much of the fire ramp's orange
const SHEET = 0.2;
// the band narrows to a point over its last rows while it comes down
const HEAD = 16;

const rgb = (hex: number) => [(hex >> 16) & 0xff, (hex >> 8) & 0xff, hex & 0xff] as const;
const FIRE = RAMPS.fire.map((index) => rgb(PALETTE[index]));

export const createGazeLight = (width: number, height: number) => {
	const bytes = new Uint8Array(width * height * 4);
	const pixels = new Uint32Array(bytes.buffer);
	const source = new PIXI.BufferImageSource({
		resource: bytes,
		width,
		height,
		format: 'rgba8unorm',
		scaleMode: 'nearest',
		alphaMode: 'premultiplied-alpha',
	});
	const texture = new PIXI.Texture({ source });

	// a colour of the fire ramp at a strength, as one little-endian RGBA pixel
	const shade = (step: number, strength: number) => {
		const [r, g, b] = FIRE[Math.max(0, Math.min(FIRE.length - 1, step))];

		return (
			((255 << 24) |
				(Math.round(b * strength) << 16) |
				(Math.round(g * strength) << 8) |
				Math.round(r * strength)) >>>
			0
		);
	};

	const paint = (light: GazeLight | undefined) => {
		pixels.fill(0);
		if (light && light.strength > 0) {
			const { pupil, top, bottom, x: middle, half, cool, strength, shimmer } = light;
			const front = Math.min(bottom, light.front);
			const steps = [6, 5, 4, 3].map((step) => shade(step - cool, strength));
			const sheet = shade(3 - cool, strength * SHEET);
			// the lit band's box, which the sheet runs down to from the pupil
			const left = middle - half;
			const right = middle + half;
			const boxTop = Math.min(top, front);
			const along = (to: number, toRow: number, y: number) =>
				toRow <= pupil.y ? to : pupil.x + ((to - pupil.x) * (y - pupil.y)) / (toRow - pupil.y);
			for (let y = Math.max(0, Math.floor(pupil.y)); y < Math.min(height, Math.ceil(front)); y++) {
				const row = y * width;
				// the band, where the light has come down to on the board
				const lit = y >= top;
				const reach = lit ? half * Math.min(1, (front - y) / HEAD) : 0;
				// the sheet: the pupil and the band's box, joined by straight edges
				const opening = Math.max(0, 1 - (y - pupil.y) / Math.max(1, boxTop - pupil.y));
				let from = Math.min(along(left, front, y), y < boxTop ? along(left, boxTop, y) : left);
				let to = Math.max(along(right, front, y), y < boxTop ? along(right, boxTop, y) : right);
				from -= pupil.half * opening;
				to += pupil.half * opening;
				for (let x = Math.max(0, Math.floor(from)); x < Math.min(width, Math.ceil(to)); x++) {
					const side = Math.abs(x + 0.5 - middle);
					if (side <= reach) {
						const out = side / Math.max(1, reach);
						const bayer = BAYER[((y + shimmer) % 4) * 4 + (x % 4)];
						if (out < 0.16) pixels[row + x] = steps[0];
						else if (out < 0.34) pixels[row + x] = steps[1];
						else if (out < 0.56) pixels[row + x] = (1 - out) * 16 > bayer ? steps[2] : steps[3];
						else if ((1 - out) * 26 > bayer) pixels[row + x] = steps[3];
						else pixels[row + x] = sheet;
					} else pixels[row + x] = sheet;
				}
			}
		}
		source.update();
	};

	return { texture, paint, destroy: () => texture.destroy(true) };
};
