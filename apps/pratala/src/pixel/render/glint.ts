// Glint Spots as the dragon's sigils: a ring carved into the flagstone with tick marks, more
// of them with each tier, and the carving lit from within in the tier's colour. Rendered straight
// on, the cell's 40 pixels, like the board (20 pixels to a unit so the marcher's steps fit).
import { PixelCanvas } from '../canvas.ts';
import { noise2, noise3 } from './noise.ts';
import { hit, render, type Material, type Scene } from './raymarch.ts';
import { quantize, rgbOf } from './quantize.ts';
import * as S from './sdf.ts';

export const GLINT_TIER_COLOURS = [
	{ glow: rgbOf(0x0cf1ff), deep: rgbOf(0x0069aa) },
	{ glow: rgbOf(0xdb3ffd), deep: rgbOf(0x7a09fa) },
	{ glow: rgbOf(0xffa214), deep: rgbOf(0xff5000) },
	{ glow: rgbOf(0xf68187), deep: rgbOf(0xff0040) },
] as const;

const PX = 20;
const CELL = 40;
const M = { stone: 0, groove: 1 };

export const glintTile = (tier: 1 | 2 | 3 | 4, lit = 1): PixelCanvas => {
	const half = CELL / PX / 2; // the cell in units
	const colour = GLINT_TIER_COLOURS[tier - 1];
	// the carving: a ring, and tick marks round it
	const R = 0.62;
	const carve = (x: number, y: number, z: number) => {
		let d = S.length2(S.length2(x, y) - R, z) - 0.04;
		const ticks = tier === 1 ? 0 : tier === 2 ? 4 : tier === 3 ? 6 : 8;
		for (let i = 0; i < ticks; i++) {
			const a = (i / ticks) * Math.PI * 2 + Math.PI / 4;
			const cx = Math.cos(a) * (R + 0.16);
			const cy = Math.sin(a) * (R + 0.16);
			const len = tier >= 4 && i % 2 === 0 ? 0.09 : 0.06;
			// a short radial bar
			const ux = Math.cos(a);
			const uy = Math.sin(a);
			const px = x - cx;
			const py = y - cy;
			const along = px * ux + py * uy;
			const across = -px * uy + py * ux;
			d = Math.min(d, S.length2(Math.max(Math.abs(along) - len, 0), S.length2(Math.max(Math.abs(across) - 0.012, 0), z)) - 0.025);
		}
		if (tier >= 3) d = Math.min(d, S.length2(S.length2(x, y) - R * 0.6, z) - 0.03);
		if (tier >= 4) {
			// a slit pupil in the middle
			d = Math.min(d, S.box(x, y, z, 0.035, 0.2, 0.06) - 0.015);
		}
		return d;
	};
	const scene: Scene = {
		sdf: (x, y, z) => {
			// the stone slab, its face at z = 0 toward the camera (camera at -z looking +z)
			const stone = -z + 0.012 * noise2(x * 7 + 3, y * 7 + 1);
			const groove = carve(x, y, z);
			// the groove is cut into the slab
			const d = Math.max(stone, -groove);
			hit.m = groove < 0.02 && z > -0.06 ? M.groove : M.stone;
			return d;
		},
		material: (m, x, y, z): Material => {
			const g = carve(x, y, z);
			const n = noise3(x * 9, y * 9, 2);
			const k = 0.1 + 0.05 * n;
			if (m === M.groove || g < 0.015) {
				return { albedo: [colour.deep[0] * 0.5, colour.deep[1] * 0.5, colour.deep[2] * 0.5], emissive: [colour.glow[0] * 1.6 * lit, colour.glow[1] * 1.6 * lit, colour.glow[2] * 1.6 * lit] };
			}
			// the stone near the carving catches its light
			const halo = Math.max(0, 1 - g / 0.18) * lit * (0.25 + 0.1 * tier);
			return {
				albedo: [k * 0.9, k * 0.95, k * 1.15],
				emissive: [colour.glow[0] * halo * 0.5, colour.glow[1] * halo * 0.5, colour.glow[2] * halo * 0.5],
				spec: 0.05,
				shine: 8,
			};
		},
		lights: [
			{ x: -2, y: 2.5, z: -3, color: [1.4, 1.1, 0.8], radius: 6, soft: 10, shadows: false },
		],
		camera: { eye: [0, 0, -5], at: [0, 0, 0], fov: 10, ortho: half },
		sky: [0.1, 0.1, 0.14],
		ground: [0.02, 0.02, 0.03],
		background: [0, 0, 0],
	};
	const result = render(scene, { width: CELL, height: CELL, maxSteps: 120, far: 12, epsilon: 0.003, ao: 0.4, exposure: 1 });
	return quantize(result, { dither: 0.03, clearBackground: true });
};
