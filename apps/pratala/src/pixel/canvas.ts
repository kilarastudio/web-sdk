import { CLEAR, DARKER, INK, LIGHTER, PALETTE } from './palette.ts';

export type Point = readonly [x: number, y: number];

// A grid of palette indices (CLEAR where nothing is drawn). Art is drawn at one art pixel per
// cell and scaled up whole, so every edge stays on the grid. Free of the DOM and Pixi, so the
// same drawing runs in the browser and under plain Node.
export class PixelCanvas {
	readonly width: number;
	readonly height: number;
	readonly data: Int8Array;

	constructor(width: number, height: number) {
		this.width = width;
		this.height = height;
		this.data = new Int8Array(width * height).fill(CLEAR);
	}

	clone() {
		const copy = new PixelCanvas(this.width, this.height);
		copy.data.set(this.data);
		return copy;
	}

	inside(x: number, y: number) {
		return x >= 0 && y >= 0 && x < this.width && y < this.height;
	}

	get(x: number, y: number) {
		return this.inside(x, y) ? this.data[y * this.width + x] : CLEAR;
	}

	set(x: number, y: number, c: number) {
		x = Math.round(x);
		y = Math.round(y);
		if (this.inside(x, y)) this.data[y * this.width + x] = c;
		return this;
	}

	dots(c: number, ...points: Point[]) {
		for (const [x, y] of points) this.set(x, y, c);
		return this;
	}

	rect(x: number, y: number, width: number, height: number, c: number) {
		for (let j = y; j < y + height; j++) for (let i = x; i < x + width; i++) this.set(i, j, c);
		return this;
	}

	line(x0: number, y0: number, x1: number, y1: number, c: number) {
		x0 = Math.round(x0);
		y0 = Math.round(y0);
		x1 = Math.round(x1);
		y1 = Math.round(y1);
		const dx = Math.abs(x1 - x0);
		const dy = -Math.abs(y1 - y0);
		const sx = x0 < x1 ? 1 : -1;
		const sy = y0 < y1 ? 1 : -1;
		let error = dx + dy;
		for (;;) {
			this.set(x0, y0, c);
			if (x0 === x1 && y0 === y1) break;
			const twice = 2 * error;
			if (twice >= dy) {
				error += dy;
				x0 += sx;
			}
			if (twice <= dx) {
				error += dx;
				y0 += sy;
			}
		}
		return this;
	}

	path(c: number, ...points: Point[]) {
		for (let i = 0; i < points.length - 1; i++)
			this.line(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1], c);
		return this;
	}

	// a filled polygon whose corners are pixels: the edges are drawn too, so thin shapes stay whole
	poly(c: number, ...points: Point[]) {
		const ys = points.map(([, y]) => y);
		const top = Math.max(0, Math.floor(Math.min(...ys)));
		const bottom = Math.min(this.height - 1, Math.ceil(Math.max(...ys)));
		for (let y = top; y <= bottom; y++) {
			const crossings: number[] = [];
			for (let i = 0; i < points.length; i++) {
				const [x0, y0] = points[i];
				const [x1, y1] = points[(i + 1) % points.length];
				if (y0 === y1) continue;
				const lower = Math.min(y0, y1);
				const upper = Math.max(y0, y1);
				if (y < lower || y >= upper) continue;
				crossings.push(x0 + ((y - y0) * (x1 - x0)) / (y1 - y0));
			}
			crossings.sort((a, b) => a - b);
			for (let i = 0; i + 1 < crossings.length; i += 2)
				for (let x = Math.round(crossings[i]); x <= Math.round(crossings[i + 1]); x++)
					this.set(x, y, c);
		}
		for (let i = 0; i < points.length; i++) {
			const [x0, y0] = points[i];
			const [x1, y1] = points[(i + 1) % points.length];
			this.line(x0, y0, x1, y1, c);
		}
		return this;
	}

	// a filled ellipse; half-pixel centres give even diameters
	ellipse(cx: number, cy: number, rx: number, ry: number, c: number) {
		for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
			for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
				const dx = (x - cx) / rx;
				const dy = (y - cy) / ry;
				if (dx * dx + dy * dy <= 1) this.set(x, y, c);
			}
		return this;
	}

	ring(cx: number, cy: number, rx: number, ry: number, thickness: number, c: number) {
		const innerX = rx - thickness;
		const innerY = ry - thickness;
		for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
			for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
				const dx = x - cx;
				const dy = y - cy;
				const outer = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1;
				const inner =
					innerX > 0 &&
					innerY > 0 &&
					(dx * dx) / (innerX * innerX) + (dy * dy) / (innerY * innerY) <= 1;
				if (outer && !inner) this.set(x, y, c);
			}
		return this;
	}

	// repaint the drawn pixels that pass the test
	paint(test: (x: number, y: number, c: number) => boolean, to: number | ((c: number) => number)) {
		const next = this.data.slice();
		for (let y = 0; y < this.height; y++)
			for (let x = 0; x < this.width; x++) {
				const c = this.data[y * this.width + x];
				if (c === CLEAR || !test(x, y, c)) continue;
				next[y * this.width + x] = typeof to === 'number' ? to : to(c);
			}
		this.data.set(next);
		return this;
	}

	swap(map: Record<number, number>) {
		return this.paint(
			(_, __, c) => c in map,
			(c) => map[c],
		);
	}

	// one ramp step lighter or darker on the pixels whose neighbour in that direction is clear
	edge(dx: number, dy: number, direction: 'lighter' | 'darker', only?: (c: number) => boolean) {
		const table = direction === 'lighter' ? LIGHTER : DARKER;
		return this.paint(
			(x, y, c) => this.get(x + dx, y + dy) === CLEAR && (!only || only(c)),
			(c) => table[c],
		);
	}

	// a one-pixel line round everything drawn
	outline(c = INK, corners = false) {
		const next = this.data.slice();
		for (let y = 0; y < this.height; y++)
			for (let x = 0; x < this.width; x++) {
				if (this.data[y * this.width + x] !== CLEAR) continue;
				const beside =
					this.get(x - 1, y) !== CLEAR ||
					this.get(x + 1, y) !== CLEAR ||
					this.get(x, y - 1) !== CLEAR ||
					this.get(x, y + 1) !== CLEAR;
				const diagonal =
					corners &&
					(this.get(x - 1, y - 1) !== CLEAR ||
						this.get(x + 1, y - 1) !== CLEAR ||
						this.get(x - 1, y + 1) !== CLEAR ||
						this.get(x + 1, y + 1) !== CLEAR);
				if (beside || diagonal) next[y * this.width + x] = c;
			}
		this.data.set(next);
		return this;
	}

	// copies the left half onto the right, mirrored about the vertical middle
	mirror() {
		for (let y = 0; y < this.height; y++)
			for (let x = 0; x < Math.floor(this.width / 2); x++)
				this.data[y * this.width + (this.width - 1 - x)] = this.data[y * this.width + x];
		return this;
	}

	blit(source: PixelCanvas, dx = 0, dy = 0, flip = false) {
		for (let y = 0; y < source.height; y++)
			for (let x = 0; x < source.width; x++) {
				const c = source.data[y * source.width + (flip ? source.width - 1 - x : x)];
				if (c !== CLEAR) this.set(x + dx, y + dy, c);
			}
		return this;
	}

	// RGBA bytes, each art pixel drawn scale × scale
	toRGBA(scale = 1) {
		const width = this.width * scale;
		const height = this.height * scale;
		const out = new Uint8ClampedArray(width * height * 4);
		for (let y = 0; y < this.height; y++)
			for (let x = 0; x < this.width; x++) {
				const c = this.data[y * this.width + x];
				if (c === CLEAR) continue;
				const rgb = PALETTE[c];
				for (let j = 0; j < scale; j++)
					for (let i = 0; i < scale; i++) {
						const at = ((y * scale + j) * width + x * scale + i) * 4;
						out[at] = rgb >> 16;
						out[at + 1] = (rgb >> 8) & 0xff;
						out[at + 2] = rgb & 0xff;
						out[at + 3] = 255;
					}
			}
		return { width, height, data: out };
	}
}
