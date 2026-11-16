// H2: a keris pusaka, the heirloom dagger of Java, standing nearly upright, point up. A broad
// blade of three smooth luk, dark steel with a pale pamor band down its middle and a dark spine;
// a dark red cloth wound round its base above the gold ganja bar; under them the gold mendak and
// a chunky gold pistol-grip hilt bent forward, flat toward the viewer, with carved lines.
// Its win act heats the blade from the edges inward.
import { fbm3 } from '../noise.ts';
import * as S from '../sdf.ts';
import { RAMPS, color } from '../../palette.ts';
import type { SymbolModel } from './rig.ts';
import { hit } from './rig.ts';

const M = { blade: 0, gold: 1, cloth: 2 };

// blue steel, gold, red cloth and fire only: grey stone tones make the blade read as rock, and
// the cool fill would turn gold in shadow olive
const ALLOWED = [
	...new Set([...RAMPS.steel, ...RAMPS.gold, ...RAMPS.red, ...RAMPS.fire, color(0xedab50), color(0x131313)]),
].filter((c) => c !== color(0x5d2c28) && c !== color(0xfdd2ed) && c !== color(0xf68187));

export type KerisState = {
	// 0..1: the blade glows from the edge inward (the win act)
	heat?: number;
};

// a slight lean to the right about the foot, and a shift that centres the whole in the cell
const LEAN = 0.16;
const cosL = Math.cos(LEAN);
const sinL = Math.sin(LEAN);
const SHIFT = 0.05;

// layout along the keris' own axis v (0 at the hilt's foot)
const V_MENDAK = 0.36;
const V_GANJA = 0.395;
const VB = 0.42; // blade base, on the ganja
const LB = 1.0; // blade length
const WB = 0.185; // half width at the base
const AMP = 0.07; // luk amplitude, about 1.5 pixels at the reel's size
const WAVES = 1.5; // three luk

// the luk: the blade's centre line, smooth S-waves that start above the cloth and calm at the tip
const lukOffset = (s: number) => {
	const env = Math.min(1, Math.max(0, (s - 0.08) / 0.12));
	const e = env * env * (3 - 2 * env);
	return AMP * e * (1 - 0.5 * s * s) * Math.sin(2 * Math.PI * WAVES * (s - 0.08));
};
const halfWidth = (s: number, front: boolean) => {
	// broad, tapering to a point; the front of the base swells into the gandik
	const w = WB * (1 - Math.pow(s, 1.6));
	const gandik = front ? 0.02 * Math.max(0, 1 - s / 0.15) : 0;
	return w + gandik;
};

// blade field in the keris frame: u across, v along, z through
const bladeSdf = (u: number, v: number, z: number) => {
	const s = (v - VB) / LB;
	const sc = Math.min(1, Math.max(0, s));
	const q = u - lukOffset(sc);
	const w = halfWidth(sc, q < 0);
	const plane = Math.max(Math.abs(q) - w, Math.max(VB - v, v - VB - LB));
	// a diamond-ish section: thick along the spine, thin at the edges
	const t = 0.055 * (1 - 0.6 * sc);
	const e = Math.min(1, Math.abs(q) / Math.max(w, 1e-3));
	const thick = Math.abs(z) - t * (1 - 0.85 * e);
	// the luk and the taper steepen the field; keep the march safe
	return Math.max(plane, thick) * 0.55;
};

// the hilt (ukiran): a 2D pistol-grip profile, swept along a curve that bends forward to its
// head, then extruded flat toward the viewer with rounded edges
const HILT = Array.from({ length: 7 }, (_, i) => {
	const t = i / 6;
	const a = 1 - t;
	const u = 2 * a * t * 0.035 + t * t * -0.12;
	const v = a * a * (V_MENDAK - 0.03) + 2 * a * t * 0.17 + t * t * 0.1;
	return { u, v, r: 0.066 + 0.034 * t * t };
});
const hiltProfile = (u: number, v: number) => {
	let d = Infinity;
	for (let i = 0; i < HILT.length - 1; i++) {
		const a = HILT[i];
		const b = HILT[i + 1];
		const bu = b.u - a.u;
		const bv = b.v - a.v;
		const h = Math.max(0, Math.min(1, ((u - a.u) * bu + (v - a.v) * bv) / (bu * bu + bv * bv)));
		d = Math.min(d, S.length2(u - a.u - bu * h, v - a.v - bv * h) - (a.r + (b.r - a.r) * h));
	}
	return d;
};
const hiltSdf = (u: number, v: number, z: number) => {
	// flat faces at |z| = 0.05, edges rounded by 0.025
	const d2 = hiltProfile(u, v);
	const rr = 0.025;
	const dz = Math.abs(z) - 0.05;
	const grip =
		S.length2(Math.max(d2 + rr, 0), Math.max(dz + rr, 0)) + Math.min(Math.max(d2 + rr, dz + rr), 0) - rr;
	// the mendak: a gold cup between the hilt and the ganja
	const mendak = S.cylinderY(u, v - V_MENDAK - 0.006, z, 0.075, 0.02);
	return Math.min(grip, mendak);
};

// the ganja: a horizontal bar 1.5 times the blade's width, its back end tapering to a tail
const ganjaSdf = (u: number, v: number, z: number) => {
	const tail = Math.max(0, (u - 0.14) / 0.14);
	const h = 0.032 * (1 - 0.45 * Math.min(1, tail));
	return S.roundBox(u - 0.005, v - V_GANJA + 0.01 * tail * tail, z, 0.28, h, 0.05, 0.008);
};

// the cloth: three turns of a dark red strip round the blade's base, a knot at the front and
// two short ends sticking out at the front
const TURNS = [0.445, 0.475, 0.505];
const clothSdf = (u: number, v: number, z: number) => {
	let d = Infinity;
	for (let i = 0; i < TURNS.length; i++) {
		// each turn a little slanted, wound round the blade's section
		const vv = v - TURNS[i] - u * 0.08 * (i % 2 ? -1 : 1);
		const s = (TURNS[i] - VB) / LB;
		const hw = halfWidth(s, u < 0) + 0.018;
		d = Math.min(d, S.roundBox(u - lukOffset(s), vv, z, hw, 0.02, 0.068, 0.018));
	}
	// the knot on the front edge and its two short ends, sticking out clear of the ganja
	const ku = -0.215;
	const kv = 0.51;
	d = Math.min(d, S.sphere(u - ku, v - kv, z + 0.01, 0.032));
	d = Math.min(d, S.capsule(u, v, z, ku, kv, -0.01, ku - 0.085, kv - 0.035, -0.03, 0.017));
	d = Math.min(d, S.capsule(u, v, z, ku, kv, -0.01, ku - 0.07, kv + 0.03, -0.02, 0.015));
	return d;
};

const toKeris = (x: number, y: number, out: number[]) => {
	out[0] = (x + SHIFT) * cosL - y * sinL;
	out[1] = (x + SHIFT) * sinL + y * cosL;
	return out;
};

export const keris = ({ heat = 0 }: KerisState = {}): SymbolModel => {
	const gold: [number, number, number] = [1.0, 0.66, 0.0];
	const uv = [0, 0];
	return {
		centreY: 0.74,
		reach: 0.76,
		exposure: 1.25,
		quantize: { allowed: ALLOWED, dither: 0.01 },
		sdf: (x, y, z) => {
			const [u, v] = toKeris(x, y, uv);
			let best = bladeSdf(u, v, z);
			let m = M.blade;
			const g = Math.min(hiltSdf(u, v, z), ganjaSdf(u, v, z));
			if (g < best) {
				best = g;
				m = M.gold;
			}
			const c = clothSdf(u, v, z);
			if (c < best) {
				best = c;
				m = M.cloth;
			}
			hit.m = m;
			return best;
		},
		material: (m, x, y, z, nx, ny, nz) => {
			const [u, v] = toKeris(x, y, uv);
			if (m === M.cloth) {
				const n = fbm3(u * 40, v * 40, z * 40, 2);
				const k = 0.8 + 0.3 * n;
				return { albedo: [0.24 * k, 0.022 * k, 0.03 * k], spec: 0.05, shine: 8 };
			}
			if (m === M.gold) {
				const n = fbm3(u * 30, v * 30, z * 30, 2);
				let k = 0.75 + 0.25 * n;
				// carved lines on the hilt's flat face: grooves across the grip and a curl on the head
				if (v < V_MENDAK - 0.01 && Math.abs(nz) > 0.7) {
					const across = Math.abs(Math.sin((v + u * 0.6) * 40)) < 0.4 && v > 0.2;
					const curl = Math.abs(S.length2(u + 0.115, v - 0.1) - 0.05) < 0.02;
					if (across || curl) k *= 0.3;
				}
				return { albedo: [gold[0] * k, gold[1] * k, gold[2] * k], spec: 0.45, shine: 40 };
			}
			const s = Math.min(1, Math.max(0, (v - VB) / LB));
			const q = u - lukOffset(s);
			const w = halfWidth(s, q < 0);
			const e = Math.min(1, Math.abs(q) / Math.max(w, 1e-3));
			// across the blade, from the front edge to the back: the ground edge (bright), dark steel,
			// the pale pamor band down the middle, and the back half as the dark spine in shadow
			const across = q / Math.max(w, 1e-3);
			const edge = across < -0.8;
			const pamor = Math.abs(across + 0.02) < 0.26;
			const spine = across >= 0.24;
			// the pamor's own streaking: lighter and darker bands across it, warped by noise
			const streak = Math.sin(s * 30 + fbm3(s * 5, across * 2, 2.3, 2) * 6) > -0.3 ? 1 : 0.75;
			const steel: [number, number, number] = edge
				? [0.7, 0.73, 0.8]
				: pamor
					? [0.5 * streak, 0.52 * streak, 0.58 * streak]
					: spine
						? [0.035, 0.04, 0.075]
						: [0.006, 0.008, 0.016];
			const glow = Math.max(0, Math.min(1, (e - (1 - heat * 1.05)) / 0.3)) * heat;
			return {
				albedo: steel,
				spec: edge ? 0.5 : pamor ? 0.35 : spine ? 0.1 : 0.2,
				shine: 60,
				emissive: glow > 0 ? [3.2 * glow, 1.0 * glow * glow + 0.25 * glow, 0.15 * glow * glow] : undefined,
			};
		},
	};
};
