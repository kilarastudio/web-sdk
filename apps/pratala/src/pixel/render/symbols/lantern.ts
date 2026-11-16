// H4: an iron lantern, lit from within. Four iron bars round a glass, a peaked cap with a ring,
// a fat base; the flame inside is the only thing that moves at rest.
import { noise3 } from '../noise.ts';
import * as S from '../sdf.ts';
import { rgbOf } from '../quantize.ts';
import type { SymbolModel } from './rig.ts';
import { hit } from './rig.ts';

const M = { iron: 0, glass: 1, flame: 2, ring: 3 };

export type LanternState = {
	// 0..1 flame phase for the rest loop
	phase?: number;
	// 0 normal .. 1 the flame leaps (a win)
	flare?: number;
};

export const lantern = ({ phase = 0, flare = 0 }: LanternState = {}): SymbolModel => {
	const flameH = 0.2 + 0.05 * Math.sin(phase * Math.PI * 2) + 0.28 * flare;
	const flameW = 0.085 + 0.02 * Math.cos(phase * Math.PI * 2 + 1) + 0.05 * flare;
	return {
		centreY: 0.52,
		reach: 0.6,
		exposure: 1.05,
		sdf: (x, y, z) => {
			let best = Infinity;
			let m = M.iron;
			const take = (d: number, mm: number) => {
				if (d < best) {
					best = d;
					m = mm;
				}
			};
			// base: a squat octagonal block
			take(S.roundBox(x, y - 0.06, z, 0.3, 0.06, 0.3, 0.03), M.iron);
			take(S.cylinderY(x, y - 0.15, z, 0.26, 0.04), M.iron);
			// glass: a box, slightly narrower than the frame
			take(S.roundBox(x, y - 0.5, z, 0.2, 0.32, 0.2, 0.02), M.glass);
			// four corner bars
			for (const sx of [-1, 1])
				for (const sz of [-1, 1]) take(S.box(x - sx * 0.22, y - 0.5, z - sz * 0.22, 0.035, 0.34, 0.035), M.iron);
			// top plate and peaked cap
			take(S.roundBox(x, y - 0.85, z, 0.27, 0.035, 0.27, 0.01), M.iron);
			take(S.coneY(x, y - 0.88, z, 0.25, 0.22), M.iron);
			// the ring on top
			take(S.torusY(x, y - 1.12, z + 0.0, 0.07, 0.022) , M.ring);
			// the flame inside: a teardrop
			const fy = y - 0.3;
			const flame = S.ellipsoid(x, fy - flameH * 0.5, z, flameW, flameH, flameW) ;
			take(flame, M.flame);
			hit.m = m;
			return best;
		},
		material: (m, x, y, z) => {
			if (m === M.flame) return { albedo: [1, 0.6, 0.2], emissive: [3.2, 1.6, 0.35] };
			if (m === M.glass) {
				// warm glass, brighter near the flame
				const d = Math.max(0, 1 - Math.abs(y - 0.45) / 0.4);
				return { albedo: [0.55, 0.32, 0.12], emissive: [1.3 * d, 0.6 * d, 0.12 * d], spec: 0.6, shine: 40 };
			}
			if (m === M.ring) return { albedo: rgbOf(0x8a4836), spec: 0.5, shine: 30 };
			const n = noise3(x * 14, y * 14, z * 14);
			const k = 0.1 + 0.06 * n;
			return { albedo: [k * 0.9, k * 0.95, k * 1.1], spec: 0.35, shine: 18 };
		},
		lights: [{ x: 0, y: 0.5, z: 0, color: [2.2 + 2 * flare, 1.1 + flare, 0.25], radius: 1.6, soft: 6, shadows: false }],
	};
};
