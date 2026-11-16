// H3: a war horn. A curved beast horn, dark and ridged at the bell and paler toward the tip,
// bound by two engraved gold bands, with a gold mouthpiece; it lies on its side with the bell
// open toward the camera's right. Its win act lights the inside of the bell.
import { fbm3 } from '../noise.ts';
import * as S from '../sdf.ts';
import { RAMPS, color } from '../../palette.ts';
import type { SymbolModel } from './rig.ts';
import { hit } from './rig.ts';

const M = { horn: 0, gold: 1, inside: 2 };

// horn, gold and fire only: the cool fill would otherwise turn dark horn grey and gold olive
const ALLOWED = [...new Set([...RAMPS.wood, ...RAMPS.gold, ...RAMPS.fire, color(0xedab50)])];

export type HornState = {
	// 0..1: a glow inside the bell (the win act)
	blow?: number;
};

// the spine: a cubic curve from the tip (t = 0) to the bell (t = 1)
const P = [
	[-0.36, 0.8, 0.06],
	[-0.62, 0.3, 0.06],
	[-0.08, 0.0, 0.08],
	[0.3, 0.24, -0.22],
];
const N = 24;
const bez = (t: number) => {
	const a = 1 - t;
	const b0 = a * a * a;
	const b1 = 3 * a * a * t;
	const b2 = 3 * a * t * t;
	const b3 = t * t * t;
	return [0, 1, 2].map((k) => b0 * P[0][k] + b1 * P[1][k] + b2 * P[2][k] + b3 * P[3][k]);
};
const radiusAt = (t: number) => 0.028 + 0.16 * Math.pow(t, 1.3) + 0.04 * Math.pow(Math.max(0, (t - 0.84) / 0.16), 2);

// the spine sampled into segments, with arc length
const pts = Array.from({ length: N + 1 }, (_, i) => bez(i / N));
const segLen = pts.slice(1).map((p, i) => S.length3(p[0] - pts[i][0], p[1] - pts[i][1], p[2] - pts[i][2]));
const arc: number[] = [0];
for (const l of segLen) arc.push(arc[arc.length - 1] + l);
const LENGTH = arc[N];
// the bell's end and its axis
const END = pts[N];
const endDir = (() => {
	const a = pts[N - 1];
	const l = segLen[N - 1];
	return [(END[0] - a[0]) / l, (END[1] - a[1]) / l, (END[2] - a[2]) / l];
})();
const tipDir = (() => {
	const b = pts[1];
	const l = segLen[0];
	return [(pts[0][0] - b[0]) / l, (pts[0][1] - b[1]) / l, (pts[0][2] - b[2]) / l];
})();

// nearest point on the spine: distance to the axis and the curve parameter there
const near = { d: 0, t: 0 };
const spine = (x: number, y: number, z: number) => {
	let bestD = Infinity;
	let bestT = 0;
	for (let i = 0; i < N; i++) {
		const a = pts[i];
		const b = pts[i + 1];
		const bx = b[0] - a[0];
		const by = b[1] - a[1];
		const bz = b[2] - a[2];
		const px = x - a[0];
		const py = y - a[1];
		const pz = z - a[2];
		const h = Math.max(0, Math.min(1, (px * bx + py * by + pz * bz) / (segLen[i] * segLen[i])));
		const d = S.length3(px - bx * h, py - by * h, pz - bz * h);
		if (d < bestD) {
			bestD = d;
			bestT = (arc[i] + h * segLen[i]) / LENGTH;
		}
	}
	near.d = bestD;
	near.t = bestT;
	return near;
};

// where the two gold bands sit, as curve parameters
const BANDS = [0.5, 0.975];
const BAND_HALF = 0.036; // half width along the arc, world units

export const horn = ({ blow = 0 }: HornState = {}): SymbolModel => {
	const gold: [number, number, number] = [1.0, 0.66, 0.0];
	return {
		centreY: 0.4,
		reach: 0.6,
		exposure: 1.3,
		quantize: { allowed: ALLOWED },
		sdf: (x, y, z) => {
			const { d, t } = spine(x, y, z);
			const s = t * LENGTH;
			let r = radiusAt(t);
			// ridges round the horn, fading toward the tip
			r += 0.0075 * Math.sin(s * 72) * Math.min(1, t * 2.5);
			let best = d - r;
			let m = M.horn;
			// the gold bands: rings a little proud of the horn (the last one is the bell's rim)
			for (const tb of BANDS) {
				const along = Math.abs(s - tb * LENGTH) - BAND_HALF;
				const band = Math.max(along, d - (radiusAt(tb) + (tb > 0.9 ? 0.03 : 0.024)));
				if (band < best) {
					best = band;
					m = M.gold;
				}
			}
			// the mouth: cut flat across the bell's axis, and hollow it
			const mouth = (x - END[0]) * endDir[0] + (y - END[1]) * endDir[1] + (z - END[2]) * endDir[2];
			best = Math.max(best, mouth);
			const hollow = -(d - (radiusAt(t) - 0.03));
			if (hollow > best) {
				best = hollow;
				m = M.inside;
			}
			// the mouthpiece: a short gold tube past the tip, with a lip
			const tx = pts[0][0];
			const ty = pts[0][1];
			const tz = pts[0][2];
			const mp = S.capsule(x, y, z, tx, ty, tz, tx + tipDir[0] * 0.07, ty + tipDir[1] * 0.07, tz + tipDir[2] * 0.07, 0.03);
			const lip = S.sphere(x - (tx + tipDir[0] * 0.08), y - (ty + tipDir[1] * 0.08), z - (tz + tipDir[2] * 0.08), 0.042);
			const piece = Math.min(mp, lip);
			if (piece < best) {
				best = piece;
				m = M.gold;
			}
			hit.m = m;
			// ridges and the growing radius steepen the field a little
			return best * 0.8;
		},
		material: (m, x, y, z) => {
			if (m === M.gold) {
				const n = fbm3(x * 30, y * 30, z * 30, 2);
				// engraving: a chased zigzag cut darker into the bands
				const { t: tg } = spine(x, y, z);
				const zig = Math.abs(Math.sin((x + y * 0.7 + z) * 60) * 0.6 + Math.sin(tg * LENGTH * 90)) < 0.35;
				const k = (0.75 + 0.25 * n) * (zig && tg > 0.05 ? 0.45 : 1);
				return { albedo: [gold[0] * k, gold[1] * k, gold[2] * k], spec: 0.45, shine: 40 };
			}
			const { t } = spine(x, y, z);
			if (m === M.inside) {
				// light from deep in the horn: dim at the lip, bright further in
				const depth = -((x - END[0]) * endDir[0] + (y - END[1]) * endDir[1] + (z - END[2]) * endDir[2]);
				const g = blow * Math.min(1, 0.15 + depth / 0.22);
				return { albedo: [0.06, 0.035, 0.03], emissive: [2.2 * g, 0.85 * g * g + 0.15 * g, 0.12 * g * g] };
			}
			// dark horn at the bell, pale bone toward the tip, with streaks along the grain
			const grain = fbm3(t * 30, x * 5, z * 5, 2);
			const pale = Math.pow(Math.max(0, 1 - t * 1.15), 1.6);
			const k = 0.8 + 0.4 * grain;
			const dark = [0.022, 0.008, 0.006];
			const bone = [0.62, 0.4, 0.2];
			// the growth rings, cut a little darker
			const ring = Math.sin(t * LENGTH * 72) < -0.55 && t > 0.12 ? 0.55 : 1;
			const k2 = k * ring;
			return {
				albedo: [
					(dark[0] + (bone[0] - dark[0]) * pale) * k2,
					(dark[1] + (bone[1] - dark[1]) * pale) * k2,
					(dark[2] + (bone[2] - dark[2]) * pale) * k2,
				],
				spec: 0.1,
				shine: 14,
			};
		},
		lights:
			blow > 0
				? [{ x: END[0] - endDir[0] * 0.05, y: END[1] - endDir[1] * 0.05, z: END[2] - endDir[2] * 0.05, color: [2.4 * blow, 1.2 * blow, 0.3 * blow], radius: 0.8, shadows: false }]
				: undefined,
	};
};
