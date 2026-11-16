// Renders H1 (the gold skull) and W (the wild coin) to a review sheet. node scripts/render-skull.ts
// With --big, also renders both at 160 px (big-skull.png, big-coin.png) to see the model behind the pixels.
import { writeFileSync } from 'node:fs';

import { sheet } from '../src/pixel/png.ts';
import type { PixelCanvas } from '../src/pixel/canvas.ts';
import { renderSymbol, type SymbolModel, type View } from '../src/pixel/render/symbols/rig.ts';
import { skull } from '../src/pixel/render/symbols/skull.ts';
import { coin } from '../src/pixel/render/symbols/coin.ts';

const out = '../../../output/pratala/art-v2/skull';
const started = Date.now();
const views: View[] = [{}, { yaw: 0.5 }, { yaw: -1.0 }];
const models: [string, SymbolModel][] = [
	['skull', skull()],
	['coin', coin()],
];
// how much of the cell the drawn pixels fill
const extent = (c: PixelCanvas) => {
	let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
	for (let y = 0; y < c.height; y++)
		for (let x = 0; x < c.width; x++)
			if (c.get(x, y) >= 0) {
				x0 = Math.min(x0, x); x1 = Math.max(x1, x);
				y0 = Math.min(y0, y); y1 = Math.max(y1, y);
			}
	return `${x1 - x0 + 1}×${y1 - y0 + 1} at (${x0},${y0})`;
};
const canvases: PixelCanvas[] = [];
for (const [name, model] of models)
	for (const view of views) {
		const c = renderSymbol(model, view);
		console.log(name, JSON.stringify(view), extent(c));
		canvases.push(c);
	}
// the skull with its embers flaring, the coin half turned
canvases.push(renderSymbol(skull({ glow: 1 })));
canvases.push(renderSymbol(coin({ turn: 0.2 })));
console.log(`rendered in ${Date.now() - started} ms`);
writeFileSync(`${out}/sheet.png`, sheet(canvases, { columns: 4, scale: 6, background: 0x1a1932 }));
writeFileSync(`${out}/sheet-1x.png`, sheet(canvases, { columns: 4, scale: 2, background: 0x1a1932 }));
console.log('wrote sheet.png and sheet-1x.png');
if (process.argv.includes('--big'))
	for (const [name, model] of models)
		writeFileSync(`${out}/big-${name}.png`, sheet(views.map((view) => renderSymbol(model, view, 160)), { columns: 3, scale: 2 }));
