import _ from 'lodash';
import { cubicOut } from 'svelte/easing';

import type { RawSymbol, SymbolState } from './types';

export const SYMBOL_SIZE = 100;

export const REEL_PADDING = 0.53;

// initial board (padded top and bottom): no wins and only two scatters
export const INITIAL_BOARD: RawSymbol[][] = [
	[
		{ name: 'L4' },
		{ name: 'H1' },
		{ name: 'L2' },
		{ name: 'L1' },
		{ name: 'H3' },
		{ name: 'L4' },
		{ name: 'H1' },
	],
	[
		{ name: 'L3' },
		{ name: 'H2' },
		{ name: 'L4' },
		{ name: 'L2' },
		{ name: 'S', scatter: true },
		{ name: 'L3' },
		{ name: 'L2' },
	],
	[
		{ name: 'L2' },
		{ name: 'H3' },
		{ name: 'L1' },
		{ name: 'L3' },
		{ name: 'H4' },
		{ name: 'L2' },
		{ name: 'L4' },
	],
	[
		{ name: 'L4' },
		{ name: 'H4' },
		{ name: 'L3' },
		{ name: 'H2' },
		{ name: 'L1' },
		{ name: 'H1' },
		{ name: 'L3' },
	],
	[
		{ name: 'H3' },
		{ name: 'L1' },
		{ name: 'H4' },
		{ name: 'L4' },
		{ name: 'L2' },
		{ name: 'S', scatter: true },
		{ name: 'H2' },
	],
	[
		{ name: 'H2' },
		{ name: 'L2' },
		{ name: 'H1' },
		{ name: 'L3' },
		{ name: 'H3' },
		{ name: 'L4' },
		{ name: 'L1' },
	],
];

export const BOARD_DIMENSIONS = { x: INITIAL_BOARD.length, y: INITIAL_BOARD[0].length - 2 };

export const BOARD_SIZES = {
	width: SYMBOL_SIZE * BOARD_DIMENSIONS.x,
	height: SYMBOL_SIZE * BOARD_DIMENSIONS.y,
};

// One art pixel is 2.5 game units everywhere: a reel cell is 40 art pixels across. Code-drawn
// textures and the processed image art all keep this density, so the whole screen sits on one
// pixel grid.
export const ART_PIXEL = SYMBOL_SIZE / 40;

// The stone frame round the board (src/pixel/ui.ts boardFrame), drawn whole at the board's size;
// border is its thickness in game units.
export const BOARD_FRAME = { border: 14 * ART_PIXEL };

// how far the frame reaches past the symbols on each side
export const BOARD_FRAME_REACH = {
	left: BOARD_FRAME.border,
	top: BOARD_FRAME.border,
	right: BOARD_FRAME.border,
	bottom: BOARD_FRAME.border,
};
export const BOARD_FRAME_SIDE = BOARD_FRAME_REACH.right;

// the panels above the board (tumble win) stand on the frame, over half its top edge
export const PANELS_BOTTOM = BOARD_FRAME_REACH.top * 0.5;

// how far the frame and the panels above the board reach past the symbols; the panels are bigger
// in the stacked layout
export const BOARD_MARGINS = {
	normal: { top: 110, bottom: BOARD_FRAME_REACH.bottom },
	stacked: { top: 134, bottom: BOARD_FRAME_REACH.bottom },
};

// what the board keeps clear, in CSS px, when it is scaled up to the room the HUD leaves: from
// the side edges (or the HUD's side columns) and from the header and the controls
export const BOARD_FIT = { edge: 10, gap: 8 };

// the title logo on the loading and welcome screens (static/assets/ui/logo.png, 152 × 79 art
// pixels shipped ×4, drawn by workspace output/pratala/logo/pixel/pratala_pixel_logo.py --ship),
// three game units to an art pixel; ratio is its width / height
export const LOADING_LOGO = { width: 456, ratio: 152 / 79 };

export const BACKGROUND_RATIO = 2039 / 1000;
export const PORTRAIT_BACKGROUND_RATIO = 1242 / 2208;
const PORTRAIT_RATIO = 800 / 1422;
const LANDSCAPE_RATIO = 1600 / 900;
const DESKTOP_RATIO = 1422 / 800;

const DESKTOP_HEIGHT = 800;
const LANDSCAPE_HEIGHT = 900;
const PORTRAIT_HEIGHT = 1422;
export const DESKTOP_MAIN_SIZES = { width: DESKTOP_HEIGHT * DESKTOP_RATIO, height: DESKTOP_HEIGHT };
export const LANDSCAPE_MAIN_SIZES = {
	width: LANDSCAPE_HEIGHT * LANDSCAPE_RATIO,
	height: LANDSCAPE_HEIGHT,
};
export const PORTRAIT_MAIN_SIZES = {
	width: PORTRAIT_HEIGHT * PORTRAIT_RATIO,
	height: PORTRAIT_HEIGHT,
};

export const HIGH_SYMBOLS = ['H1', 'H2', 'H3', 'H4', 'H5'];

export const INITIAL_SYMBOL_STATE: SymbolState = 'static';

// Kilara reel motion: columns land one by one, 1.25 × 160 = 200 ms apart, and an anticipated
// column waits (6.25 − 1.25) × 160 = 800 ms longer, so it lands about 1 s after the one before
const SPIN_OPTIONS_SHARED = {
	reelFallInDelay: 160,
	reelPaddingMultiplierNormal: 1.25,
	reelPaddingMultiplierAnticipated: 6.25,
	reelFallOutDelay: 145,
};

// A symbol's whole way into place is one curve, so its speed never jumps: it leaves from rest,
// gathers speed, and is already slowing as it arrives; it runs a hair past its place (about 1%
// of the way, 8 px on a full drop) and eases back. Nothing bounces and nothing bends. The same
// curve brings the symbols of a tumble down.
export const settleEasing = (t: number) => {
	const over = 0.6;
	const u = t ** 1.7 - 1;

	return 1 + (over + 1) * u ** 3 + over * u ** 2;
};
// leaving the board starts nearly from rest
const fallOutEasing = (t: number) => t * (0.25 + 0.75 * t);

// 650 px into place in about 380 ms, each symbol 44 ms behind the one under it, so a column pours
// in rather than dropping as a block
export const SPIN_OPTIONS_DEFAULT = {
	...SPIN_OPTIONS_SHARED,
	symbolFallInSpeed: 1.7,
	symbolFallInInterval: 44,
	symbolFallInBounceSpeed: 0.2,
	symbolFallInBounceSizeMulti: 0,
	symbolFallInEasing: settleEasing,
	symbolFallOutSpeed: 2.8,
	symbolFallOutInterval: 24,
	symbolFallOutEasing: fallOutEasing,
};

export const SPIN_OPTIONS_FAST = {
	...SPIN_OPTIONS_SHARED,
	symbolFallInSpeed: 4,
	symbolFallInInterval: 0,
	symbolFallInBounceSpeed: 0.3,
	symbolFallInBounceSizeMulti: 0,
	symbolFallInEasing: settleEasing,
	symbolFallOutSpeed: 6,
	symbolFallOutInterval: 0,
	symbolFallOutEasing: fallOutEasing,
};

// prefers-reduced-motion: the same distances and timings, eased into place without running past it
export const SPIN_OPTIONS_REDUCED_MOTION = {
	symbolFallInEasing: cubicOut,
};

// a win amount races up and slows into its final value, so the last digits can be read
export const countUpEasing = (t: number) => 1 - (1 - t) ** 2.4;

export const MOTION_BLUR_VELOCITY = 31;

export const zIndexes = {
	background: {
		backdrop: -3,
		normal: -2,
		feature: -1,
	},
};

// Symbols are drawn by code (src/pixel/symbols.ts) and animated by code as solid objects: one
// smooth curve into place, a win act of their own (SymbolSprite, game/symbolActs.ts) that leaves
// the symbol hurt until it goes, and its own way of leaving the board (SymbolExplosion).
const explosion = { type: 'explosion', assetKey: '', sizeRatios: { width: 1, height: 1 } } as const;

const kilaraSymbol = (assetKey: string) => {
	const sprite = { type: 'sprite', assetKey, sizeRatios: { width: 1, height: 1 } } as const;

	// at rest on the board a symbol may stir now and then (motion 'rest'); falling, it does not
	const resting = { ...sprite, motion: 'rest' } as const;

	return {
		explosion: { ...explosion, assetKey },
		static: resting,
		spin: sprite,
		land: { ...sprite, motion: 'land' },
		postWinStatic: { ...sprite, motion: 'hurt' },
		win: { ...sprite, motion: 'win' },
	} as const;
};

// the multiplier is an empty token whose value the game draws on it, until the value has moved
// off it (M_TAKEN)
const multiplierLow = kilaraSymbol('symbolMultiplierLow');
const multiplierMid = kilaraSymbol('symbolMultiplierMid');
const multiplierHigh = kilaraSymbol('symbolMultiplierHigh');

export const SYMBOL_INFO_MAP = {
	H1: kilaraSymbol('symbolH1'),
	H2: kilaraSymbol('symbolH2'),
	H3: kilaraSymbol('symbolH3'),
	H4: kilaraSymbol('symbolH4'),
	H5: kilaraSymbol('symbolH5'),
	L1: kilaraSymbol('symbolL1'),
	L2: kilaraSymbol('symbolL2'),
	L3: kilaraSymbol('symbolL3'),
	L4: kilaraSymbol('symbolL4'),
	W: kilaraSymbol('symbolWild'),
	S: kilaraSymbol('symbolScatter'),
	M_2: multiplierLow,
	M_4: multiplierLow,
	M_5: multiplierMid,
	M_7: multiplierMid,
	M_10: multiplierHigh,
	M_TAKEN_2: multiplierLow,
	M_TAKEN_4: multiplierLow,
	M_TAKEN_5: multiplierMid,
	M_TAKEN_7: multiplierMid,
	M_TAKEN_10: multiplierHigh,
};

export const SCATTER_LAND_SOUND_MAP = {
	1: 'sfx_scatter_stop_1',
	2: 'sfx_scatter_stop_2',
	3: 'sfx_scatter_stop_3',
	4: 'sfx_scatter_stop_4',
	5: 'sfx_scatter_stop_5',
} as const;
