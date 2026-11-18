import * as PIXI from 'pixi.js';

import { pixels } from './hallHeat';

// The boss hall cooling back into the hall when free spins end, worked out for every art pixel of
// the picture (the two halls share one composition). The glow dies from the far edges in toward
// the eye's breach, along a path that runs fast along the boss hall's cracks and slowly through
// stone, each pixel passing through grey ash on its way back to the cold hall. (Free spins start
// with a painted animation instead: components/Background.svelte.)
//
// Times are in ms from the start of the change.
export const COOL = { total: 1800, spread: 1300, pass: 500, ash: 0.45 };

// the distance through stone, against 1 along a crack, straight and diagonal
const STONE = 4;
const STONE_DIAGONAL = 6;

// a seeded generator, so the cooling's ragged front is the same every time
const random = (seed: number) => {
	let state = seed >>> 0;

	return () => {
		state = (state * 1664525 + 1013904223) >>> 0;

		return state / 4294967296;
	};
};

export const createHallCool = (
	baseTexture: PIXI.Texture,
	bonusTexture: PIXI.Texture,
	width: number,
	height: number,
) => {
	const base = pixels(baseTexture, width, height);
	const bonus = pixels(bonusTexture, width, height);
	const count = width * height;

	// the cracks: glowing red in the boss hall where the hall is cold stone
	const crack = new Uint8Array(count);
	for (let index = 0; index < count; index++) {
		const at = index * 4;
		const red = bonus[at] - (bonus[at + 1] + bonus[at + 2]) / 2;
		const cold = base[at] - (base[at + 1] + base[at + 2]) / 2 < 30;
		if (red > 65 && bonus[at] > 100 && cold) crack[index] = 1;
	}

	// a little noise per pixel, for the cooling's ragged front
	const next = random(23);
	const grain = Float32Array.from({ length: count }, () => next());

	// when each pixel cools, worked out for the breach where it is now (see aim)
	const coolAt = new Float32Array(count);
	const distance = new Int32Array(count);
	let aimed = '';

	const aim = (originX: number, originY: number) => {
		const ox = Math.max(0, Math.min(width - 1, Math.round(originX)));
		const oy = Math.max(0, Math.min(height - 1, Math.round(originY)));
		const key = `${ox},${oy}`;
		if (key === aimed) return;
		aimed = key;

		// the distance from the breach, cheap along the cracks and dear through stone: a bucket
		// queue, as the steps cost whole numbers
		const buckets: number[][] = Array.from({ length: STONE_DIAGONAL + 1 }, () => []);
		distance.fill(0x7fffffff);
		const start = oy * width + ox;
		distance[start] = 0;
		buckets[0].push(start);
		let pending = 1;
		for (let reach = 0; pending; reach++) {
			const bucket = buckets[reach % buckets.length];
			while (bucket.length) {
				const index = bucket.pop()!;
				pending--;
				if (distance[index] !== reach) continue;
				const x = index % width;
				const y = (index - x) / width;
				for (let dy = -1; dy <= 1; dy++)
					for (let dx = -1; dx <= 1; dx++) {
						if (!dx && !dy) continue;
						const nx = x + dx;
						const ny = y + dy;
						if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
						const other = ny * width + nx;
						const cost = crack[other] ? 1 : dx && dy ? STONE_DIAGONAL : STONE;
						if (reach + cost < distance[other]) {
							distance[other] = reach + cost;
							buckets[distance[other] % buckets.length].push(other);
							pending++;
						}
					}
			}
		}

		// the far edges cool first, the breach last, ragged at the front
		let far = 1;
		for (let index = 0; index < count; index++) far = Math.max(far, distance[index]);
		for (let index = 0; index < count; index++) {
			const order = 1 - distance[index] / far + 0.08 * grain[index];
			coolAt[index] = Math.max(0, Math.min(1, order)) * COOL.spread;
		}
	};

	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext('2d')!;
	const image = context.createImageData(width, height);
	const out = image.data;
	out.set(bonus);
	const texture = PIXI.Texture.from(canvas);
	texture.source.scaleMode = 'nearest';

	const blend = (
		index: number,
		from: ArrayLike<number>,
		fromAt: number,
		to: ArrayLike<number>,
		toAt: number,
		amount: number,
	) => {
		out[index] = from[fromAt] + (to[toAt] - from[fromAt]) * amount;
		out[index + 1] = from[fromAt + 1] + (to[toAt + 1] - from[fromAt + 1]) * amount;
		out[index + 2] = from[fromAt + 2] + (to[toAt + 2] - from[fromAt + 2]) * amount;
	};

	return {
		texture,
		aim,
		// the picture `ms` into the cooling
		draw: (ms: number) => {
			const ash = [0, 0, 0];
			for (let index = 0; index < count; index++) {
				const at4 = index * 4;
				const since = ms - coolAt[index];
				if (since <= 0) {
					out[at4] = bonus[at4];
					out[at4 + 1] = bonus[at4 + 1];
					out[at4 + 2] = bonus[at4 + 2];
					continue;
				}
				if (since >= COOL.pass) {
					out[at4] = base[at4];
					out[at4 + 1] = base[at4 + 1];
					out[at4 + 2] = base[at4 + 2];
					continue;
				}
				// through grey ash: the boss hall's light, drained of its colour
				const grey = (0.3 * bonus[at4] + 0.59 * bonus[at4 + 1] + 0.11 * bonus[at4 + 2]) * 0.6 + 26;
				ash[0] = grey;
				ash[1] = grey;
				ash[2] = grey + 4;
				const passed = since / COOL.pass;
				if (passed < COOL.ash) blend(at4, bonus, at4, ash, 0, passed / COOL.ash);
				else blend(at4, ash, 0, base, at4, (passed - COOL.ash) / (1 - COOL.ash));
			}
			context.putImageData(image, 0, 0);
			texture.source.update();
		},
		// when the cooling reaches a place, in ms
		coolAt: (x: number, y: number) =>
			coolAt[
				Math.max(0, Math.min(height - 1, Math.round(y))) * width +
					Math.max(0, Math.min(width - 1, Math.round(x)))
			],
	};
};

export type HallCool = ReturnType<typeof createHallCool>;
