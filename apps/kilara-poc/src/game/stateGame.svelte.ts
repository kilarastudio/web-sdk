import _ from 'lodash';
import { prefersReducedMotion, type Tween } from 'svelte/motion';

import { stateBet, stateUi } from 'state-shared';
import { createEnhanceBoard, createReelForCascading } from 'utils-slots';
import { createGetWinLevelDataByWinLevelAlias } from 'utils-shared/winLevel';

import type { GameType, RawSymbol, SymbolState } from './types';
import { stateLayoutDerived } from './stateLayout';
import { winLevelMap } from './winLevelMap';
import { eventEmitter } from './eventEmitter';
import {
	SYMBOL_SIZE,
	BOARD_SIZES,
	BOARD_MARGINS,
	BOARD_FRAME_SIDE,
	CHARACTER_SIZES,
	INITIAL_BOARD,
	BOARD_DIMENSIONS,
	SPIN_OPTIONS_DEFAULT,
	SPIN_OPTIONS_FAST,
	SPIN_OPTIONS_REDUCED_MOTION,
	INITIAL_SYMBOL_STATE,
	SCATTER_LAND_SOUND_MAP,
} from './constants';

const onSymbolLand = ({ rawSymbol }: { rawSymbol: RawSymbol }) => {
	if (rawSymbol.name === 'S') {
		eventEmitter.broadcast({ type: 'soundScatterCounterIncrease' });
		eventEmitter.broadcast({
			type: 'soundOnce',
			name: SCATTER_LAND_SOUND_MAP[scatterLandIndex()],
		});
	}

	if (rawSymbol.name === 'M') {
		eventEmitter.broadcast({
			type: 'soundOnce',
			name: 'sfx_multiplier_landing',
		});
	}
};

const board = _.range(BOARD_DIMENSIONS.x).map((reelIndex) => {
	const reel = createReelForCascading({
		reelIndex,
		symbolHeight: SYMBOL_SIZE,
		initialSymbols: INITIAL_BOARD[reelIndex],
		initialSymbolState: INITIAL_SYMBOL_STATE,
		onReelStopping: () => {
			eventEmitter.broadcast({
				type: 'soundOnce',
				name: 'sfx_reel_stop_1',
				forcePlay: !stateBet.isTurbo,
			});
		},
		onSymbolLand,
	});

	reel.reelState.spinOptions = () => {
		const spinOptions =
			reel.reelState.spinType === 'fast' ? SPIN_OPTIONS_FAST : SPIN_OPTIONS_DEFAULT;

		return prefersReducedMotion.current
			? { ...spinOptions, ...SPIN_OPTIONS_REDUCED_MOTION }
			: spinOptions;
	};

	return reel;
});

export type Reel = (typeof board)[number];
export type ReelSymbol = Reel['reelState']['symbols'][number];

export type TumbleSymbol = {
	symbolY: Tween<number>;
	rawSymbol: RawSymbol;
	symbolState: SymbolState;
	oncomplete: () => void;
};

export type MultiplierSymbol = {
	initX: number;
	initY: number;
	symbolX: Tween<number>;
	symbolY: Tween<number>;
	rawSymbol: RawSymbol;
	symbolState: SymbolState;
	oncomplete: () => void;
};

export const stateGame = $state({
	board,
	gameType: 'basegame' as GameType,
	tumbleBoardAdding: [] as TumbleSymbol[][],
	tumbleBoardBase: [] as TumbleSymbol[][],
	multiplierBoard: [] as (MultiplierSymbol | undefined)[][],
	scatterCounter: 0,
});

// the canvas in main layout units; the main layout is centred on it and can reach past its edges
const canvasArea = () => {
	const { height, scale } = stateLayoutDerived.mainLayout();
	const canvas = stateLayoutDerived.canvasSizes();
	const top = height / 2 - canvas.height / 2 / scale;

	return { top, bottom: top + canvas.height / scale, width: canvas.width / scale };
};

// the space the HUD leaves free between its header and its controls, in main layout units
const freeArea = () => {
	const { scale } = stateLayoutDerived.mainLayout();
	const canvas = canvasArea();

	return {
		top: canvas.top + stateUi.hudInset.top / scale,
		bottom: canvas.bottom - stateUi.hudInset.bottom / scale,
	};
};

const boardMargins = () =>
	stateLayoutDerived.isStacked() ? BOARD_MARGINS.stacked : BOARD_MARGINS.normal;

// the board, with its frame and the panels above it, centred in the free area; when it does not
// fit it stays clear of the controls and lets its top run under the header
const boardY = () => {
	const margins = boardMargins();
	const above = BOARD_SIZES.height / 2 + margins.top;
	const below = BOARD_SIZES.height / 2 + margins.bottom;
	const { top, bottom } = freeArea();

	return Math.min((top + bottom + above - below) / 2, bottom - below);
};

const boardLayout = () => ({
	x: stateLayoutDerived.mainLayout().width * 0.5,
	y: boardY(),
	anchor: { x: 0.5, y: 0.5 },
	pivot: { x: BOARD_SIZES.width / 2, y: BOARD_SIZES.height / 2 },
	...BOARD_SIZES,
});

// the character's box, (x, y) being the middle of its feet: beside the frame where the screen
// leaves room for a tall enough character there; otherwise right-aligned under the frame,
// standing on the bottom of the screen behind the HUD's floating controls and as tall as the room
// under the frame allows; hidden where that room is too small to read it
const characterLayout = () => {
	const { ratio, edge, side, bottom } = CHARACTER_SIZES;
	const board = boardLayout();
	const frameRight = board.x + BOARD_SIZES.width / 2 + BOARD_FRAME_SIDE;
	const frameBottom = board.y + BOARD_SIZES.height / 2 + boardMargins().bottom;
	const canvas = canvasArea();
	const { top: freeTop, bottom: freeBottom } = freeArea();
	const sideRoom = (canvas.width - BOARD_SIZES.width) / 2 - BOARD_FRAME_SIDE - side.gap - edge;
	const sideHeight = Math.min(side.maxHeight, sideRoom / ratio, freeBottom - freeTop);

	if (sideHeight >= side.minHeight) {
		const width = sideHeight * ratio;

		return {
			placement: 'side' as const,
			x: frameRight + side.gap + width / 2,
			y: frameBottom,
			width,
			height: sideHeight,
		};
	}

	const feet = canvas.bottom - edge;
	const bottomHeight = Math.min(bottom.maxHeight, feet - frameBottom - bottom.gap);

	if (bottomHeight < bottom.minHeight) {
		return { placement: 'hidden' as const, x: 0, y: 0, width: 0, height: 0 };
	}

	const width = bottomHeight * ratio;

	return {
		placement: 'bottom' as const,
		x: frameRight - width / 2,
		y: feet,
		width,
		height: bottomHeight,
	};
};

const boardRaw = () =>
	board.map((reel) => reel.reelState.symbols.map((reelSymbol) => reelSymbol.rawSymbol));

const tumbleBoardCombined = () => {
	const tumbleBoardCombined = stateGame.tumbleBoardBase.map((tumbleReelBase, reelIndex) => {
		const tumbleReelAdding = stateGame.tumbleBoardAdding[reelIndex] ?? [];
		return [...tumbleReelAdding, ...tumbleReelBase];
	});

	return tumbleBoardCombined;
};

const scatterLandIndex = () => {
	if (stateGame.scatterCounter > 5) return 5;
	if (stateGame.scatterCounter < 1) return 1;
	return stateGame.scatterCounter as 1 | 2 | 3 | 4 | 5;
};

const { enhanceBoard } = createEnhanceBoard();
const enhancedBoard = enhanceBoard({ board: stateGame.board });

// win levels

export const { getWinLevelDataByWinLevelAlias } = createGetWinLevelDataByWinLevelAlias({
	winLevelMap,
});

export const stateGameDerived = {
	onSymbolLand,
	freeArea,
	boardLayout,
	characterLayout,
	boardRaw,
	tumbleBoardCombined,
	scatterLandIndex,
	enhancedBoard,
	getWinLevelDataByWinLevelAlias,
};
