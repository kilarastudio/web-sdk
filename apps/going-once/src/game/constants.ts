import _ from 'lodash';

import type { RawSymbol, SymbolName, SymbolState } from './types';

export const SYMBOL_SIZE = 120;

export const REEL_PADDING = 0.5;

const PAYING: SymbolName[] = ['H1', 'H2', 'H3', 'H4', 'L1', 'L2', 'L3', 'L4'];

// The board shown before the first spin (a padding symbol above and below every reel). Reel 1
// only holds even steps of the list and reel 2 only odd ones, so no line can win.
export const INITIAL_BOARD: RawSymbol[][] = _.range(5).map((reel) =>
	_.range(5).map((row) => ({ name: PAYING[(reel * 3 + row * 2) % PAYING.length] })),
);

export const BOARD_DIMENSIONS = { x: INITIAL_BOARD.length, y: INITIAL_BOARD[0].length - 2 };

export const BOARD_SIZES = {
	width: SYMBOL_SIZE * BOARD_DIMENSIONS.x,
	height: SYMBOL_SIZE * BOARD_DIMENSIONS.y,
};

// How much larger than its own units the board is drawn, per layout: as large as the screen
// allows, with room for the amounts above and below it.
export const BOARD_SCALE = { stacked: 1.26, wide: 1.2 };

export const INITIAL_SYMBOL_STATE: SymbolState = 'static';

const SPIN_OPTIONS_SHARED = {
	reelBounceBackSpeed: 0.15,
	reelSpinSpeedBeforeBounce: 4,
	reelPaddingMultiplierNormal: 1.2,
	// an anticipated reel lands about 1 s after the one before (docs/kilara/style-kilara.md)
	reelPaddingMultiplierAnticipated: 5,
	reelSpinDelay: 145,
};

export const SPIN_OPTIONS_DEFAULT = {
	...SPIN_OPTIONS_SHARED,
	reelPreSpinSpeed: 2,
	reelSpinSpeed: 3,
	reelBounceSizeMulti: 0.3,
};

export const SPIN_OPTIONS_FAST = {
	...SPIN_OPTIONS_SHARED,
	reelPreSpinSpeed: 5,
	reelSpinSpeed: 5,
	reelBounceSizeMulti: 0.05,
};

// Grey box: every symbol is a square in its own shade of grey with its math name on it. High
// symbols are lighter than low ones; the wild is white. Lots are black squares with a white edge
// and their value ("5×"); the gavel and the buyer are black squares marked G and B.
export const GREY = {
	canvas: 0x15171b,
	canvasFeature: 0x1d2027,
	board: 0x0d0e11,
	cell: 0x23262c,
	line: 0x3a3e46,
	text: 0xf3f4f6,
	textDark: 0x0e1014,
	muted: 0x8a92a0,
	lot: 0x000000,
};

export const SYMBOL_LOOK: Record<
	SymbolName,
	{ fill: number; text: number; label: string; edge?: number }
> = {
	H1: { fill: 0xd2d5da, text: GREY.textDark, label: 'H1' },
	H2: { fill: 0xb9bdc4, text: GREY.textDark, label: 'H2' },
	H3: { fill: 0xa0a5ad, text: GREY.textDark, label: 'H3' },
	H4: { fill: 0x878d96, text: GREY.textDark, label: 'H4' },
	L1: { fill: 0x666b74, text: GREY.text, label: 'L1' },
	L2: { fill: 0x50555d, text: GREY.text, label: 'L2' },
	L3: { fill: 0x3c4047, text: GREY.text, label: 'L3' },
	L4: { fill: 0x2e3137, text: GREY.text, label: 'L4' },
	W: { fill: 0xffffff, text: GREY.textDark, label: 'W' },
	P: { fill: GREY.lot, text: GREY.text, label: 'LOT', edge: GREY.text },
	G: { fill: GREY.lot, text: GREY.text, label: 'G', edge: GREY.text },
	B: { fill: GREY.lot, text: GREY.text, label: 'B', edge: GREY.text },
};

// A lot's value is a multiple of the base bet (math-sdk/games/going_once/readme.txt).
export const lotLabel = (value: number) => `${value}×`;

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

export const SCATTER_LAND_SOUND_MAP = {
	1: 'sfx_scatter_stop_1',
	2: 'sfx_scatter_stop_2',
	3: 'sfx_scatter_stop_3',
	4: 'sfx_scatter_stop_4',
	5: 'sfx_scatter_stop_5',
} as const;
