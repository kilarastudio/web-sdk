import type { PixelCanvas } from './canvas.ts';

// a code-drawn picture as a data URL, for the HTML parts of the game (paytable, rules)
export const toDataUrl = (canvas: PixelCanvas, scale = 2) => {
	const { width, height, data } = canvas.toRGBA(scale);
	const element = document.createElement('canvas');
	element.width = width;
	element.height = height;
	element.getContext('2d')?.putImageData(new ImageData(data, width, height), 0, 0);

	return element.toDataURL();
};
