// H1: the skull of a young dragon, plated in gold by whoever kept it. Long snout, two swept
// horns, embers still alive in the sockets. The plates cover the crown and the snout; the jaw,
// the horns and the underside are the dark iron it was mounted on, and the gold is worn through
// on the ridges.
import { noise3 } from '../noise.ts';
import * as S from '../sdf.ts';
import type { Material } from '../raymarch.ts';
import type { SymbolModel } from './rig.ts';
import { hit } from './rig.ts';
import { color } from '../../palette.ts';

const M = { gold: 0, iron: 1, socket: 2, ember: 3, tooth: 4, horn: 5 };

// a cone with rounded ends between a (radius r1) and b (radius r2): an exact distance
const roundCone = (
	x: number, y: number, z: number,
	ax: number, ay: number, az: number,
	bx: number, by: number, bz: number,
	r1: number, r2: number,
) => {
	const bax = bx - ax, bay = by - ay, baz = bz - az;
	const l2 = bax * bax + bay * bay + baz * baz;
	const rr = r1 - r2;
	const a2 = l2 - rr * rr;
	const il2 = 1 / l2;
	const pax = x - ax, pay = y - ay, paz = z - az;
	const yy = pax * bax + pay * bay + paz * baz;
	const zz = yy - l2;
	const qx = pax * l2 - bax * yy, qy = pay * l2 - bay * yy, qz = paz * l2 - baz * yy;
	const x2 = qx * qx + qy * qy + qz * qz;
	const y2 = yy * yy * l2;
	const z2 = zz * zz * l2;
	const k = Math.sign(rr) * rr * rr * x2;
	if (Math.sign(zz) * a2 * z2 > k) return Math.sqrt(x2 + z2) * il2 - r2;
	if (Math.sign(yy) * a2 * y2 < k) return Math.sqrt(x2 + y2) * il2 - r1;
	return (Math.sqrt(x2 * a2 * il2) + yy * rr) * il2 - r1;
};

// a chain of round cones through [x, y, z, radius] points
const spine = (x: number, y: number, z: number, points: number[][]) => {
	let d = Infinity;
	for (let i = 0; i < points.length - 1; i++) {
		const a = points[i];
		const b = points[i + 1];
		d = Math.min(d, roundCone(x, y, z, a[0], a[1], a[2], b[0], b[1], b[2], a[3], b[3]));
	}
	return d;
};

// the right horn (x mirrored for the left): back along the line of the skull, then rising
const HORN = [
	[0.11, 0.46, 0.12, 0.07],
	[0.17, 0.49, 0.28, 0.056],
	[0.21, 0.5, 0.43, 0.042],
	[0.23, 0.54, 0.56, 0.028],
	[0.21, 0.61, 0.65, 0.008],
];
// the spur on each cheek, pointing back and down
const SPUR = [
	[0.16, 0.28, 0.1, 0.045],
	[0.24, 0.23, 0.24, 0.025],
	[0.28, 0.18, 0.33, 0.006],
];

// the gold stops here (model y); below it is the iron mount
const SEAM = 0.27;
// the palate: the upper jaw ends here
const PALATE = 0.22;
// the snout's width at z, for placing teeth
const snoutR = (z: number) => {
	const t = Math.max(0, Math.min(1, (z + 0.04) / -0.42));
	return 0.13 + t * (0.075 - 0.13);
};

const ALLOWED = [
	// gold, dark to light
	0x391f21, 0x5d2c28, 0x8a4836, 0xed7614, 0xffa214, 0xffc825, 0xffeb57, 0xf9e6cf,
	// iron
	0x0e071b, 0x1a1932, 0x2a2f4e, 0x424c6e, 0x657392, 0x92a1b9,
	// ember
	0x571c27, 0xff5000,
	// ivory
	0xf6ca9f,
].map(color);

// the skull sits turned a little further than the shared view, so its long snout reads in profile
// rather than pointing at the player
const TURN = 0.32;
const TURN_C = Math.cos(TURN);
const TURN_S = Math.sin(TURN);

export type SkullState = {
	// 0..1 how hot the embers in the sockets burn (a win flares them)
	glow?: number;
};

export const skull = ({ glow = 0.5 }: SkullState = {}): SymbolModel => {
	let mm = M.gold;
	// the model's own shape, writing mm; the material uses it too (wear on the ridges)
	const shape = (x: number, y: number, z: number) => {
		const ax = Math.abs(x);
		// cranium and snout, one bone; the snout a little flatter than round
		const cranium = S.ellipsoid(x, y - 0.38, z - 0.11, 0.19, 0.17, 0.22);
		const snout = roundCone(ax, (y - 0.31) / 0.82 + 0.31, z, 0, 0.35, -0.04, 0, 0.27, -0.46, 0.13, 0.075) * 0.82;
		let upper = S.smoothUnion(cranium, snout, 0.1);
		// nostril bumps at the tip, a ridge down the middle, brows and cheeks
		upper = S.smoothUnion(upper, S.sphere(ax - 0.05, y - 0.32, z + 0.42, 0.04), 0.04);
		upper = S.smoothUnion(upper, S.capsule(x, y, z, 0, 0.36, -0.34, 0, 0.47, -0.04, 0.025), 0.05);
		upper = S.smoothUnion(upper, S.capsule(ax, y, z, 0.08, 0.48, -0.13, 0.17, 0.49, 0.04, 0.042), 0.05);
		upper = S.smoothUnion(upper, S.capsule(ax, y, z, 0.13, 0.3, -0.1, 0.17, 0.28, 0.12, 0.04), 0.05);
		// the palate
		upper = S.subtract(upper, y - PALATE);
		// nostrils
		upper = S.subtract(upper, S.sphere(ax - 0.05, y - 0.345, z + 0.465, 0.034));
		// the gold plates' seams: two shallow grooves across the snout
		for (const zg of [-0.3, -0.16]) {
			const groove = Math.max(Math.abs(z - zg) - 0.008, Math.max(-(upper + 0.016), SEAM - y));
			upper = Math.max(upper, -groove);
		}
		// eye sockets, cut in deep and slanted down toward the snout, and the opening in front of
		// each (a dragon's skull is lighter than it looks)
		const socket = S.ellipsoid(ax - 0.155, y - 0.415 + (z + 0.03) * 0.25, z + 0.03, 0.08, 0.068, 0.1);
		const window = S.ellipsoid(ax - 0.115, y - 0.325 + (z + 0.2) * 0.3, z + 0.2, 0.05, 0.032, 0.065);
		const hollow = Math.min(socket, window);
		let best = Math.max(upper, -hollow);
		mm = -hollow > upper ? M.socket : M.gold;
		// the embers, deep inside the eyes
		const ember = S.sphere(ax - 0.13, y - 0.4, z + 0.02, 0.028 + 0.016 * glow);
		if (ember < best) {
			best = ember;
			mm = M.ember;
		}
		const horn = Math.min(spine(ax, y, z, HORN), spine(ax, y, z, SPUR));
		if (horn < best) {
			best = horn;
			mm = M.horn;
		}
		// lower jaw: two heavy bars meeting at the chin, hanging a little open
		const jaw = S.smoothUnion(
			roundCone(ax, y, z, 0.13, 0.19, 0.15, 0.05, 0.07, -0.36, 0.055, 0.04),
			S.sphere(x, y - 0.07, z + 0.38, 0.045),
			0.06,
		);
		if (jaw < best) {
			best = jaw;
			mm = M.iron;
		}
		// teeth: two down each side of the upper jaw (the front one a fang), two up from the lower
		const tz = S.repeatLimited(z + 0.13, 0.14, -1, 0);
		const zc = -0.13 + tz.cell * 0.14;
		const fang = tz.cell === -1 ? 1.35 : 1;
		const tx = snoutR(zc) * 0.95;
		const toothUp = roundCone(ax, y, tz.v, tx, PALATE + 0.02, 0, tx + 0.01, PALATE + 0.02 - 0.1 * fang, 0.015, 0.032 * fang, 0.006);
		if (toothUp < best) {
			best = toothUp;
			mm = M.tooth;
		}
		const tz2 = S.repeatLimited(z + 0.06, 0.14, -1, 0);
		const zc2 = -0.06 + tz2.cell * 0.14;
		const t = (zc2 - 0.15) / (-0.36 - 0.15);
		const lx = 0.13 + t * (0.05 - 0.13);
		const ly = 0.19 + t * (0.07 - 0.19) + 0.02;
		const toothLo = roundCone(ax, y, tz2.v, lx, ly, 0, lx, ly + 0.07, -0.01, 0.024, 0.005);
		if (toothLo < best) {
			best = toothLo;
			mm = M.tooth;
		}
		return best;
	};
	const iron = (n: number): Material => {
		const k = 0.07 + 0.05 * n;
		return { albedo: [k * 0.6, k * 0.8, k * 1.7], spec: 0.4, shine: 22 };
	};
	const material = (m: number, x: number, y: number, z: number, nx: number, ny: number, nz: number): Material => {
		if (m === M.ember) {
			const n = noise3(x * 40, y * 40, z * 40);
			// dull at 0, red-hot at rest (0.5); a flare spreads the light over the socket walls
			const k = 2 * glow * (0.8 + 0.4 * n);
			return { albedo: [0.12, 0.02, 0.01], emissive: [4.5 * k, 0.04 * k, 0] };
		}
		if (m === M.socket) {
			// the inside of a hollow: dark, lit red only close to the ember
			const ex = Math.abs(x) - 0.13, ey = y - 0.405, ez = z + 0.02;
			const near = Math.max(0, 1 - Math.sqrt(ex * ex + ey * ey + ez * ez) / (0.04 + 0.1 * glow));
			const k = glow * glow * 4 * near;
			return { albedo: [0.02, 0.012, 0.02], emissive: [0.9 * k, 0.03 * k, 0.01 * k] };
		}
		// ivory, kept pale even in the mouth's shadow so the row reads
		if (m === M.tooth) return { albedo: [0.8, 0.62, 0.4], emissive: [0.6, 0.45, 0.28], spec: 0.25, shine: 16 };
		const n = noise3(x * 9, y * 9, z * 9);
		if (m === M.horn) {
			// growth rings along the horn
			const ring = 0.75 + 0.25 * Math.sin((z * 1.0 + y * 0.6) * 60);
			const it = iron(n);
			it.albedo = [it.albedo[0] * ring, it.albedo[1] * ring, it.albedo[2] * ring];
			return it;
		}
		if (m === M.iron) return iron(n);
		// gold, worn through to the iron below the seam and in patches along it
		if (y - SEAM + 0.05 * (n - 0.5) < 0 || ny < -0.6) return iron(n);
		// how convex the surface is: ridges are rubbed bright, hollows hold grime
		const e = 0.02;
		const d0 = shape(x, y, z);
		const lap =
			(shape(x + e, y, z) + shape(x - e, y, z) + shape(x, y + e, z) + shape(x, y - e, z) +
				shape(x, y, z + e) + shape(x, y, z - e) - 6 * d0) / (e * e);
		const wear = Math.max(0, Math.min(1, (lap - 25) * 0.04));
		const grime = Math.max(0, Math.min(1, (-lap - 14) * 0.03));
		// a metal reflects its surroundings: bright where it faces up, deep brown where it turns away
		// the hall reflected in it: the camera looks down at the shared pitch, so mirror that ray
		// about the normal; bright vault above, a dark band at the horizon, warm floor below
		const vy = -0.33, vz = 0.94;
		const dn = vy * ny + vz * nz;
		const ry = vy - 2 * dn * ny;
		const band = Math.max(0, 1 - Math.abs(ry - 0.05) / 0.22);
		const env = Math.max(0, Math.min(1, 0.6 + 0.6 * ry - 0.55 * band));
		const g = (0.45 + 0.75 * env) * (1 - 0.55 * grime);
		// the torch caught in the gold, a broad sheen where the surface turns to the key light
		const sheen = Math.pow(Math.max(0, -0.26 * nx + 0.5 * ny - 0.83 * nz), 10) * (1 - grime);
		return {
			albedo: [
				1.45 * g + 0.2 * wear + 0.4 * sheen,
				(0.36 + 0.2 * env) * g + 0.3 * wear + 0.75 * sheen,
				0.008 * g + 0.04 * wear + 0.12 * sheen,
			],
			spec: 0.35,
			shine: 70,
		};
	};
	return {
		centreY: 0.38,
		reach: 0.515,
		exposure: 1.05,
		sdf: (x, y, z) => {
			const d = shape(x * TURN_C - z * TURN_S, y, x * TURN_S + z * TURN_C);
			hit.m = mm;
			return d;
		},
		material: (m, x, y, z, nx, ny, nz) =>
			material(m, x * TURN_C - z * TURN_S, y, x * TURN_S + z * TURN_C, nx, ny, nz),
		// the skull's own ramps: gold, iron, ember, ivory
		quantize: { allowed: ALLOWED, dither: 0.02 },
	};
};
