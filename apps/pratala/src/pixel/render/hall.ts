// The dragon's hall as a scene: a vaulted stone hall seen down its length, the vault broken
// where the dragon's eye looks down through it at the board, torches on the pillars. One
// geometry for both halls (the boss hall is the same stone, hot), and for the wide and the tall
// picture (one camera, two fields of view), so the eye, torches and fires share one world.
import { fbm3, noise2, noise3, worley2 } from './noise.ts';
import { hit, type Light, type Material, type Scene } from './raymarch.ts';
import * as S from './sdf.ts';
import { rgbOf } from './quantize.ts';
import { project } from './project.ts';

export type HallOptions = {
	hot?: boolean;
	// how open the eye is, 0 shut .. 1 wide
	open?: number;
	// where the pupil looks: across the hall (x) and along it (z), -1..1
	look?: [number, number];
	// 1 is normal; wider for the alert eye
	pupil?: number;
};

// world units are metres; the camera looks down the hall toward +z; the vault's apex is at
// vaultCentreY + vaultRadius
export const HALL = {
	halfWidth: 6.8,
	back: 7.0,
	vaultRadius: 6.8,
	vaultCentreY: 3.9,
	pillarX: 4.7,
	pillarZ: [-1.2, 3.6],
	pillarRadius: 0.5,
	torch: { y: 3.0, inset: 0.68 },
	// the hole in the vault and the eye above it
	hole: { z: 3.0, rx: 3.4, rz: 2.1 },
	eye: { x: 0, z: 3.0, radius: 3.0, lift: 1.7 },
};
export const APEX = HALL.vaultCentreY + HALL.vaultRadius;
export const EYE_Y = APEX + HALL.eye.lift;

// the eye's own frame: its axis points at the board on the floor in front of it, so the pupil
// sits on the part of the eye the player sees from below; r is across the hall, u up the picture
const AXIS = (() => {
	const cam = [0, 1.5, -1.5];
	let ax = cam[0] - HALL.eye.x;
	let ay = cam[1] - EYE_Y;
	let az = cam[2] - HALL.eye.z;
	const al = Math.sqrt(ax * ax + ay * ay + az * az);
	ax /= al;
	ay /= al;
	az /= al;
	// r = up × axis, u = axis × r
	let rx = 1 * az - 0 * ay;
	let ry = 0 * ax - 0 * az;
	let rz = 0 * ay - 1 * ax;
	const rl = Math.sqrt(rx * rx + ry * ry + rz * rz);
	rx /= rl;
	ry /= rl;
	rz /= rl;
	return { ax, ay, az, rx, ry, rz, ux: ay * rz - az * ry, uy: az * rx - ax * rz, uz: ax * ry - ay * rx };
})();

export const CAMERA = {
	Landscape: { eye: [0, 3.2, -11] as [number, number, number], at: [0, 5.3, 6] as [number, number, number], fov: 48 },
	Portrait: { eye: [0, 3.2, -11] as [number, number, number], at: [0, 3.9, 6] as [number, number, number], fov: 72 },
};
export const HALL_SIZES = {
	Landscape: { width: 576, height: 324 },
	Portrait: { width: 324, height: 576 },
} as const;

// the box on a picture that holds the hole and the eye, in its art pixels, with a margin
export const eyeBox = (shape: 'Landscape' | 'Portrait') => {
	const size = HALL_SIZES[shape];
	const camera = CAMERA[shape];
	const r = HALL.eye.radius + 0.5;
	const points: { x: number; y: number }[] = [];
	for (const sx of [-1, 1])
		for (const sy of [-1, 1])
			for (const sz of [-1, 1])
				points.push(project(camera, size.width, size.height, HALL.eye.x + sx * r, EYE_Y + sy * r, HALL.eye.z + sz * r));
	const x0 = Math.max(0, Math.floor(Math.min(...points.map((p) => p.x))) - 2);
	const x1 = Math.min(size.width, Math.ceil(Math.max(...points.map((p) => p.x))) + 2);
	const y0 = Math.max(0, Math.floor(Math.min(...points.map((p) => p.y))) - 2);
	const y1 = Math.min(size.height, Math.ceil(Math.max(...points.map((p) => p.y))) + 2);
	return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
};

const M = {
	floor: 0,
	wall: 1,
	pillar: 2,
	vault: 3,
	back: 4,
	skin: 5,
	eye: 6,
	torch: 7,
	rubble: 8,
};

// depth of a mortar groove in a staggered block pattern, 0 away from the joints
const grooves = (u: number, v: number, bw: number, bh: number, width: number, depth: number) => {
	const row = Math.floor(v / bh);
	const shift = (row & 1) * bw * 0.5;
	const fu = Math.abs((((u + shift) % bw) + bw) % bw - bw * 0.5);
	const fv = Math.abs((((v % bh) + bh) % bh) - bh * 0.5);
	const du = bw * 0.5 - fu;
	const dv = bh * 0.5 - fv;
	const d = Math.min(du, dv);
	return d < width ? depth * (1 - d / width) : 0;
};

// the jagged edge of the hole, as a factor on its radius round the angle
const holeRadius = (angle: number) =>
	1 +
	0.2 * (noise2(Math.cos(angle) * 1.6 + 7, Math.sin(angle) * 1.6 + 2) * 2 - 1) +
	0.07 * (noise2(Math.cos(angle) * 6 + 3, Math.sin(angle) * 6 + 9) * 2 - 1);

export const hallScene = ({ hot = false, open = 1, look = [0, 0], pupil = 1 }: HallOptions = {}): Scene => {
	const H = HALL;
	// broken blocks round the hole, sunk into the vault
	const rubbleBits: [number, number, number, number][] = [];
	for (let i = 0; i < 11; i++) {
		const a = (i / 11) * Math.PI * 2 + 0.3;
		const hr = holeRadius(a);
		rubbleBits.push([
			Math.cos(a) * (H.hole.rx + 0.3) * hr,
			APEX + 0.1,
			H.hole.z + Math.sin(a) * (H.hole.rz + 0.25) * hr,
			0.22 + 0.16 * noise2(i * 3, 1),
		]);
	}
	const stones: [number, number, number, number][] = [
		[-2.9, 0.12, 6.4, 0.3],
		[2.6, 0.1, 5.9, 0.24],
		[-1.9, 0.08, 7.3, 0.18],
		[3.4, 0.14, 7.0, 0.3],
		[-3.6, 0.1, 2.2, 0.22],
	];

	const sdf = (x: number, y: number, z: number) => {
		let best = Infinity;
		let m = M.floor;

		// floor: flagstones 1.4 × 1.05 with grooves
		const floor = y + grooves(x, z, 1.4, 1.05, 0.04, 0.03) + 0.008 * noise2(x * 2.1, z * 2.1);
		if (floor < best) {
			best = floor;
			m = M.floor;
		}
		// side walls, blocks 1.6 × 0.8
		const wall = H.halfWidth - Math.abs(x) + grooves(z, y, 1.6, 0.8, 0.04, 0.035);
		if (wall < best) {
			best = wall;
			m = M.wall;
		}
		// the barrel vault: the solid beyond radius R from the vault's axis, ribbed every 2.5 m,
		// with the hole cut through it
		const vr = S.length2(x, y - H.vaultCentreY);
		const rib = Math.abs((((z + 1.25) % 2.5) + 2.5) % 2.5 - 1.25) < 0.22 ? -0.18 : 0;
		let vault = H.vaultRadius - vr + rib + grooves(Math.atan2(x, y - H.vaultCentreY) * H.vaultRadius, z, 1.3, 0.65, 0.035, 0.03);
		const hx = x - H.eye.x;
		const hz = z - H.hole.z;
		const angle = Math.atan2(hz / H.hole.rz, hx / H.hole.rx);
		const hr = holeRadius(angle);
		const hole = S.length2(hx / (H.hole.rx * hr), hz / (H.hole.rz * hr)) - 1;
		// a vertical tunnel through the vault's thickness
		const tunnel = Math.max(hole * Math.min(H.hole.rx, H.hole.rz), Math.abs(y - (APEX + 0.6)) - 1.6);
		vault = Math.max(vault, -tunnel);
		if (vault < best) {
			best = vault;
			m = M.vault;
		}
		// back wall, big blocks 2.2 × 1.1
		const back = H.back - z + grooves(x, y, 2.2, 1.1, 0.05, 0.04);
		if (back < best) {
			best = back;
			m = M.back;
		}
		// the dragon's skin above the vault, and its eye looking down through the hole
		const skin = APEX + 4.6 - y + 0.08 * noise3(x * 1.5, z * 1.5, 3);
		if (skin < best) {
			best = skin;
			m = M.skin;
		}
		const eye = S.sphere(x - H.eye.x, y - EYE_Y, z - H.eye.z, H.eye.radius);
		if (eye < best) {
			best = eye;
			m = M.eye;
		}
		// the socket: a thick scaly shell round the eye, hanging through the hole, with an almond
		// opening on the side that faces the board; the opening narrows as `open` falls
		const dx = x - H.eye.x;
		const dy = y - EYE_Y;
		const dz = z - H.eye.z;
		const along = dx * AXIS.ax + dy * AXIS.ay + dz * AXIS.az;
		const up = dx * AXIS.ux + dy * AXIS.uy + dz * AXIS.uz;
		const scaleBump = 0.06 * (1 - Math.min(1, worley2(x * 1.7 + 11, z * 1.7 + y * 0.4)));
		const shell = S.sphere(dx, dy, dz, H.eye.radius + 0.38) + scaleBump;
		const gap = 0.12 + 1.15 * open;
		// the opening: a slab across the front of the socket
		const opening = Math.max(Math.abs(up) - gap * (0.55 + 0.45 * Math.max(0, along) / H.eye.radius), -(along - H.eye.radius * 0.15));
		const lid = Math.max(shell, -opening);
		if (lid < best) {
			best = lid;
			m = M.skin;
		}
		// pillars: shaft, base and capital, block rings
		for (const pz of H.pillarZ)
			for (const side of [-1, 1]) {
				const px = x - side * H.pillarX;
				const pzz = z - pz;
				const ring = Math.abs((((y + 0.3) % 0.6) + 0.6) % 0.6 - 0.3) < 0.03 ? 0.03 : 0;
				const shaft = S.cylinderY(px, y - 3.9, pzz, H.pillarRadius, 3.9) + ring;
				const base = S.roundBox(px, y - 0.3, pzz, 0.78, 0.3, 0.78, 0.06);
				const cap = S.roundBox(px, y - 7.9, pzz, 0.7, 0.26, 0.7, 0.05);
				const pillar = Math.min(shaft, Math.min(base, cap));
				if (pillar < best) {
					best = pillar;
					m = M.pillar;
				}
			}
		for (const [rx, ry, rz, rr] of rubbleBits) {
			const r = S.roundBox(x - rx, y - ry, z - rz, rr, rr * 0.5, rr * 0.9, 0.05);
			if (r < best) {
				best = r;
				m = M.rubble;
			}
		}
		// torches: a bracket and a cup on the inner face of each pillar
		for (const tz of H.pillarZ)
			for (const side of [-1, 1]) {
				const tx = x - side * (H.pillarX - H.torch.inset);
				const bracket = S.box(tx, y - H.torch.y + 0.35, z - tz, 0.05, 0.35, 0.05);
				const cup = S.cylinderY(tx, y - H.torch.y, z - tz, 0.14, 0.12);
				const arm = S.box(tx + side * 0.22, y - H.torch.y + 0.55, z - tz, 0.26, 0.04, 0.04);
				const torch = Math.min(bracket, Math.min(cup, arm));
				if (torch < best) {
					best = torch;
					m = M.torch;
				}
			}
		for (const [sx, sy, sz, sr] of stones) {
			const r = S.roundBox(x - sx, y - sy, z - sz, sr, sr * 0.6, sr * 0.8, 0.05);
			if (r < best) {
				best = r;
				m = M.rubble;
			}
		}
		hit.m = m;
		return best;
	};

	const stone = (k: number, cool: number): [number, number, number] => [k * (1 - cool * 0.25), k * (1 - cool * 0.12), k * (1 + cool * 0.35)];

	const material = (m: number, x: number, y: number, z: number, nx: number, ny: number): Material => {
		if (m === M.eye) {
			// the eye looks at the player: its pattern is laid out round the line from its centre to
			// the camera, turned by `look`; a slit pupil, an orange iris darkening to its rim, lit from
			// within
			const vx = (x - HALL.eye.x) / HALL.eye.radius;
			const vy = (y - EYE_Y) / HALL.eye.radius;
			const vz = (z - HALL.eye.z) / HALL.eye.radius;
			const ex = vx * AXIS.rx + vy * AXIS.ry + vz * AXIS.rz - look[0] * 0.35;
			const ey = vx * AXIS.ux + vy * AXIS.uy + vz * AXIS.uz - look[1] * 0.3;
			const slitHalf = (0.07 + 0.06 * (1 - Math.min(1, Math.abs(ey) / 0.95))) * pupil;
			if (Math.abs(ex) < slitHalf && Math.abs(ey) < 0.95) return { albedo: [0.01, 0.005, 0.0] };
			const r = S.length2(ex, ey);
			const a = Math.atan2(ey, ex);
			const streak = 0.72 + 0.28 * noise2(a * 9 + 20, r * 3);
			const halo = 1 - 0.4 * Math.max(0, 1 - Math.abs(ex) / (slitHalf + 0.12));
			const rim = r > 0.78 ? Math.max(0.15, 1 - (r - 0.78) / 0.22) : 1;
			const glow = Math.max(0, 1 - r * 0.55) * streak * halo * rim;
			return {
				albedo: [0.45, 0.2, 0.04],
				emissive: [1.3 * glow + 0.1 * rim, 0.55 * glow + 0.025 * rim, 0.06 * glow],
				spec: 0.9,
				shine: 90,
			};
		}
		if (m === M.skin) {
			const w = worley2(x * 1.7 + 11, z * 1.7 + y * 0.4);
			const k = 0.07 + 0.2 * Math.pow(w, 1.3);
			return { albedo: [k * 1.5, k * 0.95, k * 0.85], spec: 0.35, shine: 22 };
		}
		if (m === M.torch) return { albedo: rgbOf(0x8a4836), spec: 0.3, shine: 20 };
		const n = fbm3(x * 2.4, y * 2.4, z * 2.4, 3);
		const grain = noise3(x * 11, y * 11, z * 11);
		const k = 0.4 + 0.14 * n + 0.04 * grain;
		if (m === M.floor) {
			const wear = 0.9 + 0.2 * noise2(x * 0.7, z * 0.7);
			const base = stone(k * wear * 0.92, 0.5);
			if (hot) {
				const crack = worley2(x * 0.9 + 3, z * 0.9);
				const edge = Math.abs(crack - 0.55);
				if (edge < 0.035) {
					const g = 1 - edge / 0.035;
					return { albedo: base, emissive: [2.2 * g, 0.6 * g, 0.05 * g] };
				}
			}
			return { albedo: base, spec: 0.06, shine: 10 };
		}
		if (m === M.pillar) return { albedo: stone(k * 1.08, 0.3), spec: 0.08, shine: 12 };
		if (m === M.vault) {
			// cracks radiating from the hole
			const dx = (x - HALL.eye.x) / HALL.hole.rx;
			const dz = (z - HALL.hole.z) / HALL.hole.rz;
			const away = S.length2(dx, dz) - 1;
			if (away > 0 && away < 1.0) {
				const c = worley2(x * 1.4 + 5, z * 1.4 + 1);
				if (Math.abs(c - 0.5) < 0.03 * (1 - away)) return { albedo: stone(k * 0.35, 0.55) };
			}
			return { albedo: stone(k * 0.8, 0.55), spec: 0.03, shine: 8 };
		}
		if (m === M.rubble) return { albedo: stone(k * 1.0, 0.35), spec: 0.05, shine: 10 };
		if (m === M.back) return { albedo: stone(k * 0.85, 0.6), spec: 0.04, shine: 8 };
		return { albedo: stone(k * 0.9, 0.5), spec: 0.04, shine: 8 };
	};

	const torchColor: [number, number, number] = hot ? [5.2, 2.6, 0.9] : [4.4, 2.4, 0.9];
	const lights: Light[] = [
		...H.pillarZ.flatMap((tz, row) =>
			[-1, 1].map((side): Light => ({
				x: side * (H.pillarX - H.torch.inset + 0.02),
				y: H.torch.y + 0.32,
				z: tz,
				color: row === 0 ? torchColor : (torchColor.map((c) => c * 0.7) as [number, number, number]),
				radius: row === 0 ? 5.2 : 4.4,
				soft: 9,
			})),
		),
		// the eye's own light, down through the hole
		{ x: H.eye.x, y: APEX - 0.4, z: H.hole.z, color: [3.0, 1.3, 0.25], radius: 7.5, soft: 6, shadows: true },
	];
	if (hot)
		lights.push(
			{ x: 0, y: 0.4, z: 2.5, color: [2.2, 0.7, 0.12], radius: 6, soft: 4, shadows: false },
			{ x: -3, y: 0.3, z: 6, color: [1.6, 0.5, 0.1], radius: 4, soft: 4, shadows: false },
			{ x: 3, y: 0.3, z: 6, color: [1.6, 0.5, 0.1], radius: 4, soft: 4, shadows: false },
		);

	return {
		sdf,
		material,
		lights,
		camera: { ...CAMERA.Landscape },
		sky: hot ? [0.16, 0.08, 0.07] : [0.1, 0.12, 0.2],
		ground: hot ? [0.12, 0.03, 0.01] : [0.02, 0.02, 0.03],
		background: [0.01, 0.005, 0.01],
		fog: hot ? { color: [0.12, 0.03, 0.01], density: 0.028 } : { color: [0.015, 0.015, 0.03], density: 0.03 },
	};
};
