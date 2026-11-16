// PNG encoding and review sheets for pixel canvases, free of the DOM, so scripts under Node can
// write what the game draws.
import { deflateSync } from 'node:zlib';

import { PixelCanvas } from './canvas.ts';
import { PALETTE } from './palette.ts';

const crcTable = Array.from({ length: 256 }, (_, n) => {
	let c = n;
	for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
	return c >>> 0;
});
const crc = (bytes: Uint8Array) => {
	let c = 0xffffffff;
	for (const byte of bytes) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
	return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type: string, data: Uint8Array) => {
	const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
	const length = Buffer.alloc(4);
	length.writeUInt32BE(data.length);
	const check = Buffer.alloc(4);
	check.writeUInt32BE(crc(body));
	return Buffer.concat([length, body, check]);
};

export const png = (width: number, height: number, rgba: Uint8ClampedArray) => {
	const header = Buffer.alloc(13);
	header.writeUInt32BE(width, 0);
	header.writeUInt32BE(height, 4);
	header.set([8, 6, 0, 0, 0], 8);
	const rows = Buffer.alloc((width * 4 + 1) * height);
	for (let y = 0; y < height; y++)
		Buffer.from(rgba.buffer, rgba.byteOffset + y * width * 4, width * 4).copy(
			rows,
			y * (width * 4 + 1) + 1,
		);
	return Buffer.concat([
		Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
		chunk('IHDR', header),
		chunk('IDAT', deflateSync(rows)),
		chunk('IEND', new Uint8Array()),
	]);
};

// RGBA bytes scaled up whole, each source pixel scale × scale
export const upscale = (
	width: number,
	height: number,
	rgba: Uint8ClampedArray,
	scale: number,
) => {
	const out = new Uint8ClampedArray(width * height * scale * scale * 4);
	const w = width * scale;
	for (let y = 0; y < height; y++)
		for (let x = 0; x < width; x++) {
			const at = (y * width + x) * 4;
			for (let j = 0; j < scale; j++)
				for (let i = 0; i < scale; i++) {
					const to = ((y * scale + j) * w + x * scale + i) * 4;
					out[to] = rgba[at];
					out[to + 1] = rgba[at + 1];
					out[to + 2] = rgba[at + 2];
					out[to + 3] = rgba[at + 3];
				}
		}
	return { width: w, height: height * scale, data: out };
};

// a canvas as a PNG, scaled up whole
export const canvasPng = (canvas: PixelCanvas, scale = 1) => {
	const { width, height, data } = canvas.toRGBA(scale);
	return png(width, height, data);
};

// a sheet of canvases side by side on a backing colour, scaled up
export const sheet = (
	canvases: PixelCanvas[],
	{ columns = canvases.length, scale = 6, gap = 2, background = 0x1a1932 } = {},
) => {
	const cellWidth = Math.max(...canvases.map((c) => c.width)) + gap;
	const cellHeight = Math.max(...canvases.map((c) => c.height)) + gap;
	const rows = Math.ceil(canvases.length / columns);
	const width = (cellWidth * columns + gap) * scale;
	const height = (cellHeight * rows + gap) * scale;
	const rgba = new Uint8ClampedArray(width * height * 4);
	for (let i = 0; i < width * height; i++) {
		rgba[i * 4] = background >> 16;
		rgba[i * 4 + 1] = (background >> 8) & 0xff;
		rgba[i * 4 + 2] = background & 0xff;
		rgba[i * 4 + 3] = 255;
	}
	canvases.forEach((canvas, index) => {
		const left = (gap + (index % columns) * cellWidth) * scale;
		const top = (gap + Math.floor(index / columns) * cellHeight) * scale;
		for (let y = 0; y < canvas.height; y++)
			for (let x = 0; x < canvas.width; x++) {
				const c = canvas.get(x, y);
				if (c < 0) continue;
				const rgb = PALETTE[c];
				for (let j = 0; j < scale; j++)
					for (let i = 0; i < scale; i++) {
						const at = ((top + y * scale + j) * width + left + x * scale + i) * 4;
						rgba[at] = rgb >> 16;
						rgba[at + 1] = (rgb >> 8) & 0xff;
						rgba[at + 2] = rgb & 0xff;
					}
			}
	});
	return png(width, height, rgba);
};
