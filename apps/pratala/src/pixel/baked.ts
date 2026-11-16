// Art rendered ahead of time (scripts/bake-art.ts) and shipped as palette indices, so the game
// decodes a few hundred kilobytes instead of ray marching on a phone.
import { PixelCanvas } from './canvas.ts';

// one frame: its size and its palette indices + 1 (0 is clear), as base64 bytes
export type BakedFrame = { w: number; h: number; d: string };
export type Baked = Record<string, BakedFrame | BakedFrame[]>;

const decodeOne = ({ w, h, d }: BakedFrame) => {
	const bytes =
		typeof atob === 'function'
			? Uint8Array.from(atob(d), (c) => c.charCodeAt(0))
			: Buffer.from(d, 'base64');
	const canvas = new PixelCanvas(w, h);
	for (let i = 0; i < canvas.data.length; i++) canvas.data[i] = bytes[i] - 1;
	return canvas;
};

export const decodeBaked = (baked: Baked) => {
	const out: Record<string, PixelCanvas | PixelCanvas[]> = {};
	for (const [key, data] of Object.entries(baked))
		out[key] = Array.isArray(data) ? data.map(decodeOne) : decodeOne(data);
	return out;
};

export const encodeCanvas = (canvas: PixelCanvas): BakedFrame => {
	const bytes = new Uint8Array(canvas.data.length);
	for (let i = 0; i < bytes.length; i++) bytes[i] = canvas.data[i] + 1;
	return { w: canvas.width, h: canvas.height, d: Buffer.from(bytes).toString('base64') };
};

