import _ from 'lodash';

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

// One art pixel is 2.5 game units: a reel cell is 40 art pixels across. Code-drawn textures and
// the processed image art keep this density. The drawn paying symbols (64 art pixels in the same
// cell) sit on a finer grid; poses and effects still count in this unit, a fortieth of the cell.
export const ART_PIXEL = SYMBOL_SIZE / 40;

// The board's frame (src/pixel/frame.ts) is drawn on the symbols' grid, 64 art pixels to a cell.
export const FRAME_ART_PIXEL = SYMBOL_SIZE / 64;
// its bands round the board, in game units, and how far its carved corners reach below the board
export const BOARD_FRAME_BANDS = {
	top: 34 * FRAME_ART_PIXEL,
	bottom: 40 * FRAME_ART_PIXEL,
	side: 26 * FRAME_ART_PIXEL,
	corners: 62 * FRAME_ART_PIXEL,
};
// the thickness the layout counts on: the frame's sides reach past it into the margin the board
// keeps from the screen's edge (as in the approved mockup, 2026-11-17), so the board keeps its size
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
// in the stacked layout. Side by side with the HUD (desktop, landscape) the layout keeps room for
// the frame's whole foot and its carved corners, so they clear the controls; stacked (phones) the
// board is as wide as the screen allows and its foot has room to spare below it anyway.
export const BOARD_MARGINS = {
	normal: { top: 110, bottom: BOARD_FRAME_BANDS.corners },
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
export const COLUMN_LANDING = {
	reelFallInDelay: 160,
	paddingNormal: 1.25,
	paddingAnticipated: 6.25,
};

// A symbol's whole way into place is one curve, so its speed never jumps: it leaves from rest,
// gathers speed, and is already slowing as it arrives; it runs a hair past its place (about 1%
// of the way, 8 px on a full drop) and eases back. Nothing bounces and nothing bends. The same
// curve brings the symbols of a tumble down, and a spin's symbols land on its slowing half.
export const settleEasing = (t: number) => {
	const over = 0.6;
	const u = t ** 1.7 - 1;

	return 1 + (over + 1) * u ** 3 + over * u ** 2;
};
// leaving the board starts nearly from rest; its slope at the end is 1.75
export const fallOutEasing = (t: number) => t * (0.25 + 0.75 * t);

// The start of a spin (game/spin.svelte.ts), tumble style. The round is asked for at the press;
// meanwhile the whole board falls out at once, bottom row first (rowInterval apart), gathering
// speed over `gather` units on fallOutEasing up to `speed` (units / ms), and a stream of dimmed
// paying symbols follows the last of it down every column at that speed until the answer is in.
// The result then follows the stream's last symbol and lands on the settle curve's slowing half
// over its last `settle` units, each symbol landInterval ms behind the one under it, so a column
// still pours in. It never starts before minDuration (and never before the old board is gone),
// so a fast and a slow answer land on the same beat.
export const SPIN_FLOW = {
	normal: {
		rowInterval: 30,
		gather: 200,
		speed: 2.8,
		settle: 330,
		landInterval: 44,
		minDuration: 450,
	},
	// turbo: the board falls out nearly as a block and faster, and the columns land together
	fast: {
		rowInterval: 10,
		gather: 160,
		speed: 4.2,
		settle: 330,
		landInterval: 0,
		minDuration: 250,
	},
};

// the stream: the paying symbols only (a scatter in it would read as a near miss), stepped back
export const STREAM_SYMBOLS = ['H1', 'H2', 'H3', 'H4', 'L1', 'L2', 'L3', 'L4'] as const;
export const STREAM_TINT = 0xa8adc0;

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

// Symbols come from src/pixel/symbols.ts (drawn art and art drawn by code) and are animated by code as solid objects: one
// smooth curve into place, then frame runs of their own for every state (pixel/symbolRuns.ts): a
// land, acts at rest, a win that leaves the symbol hurt until it goes (SymbolSprite,
// game/symbolActs.ts), and its own way of leaving the board (SymbolExplosion).
const explosion = { type: 'explosion', assetKey: '', sizeRatios: { width: 1, height: 1 } } as const;

const kilaraSymbol = (assetKey: string) => {
	const sprite = { type: 'sprite', assetKey, sizeRatios: { width: 1, height: 1 } } as const;

	// at rest on the board a symbol may stir now and then (motion 'rest'); falling, it does not
	const resting = { ...sprite, motion: 'rest' } as const;

	return {
		explosion: { ...explosion, assetKey },
		static: resting,
		// falling into place: the dragon's eye comes in narrowed and snaps open as it lands
		spin: { ...sprite, motion: 'fall' },
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
