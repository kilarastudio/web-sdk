import * as PIXI from 'pixi.js';

import { pixels } from './hallHeat';

// The hall breaking open into the boss hall when free spins start, and cooling back when they
// end, worked out for every art pixel of the picture (the two halls share one composition).
//
// Breaking: the cracks the boss hall is painted with race out of the eye's breach, white-hot at
// their front, then settle to the boss hall's red. Then the wall gives way along the same path:
// the picture is cut into bricks (6 to 14 art pixels), and each brick, when the break reaches it,
// either drops away as a chunk of the old wall (a sprite cut from the hall's own picture) or
// burns through whole, revealing the boss hall under it with a brief glow. Where the floor's
// cracks open, embers leap out. The break's path is a distance from the breach that runs fast
// along the cracks and slowly through stone, so the wall falls where it cracked first.
//
// Cooling: the glow dies from the far edges in toward the breach, each pixel passing through grey
// ash on its way back to the cold hall. Nothing falls.
//
// Times are in ms from the start of each change.
export const BREAK = {
	total: 2600,
	cracks: [300, 1300],
	wall: [1000, 2000],
	// how long a crack's white-hot front takes to settle, and a burnt-through brick to stop glowing
	settle: 260,
	glow: 140,
};
export const COOL = { total: 1800, spread: 1300, pass: 500, ash: 0.45 };

// the distance through stone, against 1 along a crack, straight and diagonal
const STONE = 4;
const STONE_DIAGONAL = 6;
// chunks of wall that fall, at most, in one break; the rest of the bricks burn through
const CHUNKS = 320;
const HOT = [255, 246, 214];
const GLOW = [80, 26, 2];

// a seeded generator, so the bricks are cut the same every time
const random = (seed: number) => {
	let state = seed >>> 0;

	return () => {
		state = (state * 1664525 + 1013904223) >>> 0;

		return state / 4294967296;
	};
};

type Cell = {
	x: number;
	y: number;
	width: number;
	height: number;
	wall: boolean;
	falls: boolean;
	// the floor's crack pixels in it, for embers
	embers: number[];
	// when the break reaches it, in ms
	at: number;
};

export const createHallBreak = (
	baseTexture: PIXI.Texture,
	bonusTexture: PIXI.Texture,
	width: number,
	height: number,
	// where the floor starts, in art pixels: the wall above it falls, the floor below it opens
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

	// the bricks: rows 8 to 12 pixels high, each cut into bricks 6 to 14 wide, offset row by row
	const next = random(23);
	const cells: Cell[] = [];
	const cellOf = new Int32Array(count);
	for (let top = 0; top < height;) {
		const rowHeight = Math.min(height - top, 8 + Math.floor(next() * 5));
		for (let left = -Math.floor(next() * 10); left < width;) {
			const brick = 6 + Math.floor(next() * 9);
			const x = Math.max(0, left);
			const right = Math.min(width, left + brick);
			if (right <= x) {
				left += brick;
				continue;
			}
			const cell: Cell = {
				x,
				y: top,
				width: right - x,
				height: rowHeight,
				wall: top + rowHeight / 2 < floor,
				falls: false,
				embers: [],
				at: 0,
			};
			for (let y = top; y < top + rowHeight; y++)
				for (let column = x; column < right; column++) {
					const index = y * width + column;
					cellOf[index] = cells.length;
					if (!cell.wall && crack[index]) cell.embers.push(index);
				}
			cells.push(cell);
			left += brick;
		}
		top += rowHeight;
	}
	// which bricks fall: as many as the budget allows, the rest burn through
	const wallCells = cells.filter((cell) => cell.wall).length;
	for (const cell of cells) cell.falls = cell.wall && next() < CHUNKS / wallCells;

	// each falling brick's picture, cut from the hall's own
	const unit = baseTexture.frame.width / width;
	const chunkTextures = new Map<Cell, PIXI.Texture>();
	for (const cell of cells)
		if (cell.falls)
			chunkTextures.set(
				cell,
				new PIXI.Texture({
					source: baseTexture.source,
					frame: new PIXI.Rectangle(
						baseTexture.frame.x + cell.x * unit,
						baseTexture.frame.y + cell.y * unit,
						cell.width * unit,
						cell.height * unit,
					),
				}),
			);

	// a little noise per pixel, for the ragged front of the cooling
	const grain = new Float32Array(count);
	for (let index = 0; index < count; index++) grain[index] = next();

	// when each pixel changes, worked out for the breach where it is now (see aim)
	const revealAt = new Float32Array(count);
	const hotAt = new Float32Array(count).fill(Infinity);
	const coolAt = new Float32Array(count);
	const distance = new Int32Array(count);
	let aimed = '';
	let byTime: Cell[] = [];

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

		// each brick breaks when the break first touches it
		let cellFar = 1;
		for (const cell of cells) cell.at = Infinity;
		for (let index = 0; index < count; index++) {
			const cell = cells[cellOf[index]];
			cell.at = Math.min(cell.at, distance[index]);
		}
		for (const cell of cells) cellFar = Math.max(cellFar, cell.at);
		const [wallFrom, wallTo] = BREAK.wall;
		for (const cell of cells)
			cell.at = wallFrom + (wallTo - wallFrom - 60) * (cell.at / cellFar) + next() * 60;
		byTime = [...cells].sort((a, b) => a.at - b.at);

		const [crackFrom, crackTo] = BREAK.cracks;
		let far = 1;
		for (let index = 0; index < count; index++) far = Math.max(far, distance[index]);
		for (let index = 0; index < count; index++) {
			const cell = cells[cellOf[index]];
			revealAt[index] = cell.at;
			if (crack[index])
				hotAt[index] = cell.wall
					? crackFrom + (crackTo - crackFrom) * Math.min(1, distance[index] / crackFar)
					: revealAt[index];
			// cooling runs the other way, from the far edges in, ragged at its front
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

	const at = (x: number, y: number) =>
		Math.max(0, Math.min(height - 1, Math.round(y))) * width +
		Math.max(0, Math.min(width - 1, Math.round(x)));

	return {
		texture,
		aim,
		// the picture `ms` into the break
		drawBreak: (ms: number) => {
			for (let index = 0; index < count; index++) {
				const at4 = index * 4;
				const hot = ms - hotAt[index];
				if (hot >= 0 && hot < BREAK.settle) {
					// a crack's front: white-hot, settling to the boss hall's colour
					const settled = hot / BREAK.settle;
					blend(at4, HOT, 0, bonus, at4, settled * settled);
					continue;
				}
				const since = ms - revealAt[index];
				if (since >= 0 || hot >= 0) {
					out[at4] = bonus[at4];
					out[at4 + 1] = bonus[at4 + 1];
					out[at4 + 2] = bonus[at4 + 2];
					if (since >= 0 && since < BREAK.glow) {
						// the stone just burnt through still glows
						const lit = 1 - since / BREAK.glow;
						out[at4] += GLOW[0] * lit;
						out[at4 + 1] += GLOW[1] * lit;
						out[at4 + 2] += GLOW[2] * lit;
					}
					continue;
				}
				out[at4] = base[at4];
				out[at4 + 1] = base[at4 + 1];
				out[at4 + 2] = base[at4 + 2];
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
			show();
		},
		// when the break reaches a place, and when the cooling does, in ms
		breakAt: (x: number, y: number) => revealAt[at(x, y)],
		coolAt: (x: number, y: number) => coolAt[at(x, y)],
		// the bricks that break between two moments of the break
		breaking: (from: number, to: number) =>
			byTime.filter((cell) => cell.at >= from && cell.at < to),
		chunkTexture: (cell: Cell) => chunkTextures.get(cell),
		width,
	};
};

export type HallBreak = ReturnType<typeof createHallBreak>;
export type HallBrick = Cell;

// What flies off the wall as it breaks: chunks of stone that drop and tumble, embers that leap
// from the floor's cracks, and dust. All square, all on the hall's art-pixel grid, from one pool
// of sprites; positions are kept in the hall's art pixels and placed with `view` each frame.
const GRAVITY = 520; // art pixels a second, a second
const LIMIT = 300;
const EMBER_TINTS = [0xfff0b0, 0xffb040, 0xff6a1a, 0xc8280e];
const DUST_TINTS = [0x8b93af, 0x6b7191, 0x4a5272];

type Bit = {
	sprite: PIXI.Sprite;
	kind: 'chunk' | 'ember' | 'dust';
	x: number;
	y: number;
	vx: number;
	vy: number;
	width: number;
	height: number;
	age: number;
	life: number;
	turn: number;
};

export const createHallDebris = (container: PIXI.Container) => {
	const live: Bit[] = [];
	const spare: PIXI.Sprite[] = [];

	const spawn = (bit: Omit<Bit, 'sprite' | 'age'>, texture: PIXI.Texture, tint: number) => {
		if (live.length >= LIMIT) return false;
		const sprite = spare.pop() ?? new PIXI.Sprite({ anchor: 0.5 });
		if (!sprite.parent) container.addChild(sprite);
		sprite.texture = texture;
		sprite.tint = tint;
		sprite.rotation = 0;
		sprite.alpha = 1;
		sprite.visible = true;
		live.push({ ...bit, sprite, age: 0 });

		return true;
	};

	return {
		// a brick of the wall comes away, pushed out from the breach a little
		chunk: (cell: HallBrick, texture: PIXI.Texture, fromX: number) => {
			const centre = cell.x + cell.width / 2;
			const away = Math.sign(centre - fromX) || 1;
			const fell = spawn(
				{
					kind: 'chunk',
					x: centre,
					y: cell.y + cell.height / 2,
					vx: away * (8 + Math.random() * 34),
					vy: -20 - Math.random() * 40,
					width: cell.width,
					height: cell.height,
					life: 650 + Math.random() * 200,
					// quarter turns over its fall: none, one or two
					turn: Math.floor(Math.random() * 3) * (Math.random() < 0.5 ? -1 : 1),
				},
				texture,
				0xffffff,
			);
			if (fell && Math.random() < 0.35)
				spawn(
					{
						kind: 'dust',
						x: centre,
						y: cell.y + cell.height,
						vx: (Math.random() - 0.5) * 24,
						vy: 10 + Math.random() * 20,
						width: 2,
						height: 2,
						life: 700 + Math.random() * 400,
						turn: 0,
					},
					PIXI.Texture.WHITE,
					DUST_TINTS[Math.floor(Math.random() * DUST_TINTS.length)],
				);

			return fell;
		},
		// an ember leaps from a crack in the floor
		ember: (x: number, y: number) => {
			const size = Math.random() < 0.3 ? 2 : 1;
			spawn(
				{
					kind: 'ember',
					x,
					y,
					vx: (Math.random() - 0.5) * 30,
					vy: -60 - Math.random() * 70,
					width: size,
					height: size,
					life: 420 + Math.random() * 380,
					turn: 0,
				},
				PIXI.Texture.WHITE,
				EMBER_TINTS[0],
			);
		},
		step: (ms: number, view: { origin: { x: number; y: number }; scale: number }) => {
			const seconds = Math.min(0.05, ms / 1000);
			for (let index = live.length - 1; index >= 0; index--) {
				const bit = live[index];
				bit.age += ms;
				const age = bit.age / bit.life;
				if (age >= 1) {
					bit.sprite.visible = false;
					spare.push(bit.sprite);
					live.splice(index, 1);
					continue;
				}
				// chunks fall, dust drifts down, embers rise and slow
				const pull = bit.kind === 'chunk' ? GRAVITY : bit.kind === 'dust' ? 40 : 90;
				bit.vy += pull * seconds;
				bit.x += bit.vx * seconds;
				bit.y += bit.vy * seconds;
				const sprite = bit.sprite;
				// whole art pixels only; an odd-sized piece centres on a half pixel
				sprite.x = view.origin.x + (Math.round(bit.x - bit.width / 2) + bit.width / 2) * view.scale;
				sprite.y =
					view.origin.y + (Math.round(bit.y - bit.height / 2) + bit.height / 2) * view.scale;
				sprite.setSize(bit.width * view.scale, bit.height * view.scale);
				if (bit.kind === 'chunk') {
					sprite.rotation = Math.round(bit.turn * age) * (Math.PI / 2);
					sprite.alpha = age < 0.55 ? 1 : 1 - (age - 0.55) / 0.45;
				} else if (bit.kind === 'ember') {
					sprite.tint = EMBER_TINTS[Math.min(EMBER_TINTS.length - 1, Math.floor(age * 4))];
					sprite.alpha = age < 0.7 ? 1 : 1 - (age - 0.7) / 0.3;
				} else sprite.alpha = 0.6 * (1 - age);
			}
		},
		clear: () => {
			for (const bit of live) {
				bit.sprite.visible = false;
				spare.push(bit.sprite);
			}
			live.length = 0;
		},
		get count() {
			return live.length;
		},
	};
};
