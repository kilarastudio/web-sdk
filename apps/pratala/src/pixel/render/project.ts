// Where a world point lands on a rendered picture, in its art pixels, for the things the game
// draws over the picture (flames on the torch cups, the eye's frames, fires on the floor).
import type { Camera } from './raymarch.ts';
import { length3 } from './sdf.ts';

export const project = (
	camera: Camera,
	width: number,
	height: number,
	px: number,
	py: number,
	pz: number,
) => {
	const { eye, at, up = [0, 1, 0], fov } = camera;
	let fx = at[0] - eye[0];
	let fy = at[1] - eye[1];
	let fz = at[2] - eye[2];
	const fl = length3(fx, fy, fz);
	fx /= fl;
	fy /= fl;
	fz /= fl;
	let rx = up[1] * fz - up[2] * fy;
	let ry = up[2] * fx - up[0] * fz;
	let rz = up[0] * fy - up[1] * fx;
	const rl = length3(rx, ry, rz);
	rx /= rl;
	ry /= rl;
	rz /= rl;
	const ux = fy * rz - fz * ry;
	const uy = fz * rx - fx * rz;
	const uz = fx * ry - fy * rx;
	const vx = px - eye[0];
	const vy = py - eye[1];
	const vz = pz - eye[2];
	const depth = vx * fx + vy * fy + vz * fz;
	const right = vx * rx + vy * ry + vz * rz;
	const upward = vx * ux + vy * uy + vz * uz;
	const tanHalf = Math.tan((fov * Math.PI) / 360);
	const aspect = width / height;
	const sx = right / depth / (tanHalf * aspect);
	const sy = upward / depth / tanHalf;
	return { x: ((sx + 1) / 2) * width, y: ((1 - sy) / 2) * height, depth };
};
