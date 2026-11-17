import * as PIXI from 'pixi.js';

import { PixelCanvas } from './canvas.ts';
import { CLEAR, INK, LIGHTER, WHITE } from './palette.ts';
import { SYMBOL_DRAWINGS, SYMBOL_GLOW } from './symbols.ts';
import { SYMBOL_FRAME_RUNS } from './symbolRuns.ts';
import * as ui from './ui.ts';

// Art pixels are drawn four screen-texture pixels wide and sampled linearly: edges stay crisp at
// any layout scale, and nothing shimmers while the reels move at fractional speeds.
export const PIXEL_SCALE = 4;

// enough steps for the band of light to cross a symbol without jumping
export const SHINE_FRAMES = 12;

const sourceOf = (canvas: PixelCanvas) => {
	const { width, height, data } = canvas.toRGBA(PIXEL_SCALE);
	const element = document.createElement('canvas');
	element.width = width;
	element.height = height;
	element.getContext('2d')?.putImageData(new ImageData(data, width, height), 0, 0);

	return new PIXI.ImageSource({ resource: element, autoGenerateMipmaps: true });
};

const toTexture = (canvas: PixelCanvas) => new PIXI.Texture({ source: sourceOf(canvas) });

type Box = { x: number; y: number; width: number; height: number };

// the smallest box round the art pixels that pass the test
const boxOf = (width: number, height: number, test: (x: number, y: number) => boolean): Box => {
	let left = width;
	let top = height;
	let right = -1;
	let bottom = -1;
	for (let y = 0; y < height; y++)
		for (let x = 0; x < width; x++) {
			if (!test(x, y)) continue;
			left = Math.min(left, x);
			right = Math.max(right, x);
			top = Math.min(top, y);
			bottom = Math.max(bottom, y);
		}
	// nothing at all: one clear pixel stands for it
	if (right < 0) return { x: 0, y: 0, width: 1, height: 1 };

	return { x: left, y: top, width: right - left + 1, height: bottom - top + 1 };
};

// Only the box is stored; `orig` keeps the whole frame's size and `trim` where the box sits in it,
// so a sprite sizes and places the texture as if it were whole.
const croppedTexture = (canvas: PixelCanvas, box: Box) => {
	const part = new PixelCanvas(box.width, box.height).blit(canvas, -box.x, -box.y);
	const source = sourceOf(part);

	return new PIXI.Texture({
		source,
		frame: new PIXI.Rectangle(0, 0, source.width, source.height),
		orig: new PIXI.Rectangle(0, 0, canvas.width * PIXEL_SCALE, canvas.height * PIXEL_SCALE),
		trim: new PIXI.Rectangle(box.x * PIXEL_SCALE, box.y * PIXEL_SCALE, source.width, source.height),
	});
};

// Frames that only change the still art in places (an ember, a liquid's surface, an eye) are drawn
// over it: their texture holds just the box where they differ. The game draws the still art
// under any texture in this set.
export const OVER_STILL = new WeakSet<PIXI.Texture>();

// A run of frames, each stored as small as it can be: over the still art where that is enough,
// else cropped to what is drawn. A frame the same as one before shares its texture.
const runTextures = (frames: PixelCanvas[], still?: PixelCanvas) => {
	const made = new Map<string, PIXI.Texture>();

	return frames.map((frame) => {
		const id = frame.data.join(',');
		const known = made.get(id);
		if (known) return known;
		const margin = still ? (frame.width - still.width) / 2 : 0;
		const under = (x: number, y: number) => (still ? still.get(x - margin, y - margin) : CLEAR);
		let erases = false;
		const changed = boxOf(frame.width, frame.height, (x, y) => {
			const differs = frame.get(x, y) !== under(x, y);
			if (differs && frame.get(x, y) === CLEAR) erases = true;

			return differs;
		});
		const drawn = boxOf(frame.width, frame.height, (x, y) => frame.get(x, y) !== CLEAR);
		const over = still && !erases && changed.width * changed.height < drawn.width * drawn.height;
		const texture = croppedTexture(frame, over ? changed : drawn);
		if (over) OVER_STILL.add(texture);
		made.set(id, texture);

		return texture;
	});
};

// a band of light crossing the symbol from the top left to the bottom right: lighter toward the
// band's edges, white at its core. Only the band is drawn, so it lies over whatever the symbol
// shows under it. The outline stays dark: on code-drawn art it is INK, on drawn art whatever dark
// the artist used, so the rim is left alone too.
const shineFrames = (canvas: PixelCanvas) =>
	Array.from({ length: SHINE_FRAMES }, (_, frame) => {
		const at = -8 + ((canvas.width + canvas.height + 16) * frame) / (SHINE_FRAMES - 1);
		const lit = new PixelCanvas(canvas.width, canvas.height);
		for (let y = 0; y < canvas.height; y++)
			for (let x = 0; x < canvas.width; x++) {
				const c = canvas.get(x, y);
				if (c === CLEAR || c === INK) continue;
				const rim =
					canvas.get(x - 1, y) === CLEAR ||
					canvas.get(x + 1, y) === CLEAR ||
					canvas.get(x, y - 1) === CLEAR ||
					canvas.get(x, y + 1) === CLEAR;
				if (rim) continue;
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
		art[`${key}Shine`] = runTextures(shineFrames(canvas));
	}

	// What the symbols do in every state (pixel/symbolRuns.ts). Every run but Gone is drawn over its
	// symbol's still art where it can be; Gone starts from where the win left the symbol.
	const stills = Object.keys(SYMBOL_DRAWINGS).sort((a, b) => b.length - a.length);
	for (const [key, frames] of Object.entries(SYMBOL_FRAME_RUNS())) {
		const symbol = stills.find((still) => key.startsWith(still)) as keyof typeof SYMBOL_DRAWINGS;
		art[key] = runTextures(frames, key.endsWith('Gone') ? undefined : SYMBOL_DRAWINGS[symbol]());
	}

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
	// a win's light behind the symbol, one base per colour; its beat and its hit are white, tinted
	for (const ramp of new Set(Object.values(SYMBOL_GLOW)))
		art[`winGlow_${ramp}`] = toTexture(ui.winGlow(ramp));
	art.winGlowWave = ui.winGlowWaves().map(toTexture);
	art.winGlowFlash = toTexture(ui.winGlowFlash());
	art.landDust = ui.landPuffFrames(false).map(toTexture);
	art.landEmbers = ui.landPuffFrames(true).map(toTexture);
	art.pixel = toTexture(ui.pixel());
	art.anticipationBeam = toTexture(ui.anticipationBeam());
	art.gazeBeam = ui.gazeBeamFrames(false).map(toTexture);
	art.gazeBeamHead = ui.gazeBeamFrames(true).map(toTexture);

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
