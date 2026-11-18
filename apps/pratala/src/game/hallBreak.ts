import * as PIXI from 'pixi.js';

import { pixels } from './hallHeat';

// The hall burning open into the boss hall when free spins start, and cooling back when they end,
// worked out for every art pixel of the picture (the two halls share one composition).
//
// Burning: the cracks the boss hall is painted with race out of the eye's breach, white-hot at
// their front, then settle to the boss hall's red. Then the boss hall burns through along the
// same path, pixel by pixel: a front spreads from the breach, fast along the cracks and slowly
// through stone, one art pixel white and one orange at its edge, the boss hall behind it. Its edge
// is ragged with a little noise. Where it crosses the floor's cracks, embers leap out. Every pixel
// is the hall, the boss hall or the front's colour at any moment, never a blend of the halls.
//
// Cooling: the glow dies from the far edges in toward the breach, each pixel passing through grey
// ash on its way back to the cold hall.
//
// Times are in ms from the start of each change.
export const BREAK = {
	total: 2600,
	cracks: [300, 1300],
	burn: [1000, 2000],
	// how long a crack's white-hot front takes to settle
	settle: 260,
};
export const COOL = { total: 1800, spread: 1300, pass: 500, ash: 0.45 };

// the distance through stone, against 1 along a crack, straight and diagonal
const STONE = 4;
const STONE_DIAGONAL = 6;
// how far the burning front's edge wanders, in its share of the whole path, and how coarse the
// wandering is, in art pixels
const RAGGED = { reach: 0.03, grain: 5 };
// embers thrown up by the front crossing the floor's cracks, about, in one change
const EMBERS = 200;
const HOT = [255, 246, 214];
const WHITE = [255, 250, 232];
const ORANGE = [255, 132, 26];

// a seeded generator, so the noise is the same every time
const random = (seed: number) => {
	let state = seed >>> 0;

	return () => {
		state = (state * 1664525 + 1013904223) >>> 0;

		return state / 4294967296;
	};
};

// smooth noise between -1 and 1, `grain` pixels across
const ragged = (width: number, height: number, grain: number, next: () => number) => {
	const columns = Math.ceil(width / grain) + 2;
	const rows = Math.ceil(height / grain) + 2;
	const knots = Float32Array.from({ length: columns * rows }, () => next() * 2 - 1);
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

export const createHallBreak = (
	baseTexture: PIXI.Texture,
	bonusTexture: PIXI.Texture,
	width: number,
	height: number,
	// where the floor starts, in art pixels: the cracks above it race out first, the floor's
	// cracks below it throw embers as the front crosses them
	floor: number,
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

	// a little noise per pixel: the burning front's ragged edge, and the cooling's
	const next = random(23);
	const wander = ragged(width, height, RAGGED.grain, next);
	const edge = new Float32Array(count);
	const grain = new Float32Array(count);
	for (let index = 0; index < count; index++) {
		edge[index] = wander(index % width, Math.floor(index / width)) * RAGGED.reach;
		grain[index] = next();
	}

	// when each pixel changes, worked out for the breach where it is now (see aim)
	const revealAt = new Float32Array(count);
	const hotAt = new Float32Array(count);
	const coolAt = new Float32Array(count);
	const distance = new Int32Array(count);
	// the floor's crack pixels that throw an ember, in the order the front reaches them
	let sparks: number[] = [];
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

		// the cracks light in order of their distance; a few stray ones far from the rest wait
		// for the slowest
		const crackReach: number[] = [];
		for (let index = 0; index < count; index++)
			if (crack[index] && index / width < floor) crackReach.push(distance[index]);
		crackReach.sort((a, b) => a - b);
		const crackFar = Math.max(1, crackReach[Math.floor(crackReach.length * 0.95)] ?? 1);

		// the front burns through the whole picture over BREAK.burn; the last few far corners
		// go with the slowest
		const reaches = Array.from(distance).sort((a, b) => a - b);
		const burnFar = Math.max(1, reaches[Math.floor(count * 0.98)]);
		let far = 1;
		for (let index = 0; index < count; index++) far = Math.max(far, distance[index]);

		const [crackFrom, crackTo] = BREAK.cracks;
		const [burnFrom, burnTo] = BREAK.burn;
		const floorCracks: number[] = [];
		for (let index = 0; index < count; index++) {
			const burnt = Math.max(0, Math.min(1, distance[index] / burnFar + edge[index]));
			revealAt[index] = burnFrom + (burnTo - burnFrom) * burnt;
			hotAt[index] =
				crack[index] && index / width < floor
					? crackFrom + (crackTo - crackFrom) * Math.min(1, distance[index] / crackFar)
					: Infinity;
			if (crack[index] && index / width >= floor) floorCracks.push(index);
			// cooling runs the other way, from the far edges in, ragged at its front
			const order = 1 - distance[index] / far + 0.08 * grain[index];
			coolAt[index] = Math.max(0, Math.min(1, order)) * COOL.spread;
		}
		const share = EMBERS / Math.max(1, floorCracks.length);
		sparks = floorCracks
			.filter((index) => grain[index] < share)
			.sort((a, b) => revealAt[a] - revealAt[b]);
	};

	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext('2d')!;
	const image = context.createImageData(width, height);
	const out = image.data;
	out.set(base);
	const texture = PIXI.Texture.from(canvas);
	texture.source.scaleMode = 'nearest';
	const show = () => {
		context.putImageData(image, 0, 0);
		texture.source.update();
	};

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
	const paint = (index: number, colour: ArrayLike<number>, at: number) => {
		out[index] = colour[at];
		out[index + 1] = colour[at + 1];
		out[index + 2] = colour[at + 2];
	};

	// which pixels the front has passed, this frame
	const burnt = new Uint8Array(count);
	// whether the pixel `steps` away in any straight direction is not burnt yet (off the picture
	// counts as burnt, so the front has no edge at the border)
	const nearUnburnt = (x: number, y: number, steps: number) =>
		(x >= steps && !burnt[y * width + x - steps]) ||
		(x < width - steps && !burnt[y * width + x + steps]) ||
		(y >= steps && !burnt[(y - steps) * width + x]) ||
		(y < height - steps && !burnt[(y + steps) * width + x]);

	const at = (x: number, y: number) =>
		Math.max(0, Math.min(height - 1, Math.round(y))) * width +
		Math.max(0, Math.min(width - 1, Math.round(x)));

	return {
		texture,
		aim,
		// the picture `ms` into the burning
		drawBreak: (ms: number) => {
			for (let index = 0; index < count; index++) burnt[index] = revealAt[index] <= ms ? 1 : 0;
			for (let y = 0; y < height; y++)
				for (let x = 0; x < width; x++) {
					const index = y * width + x;
					const at4 = index * 4;
					if (burnt[index]) {
						// the front: a white pixel at its edge, an orange one behind, then the boss hall
						if (nearUnburnt(x, y, 1)) paint(at4, WHITE, 0);
						else if (nearUnburnt(x, y, 2)) paint(at4, ORANGE, 0);
						else paint(at4, bonus, at4);
						continue;
					}
					const hot = ms - hotAt[index];
					if (hot >= 0 && hot < BREAK.settle) {
						// a crack's front: white-hot, settling to the boss hall's colour
						const settled = hot / BREAK.settle;
						blend(at4, HOT, 0, bonus, at4, settled * settled);
					} else if (hot >= 0) paint(at4, bonus, at4);
					else paint(at4, base, at4);
				}
			show();
		},
		// the picture `ms` into the cooling
		drawCool: (ms: number) => {
			const ash = [0, 0, 0];
			for (let index = 0; index < count; index++) {
				const at4 = index * 4;
				const since = ms - coolAt[index];
				if (since <= 0) {
					paint(at4, bonus, at4);
					continue;
				}
				if (since >= COOL.pass) {
					paint(at4, base, at4);
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
			show();
		},
		// when the burning reaches a place, and when the cooling does, in ms
		breakAt: (x: number, y: number) => revealAt[at(x, y)],
		coolAt: (x: number, y: number) => coolAt[at(x, y)],
		// the floor's crack pixels that throw an ember as the front crosses them between two moments,
		// as art-pixel positions
		sparksBetween: (from: number, to: number) =>
			sparks
				.filter((index) => revealAt[index] >= from && revealAt[index] < to)
				.map((index) => ({ x: index % width, y: Math.floor(index / width) })),
	};
};

export type HallBreak = ReturnType<typeof createHallBreak>;

// The embers the burning throws up from the floor's cracks: square, one or two art pixels, rising
// and slowing, white to red as they die, from one pool of sprites. Positions are kept in the hall's
// art pixels, on its grid, and placed with `view` each frame.
const LIMIT = 150;
const EMBER_TINTS = [0xfff0b0, 0xffb040, 0xff6a1a, 0xc8280e];

type Ember = {
	sprite: PIXI.Sprite;
	x: number;
	y: number;
	vx: number;
	vy: number;
	size: number;
	age: number;
	life: number;
};

export const createHallEmbers = (container: PIXI.Container) => {
	const live: Ember[] = [];
	const spare: PIXI.Sprite[] = [];

	return {
		throw: (x: number, y: number) => {
			if (live.length >= LIMIT) return;
			const sprite = spare.pop() ?? new PIXI.Sprite({ texture: PIXI.Texture.WHITE, anchor: 0.5 });
			if (!sprite.parent) container.addChild(sprite);
			sprite.alpha = 1;
			sprite.visible = true;
			live.push({
				sprite,
				x,
				y,
				vx: (Math.random() - 0.5) * 30,
				vy: -60 - Math.random() * 70,
				size: Math.random() < 0.3 ? 2 : 1,
				age: 0,
				life: 420 + Math.random() * 380,
			});
		},
		step: (ms: number, view: { origin: { x: number; y: number }; scale: number }) => {
			const seconds = Math.min(0.05, ms / 1000);
			for (let index = live.length - 1; index >= 0; index--) {
				const ember = live[index];
				ember.age += ms;
				const age = ember.age / ember.life;
				if (age >= 1) {
					ember.sprite.visible = false;
					spare.push(ember.sprite);
					live.splice(index, 1);
					continue;
				}
				ember.vy += 90 * seconds;
				ember.x += ember.vx * seconds;
				ember.y += ember.vy * seconds;
				const { sprite, size } = ember;
				// whole art pixels only; a two-pixel ember centres on a pixel corner
				sprite.x = view.origin.x + (Math.round(ember.x - size / 2) + size / 2) * view.scale;
				sprite.y = view.origin.y + (Math.round(ember.y - size / 2) + size / 2) * view.scale;
				sprite.setSize(size * view.scale, size * view.scale);
				sprite.tint = EMBER_TINTS[Math.min(EMBER_TINTS.length - 1, Math.floor(age * 4))];
				sprite.alpha = age < 0.7 ? 1 : 1 - (age - 0.7) / 0.3;
			}
		},
		clear: () => {
			for (const ember of live) {
				ember.sprite.visible = false;
				spare.push(ember.sprite);
			}
			live.length = 0;
		},
	};
};
