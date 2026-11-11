// Renders the art drawn by code to PNG sheets for review. Run from apps/deep-glint:
//   node scripts/pixel-preview.ts [output folder]
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

import { PixelCanvas } from '../src/pixel/canvas.ts';
import { PALETTE } from '../src/pixel/palette.ts';
import { SYMBOL_DRAWINGS, SYMBOL_FRAME_RUNS } from '../src/pixel/symbols.ts';

const out = process.argv[2] ?? '../../../output/dragon/pixel';
mkdirSync(out, { recursive: true });

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
		Buffer.from(rgba.buffer, y * width * 4, width * 4).copy(rows, y * (width * 4 + 1) + 1);
	return Buffer.concat([
		Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
		chunk('IHDR', header),
		chunk('IDAT', deflateSync(rows)),
		chunk('IEND', new Uint8Array()),
	]);
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

const symbols = Object.values(SYMBOL_DRAWINGS).map((draw) => draw());
writeFileSync(join(out, 'symbols.png'), sheet(symbols, { columns: 5 }));
writeFileSync(join(out, 'symbols-1x.png'), sheet(symbols, { columns: 10, scale: 2 }));
console.log(`wrote ${out}/symbols.png`);

// the board as the game composes it: floor, lit spots, symbols, frame
import * as ui from '../src/pixel/ui.ts';

const columns = 6;
const rows = 5;
const frame = ui.boardFrame(columns, rows);
const board = new PixelCanvas(frame.width, frame.height);
board.blit(ui.boardFloor(columns, rows), ui.FRAME.border, ui.FRAME.border);
const lit: Record<string, 1 | 2 | 3 | 4> = { '1,1': 1, '2,3': 2, '4,2': 3, '5,0': 4, '0,4': 1 };
const next = ui.random(3);
for (let column = 0; column < columns; column++)
	for (let row = 0; row < rows; row++) {
		const x = ui.FRAME.border + column * ui.CELL;
		const y = ui.FRAME.border + row * ui.CELL;
		const tier = lit[`${column},${row}`];
		if (tier) board.blit(ui.glintTile(tier), x, y);
		board.blit(symbols[Math.floor(next() * 9)], x, y);
	}
board.blit(frame);
writeFileSync(join(out, 'board.png'), sheet([board], { scale: 4, background: 0x0e071b }));

const { trough, fill } = ui.loadingBar(100);
writeFileSync(
	join(out, 'ui.png'),
	sheet(
		[
			ui.glintTile(1),
			ui.glintTile(2),
			ui.glintTile(3),
			ui.glintTile(4),
			ui.glintPrimed(),
			ui.panel(),
			...ui.coinFrames(),
			...ui.sparkleFrames(),
			...ui.fireballFrames(),
			...ui.burstFrames(),
			ui.anticipationBeam(),
			trough,
			fill,
		],
		{ columns: 10, scale: 5 },
	),
);
console.log('wrote board.png, ui.png');

// the frame runs beside the still symbols: the gems' turning light, the scatter's blink and alert,
// and the sword's slash
writeFileSync(
	join(out, 'symbol-frames.png'),
	sheet([...Object.values(SYMBOL_FRAME_RUNS()).flat(), ...ui.slashFrames()], {
		columns: 8,
		scale: 5,
	}),
);
console.log('wrote symbol-frames.png');

// the torch flames, at the two sizes the base backgrounds use, and their glow
writeFileSync(
	join(out, 'flames.png'),
	sheet([...ui.flameFrames(22, 42), ...ui.flameFrames(38, 62)], {
		columns: 12,
		scale: 5,
	}),
);
console.log('wrote flames.png');
