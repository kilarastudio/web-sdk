import * as PIXI from 'pixi.js';

// The hall heating into the boss hall, and cooling back, worked out for every art pixel of the
// picture. The two pictures share one composition, so each pixel only has to change colour, and
// when it does is what makes the change read as heat: the cracks that glow in the boss hall open
// first, the heat spreads out of them through the stone, low parts before high, and the vault
// goes last. `order` holds that moment for each pixel, from 0 (first) to 1 (last).
//
// A pixel about to be reached warms toward red; as the heat reaches it, it glows, then settles
// into the boss hall's colour. The steps between are blended, so nothing snaps.
const REACH = 64; // art pixels the heat travels from a crack before height alone decides
const WARM = 0.16; // how far ahead of the heat the stone starts to warm, in `order`
const SETTLE = 0.14; // how long a pixel takes to settle into the boss hall, in `order`
const GLOW = [120, 52, 6];

export const HEAT_FROM = -WARM - 0.02;
export const HEAT_TO = 1 + SETTLE + 0.02;

const pixels = (texture: PIXI.Texture, width: number, height: number) => {
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext('2d', { willReadFrequently: true })!;
	context.imageSmoothingEnabled = false;
	context.drawImage(texture.source.resource as CanvasImageSource, 0, 0, width, height);

	return context.getImageData(0, 0, width, height).data;
};

// smooth blotches between 0 and 1, `grain` pixels across
const blotches = (width: number, height: number, grain: number, seed: number) => {
	const columns = Math.ceil(width / grain) + 2;
	const rows = Math.ceil(height / grain) + 2;
	let state = seed;
	const knots = Float32Array.from({ length: columns * rows }, () => {
		state = (state * 1664525 + 1013904223) >>> 0;

		return state / 4294967296;
	});
	const ease = (value: number) => value * value * (3 - 2 * value);

	return (x: number, y: number) => {
		const column = Math.floor(x / grain);
		const row = Math.floor(y / grain);
		const across = ease(x / grain - column);
		const down = ease(y / grain - row);
		const at = (c: number, r: number) => knots[r * columns + c];
		const top = at(column, row) * (1 - across) + at(column + 1, row) * across;
		const bottom = at(column, row + 1) * (1 - across) + at(column + 1, row + 1) * across;

		return top * (1 - down) + bottom * down;
	};
};

export const createHallHeat = (
	baseTexture: PIXI.Texture,
	bonusTexture: PIXI.Texture,
	width: number,
	height: number,
) => {
	const base = pixels(baseTexture, width, height);
	const bonus = pixels(bonusTexture, width, height);
	const count = width * height;

	// the cracks: bright orange in the boss hall where the hall is cold stone
	const far = new Float32Array(count).fill(1e6);
	let cracks = 0;
	for (let index = 0; index < count; index++) {
		const at = index * 4;
		const hot = bonus[at] > 200 && bonus[at + 1] > 60 && bonus[at + 2] < 90;
		const cold = base[at] < base[at + 2] + 50;
		if (hot && cold) {
			far[index] = 0;
			cracks++;
		}
	}
	// how far each pixel is from a crack: two passes over the picture
	if (cracks) {
		const step = (index: number, other: number, cost: number) => {
			if (far[other] + cost < far[index]) far[index] = far[other] + cost;
		};
		for (let y = 0; y < height; y++)
			for (let x = 0; x < width; x++) {
				const index = y * width + x;
				if (x > 0) step(index, index - 1, 1);
				if (y > 0) step(index, index - width, 1);
				if (x > 0 && y > 0) step(index, index - width - 1, 1.41);
				if (x < width - 1 && y > 0) step(index, index - width + 1, 1.41);
			}
		for (let y = height - 1; y >= 0; y--)
			for (let x = width - 1; x >= 0; x--) {
				const index = y * width + x;
				if (x < width - 1) step(index, index + 1, 1);
				if (y < height - 1) step(index, index + width, 1);
				if (x < width - 1 && y < height - 1) step(index, index + width + 1, 1.41);
				if (x > 0 && y < height - 1) step(index, index + width - 1, 1.41);
			}
	}

	const coarse = blotches(width, height, 40, 7);
	const fine = blotches(width, height, 9, 19);
	const order = new Float32Array(count);
	let least = Infinity;
	let most = -Infinity;
	for (let y = 0; y < height; y++)
		for (let x = 0; x < width; x++) {
			const index = y * width + x;
			const spread = cracks ? Math.min(1.5, far[index] / REACH) : 0.6;
			const value = spread + 0.55 * (1 - y / height) + 0.3 * coarse(x, y) + 0.1 * fine(x, y);
			order[index] = value;
			least = Math.min(least, value);
			most = Math.max(most, value);
		}
	for (let index = 0; index < count; index++)
		order[index] = (order[index] - least) / (most - least);

	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext('2d')!;
	const image = context.createImageData(width, height);
	const out = image.data;
	out.set(base);
	const texture = PIXI.Texture.from(canvas);
	texture.source.scaleMode = 'nearest';

	return {
		texture,
		// when the heat reaches a place in the picture
		orderAt: (x: number, y: number) =>
			order[
				Math.max(0, Math.min(height - 1, Math.round(y))) * width +
					Math.max(0, Math.min(width - 1, Math.round(x)))
			],
		// the picture with the heat at `heat` (HEAT_FROM: the hall, HEAT_TO: the boss hall);
		// `glow` is how brightly the stone glows as it changes, less when it cools
		draw: (heat: number, glow = 1) => {
			for (let index = 0; index < count; index++) {
				const at = index * 4;
				const since = heat - order[index];
				if (since <= -WARM) {
					out[at] = base[at];
					out[at + 1] = base[at + 1];
					out[at + 2] = base[at + 2];
					continue;
				}
				if (since >= SETTLE) {
					out[at] = bonus[at];
					out[at + 1] = bonus[at + 1];
					out[at + 2] = bonus[at + 2];
					continue;
				}
				// the stone warmed as far as it goes before it changes
				const warm = Math.min(1, (since + WARM) / WARM);
				const red = base[at] + (Math.min(255, base[at] * 1.2 + 34) - base[at]) * warm;
				const green = base[at + 1] * (1 - 0.42 * warm);
				const blue = base[at + 2] * (1 - 0.58 * warm);
				if (since < 0) {
					out[at] = red;
					out[at + 1] = green;
					out[at + 2] = blue;
					continue;
				}
				const settled = since / SETTLE;
				const ease = settled * settled * (3 - 2 * settled);
				const lit = Math.sin(Math.PI * settled) * glow;
				out[at] = red + (bonus[at] - red) * ease + GLOW[0] * lit;
				out[at + 1] = green + (bonus[at + 1] - green) * ease + GLOW[1] * lit;
				out[at + 2] = blue + (bonus[at + 2] - blue) * ease + GLOW[2] * lit;
			}
			context.putImageData(image, 0, 0);
			texture.source.update();
		},
	};
};

export type HallHeat = ReturnType<typeof createHallHeat>;
