import * as PIXI from 'pixi.js';

import { PixelCanvas } from './canvas.ts';
import { CLEAR, INK, LIGHTER, WHITE } from './palette.ts';
import { SYMBOL_DRAWINGS, SYMBOL_FRAME_RUNS } from './symbols.ts';
import * as ui from './ui.ts';

// Art pixels are drawn four screen-texture pixels wide and sampled linearly: edges stay crisp at
// any layout scale, and nothing shimmers while the reels move at fractional speeds.
export const PIXEL_SCALE = 4;

// enough steps for the band of light to cross a symbol without jumping
export const SHINE_FRAMES = 12;

const toTexture = (canvas: PixelCanvas) => {
	const { width, height, data } = canvas.toRGBA(PIXEL_SCALE);
	const element = document.createElement('canvas');
	element.width = width;
	element.height = height;
	element.getContext('2d')?.putImageData(new ImageData(data, width, height), 0, 0);

	return new PIXI.Texture({
		source: new PIXI.ImageSource({ resource: element, autoGenerateMipmaps: true }),
	});
};

// a band of light crossing the symbol from the top left to the bottom right: lighter toward the
// band's edges, white at its core. Only the band is drawn, so it lies over whatever the symbol
// shows under it.
const shineFrames = (canvas: PixelCanvas) =>
	Array.from({ length: SHINE_FRAMES }, (_, frame) => {
		const at = -8 + ((canvas.width + canvas.height + 16) * frame) / (SHINE_FRAMES - 1);
		const lit = new PixelCanvas(canvas.width, canvas.height);
		for (let y = 0; y < canvas.height; y++)
			for (let x = 0; x < canvas.width; x++) {
				const c = canvas.get(x, y);
				if (c === CLEAR || c === INK) continue;
				const distance = Math.abs(x + y - at);
				if (distance <= 1) lit.set(x, y, WHITE);
				else if (distance <= 5) lit.set(x, y, LIGHTER[LIGHTER[c]]);
			}

		return lit;
	});

// the symbol's silhouette in white, for the frames where it flashes
const flash = (canvas: PixelCanvas) =>
	canvas.clone().paint(
		() => true,
		() => WHITE,
	);

export type GeneratedArt = Record<string, PIXI.Texture | PIXI.Texture[]>;

// how much light each frame of a torch flame gives, keyed like the flame (ui.flameLight)
export const FLAME_LIGHT = new Map<string, number[]>();

// Every texture the game draws by code, keyed like a loaded asset.
export const generateArt = ({
	columns,
	rows,
	flames = [],
}: {
	columns: number;
	rows: number;
	// the torch flame sizes the backgrounds need, as [width, height] in art pixels
	flames?: (readonly [number, number])[];
}): GeneratedArt => {
	const art: GeneratedArt = {};

	for (const [key, draw] of Object.entries(SYMBOL_DRAWINGS)) {
		const canvas = draw();
		art[key] = toTexture(canvas);
		art[`${key}Flash`] = toTexture(flash(canvas));
		art[`${key}Shine`] = shineFrames(canvas).map(toTexture);
	}

	// what the symbols do at rest, how a win leaves them and how they go
	for (const [key, frames] of Object.entries(SYMBOL_FRAME_RUNS())) art[key] = frames.map(toTexture);

	for (const [width, height] of flames) {
		const run = ui.flameFrames(width, height);
		art[`flame${width}x${height}`] = run.map(toTexture);
		FLAME_LIGHT.set(`flame${width}x${height}`, ui.flameLight(run));
		art[`soot${width}x${height}`] = ui.sootFrames(width, height).map(toTexture);
	}
	art.flameGlow = toTexture(ui.flameGlow());
	art.smokeWisp = ui.smokeWispFrames().map(toTexture);

	art.boardFloor = toTexture(ui.boardFloor(columns, rows));
	art.boardFrame = toTexture(ui.boardFrame(columns, rows));
	art.panel = toTexture(ui.panel());
	for (const tier of [1, 2, 3, 4] as const) {
		art[`glintTile${tier}`] = toTexture(ui.glintTile(tier));
		art[`glintIgnite${tier}`] = ui.glintIgniteFrames(tier).map(toTexture);
	}
	art.glintIgniteFront = ui.glintIgniteFrames(0).map(toTexture);
	art.glintPrimed = toTexture(ui.glintPrimed());
	art.glintFlash = toTexture(ui.glintFlash());
	art.coin = ui.coinFrames().map(toTexture);
	art.fireball = ui.fireballFrames().map(toTexture);
	art.burst = ui.burstFrames().map(toTexture);
	art.pixel = toTexture(ui.pixel());
	art.anticipationBeam = toTexture(ui.anticipationBeam());

	return art;
};

// Art drawn the first time it is asked for, once: what only some rounds ever show.
const drawn = new Map<string, unknown>();
const once = <T>(key: string, draw: () => T) => {
	if (!drawn.has(key)) drawn.set(key, draw());

	return drawn.get(key) as T;
};

// a bed of fire this many art pixels across and high, as a loop of frames
export const fireBed = (
	length: number,
	depth: number,
	under = 0,
	seed = 11,
	taper = 0.42,
	wild = 1.2,
) =>
	once(`fireBed${length}x${depth}+${under}:${seed}:${taper}:${wild}`, () =>
		ui.fireBedFrames(length, depth, under, seed, taper, wild).map(toTexture),
	);

// the claw marks of the free spins intro: each one's scar and the glow inside it
export const clawMarks = () =>
	once('clawMarks', () =>
		ui.clawMarks().map(({ scar, glow, x, y }) => ({
			scar: toTexture(scar),
			glow: toTexture(glow),
			x,
			y,
			width: scar.width,
			height: scar.height,
		})),
	);
