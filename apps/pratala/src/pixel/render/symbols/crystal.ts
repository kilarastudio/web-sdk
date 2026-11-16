// L1 to L4: clusters of cave crystal, each colour its own shape, growing out of a knob of
// stone. The light lives inside them: an ember glow that breathes at rest.
import { noise3 } from '../noise.ts';
import * as S from '../sdf.ts';
import { rgbOf } from '../quantize.ts';
import type { SymbolModel } from './rig.ts';
import { hit } from './rig.ts';

const M = { stone: 0, crystal: 1 };

export type CrystalKind = 'ruby' | 'sapphire' | 'emerald' | 'amethyst';

type Shard = { x: number; z: number; h: number; r: number; tiltX: number; tiltZ: number; rot: number };

// each kind's shards: position on the stone, height, radius, lean
const SHARDS: Record<CrystalKind, Shard[]> = {
	ruby: [
		{ x: 0.0, z: 0.0, h: 0.72, r: 0.15, tiltX: 0.05, tiltZ: -0.08, rot: 0.3 },
		{ x: -0.2, z: 0.08, h: 0.42, r: 0.11, tiltX: -0.35, tiltZ: 0.1, rot: 0.9 },
		{ x: 0.2, z: -0.05, h: 0.5, r: 0.12, tiltX: 0.38, tiltZ: -0.05, rot: 1.4 },
	],
	sapphire: [
		{ x: 0.08, z: 0.0, h: 0.62, r: 0.13, tiltX: 0.3, tiltZ: 0.0, rot: 0.2 },
		{ x: -0.14, z: 0.02, h: 0.56, r: 0.12, tiltX: -0.3, tiltZ: 0.1, rot: 1.0 },
		{ x: -0.02, z: -0.16, h: 0.36, r: 0.1, tiltX: 0.0, tiltZ: -0.45, rot: 2.0 },
		{ x: 0.18, z: 0.16, h: 0.3, r: 0.09, tiltX: 0.4, tiltZ: 0.4, rot: 0.6 },
	],
	emerald: [
		{ x: -0.12, z: 0.0, h: 0.7, r: 0.12, tiltX: -0.12, tiltZ: 0.0, rot: 0.5 },
		{ x: 0.14, z: 0.04, h: 0.52, r: 0.12, tiltX: 0.25, tiltZ: 0.0, rot: 1.1 },
	],
	amethyst: [
		{ x: 0.0, z: 0.0, h: 0.5, r: 0.13, tiltX: 0.0, tiltZ: 0.0, rot: 0.4 },
		{ x: -0.22, z: -0.06, h: 0.38, r: 0.1, tiltX: -0.5, tiltZ: -0.1, rot: 1.6 },
		{ x: 0.22, z: -0.04, h: 0.4, r: 0.1, tiltX: 0.5, tiltZ: -0.05, rot: 0.8 },
		{ x: 0.02, z: 0.2, h: 0.34, r: 0.09, tiltX: 0.0, tiltZ: 0.5, rot: 2.2 },
		{ x: -0.06, z: -0.2, h: 0.3, r: 0.08, tiltX: -0.1, tiltZ: -0.5, rot: 1.9 },
	],
};

const COLOURS: Record<CrystalKind, { albedo: number; glow: [number, number, number] }> = {
	ruby: { albedo: 0xc42430, glow: [1.6, 0.25, 0.15] },
	sapphire: { albedo: 0x0069aa, glow: [0.25, 0.75, 1.7] },
	emerald: { albedo: 0x1e6f50, glow: [0.3, 1.5, 0.5] },
	amethyst: { albedo: 0x7a09fa, glow: [1.1, 0.35, 1.7] },
};

// a hexagonal prism with a pointed tip, standing on y = 0, leaning by tilt
const shardSdf = (x: number, y: number, z: number, s: Shard) => {
	// lean: rotate the point back by the shard's tilt
	let px = x - s.x;
	let pz = z - s.z;
	let py = y;
	const cx = Math.cos(-s.tiltX);
	const sx = Math.sin(-s.tiltX);
	const ry = py * cx - px * sx;
	px = py * sx + px * cx;
	py = ry;
	const cz = Math.cos(-s.tiltZ);
	const sz = Math.sin(-s.tiltZ);
	const ry2 = py * cz - pz * sz;
	pz = py * sz + pz * cz;
	py = ry2;
	// turn about its own axis
	const cr = Math.cos(s.rot);
	const sr = Math.sin(s.rot);
	const qx = px * cr - pz * sr;
	const qz = px * sr + pz * cr;
	// hexagon in xz
	const ax = Math.abs(qx);
	const az = Math.abs(qz);
	const hex = Math.max(ax * 0.866 + az * 0.5, az) - s.r;
	// the tip: the radius shrinks over the top 30%
	const tipStart = s.h * 0.7;
	const taper = py > tipStart ? ((py - tipStart) / (s.h - tipStart)) * s.r : 0;
	const body = Math.max(hex + taper, Math.max(-py - 0.05, py - s.h));
	// the taper makes the field steeper than a true distance; scale it so the march never overshoots
	return body * 0.55;
};

export const crystal = (kind: CrystalKind, { glow = 0.5, lift = 0 }: { glow?: number; lift?: number } = {}): SymbolModel => {
	const shards = SHARDS[kind];
	const colour = COLOURS[kind];
	const base = rgbOf(colour.albedo);
	return {
		centreY: 0.34,
		reach: 0.5,
		exposure: 1.05,
		sdf: (x, y, z) => {
			let best = Infinity;
			let m = M.stone;
			// the stone: a flattened lump
			const stone = S.ellipsoid(x, y - 0.02, z, 0.36, 0.11, 0.3) + 0.012 * noise3(x * 12, y * 12, z * 12);
			if (stone < best) {
				best = stone;
				m = M.stone;
			}
			for (const s of shards) {
				const d = shardSdf(x, y - lift, z, s);
				if (d < best) {
					best = d;
					m = M.crystal;
				}
			}
			hit.m = m;
			return best;
		},
		material: (m, x, y, z, nx, ny) => {
			if (m === M.stone) {
				const n = noise3(x * 9, y * 9, z * 9);
				const k = 0.22 + 0.1 * n;
				return { albedo: [k * 0.95, k * 0.95, k * 1.08], spec: 0.05, shine: 10 };
			}
			// crystal: translucent look, lit from inside near the base, glassy highlight
			const inner = Math.max(0, 1 - y / 0.75) * glow;
			const facet = 0.7 + 0.3 * Math.max(0, ny) + 0.15 * Math.max(0, -nx);
			return {
				albedo: [base[0] * facet, base[1] * facet, base[2] * facet],
				emissive: [colour.glow[0] * inner * 0.3, colour.glow[1] * inner * 0.3, colour.glow[2] * inner * 0.3],
				spec: 0.9,
				shine: 70,
			};
		},
	};
};
