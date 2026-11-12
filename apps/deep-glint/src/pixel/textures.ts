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

// the symbol with a band of light crossing it from the top left to the bottom right:
// lighter toward the band's edges, white at its core
const shineFrames = (canvas: PixelCanvas) =>
	Array.from({ length: SHINE_FRAMES }, (_, frame) => {
		const at = -8 + ((canvas.width + canvas.height + 16) * frame) / (SHINE_FRAMES - 1);
		const lit = canvas.clone();
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

	// the gems' turning light, the scatter's blink and alert
	for (const [key, frames] of Object.entries(SYMBOL_FRAME_RUNS())) art[key] = frames.map(toTexture);
	art.slash = ui.slashFrames().map(toTexture);

	for (const [width, height] of flames)
		art[`flame${width}x${height}`] = ui.flameFrames(width, height).map(toTexture);
	art.flameGlow = toTexture(ui.flameGlow());

	art.boardFloor = toTexture(ui.boardFloor(columns, rows));
	art.boardFrame = toTexture(ui.boardFrame(columns, rows));
	art.panel = toTexture(ui.panel());
	for (const tier of [1, 2, 3, 4] as const) art[`glintTile${tier}`] = toTexture(ui.glintTile(tier));
	art.glintPrimed = toTexture(ui.glintPrimed());
	art.glintFlash = toTexture(ui.glintFlash());
	art.coin = ui.coinFrames().map(toTexture);
	art.fireball = ui.fireballFrames().map(toTexture);
	art.burst = ui.burstFrames().map(toTexture);
	art.pixel = toTexture(ui.pixel());
	art.anticipationBeam = toTexture(ui.anticipationBeam());
	const { trough, fill } = ui.loadingBar(120);
	art.loadingTrough = toTexture(trough);
	art.loadingFill = toTexture(fill);

	return art;
};
