import _ from 'lodash';

import type { RawSymbol, SymbolName, SymbolState } from './types';

export const SYMBOL_SIZE = 80;

export const REEL_PADDING = 0.5;

const PAYING: SymbolName[] = ['P1', 'D2', 'P3', 'D4', 'P2', 'D1', 'P4', 'D3'];

// The board shown before the first spin (a padding symbol above and below every reel). No two
// neighbours are the same symbol, so it shows no win.
export const INITIAL_BOARD: RawSymbol[][] = _.range(7).map((reel) =>
	_.range(9).map((row) => ({ name: PAYING[(reel * 3 + row * 2) % PAYING.length] })),
);

export const BOARD_DIMENSIONS = { x: INITIAL_BOARD.length, y: INITIAL_BOARD[0].length - 2 };

export const BOARD_SIZES = {
	width: SYMBOL_SIZE * BOARD_DIMENSIONS.x,
	height: SYMBOL_SIZE * BOARD_DIMENSIONS.y,
};

// How much larger than its own units the board is drawn, per layout: as large as the screen
// allows, the HUD and the amounts above it included.
export const BOARD_SCALE = { stacked: 1.3, wide: 1.05 };

export const INITIAL_SYMBOL_STATE: SymbolState = 'static';

const SPIN_OPTIONS_SHARED = {
	reelFallInDelay: 80,
	reelPaddingMultiplierNormal: 1.25,
	reelPaddingMultiplierAnticipated: 18,
	reelFallOutDelay: 145,
};

export const SPIN_OPTIONS_DEFAULT = {
	...SPIN_OPTIONS_SHARED,
	symbolFallInSpeed: 3.5,
	symbolFallInInterval: 30,
	symbolFallInBounceSpeed: 0.15,
	symbolFallInBounceSizeMulti: 0.5,
	symbolFallOutSpeed: 3.5,
	symbolFallOutInterval: 20,
};

export const SPIN_OPTIONS_FAST = {
	...SPIN_OPTIONS_SHARED,
	symbolFallInSpeed: 7,
	symbolFallInInterval: 0,
	symbolFallInBounceSpeed: 0.3,
	symbolFallInBounceSizeMulti: 0.25,
	symbolFallOutSpeed: 7,
	symbolFallOutInterval: 0,
};

// Grey box: every symbol is a square in its own shade of grey with its math name on it. The side
// is the whole mechanic, so it reads without colour: phoenix symbols are light with a "▲",
// dragon symbols dark with a "▼". Rank 1 is the outermost shade of each side; the scatter is the
// only white one.
export const GREY = {
	canvas: 0x15171b,
	canvasFeature: 0x1d2027,
	board: 0x0d0e11,
	cell: 0x23262c,
	line: 0x3a3e46,
	text: 0xf3f4f6,
	textDark: 0x0e1014,
	muted: 0x8a92a0,
	phoenixMark: 0xd2d5da,
	dragonMark: 0x050607,
};

export type Side = 'phoenix' | 'dragon';

export const SIDE_GLYPH: Record<Side, string> = { phoenix: '▲', dragon: '▼' };

export const SYMBOL_LOOK: Record<
	SymbolName,
	{ fill: number; text: number; label: string; side: Side | null }
> = {
	P1: { fill: 0xe6e8eb, text: GREY.textDark, label: 'P1', side: 'phoenix' },
	P2: { fill: 0xd0d3d8, text: GREY.textDark, label: 'P2', side: 'phoenix' },
	P3: { fill: 0xbabec5, text: GREY.textDark, label: 'P3', side: 'phoenix' },
	P4: { fill: 0xa4a9b1, text: GREY.textDark, label: 'P4', side: 'phoenix' },
	D1: { fill: 0x30333a, text: GREY.text, label: 'D1', side: 'dragon' },
	D2: { fill: 0x41454d, text: GREY.text, label: 'D2', side: 'dragon' },
	D3: { fill: 0x535861, text: GREY.text, label: 'D3', side: 'dragon' },
	D4: { fill: 0x666b75, text: GREY.text, label: 'D4', side: 'dragon' },
	S: { fill: 0xffffff, text: GREY.textDark, label: 'S', side: null },
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

export const SCATTER_LAND_SOUND_MAP = {
	1: 'sfx_scatter_stop_1',
	2: 'sfx_scatter_stop_2',
	3: 'sfx_scatter_stop_3',
	4: 'sfx_scatter_stop_4',
	5: 'sfx_scatter_stop_5',
} as const;

// Territory (math-sdk/games/dwanda/readme.txt): `marks` values of the territory event.
export const MARK = { none: 0, phoenix: 1, dragon: 2, clash: 3 } as const;
