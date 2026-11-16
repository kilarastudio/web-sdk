// Renders the reel board: the stone tray and the flagstone floor. node scripts/render-board.ts
// Writes board.png (the frame over the floor, × 3), board-frame.png (the frame alone, × 2) and
// board-symbols.png (the board with symbols in a few cells, × 3, to judge how calm the floor is).
import { writeFileSync } from 'node:fs';

import { PixelCanvas } from '../src/pixel/canvas.ts';
import { CLEAR } from '../src/pixel/palette.ts';
import { sheet } from '../src/pixel/png.ts';
import { boardFloor, boardFrame } from '../src/pixel/render/board.ts';
import { renderSymbol } from '../src/pixel/render/symbols/rig.ts';
import { lantern } from '../src/pixel/render/symbols/lantern.ts';
import { crystal } from '../src/pixel/render/symbols/crystal.ts';

const out = '../../../output/pratala/art-v2/board';
const columns = 6;
const rows = 5;
const CELL = 40;
const BORDER = 14;

const started = Date.now();
const frame = boardFrame(columns, rows);
const floor = boardFloor(columns, rows);
console.log(`rendered in ${Date.now() - started} ms`);

// checks: the sizes the game expects, and a clear opening
const failures: string[] = [];
const want = { frame: [columns * CELL + BORDER * 2, rows * CELL + BORDER * 2], floor: [columns * CELL, rows * CELL] };
if (frame.width !== want.frame[0] || frame.height !== want.frame[1])
	failures.push(`frame is ${frame.width}x${frame.height}, want ${want.frame.join('x')}`);
if (floor.width !== want.floor[0] || floor.height !== want.floor[1])
	failures.push(`floor is ${floor.width}x${floor.height}, want ${want.floor.join('x')}`);
let opaqueInOpening = 0;
let clearInRim = 0;
for (let y = 0; y < frame.height; y++)
	for (let x = 0; x < frame.width; x++) {
		const inside = x >= BORDER && y >= BORDER && x < frame.width - BORDER && y < frame.height - BORDER;
		const c = frame.get(x, y);
		if (inside && c !== CLEAR) opaqueInOpening++;
		if (!inside && c === CLEAR) clearInRim++;
	}
if (opaqueInOpening) failures.push(`${opaqueInOpening} opaque pixels inside the opening`);
if (clearInRim) failures.push(`${clearInRim} clear pixels in the rim`);
let clearInFloor = 0;
for (const c of floor.data) if (c === CLEAR) clearInFloor++;
if (clearInFloor) failures.push(`${clearInFloor} clear pixels in the floor`);
console.log(
	`frame ${frame.width}x${frame.height}, floor ${floor.width}x${floor.height}, opening ` +
		`${frame.width - BORDER * 2}x${frame.height - BORDER * 2} at ${BORDER},${BORDER}: ` +
		(failures.length ? `FAIL\n  ${failures.join('\n  ')}` : 'all clear, sizes right'),
);

const board = new PixelCanvas(frame.width, frame.height);
board.blit(floor, BORDER, BORDER);
board.blit(frame);
writeFileSync(`${out}/board.png`, sheet([board], { scale: 3 }));
writeFileSync(`${out}/board-frame.png`, sheet([frame], { scale: 2 }));

// a few symbols in their cells
const symbols = [lantern(), crystal('ruby'), crystal('sapphire'), crystal('emerald'), crystal('amethyst')].map((m) => renderSymbol(m));
const dressed = board.clone();
dressed.data.set(board.data);
for (let row = 0; row < rows; row++)
	for (let column = 0; column < columns; column++)
		if ((row * 7 + column * 3) % 4 !== 0)
			dressed.blit(symbols[(row * columns + column) % symbols.length], BORDER + column * CELL, BORDER + row * CELL);
dressed.blit(frame);
writeFileSync(`${out}/board-symbols.png`, sheet([dressed], { scale: 3 }));
console.log('wrote board.png, board-frame.png, board-symbols.png');
if (failures.length) process.exitCode = 1;
