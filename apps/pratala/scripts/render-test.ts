// A test scene for the renderer: a flagstone floor with grooves, a pillar, a sphere, a torch.
//   node scripts/render-test.ts
import { writeFileSync } from 'node:fs';

import { canvasPng } from '../src/pixel/png.ts';
import { render, hit, type Scene } from '../src/pixel/render/raymarch.ts';
import { quantize, rgbOf } from '../src/pixel/render/quantize.ts';
import * as S from '../src/pixel/render/sdf.ts';
import { fbm3, noise2 } from '../src/pixel/render/noise.ts';

const out = '../../../output/pratala/art-v2';

const STONE = 0;
const PILLAR = 1;
const BALL = 2;
const GOLD = 3;

const scene: Scene = {
	sdf: (x, y, z) => {
		let best = Infinity;
		let m = 0;
		// floor with flagstone grooves 1.2 units apart, 0.03 deep
		const gx = Math.abs(((x + 0.6) % 1.2) - 0.6);
		const gz = Math.abs(((z + 0.6) % 1.2) - 0.6);
		const groove = Math.min(gx, gz) < 0.03 ? 0.03 : 0;
		const floor = y + groove;
		if (floor < best) {
			best = floor;
			m = STONE;
		}
		const pillar = S.cylinderY(x + 1.6, y - 1.5, z - 1, 0.45, 1.5);
		if (pillar < best) {
			best = pillar;
			m = PILLAR;
		}
		const ball = S.sphere(x - 1.2, y - 0.6, z - 0.4, 0.6);
		if (ball < best) {
			best = ball;
			m = BALL;
		}
		const bar = S.roundBox(x - 0.2, y - 0.15, z + 1.4, 0.9, 0.15, 0.3, 0.05);
		if (bar < best) {
			best = bar;
			m = GOLD;
		}
		hit.m = m;
		return best;
	},
	material: (m, x, y, z) => {
		if (m === STONE) {
			const n = fbm3(x * 3, y * 3, z * 3, 3);
			const k = 0.28 + 0.2 * n;
			return { albedo: [k * 0.9, k * 0.92, k * 1.05], spec: 0.05, shine: 8 };
		}
		if (m === PILLAR) {
			const n = noise2(x * 6 + z * 2, y * 6);
			const k = 0.35 + 0.15 * n;
			return { albedo: [k, k * 0.98, k * 1.1], spec: 0.08, shine: 10 };
		}
		if (m === BALL) return { albedo: rgbOf(0xc42430), spec: 0.6, shine: 48 };
		return { albedo: rgbOf(0xffa214), spec: 0.9, shine: 64 };
	},
	lights: [
		{ x: -1.1, y: 2.4, z: 0.2, color: [3.2, 1.9, 0.9], radius: 3.2, soft: 10 },
		{ x: 2.6, y: 1.8, z: -1.5, color: [0.7, 0.8, 1.3], radius: 4, soft: 16 },
	],
	camera: { eye: [0, 1.7, -4.6], at: [0, 0.8, 0.5], fov: 55 },
	sky: [0.22, 0.24, 0.34],
	ground: [0.03, 0.03, 0.04],
	background: [0.02, 0.02, 0.03],
	fog: { color: [0.02, 0.02, 0.03], density: 0.05 },
};

const started = Date.now();
const result = render(scene, { width: 192, height: 108 });
console.log(`rendered in ${Date.now() - started} ms`);
writeFileSync(`${out}/test-dither.png`, canvasPng(quantize(result, { dither: 0.06 }), 4));
writeFileSync(`${out}/test-ink.png`, canvasPng(quantize(result, { dither: 0.06, outline: 0.06 }), 4));
writeFileSync(
	`${out}/test-darken.png`,
	canvasPng(quantize(result, { dither: 0.06, outlineDarken: 2 }), 4),
);
console.log('wrote test-*.png');
