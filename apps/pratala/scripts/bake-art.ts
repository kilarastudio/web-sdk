// Renders every v2 symbol frame and the board, and writes them as palette data for the game to
// decode at load (src/pixel/baked.ts).  node scripts/bake-art.ts
import { writeFileSync } from 'node:fs';

import { encodeCanvas, type Baked } from '../src/pixel/baked.ts';
import { sheet } from '../src/pixel/png.ts';
import { renderAll } from '../src/pixel/render/symbols/index.ts';
import { boardFloor, boardFrame } from '../src/pixel/render/board.ts';
import { glintTile } from '../src/pixel/render/glint.ts';
import { renderSymbol } from '../src/pixel/render/symbols/rig.ts';
import { coin } from '../src/pixel/render/symbols/coin.ts';

const started = Date.now();
const frames = renderAll();
const symbols: Baked = {};
let count = 0;
for (const [key, value] of Object.entries(frames)) {
	symbols[key] = Array.isArray(value) ? value.map(encodeCanvas) : encodeCanvas(value);
	count += Array.isArray(value) ? value.length : 1;
}
writeFileSync('src/pixel/baked/symbols.json', JSON.stringify(symbols));
console.log(`baked ${count} symbol frames in ${Date.now() - started} ms`);

const board: Baked = {
	boardFrame: encodeCanvas(boardFrame(6, 5)),
	boardFloor: encodeCanvas(boardFloor(6, 5)),
	// the coins that fly to a win: the coin turning, small
	coin: Array.from({ length: 8 }, (_, i) =>
		encodeCanvas(renderSymbol(coin({ turn: i / 8 }), { yaw: 0, pitch: 0.12 }, 16)),
	),
};
for (const tier of [1, 2, 3, 4] as const) board[`glintTile${tier}`] = encodeCanvas(glintTile(tier));
writeFileSync('src/pixel/baked/board.json', JSON.stringify(board));
console.log('baked board');

const all = [...Object.values(frames).flat(), ...[1, 2, 3, 4].map((t) => glintTile(t as 1 | 2 | 3 | 4))];
writeFileSync('../../../output/pratala/art-v2/baked-symbols.png', sheet(all, { columns: 12, scale: 4 }));
console.log('wrote baked-symbols.png');
