// W: the wild coin. A thick old gold coin from the hoard, stamped with the dragon's own eye (the
// slit pupil is cut deep and still warm), a bevelled rim, nicks from being bitten and dropped.
// Never on the reels; the UI spins it.
import { noise3 } from '../noise.ts';
import { color } from '../../palette.ts';
import * as S from '../sdf.ts';
import type { Material } from '../raymarch.ts';
import type { SymbolModel } from './rig.ts';
import { hit } from './rig.ts';

const M = { gold: 0, field: 1, pupil: 2, edge: 3 };

// the coin's size: radius, half thickness, where it stands
const R = 0.45;
const T = 0.09;
const CY = R + 0.01;
// the rim's width, the field's depth below it
const RIM = 0.065;
const FIELD = 0.022;
// nicks in the rim, by angle
const NICKS = [0.55, 2.6, 4.4];

const ALLOWED = [
	0x0e071b, 0x1a1932, 0x391f21, 0x5d2c28, 0x8a4836, 0xed7614, 0xffa214, 0xffc825, 0xffeb57, 0xf9e6cf,
	0x571c27, 0xff5000,
].map(color);

export type CoinState = {
	// 0..1 one turn about the vertical axis
	turn?: number;
	// 0..1 how warm the pupil burns
	glow?: number;
};

export const coin = ({ turn = 0, glow = 0.5 }: CoinState = {}): SymbolModel => {
	const a = turn * Math.PI * 2;
	const ca = Math.cos(a);
	const sa = Math.sin(a);
	let mm = M.gold;
	const shape = (x: number, y: number, z: number) => {
		const py = y - CY;
		const r = S.length2(x, py);
		const az = Math.abs(z);
		// the blank: a thick disc with a chamfered edge
		let d = S.cylinderZ(x, py, z, R, T);
		d = Math.max(d, (r + az - R - T + 0.03) * Math.SQRT1_2);
		mm = M.edge;
		// the field sunk inside the rim, on both faces
		const field = Math.max(r - (R - RIM), -(az - (T - FIELD)));
		if (-field > d) mm = M.field;
		d = Math.max(d, -field);
		// the stamp, on both faces, struck up from the field in rounded relief
		const face = az - (T - FIELD);
		// the almond of the eye: two circles' intersection, about 0.59 wide and 0.41 tall
		const almond = Math.max(S.length2(x, py + 0.11) - 0.315, S.length2(x, py - 0.11) - 0.315);
		// its lid, a half-round ridge along the almond's edge
		const lid = S.length2(almond + 0.02, face) - 0.026;
		// the iris, a low dome
		const iris = S.ellipsoid(x, py, face, 0.135, 0.135, 0.034);
		// a ring of beads inside the rim
		const theta = Math.atan2(py, x);
		const step = (Math.PI * 2) / 28;
		const k = Math.round(theta / step) * step;
		const bead = S.length3(x - Math.cos(k) * (R - RIM - 0.035), py - Math.sin(k) * (R - RIM - 0.035), face) - 0.017;
		const relief = Math.min(Math.min(lid, iris), bead);
		if (relief < d) {
			d = relief;
			mm = M.gold;
		}
		// the slit pupil, cut deep through the iris
		const slit = S.ellipsoid(x, py, 0, 0.034, 0.115, 1);
		const slitCut = Math.max(slit, T - 0.05 - az);
		if (-slitCut > d) mm = M.pupil;
		d = Math.max(d, -slitCut);
		// nicks in the rim
		for (const n of NICKS) {
			const nx = Math.cos(n);
			const ny = Math.sin(n);
			// into the nick's own frame: u along the radius, v along the rim
			const u = x * nx + py * ny - R;
			const v = -x * ny + py * nx;
			// a V bitten into the edge
			const nick = Math.abs(v) * 0.8 - 0.6 * (u + 0.055);
			if (-nick > d) mm = M.edge;
			d = Math.max(d, -nick);
		}
		return d;
	};
	const material = (m: number, x: number, y: number, z: number, nx: number, ny: number, nz: number): Material => {
		if (m === M.pupil) {
			const k = 0.3 + 0.7 * glow;
			return { albedo: [0.03, 0.015, 0.02], emissive: [0.8 * k, 0.14 * k, 0.03 * k] };
		}
		const n = noise3(x * 10, y * 10, z * 10);
		// the hall reflected in the gold, as on the skull
		const vy = -0.33, vz = 0.94;
		const dn = vy * ny + vz * nz;
		const ry = vy - 2 * dn * ny;
		const band = Math.max(0, 1 - Math.abs(ry - 0.05) / 0.22);
		const env = Math.max(0, Math.min(1, 0.6 + 0.6 * ry - 0.55 * band));
		// the sunk field is duller, worn by fingers less than the raised parts
		const dull = m === M.field ? 0.24 : m === M.gold ? 1.15 : 1;
		const g = (0.45 + 0.75 * env) * (0.95 + 0.1 * n) * dull;
		const sheen = Math.pow(Math.max(0, -0.26 * nx + 0.5 * ny - 0.83 * nz), 10);
		return {
			albedo: [1.45 * g + 0.4 * sheen, (0.36 + 0.2 * env) * g + 0.75 * sheen, 0.008 * g + 0.12 * sheen],
			spec: 0.35,
			shine: 70,
		};
	};
	return {
		centreY: CY,
		reach: 0.525,
		exposure: 1.05,
		sdf: (x, y, z) => {
			const d = shape(x * ca - z * sa, y, x * sa + z * ca);
			hit.m = mm;
			return d;
		},
		material: (m, x, y, z, nx, ny, nz) => material(m, x * ca - z * sa, y, x * sa + z * ca, nx, ny, nz),
		quantize: { allowed: ALLOWED, dither: 0 },
	};
};
