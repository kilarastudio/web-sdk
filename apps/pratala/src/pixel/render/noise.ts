// Deterministic noise for textures: the same picture on every machine and every run.

// a hash of three integers to 0..1
export const hash3 = (x: number, y: number, z: number) => {
	let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0;
	h = Math.imul(h ^ (h >>> 13), 1274126177);
	h ^= h >>> 16;
	return (h >>> 0) / 4294967296;
};
export const hash2 = (x: number, y: number) => hash3(x, y, 7919);

const smooth = (t: number) => t * t * (3 - 2 * t);

// value noise in three dimensions, 0..1, features about one unit across
export const noise3 = (x: number, y: number, z: number) => {
	const x0 = Math.floor(x);
	const y0 = Math.floor(y);
	const z0 = Math.floor(z);
	const fx = smooth(x - x0);
	const fy = smooth(y - y0);
	const fz = smooth(z - z0);
	const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
	const c00 = lerp(hash3(x0, y0, z0), hash3(x0 + 1, y0, z0), fx);
	const c10 = lerp(hash3(x0, y0 + 1, z0), hash3(x0 + 1, y0 + 1, z0), fx);
	const c01 = lerp(hash3(x0, y0, z0 + 1), hash3(x0 + 1, y0, z0 + 1), fx);
	const c11 = lerp(hash3(x0, y0 + 1, z0 + 1), hash3(x0 + 1, y0 + 1, z0 + 1), fx);
	return lerp(lerp(c00, c10, fy), lerp(c01, c11, fy), fz);
};

export const noise2 = (x: number, y: number) => noise3(x, y, 0.5);

// layered noise, 0..1
export const fbm3 = (x: number, y: number, z: number, octaves = 4, gain = 0.5) => {
	let sum = 0;
	let amp = 1;
	let total = 0;
	let f = 1;
	for (let i = 0; i < octaves; i++) {
		sum += amp * noise3(x * f, y * f, z * f);
		total += amp;
		amp *= gain;
		f *= 2.03;
	}
	return sum / total;
};
export const fbm2 = (x: number, y: number, octaves = 4, gain = 0.5) =>
	fbm3(x, y, 0.5, octaves, gain);

// Worley (cellular) distance in two dimensions, 0..~1: stone cells, cracks
export const worley2 = (x: number, y: number) => {
	const x0 = Math.floor(x);
	const y0 = Math.floor(y);
	let best = 9;
	for (let j = -1; j <= 1; j++)
		for (let i = -1; i <= 1; i++) {
			const cx = x0 + i + hash2(x0 + i, y0 + j);
			const cy = y0 + j + hash2(y0 + j, x0 + i + 31);
			const d = (cx - x) * (cx - x) + (cy - y) * (cy - y);
			if (d < best) best = d;
		}
	return Math.sqrt(best);
};
