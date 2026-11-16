// Signed distance primitives and operators, on plain numbers so a scene evaluates millions of
// times without allocating. Every primitive takes the point already moved into its own frame.
export const length2 = (x: number, y: number) => Math.sqrt(x * x + y * y);
export const length3 = (x: number, y: number, z: number) => Math.sqrt(x * x + y * y + z * z);

export const sphere = (x: number, y: number, z: number, r: number) => length3(x, y, z) - r;

export const box = (x: number, y: number, z: number, hx: number, hy: number, hz: number) => {
	const qx = Math.abs(x) - hx;
	const qy = Math.abs(y) - hy;
	const qz = Math.abs(z) - hz;
	const ox = Math.max(qx, 0);
	const oy = Math.max(qy, 0);
	const oz = Math.max(qz, 0);
	return length3(ox, oy, oz) + Math.min(Math.max(qx, Math.max(qy, qz)), 0);
};

export const roundBox = (
	x: number,
	y: number,
	z: number,
	hx: number,
	hy: number,
	hz: number,
	r: number,
) => box(x, y, z, hx - r, hy - r, hz - r) - r;

// a cylinder standing on its axis (y), radius r, half height h
export const cylinderY = (x: number, y: number, z: number, r: number, h: number) => {
	const dx = length2(x, z) - r;
	const dy = Math.abs(y) - h;
	return Math.min(Math.max(dx, dy), 0) + length2(Math.max(dx, 0), Math.max(dy, 0));
};
export const cylinderZ = (x: number, y: number, z: number, r: number, h: number) =>
	cylinderY(x, z, y, r, h);
export const cylinderX = (x: number, y: number, z: number, r: number, h: number) =>
	cylinderY(y, x, z, r, h);

// a capsule from a to b with radius r
export const capsule = (
	x: number,
	y: number,
	z: number,
	ax: number,
	ay: number,
	az: number,
	bx: number,
	by: number,
	bz: number,
	r: number,
) => {
	const pax = x - ax;
	const pay = y - ay;
	const paz = z - az;
	const bax = bx - ax;
	const bay = by - ay;
	const baz = bz - az;
	const h = Math.max(
		0,
		Math.min(1, (pax * bax + pay * bay + paz * baz) / (bax * bax + bay * bay + baz * baz)),
	);
	return length3(pax - bax * h, pay - bay * h, paz - baz * h) - r;
};

// a cone standing on y: tip at y = h, base radius r at y = 0 (approximate but exact enough)
export const coneY = (x: number, y: number, z: number, r: number, h: number) => {
	const q = length2(x, z);
	const d1 = -y;
	const d2 = Math.max((q * h + (y - h) * r) / length2(h, r), y - h);
	return Math.max(d1, d2);
};

export const torusY = (x: number, y: number, z: number, R: number, r: number) =>
	length2(length2(x, z) - R, y) - r;

export const ellipsoid = (
	x: number,
	y: number,
	z: number,
	rx: number,
	ry: number,
	rz: number,
) => {
	const k0 = length3(x / rx, y / ry, z / rz);
	const k1 = length3(x / (rx * rx), y / (ry * ry), z / (rz * rz));
	return (k0 * (k0 - 1)) / k1;
};

export const planeY = (y: number, h: number) => y - h;

// operators
export const union = (a: number, b: number) => (a < b ? a : b);
export const subtract = (a: number, b: number) => Math.max(a, -b);
export const intersect = (a: number, b: number) => Math.max(a, b);
export const smoothUnion = (a: number, b: number, k: number) => {
	const h = Math.max(k - Math.abs(a - b), 0) / k;
	return Math.min(a, b) - h * h * k * 0.25;
};
export const smoothSubtract = (a: number, b: number, k: number) => -smoothUnion(-a, b, k);

// repeat a coordinate every `period`, centred, keeping a cell index for variation
export const repeat = (v: number, period: number) => {
	const cell = Math.round(v / period);
	return { v: v - cell * period, cell };
};
// repeat within a limited range of cells
export const repeatLimited = (v: number, period: number, min: number, max: number) => {
	const cell = Math.max(min, Math.min(max, Math.round(v / period)));
	return { v: v - cell * period, cell };
};

// rotate a point in a plane; returns through the out array to avoid allocation
export const rot = (a: number, b: number, angle: number, out: number[]) => {
	const c = Math.cos(angle);
	const s = Math.sin(angle);
	out[0] = a * c - b * s;
	out[1] = a * s + b * c;
	return out;
};
