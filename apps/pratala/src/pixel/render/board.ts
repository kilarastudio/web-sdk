// The reel board as one stone object: a tray of dressed stone blocks round the 6 × 5 opening, one
// gold inlay line round the opening, and the dark flagstone floor of the cells, recessed behind
// the rim so the rim's shadow falls into it. One scene, rendered once with an orthographic camera
// looking straight at the board face: the frame is its rim (the opening CLEAR), the floor is the
// opening, cropped, with the rim's shadow baked in.
//
// The model is built in pixel units (X right, Y down, Z away from the viewer, the rim's face at
// Z = 0) and scaled into the ray marcher's world, so every seam, chamfer and line sits on the grid.
import { PixelCanvas } from '../canvas.ts';
import { DARKER, INK, RAMPS } from '../palette.ts';
import { fbm3, hash2, noise3, worley2 } from './noise.ts';
import { hit, render, type Light, type Material, type RenderResult, type Scene } from './raymarch.ts';
import { quantize } from './quantize.ts';
import * as S from './sdf.ts';

// world units per pixel: the ray marcher's occlusion and shadow steps are tuned for objects about
// one unit across, so 20 pixels make a unit
const U = 1 / 20;

// the sizes the game lays the board out with (ui.ts: CELL, FRAME.border)
const CELL = 40;
const B = 14;
// the rim's profile across its width, in pixels from the outer edge
const RIM = {
	outer: 3, // the outer chamfer (its outermost pixel is the ink line)
	inner: 3.5, // the chamfer down into the opening
	ends: 2, // the chamfer at each block's ends, half of a seam's V
	gold: 10, // the pixel ring the gold inlay runs in
	floor: 5, // how far the floor lies behind the rim's face
};

const M = { rim: 0, gold: 1, floor: 2, mortar: 3 };

type Block = {
	x0: number;
	x1: number;
	y0: number;
	y1: number;
	// chamfers: left, right, top, bottom
	cl: number;
	cr: number;
	ct: number;
	cb: number;
	// the face's depth (a block stands a little proud or sunk)
	z: number;
	chips: [number, number, number, number][];
};

type Gouge = { ax: number; ay: number; bx: number; by: number };

// split a run of `length` pixels into blocks about `size` long, each seam on a whole pixel
const seams = (length: number, size: number, seed: number) => {
	const count = Math.max(1, Math.round(length / size));
	const cuts = [0];
	for (let i = 1; i < count; i++) {
		const jitter = Math.round((hash2(seed, i) - 0.5) * size * 0.3);
		cuts.push(Math.round((length * i) / count) + jitter);
	}
	cuts.push(length);
	return cuts;
};

const layout = (W: number, H: number) => {
	const blocks: Block[] = [];
	const { outer: co, inner: ci, ends: ce } = RIM;
	const add = (x0: number, x1: number, y0: number, y1: number, cl: number, cr: number, ct: number, cb: number) => {
		const i = blocks.length;
		const chips: Block['chips'] = [];
		// a chip or two knocked off the outer edges
		const n = Math.floor(hash2(i, 3) * 2.6);
		for (let k = 0; k < n; k++) {
			const along = hash2(i, 10 + k);
			const side = Math.floor(hash2(i, 20 + k) * 4);
			const r = 1.8 + hash2(i, 30 + k) * 1.2;
			const x = side === 0 ? x0 : side === 1 ? x1 : x0 + along * (x1 - x0);
			const y = side === 2 ? y0 : side === 3 ? y1 : y0 + along * (y1 - y0);
			chips.push([x, y, -0.2, r]);
		}
		blocks.push({ x0, x1, y0, y1, cl, cr, ct, cb, z: (hash2(i, 41) - 0.5) * 0.8, chips });
	};
	// the four corners: plain square blocks, a one-pixel seam on their two inner sides
	add(0, B - 1, 0, B - 1, co, ce, co, ce);
	add(W - B + 1, W, 0, B - 1, ce, co, co, ce);
	add(0, B - 1, H - B + 1, H, co, ce, ce, co);
	add(W - B + 1, W, H - B + 1, H, ce, co, ce, co);
	// the runs; a seam is the pixel column (or row) just before each cut
	const run = (length: number, seed: number, place: (a: number, b: number) => void) => {
		const cuts = seams(length, 46, seed);
		for (let i = 0; i < cuts.length - 1; i++) place(cuts[i], cuts[i + 1]);
	};
	const inner = W - 2 * B;
	const tall = H - 2 * B;
	run(inner, 1, (a, b) => add(B + a, B + b - 1, 0, B, ce, ce, co, ci));
	run(inner, 2, (a, b) => add(B + a, B + b - 1, H - B, H, ce, ce, ci, co));
	run(tall, 3, (a, b) => add(0, B, B + a, B + b - 1, co, ci, ce, ce));
	run(tall, 4, (a, b) => add(W - B, W, B + a, B + b - 1, ci, co, ce, ce));
	return blocks;
};

// a block with its front edges chamfered (the back edges square, so its outline stays square)
const blockSdf = (b: Block, X: number, Y: number, Z: number) => {
	const cx = (b.x0 + b.x1) * 0.5;
	const cy = (b.y0 + b.y1) * 0.5;
	const back = RIM.floor + 6;
	const zc = (b.z + back) * 0.5;
	let d = S.box(X - cx, Y - cy, Z - zc, (b.x1 - b.x0) * 0.5, (b.y1 - b.y0) * 0.5, (back - b.z) * 0.5);
	const front = b.z - Z;
	const r2 = Math.SQRT1_2;
	d = Math.max(d, (b.x0 - X + front + b.cl) * r2);
	d = Math.max(d, (X - b.x1 + front + b.cr) * r2);
	d = Math.max(d, (b.y0 - Y + front + b.ct) * r2);
	d = Math.max(d, (Y - b.y1 + front + b.cb) * r2);
	for (const [x, y, z, r] of b.chips) d = Math.max(d, -S.sphere(X - x, Y - y, Z - (b.z + z), r));
	// the face is dressed a little proud: it falls away toward its edges
	const u = (X - cx) / ((b.x1 - b.x0) * 0.5);
	const v = (Y - cy) / ((b.y1 - b.y0) * 0.5);
	return d + 0.9 * (u * u + v * v);
};

// claw marks: three parallel strokes along (dx, dy), set `sx, sy` apart, raked across a block
const clawSet = (x: number, y: number, dx: number, dy: number, sx: number, sy: number, length: number): Gouge[] => {
	const l = Math.hypot(dx, dy);
	const ux = dx / l;
	const uy = dy / l;
	return [-1, 0, 1].map((k) => {
		const ox = x + sx * k;
		const oy = y + sy * k;
		const len = length * (k === 0 ? 1 : 0.82);
		return { ax: ox - ux * len * 0.5, ay: oy - uy * len * 0.5, bx: ox + ux * len * 0.5, by: oy + uy * len * 0.5 };
	});
};

const gougeSdf = (g: Gouge, X: number, Y: number, Z: number) =>
	S.capsule(X, Y, Z, g.ax, g.ay, 0.1, g.bx, g.by, 0.1, 1.35);

export type BoardRender = { frame: PixelCanvas; floor: PixelCanvas; result: RenderResult };

const cache = new Map<string, BoardRender>();

export const renderBoard = (columns: number, rows: number): BoardRender => {
	const key = `${columns}x${rows}`;
	const cached = cache.get(key);
	if (cached) return cached;

	const W = columns * CELL + B * 2;
	const H = rows * CELL + B * 2;
	const blocks = layout(W, H);
	// claw gouges on two blocks, both in the torchlight: the top run right of centre, the left run low
	const gouges: Gouge[] = [
		...clawSet(B + columns * CELL * 0.68, 5.6, 0.55, 1, 3.8, 0, 8),
		...clawSet(5.6, B + rows * CELL * 0.62, 1, 0.75, 0, 4, 8),
	];
	// the gold ring's centre line: a rectangle `RIM.gold + 0.5` in from the outer edge
	const g0 = RIM.gold + 0.5;
	const ringDistance = (X: number, Y: number) => {
		const hx = W * 0.5 - g0;
		const hy = H * 0.5 - g0;
		const qx = Math.abs(X - W * 0.5) - hx;
		const qy = Math.abs(Y - H * 0.5) - hy;
		// distance to the rectangle's outline (not its area)
		const outside = S.length2(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0);
		return Math.abs(outside);
	};

	// distance to the nearest joint between flagstones (the opening's own edge is not a joint: the
	// stones run on under the rim)
	const jointDistance = (fx: number, fy: number) => {
		const cx = Math.round(fx / CELL);
		const cy = Math.round(fy / CELL);
		const ex = cx > 0 && cx < columns ? Math.abs(fx - cx * CELL) : Infinity;
		const ey = cy > 0 && cy < rows ? Math.abs(fy - cy * CELL) : Infinity;
		return Math.min(ex, ey);
	};

	const model = (X: number, Y: number, Z: number) => {
		let best = Infinity;
		let m = M.floor;
		// floor: flagstones a cell each, a joint on every cell seam, each stone a little uneven
		{
			const fx = X - B;
			const fy = Y - B;
			const cx = Math.floor(fx / CELL);
			const cy = Math.floor(fy / CELL);
			const e = jointDistance(fx, fy);
			// a narrow joint, each stone's worn edge rounding down into it
			const groove = e < 1 ? 1.8 : e < 3 ? 0.9 * (3 - e) : 0;
			const tilt = (hash2(cx, cy) - 0.5) * 0.25;
			const lump = 0.25 * (noise3(X * 0.09, Y * 0.09, 3.1) - 0.5);
			const floor = RIM.floor + groove + tilt + lump - Z;
			if (floor < best) {
				best = floor;
				m = M.floor;
			}
		}
		// the rim: skip blocks whose outline is farther than the nearest so far
		let rim = Infinity;
		const lumpy = 0.4 * (fbm3(X * 0.16, Y * 0.16, 7.7, 2) - 0.5);
		for (const b of blocks) {
			const dx = Math.max(b.x0 - X, X - b.x1, 0);
			const dy = Math.max(b.y0 - Y, Y - b.y1, 0);
			if (dx > rim || dy > rim) continue;
			rim = Math.min(rim, blockSdf(b, X, Y, Z) + lumpy);
		}
		// claws cut into the rim
		if (rim < 4) for (const g of gouges) rim = Math.max(rim, -gougeSdf(g, X, Y, Z));
		if (rim < best) {
			best = rim;
			m = M.rim;
		}
		// the mortar bed the blocks are laid in, deep in every seam
		const outerBox = S.box(X - W * 0.5, Y - H * 0.5, 0, W * 0.5, H * 0.5, 1);
		const openingBox = S.box(X - W * 0.5, Y - H * 0.5, 0, W * 0.5 - B, H * 0.5 - B, 1);
		const bed = Math.max(Math.max(outerBox, -openingBox), 3.6 - Z);
		if (bed < best) {
			best = bed;
			m = M.mortar;
		}
		// the gold inlay: a strip one pixel wide set into the rim, filling the seams it crosses
		const ring = ringDistance(X, Y) - 0.5;
		if (ring < 3) {
			const gold = Math.max(ring, 0.5 - Z, Z - RIM.floor);
			if (gold < best) {
				best = gold;
				m = M.gold;
			}
		}
		hit.m = m;
		return best;
	};

	// world (y up, centred) ↔ model (pixels, y down)
	const toModelX = (x: number) => x / U + W * 0.5;
	const toModelY = (y: number) => H * 0.5 - y / U;
	const toWorld = (X: number, Y: number, Z: number) => [(X - W * 0.5) * U, (H * 0.5 - Y) * U, Z * U] as const;

	const sdf = (x: number, y: number, z: number) => model(toModelX(x), toModelY(y), z / U) * U;

	// the hall's stone: the same layered noise and cool grey, at the scale it has on the hall's
	// nearest walls (about 40 pixels to a metre)
	const stone = (k: number, cool: number): [number, number, number] => [
		k * (1 - cool * 0.25),
		k * (1 - cool * 0.12),
		k * (1 + cool * 0.35),
	];
	const material = (m: number, x: number, y: number, z: number): Material => {
		const X = toModelX(x);
		const Y = toModelY(y);
		const Z = z / U;
		const n = fbm3(X * 0.06, Y * 0.06, Z * 0.06, 3);
		const grain = noise3(X * 0.28, Y * 0.28, Z * 0.28);
		const k = 0.4 + 0.14 * n + 0.04 * grain;
		if (m === M.gold || (m === M.rim && ringDistance(X, Y) < 0.5))
			return { albedo: [0.95, 0.52, 0.12], spec: 0.7, shine: 30 };
		if (m === M.mortar) return { albedo: stone(k * 0.35, 0.5) };
		if (m === M.floor) {
			const fx = Math.floor((X - B) / CELL);
			const fy = Math.floor((Y - B) / CELL);
			const per = 0.92 + 0.16 * hash2(fx + 11, fy + 5);
			// worn patches; grime in the joints
			const wear = 0.94 + 0.12 * noise3(X * 0.05, Y * 0.05, 9);
			const grime = jointDistance(X - B, Y - B) < 1 ? 0.3 : 1;
			return { albedo: stone(k * 0.15 * per * wear * grime, 0.6), spec: 0.04, shine: 10 };
		}
		// rim: each block cut from its own stone, pitted by the chisel; the fresh stone inside a
		// claw mark is paler
		let fresh = 1;
		for (const g of gouges) {
			const d = gougeSdf(g, X, Y, Z);
			if (d < 0.5) fresh = Math.min(fresh, d < -0.4 ? 1 : 0.4);
			else if (d < 1.1 && fresh === 1) fresh = 1.3;
		}
		const index = blocks.findIndex((b) => X >= b.x0 - 0.5 && X <= b.x1 + 0.5 && Y >= b.y0 - 0.5 && Y <= b.y1 + 0.5);
		const per = 0.9 + 0.2 * hash2(index, 77);
		const pit = worley2(X * 0.3 + index * 3.1, Y * 0.3) < 0.09 ? 0.75 : 1;
		const tooth = 0.94 + 0.12 * noise3(X * 0.55, Y * 0.55, 2.2);
		return { albedo: stone(k * 0.75 * per * fresh * pit * tooth, 0.35), spec: 0.08, shine: 12 };
	};

	// lights, placed in model pixels: the hall's torches warm from the upper left in front, a cool
	// fill from the lower right
	const light = (X: number, Y: number, Z: number, rest: Omit<Light, 'x' | 'y' | 'z'>): Light => {
		const [x, y, z] = toWorld(X, Y, Z);
		return { x, y, z, ...rest };
	};
	const reach = Math.hypot(W, H) * U;
	const scene: Scene = {
		sdf,
		material,
		lights: [
			light(-1.1 * W, -1.6 * H, -0.6 * W, { color: [3.2, 2.35, 1.6], radius: reach * 4, soft: 2.8 }),
			light(1.6 * W, 1.3 * H, -0.8 * W, { color: [0.4, 0.5, 0.85], radius: reach * 3, shadows: false }),
		],
		camera: { eye: [0, 0, -40 * U], at: [0, 0, 0], fov: 10, ortho: H * 0.5 * U },
		sky: [0.08, 0.09, 0.15],
		ground: [0.05, 0.045, 0.06],
		background: [0, 0, 0],
	};
	const result = render(scene, {
		width: W,
		height: H,
		maxSteps: 160,
		far: 4,
		epsilon: 0.0015,
		ao: 0.55,
		exposure: 1.05,
	});

	const steel = RAMPS.steel;
	const greys = RAMPS.stone;
	// the hall's ramp: blue in shade, neutral grey in the light
	const stoneColours = [INK, steel[0], steel[1], steel[2], greys[3], greys[4], greys[5]];
	const floorColours = [INK, steel[0], steel[1], steel[2]];
	const rimPixels = quantize(result, { dither: 0.025, allowed: stoneColours });
	const floorPixels = quantize(result, { dither: 0.015, allowed: floorColours });

	const inOpening = (px: number, py: number) => px >= B && py >= B && px < W - B && py < H - B;
	const onRing = (px: number, py: number) => ringDistance(px + 0.5, py + 0.5) < 0.5;

	// the gold line takes one shade per run, as a flat inlay under one light does: the runs facing
	// the torch (top, left) brighter than the two in shade
	const g = RIM.gold;
	const goldAt = (px: number, py: number) => (py === g || (px === g && py < H - 1 - g) ? RAMPS.gold[4] : RAMPS.gold[3]);
	const frame = new PixelCanvas(W, H);
	for (let py = 0; py < H; py++)
		for (let px = 0; px < W; px++) {
			if (inOpening(px, py)) continue;
			const i = py * W + px;
			const edge = px === 0 || py === 0 || px === W - 1 || py === H - 1;
			frame.data[i] = edge ? INK : onRing(px, py) ? goldAt(px, py) : rimPixels.data[i];
		}

	const floor = new PixelCanvas(W - 2 * B, H - 2 * B);
	for (let py = 0; py < floor.height; py++)
		for (let px = 0; px < floor.width; px++)
			floor.data[py * floor.width + px] = floorPixels.data[(py + B) * W + px + B];
	// where the floor meets the lit lower and right walls, a line of contact shadow
	for (let px = 0; px < floor.width; px++) floor.set(px, floor.height - 1, DARKER[floor.get(px, floor.height - 1)]);
	for (let py = 0; py < floor.height - 1; py++) floor.set(floor.width - 1, py, DARKER[floor.get(floor.width - 1, py)]);

	const out = { frame, floor, result };
	cache.set(key, out);
	return out;
};

// the stone tray round the board, its opening CLEAR: (columns × 40 + 28) × (rows × 40 + 28)
export const boardFrame = (columns: number, rows: number) => renderBoard(columns, rows).frame;

// the flagstones under the symbols, with the rim's shadow: (columns × 40) × (rows × 40)
export const boardFloor = (columns: number, rows: number) => renderBoard(columns, rows).floor;
