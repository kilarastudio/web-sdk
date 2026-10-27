import _ from 'lodash';
import { cubicOut } from 'svelte/easing';

import type { RawSymbol, SymbolState } from './types';

export const SYMBOL_SIZE = 100;

export const REEL_PADDING = 0.53;

// initial board (padded top and bottom)
export const INITIAL_BOARD: RawSymbol[][] = [
	[
		{ name: 'M', multiplier: 10 },
		{ name: 'H1' },
		{ name: 'M', multiplier: 2 },
		{ name: 'L1' },
		{ name: 'H1' },
		{ name: 'H4' },
		{ name: 'H1' },
	],
	[
		{ name: 'L3' },
		{ name: 'H2' },
		{ name: 'M', multiplier: 4 },
		{ name: 'L2' },
		{ name: 'S', scatter: true },
		{ name: 'S', scatter: true },
		{ name: 'L2' },
	],
	[
		{ name: 'L2' },
		{ name: 'H3' },
		{ name: 'M', multiplier: 5 },
		{ name: 'L3' },
		{ name: 'H1' },
		{ name: 'L2' },
		{ name: 'L2' },
	],
	[
		{ name: 'L3' },
		{ name: 'H4' },
		{ name: 'M', multiplier: 7 },
		{ name: 'L3' },
		{ name: 'H1' },
		{ name: 'H1' },
		{ name: 'H1' },
	],
	[
		{ name: 'H3' },
		{ name: 'H4' },
		{ name: 'M', multiplier: 10 },
		{ name: 'H2' },
		{ name: 'S', scatter: true },
		{ name: 'L2' },
		{ name: 'M', multiplier: 7 },
	],
	[
		{ name: 'H2' },
		{ name: 'H2' },
		{ name: 'S', scatter: true },
		{ name: 'L3' },
		{ name: 'H1' },
		{ name: 'S', scatter: true },
		{ name: 'L2' },
	],
];

export const BOARD_DIMENSIONS = { x: INITIAL_BOARD.length, y: INITIAL_BOARD[0].length - 2 };

export const BOARD_SIZES = {
	width: SYMBOL_SIZE * BOARD_DIMENSIONS.x,
	height: SYMBOL_SIZE * BOARD_DIMENSIONS.y,
};

// The Kilara Mine board frame (kilara-mine-v2/board-frame.png), drawn as a nine-slice round the
// board so its corners keep their size while its edges stretch. In source pixels
// (frame-geometry.json): the slices cut from each side, and how much of each is visible frame
// rather than clear padding.
export const BOARD_FRAME = {
	slices: { left: 152, top: 194, right: 155, bottom: 226 },
	border: { left: 114, top: 119, right: 115, bottom: 121 },
	// source pixels to game units
	scale: 0.3,
	// clear between the symbols and the frame's inner edge
	padding: 6,
};

// how far the frame reaches past the symbols on each side
export const BOARD_FRAME_REACH = {
	left: BOARD_FRAME.padding + BOARD_FRAME.border.left * BOARD_FRAME.scale,
	top: BOARD_FRAME.padding + BOARD_FRAME.border.top * BOARD_FRAME.scale,
	right: BOARD_FRAME.padding + BOARD_FRAME.border.right * BOARD_FRAME.scale,
	bottom: BOARD_FRAME.padding + BOARD_FRAME.border.bottom * BOARD_FRAME.scale,
};
export const BOARD_FRAME_SIDE = BOARD_FRAME_REACH.right;

// the panels above the board (tumble win, multiplier) stand on the frame, over half its top edge
export const PANELS_BOTTOM =
	BOARD_FRAME_REACH.top - BOARD_FRAME.border.top * BOARD_FRAME.scale * 0.5;

// how far the frame and the panels above the board reach past the symbols; the panels are bigger
// in the stacked layout
export const BOARD_MARGINS = {
	normal: { top: 110, bottom: BOARD_FRAME_REACH.bottom },
	stacked: { top: 134, bottom: BOARD_FRAME_REACH.bottom },
};

// what the board keeps clear, in CSS px, when it is scaled up to the room the HUD leaves: from
// the side edges (or the HUD's side columns) and from the header and the controls
export const BOARD_FIT = { edge: 10, gap: 8 };

// The game's character: where the screen leaves room beside the frame it stands right of it, its
// feet level with the frame's bottom; otherwise it stands right-aligned under the frame on the
// bottom of the screen, behind the HUD's floating controls, or stays hidden where the room there
// is too small to read it. Its height grows with the room, between these bounds, and stays below
// the board's (500) so the reels keep the focus; width = height × ratio.
export const CHARACTER_SIZES = {
	ratio: 0.5,
	// kept clear between the character and the edge of the screen
	edge: 16,
	side: { minHeight: 240, maxHeight: 400, gap: 24 },
	bottom: { minHeight: 200, maxHeight: 400, gap: 8 },
};

// the Deep Glint logo with the miner on the loading screen, a little narrower than the board (600);
// ratio is the trimmed art's width / height
export const LOADING_LOGO = { width: 440, ratio: 1209 / 979 };

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

// a short, firm settle: the last 25 px into place in 125 ms
export const SPIN_OPTIONS_DEFAULT = {
	...SPIN_OPTIONS_SHARED,
	symbolFallInSpeed: 3.5,
	symbolFallInInterval: 30,
	symbolFallInBounceSpeed: 0.2,
	symbolFallInBounceSizeMulti: 0.25,
	symbolFallOutSpeed: 3.5,
	symbolFallOutInterval: 20,
};

export const SPIN_OPTIONS_FAST = {
	...SPIN_OPTIONS_SHARED,
	symbolFallInSpeed: 7,
	symbolFallInInterval: 0,
	symbolFallInBounceSpeed: 0.3,
	symbolFallInBounceSizeMulti: 0.12,
	symbolFallOutSpeed: 7,
	symbolFallOutInterval: 0,
};

// prefers-reduced-motion: the same distances and timings, eased into place without the overshoot
export const SPIN_OPTIONS_REDUCED_MOTION = {
	symbolFallInBounceEasing: cubicOut,
};

// a back-out whose overshoot is about 4% of the distance instead of backOut's 10%
export const settleOut = (t: number) => {
	const overshoot = 1;
	const u = t - 1;

	return u * u * ((overshoot + 1) * u + overshoot) + 1;
};

export const MOTION_BLUR_VELOCITY = 31;

export const zIndexes = {
	background: {
		backdrop: -3,
		normal: -2,
		feature: -1,
	},
};

const explosion = {
	type: 'spine',
	assetKey: 'explosion',
	animationName: 'explosion',
	sizeRatios: { width: 1, height: 1 },
};

// Kilara symbols (kilara-mine-v3) are still static art: one sprite for every state but the
// explosion, which a win beats in code (see winPulse) until the art has its own animations
const SYMBOL_SPRITE_SIZE = 0.96;

const kilaraSymbol = (assetKey: string) => {
	const sprite = {
		type: 'sprite',
		assetKey,
		sizeRatios: { width: SYMBOL_SPRITE_SIZE, height: SYMBOL_SPRITE_SIZE },
	} as const;

	return {
		explosion,
		static: sprite,
		spin: sprite,
		land: sprite,
		postWinStatic: sprite,
		win: { ...sprite, pulse: true },
	};
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
