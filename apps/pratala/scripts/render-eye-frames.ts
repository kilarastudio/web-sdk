// Renders the hall eye's frames for the game to draw over the background: for each shape and each
// hall, the eye's region (eyeBox) of the hall picture in every frame of EYE_FRAMES, rendered and
// quantized exactly as scripts/bake-hall.ts bakes the whole picture, cut to the box, scaled up four
// times and laid out in a grid (EYE_STRIP_COLUMNS to a row, row by row). Writes
// static/assets/eye/{base|bonus}-{landscape|portrait}-eye.png and the boxes it used into
// src/game/dragonEye.ts (EYES).
//   node scripts/render-eye-frames.ts            all four strips
//   node scripts/render-eye-frames.ts verify     also checks the open frame against the baked
//                                                background in static/assets/backgrounds
import { readFileSync, writeFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

import { PixelCanvas } from '../src/pixel/canvas.ts';
import { png, upscale } from '../src/pixel/png.ts';
import { CAMERA, EYE_Y, HALL, HALL_SIZES, eyeBox, hallScene, type HallOptions } from '../src/pixel/render/hall.ts';
import { quantize } from '../src/pixel/render/quantize.ts';
import { render, type RenderOptions, type Scene } from '../src/pixel/render/raymarch.ts';
import { EYE_FRAMES, EYE_STRIP_COLUMNS, EYE_STRIP_SCALE, type EyeFrame } from '../src/game/dragonEye.ts';

// the grid as near square as the frames allow, so no side of the texture grows past the others
const COLUMNS = Math.ceil(Math.sqrt(EYE_FRAMES.length));
const ROWS = Math.ceil(EYE_FRAMES.length / COLUMNS);
if (COLUMNS !== EYE_STRIP_COLUMNS) throw new Error(`EYE_STRIP_COLUMNS in dragonEye.ts should be ${COLUMNS}`);

const SHAPES = HALL_SIZES;
type Shape = keyof typeof SHAPES;

// The same render and quantize options as scripts/bake-hall.ts, so the open frame is the picture.
// They are copied, not imported, because importing bake-hall.ts bakes the halls; the check below
// stops the run if the two drift apart.
const RENDER: Omit<RenderOptions, 'width' | 'height'> = { maxSteps: 200, far: 40, ao: 0.5, exposure: 1.3 };
const QUANTIZE = { dither: 0.035, outlineDarken: 1 };
const bake = readFileSync(new URL('./bake-hall.ts', import.meta.url), 'utf8');
for (const [name, value] of [['HALL_RENDER', RENDER], ['HALL_QUANTIZE', QUANTIZE]] as const) {
	const literal = bake.match(new RegExp(`export const ${name} = (\\{[^}]*\\})`))?.[1];
	const theirs = literal && (Function(`return ${literal}`)() as object);
	if (JSON.stringify(theirs) !== JSON.stringify(value))
		throw new Error(`${name} in bake-hall.ts is ${literal}; update this script to match`);
}

// what each frame changes on the eye; the eye's own light is left alone so nothing outside the
// box changes
const FRAMES: Record<EyeFrame, HallOptions & { brighter?: number }> = {
	open: {},
	half: { open: 0.5 },
	shut: { open: 0.05 },
	alert: { pupil: 1.7, brighter: 1.35 },
	// across the eye as the player sees it, and down toward the board
	lookLeft: { look: [-0.8, 0] },
	lookRight: { look: [0.8, 0] },
	lookDown: { look: [0, -0.8] },
};

type Box = { x: number; y: number; width: number; height: number };

const sceneFor = (shape: Shape, hot: boolean, frame: EyeFrame): Scene => {
	const { brighter, ...options } = FRAMES[frame];
	const scene = hallScene({ hot, ...options });
	scene.camera = { ...CAMERA[shape] };
	if (brighter) {
		// the alert eye burns brighter: the eyeball's own emission only, picked by its surface
		const E = HALL.eye;
		const material = scene.material;
		scene.material = (m, x, y, z, nx, ny, nz) => {
			const mat = material(m, x, y, z, nx, ny, nz);
			const onEye = Math.abs(Math.hypot(x - E.x, y - EYE_Y, z - E.z) - E.radius) < 0.03;
			if (!onEye || !mat.emissive) return mat;
			const [r, g, b] = mat.emissive;
			return { ...mat, emissive: [r * brighter, g * brighter, b * brighter] };
		};
	}
	return scene;
};

// the frame quantized over the box and one pixel round it (so ink along depth jumps at the box's
// edge sees its neighbours), as a canvas the size of the whole picture
const renderFrame = (shape: Shape, hot: boolean, frame: EyeFrame, box: Box) => {
	const { width, height } = SHAPES[shape];
	const region = {
		x0: Math.max(0, box.x - 1),
		y0: Math.max(0, box.y - 1),
		x1: Math.min(width, box.x + box.width + 1),
		y1: Math.min(height, box.y + box.height + 1),
	};
	const result = render(sceneFor(shape, hot, frame), { width, height, ...RENDER, region });
	return quantize(result, QUANTIZE);
};

// the RGBA of a PNG written by src/pixel/png.ts (8-bit RGBA, not interlaced)
const readPng = (file: URL) => {
	const bytes = readFileSync(file);
	let at = 8;
	let width = 0;
	let height = 0;
	const idat: Buffer[] = [];
	while (at < bytes.length) {
		const length = bytes.readUInt32BE(at);
		const type = bytes.toString('ascii', at + 4, at + 8);
		const body = bytes.subarray(at + 8, at + 8 + length);
		if (type === 'IHDR') {
			width = body.readUInt32BE(0);
			height = body.readUInt32BE(4);
			if (body[8] !== 8 || body[9] !== 6 || body[12] !== 0) throw new Error(`${file.pathname}: not 8-bit RGBA`);
		} else if (type === 'IDAT') idat.push(body);
		at += 12 + length;
	}
	const raw = inflateSync(Buffer.concat(idat));
	const stride = width * 4;
	const out = new Uint8Array(stride * height);
	for (let y = 0; y < height; y++) {
		const filter = raw[y * (stride + 1)];
		for (let x = 0; x < stride; x++) {
			const v = raw[y * (stride + 1) + 1 + x];
			const a = x >= 4 ? out[y * stride + x - 4] : 0;
			const b = y > 0 ? out[(y - 1) * stride + x] : 0;
			const c = x >= 4 && y > 0 ? out[(y - 1) * stride + x - 4] : 0;
			const p = a + b - c;
			const pa = Math.abs(p - a);
			const pb = Math.abs(p - b);
			const pc = Math.abs(p - c);
			const paeth = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
			out[y * stride + x] = (v + [0, a, b, (a + b) >> 1, paeth][filter]) & 0xff;
		}
	}
	return { width, height, data: out };
};

const crop = (canvas: PixelCanvas, box: Box) => {
	const out = new PixelCanvas(box.width, box.height);
	for (let y = 0; y < box.height; y++)
		for (let x = 0; x < box.width; x++) out.data[y * box.width + x] = canvas.get(box.x + x, box.y + y);
	return out;
};

const verify = process.argv.includes('verify');
const boxes = {} as Record<Shape, Box>;
for (const shape of ['Landscape', 'Portrait'] as const) {
	const box = eyeBox(shape);
	boxes[shape] = box;
	for (const hot of [false, true]) {
		const started = Date.now();
		const frames = EYE_FRAMES.map((frame) => crop(renderFrame(shape, hot, frame, box), box));
		// every change between frames must lie inside the box, away from its edge
		const open = frames[0];
		let changed = 0;
		let edge = 0;
		frames.forEach((f) => {
			for (let y = 0; y < box.height; y++)
				for (let x = 0; x < box.width; x++)
					if (f.data[y * box.width + x] !== open.data[y * box.width + x]) {
						changed++;
						// the top edge may be the picture's own, where the hole runs on above it
						const top = box.y > 0 && y < 2;
						if (x < 2 || top || x >= box.width - 2 || y >= box.height - 2) edge++;
					}
		});
		const name = `${hot ? 'bonus' : 'base'}-${shape.toLowerCase()}-eye`;
		if (verify) {
			// the baked background, four of its pixels to an art pixel, against the open frame
			const file = new URL(`../static/assets/backgrounds/${hot ? 'bonus' : 'base'}-${shape.toLowerCase()}.png`, import.meta.url);
			const baked = readPng(file);
			const mine = open.toRGBA(1).data;
			let off = 0;
			for (let y = 0; y < box.height; y++)
				for (let x = 0; x < box.width; x++) {
					const from = (((box.y + y) * EYE_STRIP_SCALE) * baked.width + (box.x + x) * EYE_STRIP_SCALE) * 4;
					const to = (y * box.width + x) * 4;
					if (baked.data[from] !== mine[to] || baked.data[from + 1] !== mine[to + 1] || baked.data[from + 2] !== mine[to + 2]) off++;
				}
			console.log(`  ${name}: open frame differs from the baked background in ${off} of ${box.width * box.height} pixels`);
		}
		// the strip: a grid of frames, row by row, each pixel EYE_STRIP_SCALE × EYE_STRIP_SCALE; the
		// cells past the last frame stay transparent
		const stripWidth = box.width * EYE_STRIP_SCALE * COLUMNS;
		const stripHeight = box.height * EYE_STRIP_SCALE * ROWS;
		const strip = new Uint8ClampedArray(stripWidth * stripHeight * 4);
		frames.forEach((f, index) => {
			const big = upscale(f.width, f.height, f.toRGBA(1).data, EYE_STRIP_SCALE);
			const left = (index % COLUMNS) * big.width;
			const top = Math.floor(index / COLUMNS) * big.height;
			for (let y = 0; y < big.height; y++)
				strip.set(
					big.data.subarray(y * big.width * 4, (y + 1) * big.width * 4),
					((top + y) * stripWidth + left) * 4,
				);
		});
		writeFileSync(new URL(`../static/assets/eye/${name}.png`, import.meta.url), png(stripWidth, stripHeight, strip));
		console.log(
			`${name}.png ${stripWidth}x${stripHeight}, box ${JSON.stringify(box)}, ${changed} changed pixels (${edge} at the edge), ${Date.now() - started} ms`,
		);
	}
}

// the boxes into src/game/dragonEye.ts
const file = new URL('../src/game/dragonEye.ts', import.meta.url);
const source = readFileSync(file, 'utf8');
const line = (b: Box) => `{ x: ${b.x}, y: ${b.y}, width: ${b.width}, height: ${b.height} }`;
const eyes = `export const EYES = {\n\tLandscape: ${line(boxes.Landscape)},\n\tPortrait: ${line(boxes.Portrait)},\n} as const;`;
const next = source.replace(/export const EYES = \{[\s\S]*?\} as const;/, eyes);
if (next === source && !source.includes(eyes)) throw new Error('EYES not found in dragonEye.ts');
writeFileSync(file, next);
console.log('EYES', boxes);
