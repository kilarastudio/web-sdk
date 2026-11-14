import type { PixelCanvas } from './canvas.ts';
import { CLEAR, PALETTE } from './palette.ts';

// A code-drawn picture as SVG markup: one rect per run of a colour along each row, on the art
// pixel grid. Needs no DOM, so the server can write it into the page (the HTML loading screen);
// it scales to any size and keeps its hard edges.
export const toSvg = (canvas: PixelCanvas, attributes = '') => {
	const rects: string[] = [];
	for (let y = 0; y < canvas.height; y++) {
		let x = 0;
		while (x < canvas.width) {
			const c = canvas.get(x, y);
			let end = x + 1;
			while (end < canvas.width && canvas.get(end, y) === c) end++;
			if (c !== CLEAR) {
				const hex = `#${PALETTE[c].toString(16).padStart(6, '0')}`;
				rects.push(`<rect x="${x}" y="${y}" width="${end - x}" height="1" fill="${hex}"/>`);
			}
			x = end;
		}
	}

	return (
		`<svg viewBox="0 0 ${canvas.width} ${canvas.height}" preserveAspectRatio="none" ` +
		`shape-rendering="crispEdges" aria-hidden="true" ${attributes}>${rects.join('')}</svg>`
	);
};
