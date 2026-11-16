// S (scatter): the dragon's eye seen from the front. A pointed lens of dark scaly skin, the heavy
// upper lid under a brow ridge with three horn spikes, the lower lid below; between the lids an
// almond opening, and in it the eyeball, orange and lit from within, with radial streaks, a dark
// rim where it meets the lids and a vertical slit pupil. The lids close for a blink, the pupil
// narrows or widens and looks about, and the eye burns brighter when alert.
import { color } from '../../palette.ts';
import { hash2 as hash, noise2 } from '../noise.ts';
import * as S from '../sdf.ts';
import { rgbOf } from '../quantize.ts';
import { DEFAULT_VIEW, hit, type SymbolModel } from './rig.ts';

const M = { skin: 0, eye: 1, horn: 2 };

export type EyeState = {
	// 1 wide open .. 0 shut
	open?: number;
	// where the pupil looks, -1..1 on x (the player's right) and y (up)
	look?: [number, number];
	// 1 normal; above 1 wider, below narrower
	pupil?: number;
	// 0 calm .. 1 alert: the eye burns brighter
	glow?: number;
};

// The eye's own frame: its middle at the origin, looking toward -z, turned to face the symbol
// camera (DEFAULT_VIEW) less a little, so the lids show their thickness.
const CY = 0.44;
const FACE_YAW = DEFAULT_VIEW.yaw * 0.8;
const FACE_PITCH = DEFAULT_VIEW.pitch * 0.6;

// the opening: half width, upper and lower half heights when open; the head's outline the same
// shape, larger; both tilt with the outer (right) corner up
const OPENING = { w: 0.41, up: 0.27, low: 0.19 };
const HEAD = { w: 0.55, up: 0.38, low: 0.32 };
const TILT = 0.12;
// the eyeball, its front a little behind the lids
const BALL = { z: 0.42, r: 0.62 };

// a warm palette only: the dark skin, the fire of the eye, the bone of the horns, the ink
const ALLOWED = [
	0x0e071b, 0x1c121c, 0x391f21, 0x5d2c28, 0x8a4836, 0xbf6f4a, 0xe69c69, 0xf6ca9f, 0x571c27,
	0x891e2b, 0x8e251d, 0xc64524, 0x3b1443, 0xe07438, 0xff5000, 0xed7614, 0xffa214, 0xffc825, 0xffeb57, 0xf9e6cf,
	0x131313, 0x272727,
].map(color);

const smoothstep = (a: number, b: number, v: number) => {
	const t = Math.max(0, Math.min(1, (v - a) / (b - a)));
	return t * t * (3 - 2 * t);
};

// a cone standing on y: base radius r at y = 0, tip at y = h (sdf.ts coneY measures its slant
// from the base, not the tip, and comes out empty)
const cone = (x: number, y: number, z: number, r: number, h: number) => {
	const q = S.length2(x, z);
	return Math.max(-y, (q * h + (y - h) * r) / S.length2(h, r));
};

// a lens between two arcs through (±w, 0): the upper through (0, up), the lower through (0, -low)
const lens = (x: number, y: number, w: number, up: number, low: number) => {
	const ru = (w * w + up * up) / (2 * up);
	const rl = (w * w + low * low) / (2 * low);
	return Math.max(S.length2(x, y - (up - ru)) - ru, S.length2(x, y + (low - rl)) - rl);
};

export const eye = ({ open = 1, look = [0, 0], pupil = 1, glow = 0 }: EyeState = {}): SymbolModel => {
	const o = Math.max(0, Math.min(1, open));
	// the lids meet a little below the middle; shut, a seam is left
	const mid = -0.04 * (1 - o);
	const hu = Math.max(0.012, OPENING.up * o);
	const hl = Math.max(0.008, OPENING.low * o);
	const ct = Math.cos(TILT);
	const st = Math.sin(TILT);
	const tilt = (x: number, y: number, out: number[]) => {
		out[0] = x * ct + y * st;
		out[1] = -x * st + y * ct;
		return out;
	};
	const t2 = [0, 0];
	const opening = (x: number, y: number) => {
		tilt(x, y, t2);
		return lens(t2[0], t2[1] - mid, OPENING.w, hu, hl);
	};
	const outline = (x: number, y: number) => {
		tilt(x, y, t2);
		return lens(t2[0], t2[1], HEAD.w, HEAD.up, HEAD.low);
	};

	const cyw = Math.cos(FACE_YAW);
	const syw = Math.sin(FACE_YAW);
	const cp = Math.cos(FACE_PITCH);
	const sp = Math.sin(FACE_PITCH);
	const q = [0, 0, 0];
	// model → the eye's frame
	const local = (x: number, y: number, z: number) => {
		const px = x * cyw - z * syw;
		const pz0 = x * syw + z * cyw;
		const py0 = y - CY;
		q[0] = px;
		q[1] = py0 * cp - pz0 * sp;
		q[2] = py0 * sp + pz0 * cp;
		return q;
	};
	// the eye's frame → model, for the light the eye gives off
	const toModel = (x: number, y: number, z: number): [number, number, number] => {
		const py0 = y * cp + z * sp;
		const pz0 = -y * sp + z * cp;
		return [x * cyw + pz0 * syw, py0 + CY, -x * syw + pz0 * cyw];
	};

	// horn spikes along the brow, leaning outward and a little back, longest at the outer corner
	const spikes = [
		{ x: -0.26, y: 0.29, z: -0.04, h: 0.15, r: 0.085, lean: -0.4 },
		{ x: 0.07, y: 0.38, z: -0.06, h: 0.22, r: 0.1, lean: 0.15 },
		{ x: 0.38, y: 0.33, z: -0.03, h: 0.26, r: 0.1, lean: 0.75 },
	].map((s) => ({ ...s, cl: Math.cos(s.lean), sl: Math.sin(s.lean) }));
	const cb = Math.cos(-0.1);
	const sb = Math.sin(-0.1);

	// Scales in rows round the opening, as a reptile's are: rows follow the lid line, each row
	// staggered by half a scale, the rows widening away from the eye. 0 in a seam, 1 at a
	// scale's middle; the cell index for a little variation.
	const cell = { bump: 0, id: 0 };
	const scales = (px: number, py: number, a: number) => {
		const u = 4 * Math.sqrt(Math.max(0, a) + 0.004);
		const row = Math.floor(u);
		const fu = u - row;
		const along = Math.atan2(py * 1.7, px) * (0.25 + Math.max(0, a)) / (0.12 + 0.05 * row) + row * 0.5;
		const col = Math.floor(along);
		const fv = along - col;
		cell.bump = Math.sin(Math.PI * fu) * Math.sin(Math.PI * fv);
		cell.id = hash(row, col);
		return cell;
	};

	const sdf = (x: number, y: number, z: number) => {
		const [px, py, pz] = local(x, y, z);
		const a = opening(px, py);
		// the head: the lens outline pushed out into a domed pillow
		const bent = pz + 0.32 * (px * px + py * py);
		const r = 0.08;
		const e = outline(px, py) + r;
		// thinner toward the corners, so they taper to points
		const taper = 1 - 0.6 * Math.min(1, (px * px) / (HEAD.w * HEAD.w));
		const w = Math.abs(bent - 0.06) - 0.2 * taper + r;
		const pillow = (Math.min(Math.max(e, w), 0) + S.length2(Math.max(e, 0), Math.max(w, 0)) - r) * 0.8;
		let skin = pillow;
		// the brow: a ridge arching over the upper lid, low at the inner corner, peaked above the
		// outer half
		const brow = Math.min(
			S.capsule(px, py, pz, -0.5, 0.12, -0.04, 0.1, 0.36, -0.1, 0.075),
			S.capsule(px, py, pz, 0.1, 0.36, -0.1, 0.54, 0.24, -0.02, 0.07),
		);
		skin = S.smoothUnion(skin, brow, 0.08);
		// the lids swell into a lip round the opening
		skin -= 0.035 * Math.max(0, 1 - Math.abs(a - 0.04) / 0.06);
		// scales as small domes
		skin -= 0.014 * Math.sqrt(scales(px, py, a).bump);
		// cut the opening through the skin, with rounded lid edges
		skin = S.smoothSubtract(skin, a, 0.035);
		let best = skin * 0.65;
		let m = M.skin;
		// the eyeball lives inside the head: only its front shows, through the opening
		const ball = Math.max(S.sphere(px, py, pz - BALL.z, BALL.r), pillow + 0.03);
		if (ball < best) {
			best = ball;
			m = M.eye;
		}
		for (const s of spikes) {
			let sx = px - s.x;
			let sy = py - s.y;
			let sz = pz - s.z;
			const rx = sx * s.cl + sy * s.sl;
			sy = -sx * s.sl + sy * s.cl;
			sx = rx;
			const ry = sy * cb - sz * sb;
			sz = sy * sb + sz * cb;
			sy = ry;
			const d = cone(sx, sy + 0.05, sz, s.r, s.h + 0.05) * 0.8;
			if (d < best) {
				best = d;
				m = M.horn;
			}
		}
		hit.m = m;
		return best;
	};

	const skinBase = rgbOf(0x571c27);
	const material: SymbolModel['material'] = (m, x, y, z) => {
		const [px, py] = local(x, y, z);
		if (m === M.eye) {
			// the pupil's middle, moved by look
			const ex = px - look[0] * 0.14;
			const ey = py - mid - look[1] * 0.1;
			const along = Math.min(1, Math.abs(ey) / 0.34);
			const half = 0.05 * pupil * Math.sqrt(Math.max(0, 1 - along * along));
			if (Math.abs(ex) < half) return { albedo: [0.004, 0.001, 0.002] };
			const r = S.length2(ex, ey * 1.2);
			const angle = Math.atan2(ey, ex);
			// streaks fanning out from the pupil, a darker halo round it, a dark rim at the lids;
			// yellow by the pupil, orange, then red toward the rim
			const streak = 0.5 + 0.5 * noise2(angle * 6 + 11, r * 4);
			const halo = smoothstep(half, half + 0.05, Math.abs(ex));
			const rim = smoothstep(-0.015, -0.1, opening(px, py));
			const inner = Math.max(0, 1 - r / 0.42);
			const heat = (0.35 + 1.1 * inner) * (0.55 + 0.45 * streak) * (0.4 + 0.6 * halo) * (0.15 + 0.85 * rim) * (1 + glow * 0.9);
			const yellow = smoothstep(0.35, 0.85, inner);
			return {
				albedo: [0.5, 0.22, 0.04],
				emissive: [1.5 * heat, (0.22 + 0.6 * yellow) * heat, (0.02 + 0.12 * yellow) * heat],
				spec: 0.6,
				shine: 50,
			};
		}
		if (m === M.horn) {
			// bone, darker at the root
			const t = smoothstep(0.3, 0.55, py);
			const k = 0.3 + 0.65 * t;
			return { albedo: [0.75 * k, 0.6 * k, 0.42 * k], spec: 0.3, shine: 20 };
		}
		// skin: each scale lighter toward its rim
		const c = scales(px, py, opening(px, py));
		const k = (0.25 + 1.1 * c.bump) * (0.8 + 0.4 * c.id);
		return { albedo: [skinBase[0] * k, skinBase[1] * k, skinBase[2] * k], spec: 0.08, shine: 14 };
	};

	// the eye lights its own lids from within
	const [lx, ly, lz] = toModel(0, mid, -0.34);
	const heat = o * (1 + glow);
	return {
		centreY: 0.5,
		reach: 0.6,
		exposure: 1.1,
		quantize: { allowed: ALLOWED, dither: 0.015 },
		sdf,
		material,
		lights: [{ x: lx, y: ly, z: lz, color: [1.2 * heat, 0.45 * heat, 0.08 * heat], radius: 0.45, shadows: false }],
	};
};
