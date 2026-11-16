// A small ray marcher: a scene is a signed distance field with materials, lit by point lights
// and a sky, with soft shadows and ambient occlusion. It renders to linear RGB and depth, which
// quantize.ts turns into palette pixels.
import { length3 } from './sdf.ts';

export type Material = {
	// linear RGB 0..1
	albedo: [number, number, number];
	// 0 matte .. 1 mirror-like highlight
	spec?: number;
	shine?: number;
	// light the surface gives off, linear RGB
	emissive?: [number, number, number];
};

export type Light = {
	x: number;
	y: number;
	z: number;
	// linear RGB times intensity
	color: [number, number, number];
	// distance at which the light has fallen to a quarter
	radius: number;
	// 0 hard .. larger softer shadows
	soft?: number;
	shadows?: boolean;
};

export type Camera = {
	eye: [number, number, number];
	at: [number, number, number];
	up?: [number, number, number];
	// vertical field of view in degrees (perspective)
	fov: number;
	// an orthographic camera instead: half the height of the view, in world units
	ortho?: number;
};

// The scene writes the material index of its nearest surface into `hit.m` as it evaluates.
export const hit = { m: 0 };

export type Scene = {
	sdf: (x: number, y: number, z: number) => number;
	// the material at a point of surface m, with the normal, so albedo can be textured
	material: (m: number, x: number, y: number, z: number, nx: number, ny: number, nz: number) => Material;
	lights: Light[];
	camera: Camera;
	// sky light from above and fill from below, linear RGB
	sky?: [number, number, number];
	ground?: [number, number, number];
	// what a ray that hits nothing sees
	background?: [number, number, number];
	// per unit of distance
	fog?: { color: [number, number, number]; density: number };
};

export type RenderOptions = {
	width: number;
	height: number;
	maxSteps?: number;
	far?: number;
	epsilon?: number;
	// ambient occlusion strength 0..1
	ao?: number;
	// multiplies all light before tone mapping
	exposure?: number;
	// how much a ray may advance per step (below 1 for displaced surfaces)
	relax?: number;
	// a hook to light pixels differently (rows and columns omitted are rendered)
	region?: { x0: number; y0: number; x1: number; y1: number };
};

export type RenderResult = {
	width: number;
	height: number;
	// linear RGB per pixel
	rgb: Float32Array;
	// distance along the ray, Infinity where nothing was hit
	depth: Float32Array;
	// surface normal per pixel (zeros where nothing was hit)
	normal: Float32Array;
	// material index per pixel, -1 where nothing was hit
	material: Int16Array;
};

const normalOf = (scene: Scene, x: number, y: number, z: number, e: number, out: number[]) => {
	// the tetrahedron technique: four evaluations
	const a = scene.sdf(x + e, y - e, z - e);
	const b = scene.sdf(x - e, y - e, z + e);
	const c = scene.sdf(x - e, y + e, z - e);
	const d = scene.sdf(x + e, y + e, z + e);
	const nx = a - b - c + d;
	const ny = -a - b + c + d;
	const nz = -a + b - c + d;
	const l = length3(nx, ny, nz) || 1;
	out[0] = nx / l;
	out[1] = ny / l;
	out[2] = nz / l;
	return out;
};

const softShadow = (
	scene: Scene,
	ox: number,
	oy: number,
	oz: number,
	dx: number,
	dy: number,
	dz: number,
	maxT: number,
	soft: number,
) => {
	let t = 0.02;
	let res = 1;
	let ph = 1e10;
	for (let i = 0; i < 48 && t < maxT; i++) {
		const h = scene.sdf(ox + dx * t, oy + dy * t, oz + dz * t);
		if (h < 0.001) return 0;
		const y = (h * h) / (2 * ph);
		const d = Math.sqrt(Math.max(0, h * h - y * y));
		res = Math.min(res, (soft * d) / Math.max(0, t - y));
		ph = h;
		t += Math.max(h, 0.01);
	}
	return Math.max(0, Math.min(1, res));
};

const occlusion = (
	scene: Scene,
	x: number,
	y: number,
	z: number,
	nx: number,
	ny: number,
	nz: number,
	strength: number,
) => {
	let occ = 0;
	let sca = 1;
	for (let i = 1; i <= 5; i++) {
		const h = 0.02 + 0.08 * i;
		const d = scene.sdf(x + nx * h, y + ny * h, z + nz * h);
		occ += (h - d) * sca;
		sca *= 0.8;
	}
	return Math.max(0, Math.min(1, 1 - strength * occ * 3));
};

export const render = (scene: Scene, options: RenderOptions): RenderResult => {
	const {
		width,
		height,
		maxSteps = 160,
		far = 60,
		epsilon = 0.0015,
		ao = 0.6,
		exposure = 1,
		relax = 0.85,
	} = options;
	const region = options.region ?? { x0: 0, y0: 0, x1: width, y1: height };
	const rgb = new Float32Array(width * height * 3);
	const depth = new Float32Array(width * height).fill(Infinity);
	const normal = new Float32Array(width * height * 3);
	const material = new Int16Array(width * height).fill(-1);

	const { eye, at, up = [0, 1, 0], fov, ortho } = scene.camera;
	// camera basis
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
	const tanHalf = Math.tan((fov * Math.PI) / 360);
	const aspect = width / height;

	const sky = scene.sky ?? [0.05, 0.05, 0.07];
	const ground = scene.ground ?? [0.02, 0.02, 0.02];
	const background = scene.background ?? [0, 0, 0];
	const n = [0, 0, 0];

	for (let py = region.y0; py < region.y1; py++)
		for (let px = region.x0; px < region.x1; px++) {
			const sx = ((px + 0.5) / width) * 2 - 1;
			const sy = 1 - ((py + 0.5) / height) * 2;
			let dx: number;
			let dy: number;
			let dz: number;
			let ox = eye[0];
			let oy = eye[1];
			let oz = eye[2];
			if (ortho) {
				dx = fx;
				dy = fy;
				dz = fz;
				ox += rx * sx * ortho * aspect + ux * sy * ortho;
				oy += ry * sx * ortho * aspect + uy * sy * ortho;
				oz += rz * sx * ortho * aspect + uz * sy * ortho;
			} else {
				dx = fx + rx * sx * tanHalf * aspect + ux * sy * tanHalf;
				dy = fy + ry * sx * tanHalf * aspect + uy * sy * tanHalf;
				dz = fz + rz * sx * tanHalf * aspect + uz * sy * tanHalf;
				const dl = length3(dx, dy, dz);
				dx /= dl;
				dy /= dl;
				dz /= dl;
			}

			let t = 0.01;
			let found = false;
			let m = 0;
			for (let i = 0; i < maxSteps; i++) {
				const d = scene.sdf(ox + dx * t, oy + dy * t, oz + dz * t);
				if (d < epsilon * (ortho ? 1 : t)) {
					found = true;
					m = hit.m;
					break;
				}
				t += d * relax;
				if (t > far) break;
			}
			const index = py * width + px;
			let r: number;
			let g: number;
			let b: number;
			if (!found) {
				r = background[0];
				g = background[1];
				b = background[2];
			} else {
				const x = ox + dx * t;
				const y = oy + dy * t;
				const z = oz + dz * t;
				normalOf(scene, x, y, z, Math.max(0.0008, epsilon * (ortho ? 1 : t) * 0.5), n);
				const nx = n[0];
				const ny = n[1];
				const nz = n[2];
				const mat = scene.material(m, x, y, z, nx, ny, nz);
				const [ar, ag, ab] = mat.albedo;
				const occ = ao > 0 ? occlusion(scene, x, y, z, nx, ny, nz, ao) : 1;
				// sky from above, ground from below
				const upness = ny * 0.5 + 0.5;
				r = ar * (sky[0] * upness + ground[0] * (1 - upness)) * occ;
				g = ag * (sky[1] * upness + ground[1] * (1 - upness)) * occ;
				b = ab * (sky[2] * upness + ground[2] * (1 - upness)) * occ;
				for (const light of scene.lights) {
					let lx = light.x - x;
					let ly = light.y - y;
					let lz = light.z - z;
					const dist = length3(lx, ly, lz) || 1;
					lx /= dist;
					ly /= dist;
					lz /= dist;
					const ndl = nx * lx + ny * ly + nz * lz;
					if (ndl <= 0) continue;
					const q = dist / light.radius;
					const atten = 1 / (1 + 3 * q * q);
					const shadow =
						light.shadows === false
							? 1
							: softShadow(
									scene,
									x + nx * 0.01,
									y + ny * 0.01,
									z + nz * 0.01,
									lx,
									ly,
									lz,
									dist,
									light.soft ?? 8,
								);
					if (shadow <= 0) continue;
					const strength = atten * shadow;
					r += ar * light.color[0] * strength * ndl;
					g += ag * light.color[1] * strength * ndl;
					b += ab * light.color[2] * strength * ndl;
					if (mat.spec) {
						// Blinn highlight toward the camera
						let hx = lx - dx;
						let hy = ly - dy;
						let hz = lz - dz;
						const hl = length3(hx, hy, hz) || 1;
						hx /= hl;
						hy /= hl;
						hz /= hl;
						const ndh = Math.max(0, nx * hx + ny * hy + nz * hz);
						const s = mat.spec * Math.pow(ndh, mat.shine ?? 32) * strength;
						r += light.color[0] * s;
						g += light.color[1] * s;
						b += light.color[2] * s;
					}
				}
				if (mat.emissive) {
					r += mat.emissive[0];
					g += mat.emissive[1];
					b += mat.emissive[2];
				}
				if (scene.fog) {
					const f = 1 - Math.exp(-t * scene.fog.density);
					r += (scene.fog.color[0] - r) * f;
					g += (scene.fog.color[1] - g) * f;
					b += (scene.fog.color[2] - b) * f;
				}
				depth[index] = t;
				normal[index * 3] = nx;
				normal[index * 3 + 1] = ny;
				normal[index * 3 + 2] = nz;
				material[index] = m;
			}
			rgb[index * 3] = r * exposure;
			rgb[index * 3 + 1] = g * exposure;
			rgb[index * 3 + 2] = b * exposure;
		}

	return { width, height, rgb, depth, normal, material };
};
