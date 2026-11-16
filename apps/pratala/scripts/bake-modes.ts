// The mode pictures on the buy cards, built from the v2 symbol models at 64 × 64 art pixels,
// shipped ×4 into static/assets/ui. ANTE: two scatter eyes. BOOST: the eye, alert, over fire.
// BONUS, SUPER, HOARD: the eye in a heavier mood with its own fire and coins.
//   node scripts/bake-modes.ts
import { writeFileSync } from 'node:fs';

import { PixelCanvas } from '../src/pixel/canvas.ts';
import { png, sheet, upscale } from '../src/pixel/png.ts';
import { renderSymbol } from '../src/pixel/render/symbols/rig.ts';
import { eye } from '../src/pixel/render/symbols/eye.ts';
import { coin } from '../src/pixel/render/symbols/coin.ts';
import * as ui from '../src/pixel/ui.ts';

const SIZE = 64;
const big = (model: Parameters<typeof renderSymbol>[0], view = {}, px = 56) => renderSymbol(model, view, px);

const compose = (parts: { art: PixelCanvas; x: number; y: number }[]) => {
	const canvas = new PixelCanvas(SIZE, SIZE);
	for (const { art, x, y } of parts) canvas.blit(art, x, y);
	return canvas;
};
const fire = (frame: number, length: number, depth: number) => ui.fireBedFrames(length, depth, 4, 11, 0.42, 1.2)[frame];

const pictures: Record<string, PixelCanvas> = {
	ante: compose([
		{ art: big(eye({ look: [0.5, 0.1] }), { yaw: -0.25 }, 34), x: -2, y: 20 },
		{ art: big(eye({ look: [-0.5, 0.1] }), { yaw: 0.25 }, 34), x: 31, y: 8 },
	]),
	boost: compose([
		{ art: fire(3, 60, 26), x: 2, y: 38 },
		{ art: big(eye({ pupil: 1.5, glow: 0.8 }), { yaw: -0.1 }, 56), x: 4, y: 0 },
	]),
	bonus: compose([{ art: big(eye({ open: 0.75 }), { yaw: -0.3 }, 60), x: 2, y: 2 }]),
	super: compose([
		{ art: fire(5, 62, 30), x: 1, y: 34 },
		{ art: big(eye({ pupil: 1.6, glow: 1 }), { yaw: -0.3 }, 60), x: 2, y: -2 },
	]),
	hoard: compose([
		{ art: fire(2, 62, 24), x: 1, y: 40 },
		{ art: big(eye({ pupil: 1.6, glow: 1 }), { yaw: -0.3 }, 54), x: 5, y: 0 },
		{ art: big(coin({ turn: 0.1 }), { yaw: -0.5 }, 22), x: 2, y: 40 },
		{ art: big(coin({ turn: 0.4 }), { yaw: 0.8 }, 22), x: 40, y: 42 },
		{ art: big(coin({ turn: 0.2 }), { yaw: 0.2 }, 24), x: 20, y: 44 },
	]),
};

for (const [name, canvas] of Object.entries(pictures)) {
	const { width, height, data } = canvas.toRGBA(1);
	const b = upscale(width, height, data, 4);
	writeFileSync(`static/assets/ui/mode-${name}.png`, png(b.width, b.height, b.data));
}
writeFileSync('../../../output/pratala/art-v2/modes.png', sheet(Object.values(pictures), { columns: 5, scale: 4, background: 0x0e071b }));
console.log('wrote mode pictures');
