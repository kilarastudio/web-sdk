// Renders the keris (H2) and the war horn (H3) to review sheets. node scripts/render-blades.ts
import { mkdirSync, writeFileSync } from 'node:fs';

import { sheet } from '../src/pixel/png.ts';
import type { PixelCanvas } from '../src/pixel/canvas.ts';
import { renderSymbol, type SymbolModel } from '../src/pixel/render/symbols/rig.ts';
import { keris } from '../src/pixel/render/symbols/keris.ts';
import { horn } from '../src/pixel/render/symbols/horn.ts';

const out = '../../../output/pratala/art-v2/blades';
mkdirSync(out, { recursive: true });
const started = Date.now();

// the used box of a canvas, to check the ~90% fill
const extent = (c: PixelCanvas) => {
	let x0 = 99, y0 = 99, x1 = -1, y1 = -1;
	for (let y = 0; y < c.height; y++)
		for (let x = 0; x < c.width; x++)
			if (c.get(x, y) >= 0) {
				x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
			}
	return `${x1 - x0 + 1}×${y1 - y0 + 1} at ${x0},${y0}`;
};

const views = [{}, { yaw: 0.5 }, { yaw: -1.0 }];
const rows: [string, SymbolModel][] = [
	['keris', keris()],
	['keris heat', keris({ heat: 0.7 })],
	['horn', horn()],
	['horn blow', horn({ blow: 0.8 })],
];
const canvases: PixelCanvas[] = [];
for (const [name, model] of rows)
	for (const view of views) {
		const c = renderSymbol(model, view);
		console.log(name, JSON.stringify(view), extent(c));
		canvases.push(c);
	}
console.log(`rendered in ${Date.now() - started} ms`);
writeFileSync(`${out}/sheet.png`, sheet(canvases, { columns: 3, scale: 6, background: 0x1a1932 }));
writeFileSync(`${out}/sheet-1x.png`, sheet(canvases, { columns: 6, scale: 2, background: 0x1a1932 }));
console.log('wrote sheet.png and sheet-1x.png');

// a large render of each model, to judge the shapes apart from the pixel grid
writeFileSync(
	`${out}/large.png`,
	sheet([renderSymbol(keris(), {}, 160), renderSymbol(horn(), {}, 160)], { columns: 2, scale: 2, background: 0x1a1932 }),
);
