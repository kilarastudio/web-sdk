import _ from 'lodash';

import { recordBookEvent, checkIsMultipleRevealEvents, type BookEventHandlerMap } from 'utils-book';
import { stateBet, stateBetDerived, stateUi } from 'state-shared';
import { BOOK_AMOUNT_MULTIPLIER } from 'constants-shared/bet';

import { eventEmitter } from './eventEmitter';
import { playBookEvent } from './utils';
import { winLevelMap, type WinLevel, type WinLevelData } from './winLevelMap';
import { stateGame, stateGameDerived, emptyGlint } from './stateGame.svelte';
import type { BookEvent, BookEventOfType, BookEventContext } from './typesBookEvent';
import type { Position } from './types';
import { glintChanges } from './glint';
import type { GlintApplySpot } from '../components/GlintSpots.svelte';

let awaitingFirstFreeSpinGlint = false;
const updateGlint = async (glint: number[][]) => {
	const superStart =
		awaitingFirstFreeSpinGlint &&
		stateGame.gameType === 'freegame' &&
		glint.length === 6 &&
		glint.every((column) => column.length === 5 && column.every((value) => value === 2));
	awaitingFirstFreeSpinGlint = false;
	const spots = glintChanges(stateGame.glint, glint);
	stateGame.glint = glint;
	if (superStart) await eventEmitter.broadcastAsync({ type: 'glintSuperShow' });
	else if (spots.length) await eventEmitter.broadcastAsync({ type: 'glintAnimateShow', spots });
};

const resetGlint = async () => {
	awaitingFirstFreeSpinGlint = false;
	if (stateGame.glint.some((column) => column.some((value) => value > 0)))
		await eventEmitter.broadcastAsync({ type: 'glintResetShow' });
	stateGame.glint = emptyGlint();
};

const appliedSpots = (wins: BookEventOfType<'winInfo'>['wins']): GlintApplySpot[] =>
	wins.flatMap((win) => {
		if (win.meta.clusterMult <= 1) return [];
		const position = win.positions.find(
			({ reel, row }) => stateGame.glint[reel]?.[row - 1] === win.meta.clusterMult,
		);
		return position
			? [
					{
						reel: position.reel,
						row: position.row - 1,
						value: win.meta.clusterMult,
						targetReel: win.meta.overlay.reel,
						targetRow: win.meta.overlay.row - 1,
					},
				]
			: [];
	});

const winLevelSoundsPlay = ({ winLevelData }: { winLevelData: WinLevelData }) => {
	if (winLevelData?.alias === 'max') eventEmitter.broadcastAsync({ type: 'uiHide' });
	if (winLevelData?.sound?.sfx) {
		eventEmitter.broadcast({ type: 'soundOnce', name: winLevelData.sound.sfx });
	}
	if (winLevelData?.sound?.bgm) {
		eventEmitter.broadcast({ type: 'soundMusic', name: winLevelData.sound.bgm });
	}
};

// the character only celebrates a win above what the round cost (a win at or below it is a loss
// in disguise), and a big win the most
const characterReactToWin = ({
	amount,
	winLevelData,
}: {
	amount: number;
	winLevelData: WinLevelData;
}) => {
	const cost = (stateBetDerived.activeBetMode()?.costMultiplier ?? 1) * BOOK_AMOUNT_MULTIPLIER;
	if (amount <= cost) return;

	eventEmitter.broadcast({
		type: 'characterReact',
		reaction: winLevelData?.type === 'big' ? 'bigWin' : 'win',
	});
};

const winLevelSoundsStop = () => {
	if (stateBet.activeBetModeKey === 'SUPERSPIN' || stateGame.gameType === 'freegame') {
		// check if SUPERSPIN, when finishing a bet.
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_freespin' });
	} else {
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_main' });
	}
	eventEmitter.broadcastAsync({ type: 'uiShow' });
};

const animateSymbols = async ({ positions }: { positions: Position[] }) => {
	eventEmitter.broadcast({ type: 'boardShow' });
	await eventEmitter.broadcastAsync({
		type: 'boardWithAnimateSymbols',
		symbolPositions: positions,
	});
};

export const bookEventHandlerMap: BookEventHandlerMap<BookEvent, BookEventContext> = {
	reveal: async (bookEvent: BookEventOfType<'reveal'>, { bookEvents }: BookEventContext) => {
		eventEmitter.broadcast({ type: 'tumbleWinAmountReset' });
		const isBonusGame = checkIsMultipleRevealEvents({ bookEvents });
		if (isBonusGame) {
			eventEmitter.broadcast({ type: 'stopButtonEnable' });
			recordBookEvent({ bookEvent });
		}

		stateGame.gameType = bookEvent.gameType;
		// spots belong to one base round; free spins keep theirs (updateGlint sets them)
		if (bookEvent.gameType === 'basegame') await resetGlint();
		await stateGameDerived.enhancedBoard.spin({ revealEvent: bookEvent });
		eventEmitter.broadcast({ type: 'soundScatterCounterClear' });
	},
	winInfo: async (bookEvent: BookEventOfType<'winInfo'>) => {
		const applied = appliedSpots(bookEvent.wins);
		const promise1 = async () => {
			eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_winlevel_small' });
			await animateSymbols({ positions: _.flatten(bookEvent.wins.map((win) => win.positions)) });
		};

		const promise2 = async () => {
			await eventEmitter.broadcastAsync({
				type: 'showClusterWinAmounts',
				wins: bookEvent.wins.map((win) => {
					// clusterMult is the brightest lit Glint Spot under the win (1 when none)
					return {
						win: win.meta.winWithoutMult,
						mult: win.meta.clusterMult,
						result: win.win,
						reel: win.meta.overlay.reel,
						row: win.meta.overlay.row,
					};
				}),
			});
		};

		const unique = applied.filter(
			(spot, index) =>
				applied.findIndex((s) => s.reel === spot.reel && s.row === spot.row) === index,
		);
		await Promise.all([
			promise1(),
			promise2(),
			...(applied.length
				? [
						eventEmitter.broadcastAsync({ type: 'glintApplyFly', spots: applied }),
						eventEmitter.broadcastAsync({
							type: 'glintAnimateShow',
							spots: unique.map((spot) => ({
								reel: spot.reel,
								row: spot.row,
								from: spot.value,
								to: spot.value,
								animation: 'apply' as const,
							})),
						}),
					]
				: []),
		]);
	},
	updateTumbleWin: async (bookEvent: BookEventOfType<'updateTumbleWin'>) => {
		if (bookEvent.amount > 0) {
			eventEmitter.broadcast({ type: 'tumbleWinAmountShow' });
			eventEmitter.broadcast({
				type: 'tumbleWinAmountUpdate',
				amount: bookEvent.amount,
				animate: false,
			});
		}
	},
	setTotalWin: async (bookEvent: BookEventOfType<'setTotalWin'>) => {
		stateBet.winBookEventAmount = bookEvent.amount;
	},
	freeSpinTrigger: async (bookEvent: BookEventOfType<'freeSpinTrigger'>) => {
		// animate scatters
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_scatter_win_v2' });
		eventEmitter.broadcast({ type: 'characterReact', reaction: 'bonus' });
		await animateSymbols({ positions: bookEvent.positions });
		// show free spin intro
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_superfreespin' });
		await eventEmitter.broadcastAsync({ type: 'uiHide' });
		await eventEmitter.broadcastAsync({ type: 'transition' });
		eventEmitter.broadcast({ type: 'freeSpinIntroShow' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'jng_intro_fs' });
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_freespin' });
		await eventEmitter.broadcastAsync({
			type: 'freeSpinIntroUpdate',
			totalFreeSpins: bookEvent.totalFs,
		});
		stateGame.gameType = 'freegame';
		awaitingFirstFreeSpinGlint = true;
		eventEmitter.broadcast({ type: 'freeSpinIntroHide' });
		eventEmitter.broadcast({ type: 'boardFrameGlowShow' });
		// the HUD shows the free spins counter in every layout
		stateUi.freeSpinCounterShow = true;
		stateUi.freeSpinCounterCurrent = 0;
		stateUi.freeSpinCounterTotal = bookEvent.totalFs;
		await eventEmitter.broadcastAsync({ type: 'uiShow' });
		await eventEmitter.broadcastAsync({ type: 'drawerButtonShow' });
		eventEmitter.broadcast({ type: 'drawerFold' });
	},
	updateFreeSpin: async (bookEvent: BookEventOfType<'updateFreeSpin'>) => {
		stateUi.freeSpinCounterShow = true;
		stateUi.freeSpinCounterCurrent = bookEvent.amount;
		stateUi.freeSpinCounterTotal = bookEvent.total;
	},
	freeSpinRetrigger: async (bookEvent: BookEventOfType<'freeSpinRetrigger'>) => {
		// animate scatters, then raise the total (the next updateFreeSpin carries the same total)
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_scatter_win_v2' });
		eventEmitter.broadcast({ type: 'characterReact', reaction: 'bonus' });
		await animateSymbols({ positions: bookEvent.positions });
		stateUi.freeSpinCounterTotal = bookEvent.totalFs;
	},
	wincap: async () => {
		// max win reached: math ends the round here, and the setTotalWin, freeSpinEnd and
		// finalWin events that follow already carry the capped amount
	},
	updateGlint: async (bookEvent: BookEventOfType<'updateGlint'>) => {
		await updateGlint(bookEvent.glint);
	},
	glintStrike: async (bookEvent: BookEventOfType<'glintStrike'>) => {
		// Only the initial updateGlint can be the SUPER board initialization.
		awaitingFirstFreeSpinGlint = false;
		eventEmitter.broadcast({ type: 'characterReact', reaction: 'power' });
		await Promise.all([
			updateGlint(bookEvent.glint),
			eventEmitter.broadcastAsync({
				type: 'glintStrikeShow',
				spots: bookEvent.spots.map((spot) => ({ ...spot, row: spot.row - 1 })),
			}),
		]);
	},
	freeSpinEnd: async (bookEvent: BookEventOfType<'freeSpinEnd'>) => {
		const winLevelData = winLevelMap[bookEvent.winLevel as WinLevel];

		await eventEmitter.broadcastAsync({ type: 'uiHide' });
		stateGame.gameType = 'basegame';
		eventEmitter.broadcast({ type: 'boardFrameGlowHide' });
		eventEmitter.broadcast({ type: 'freeSpinOutroShow' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_youwon_panel' });
		characterReactToWin({ amount: bookEvent.amount, winLevelData });
		winLevelSoundsPlay({ winLevelData });
		await eventEmitter.broadcastAsync({
			type: 'freeSpinOutroCountUp',
			amount: bookEvent.amount,
			winLevelData,
		});
		winLevelSoundsStop();
		eventEmitter.broadcast({ type: 'freeSpinOutroHide' });
		stateUi.freeSpinCounterShow = false;
		await resetGlint();
		eventEmitter.broadcast({ type: 'tumbleWinAmountHide' });
		await eventEmitter.broadcastAsync({ type: 'transition' });
		await eventEmitter.broadcastAsync({ type: 'uiShow' });
		await eventEmitter.broadcastAsync({ type: 'drawerUnfold' });
		eventEmitter.broadcast({ type: 'drawerButtonHide' });
	},
	tumbleBoard: async (bookEvent: BookEventOfType<'tumbleBoard'>) => {
		eventEmitter.broadcast({ type: 'boardHide' });
		eventEmitter.broadcast({ type: 'tumbleBoardShow' });
		eventEmitter.broadcast({ type: 'tumbleBoardInit', addingBoard: bookEvent.newSymbols });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_explosion_b' });
		await eventEmitter.broadcastAsync({
			type: 'tumbleBoardExplode',
			explodingPositions: bookEvent.explodingSymbols,
		});
		eventEmitter.broadcast({ type: 'tumbleBoardRemoveExploded' });
		await eventEmitter.broadcastAsync({ type: 'tumbleBoardSlideDown' });
		eventEmitter.broadcast({
			type: 'boardSettle',
			board: stateGameDerived
				.tumbleBoardCombined()
				.map((tumbleReel) => tumbleReel.map((tumbleSymbol) => tumbleSymbol.rawSymbol)),
		});
		eventEmitter.broadcast({ type: 'tumbleBoardReset' });
		eventEmitter.broadcast({ type: 'tumbleBoardHide' });
		eventEmitter.broadcast({ type: 'boardShow' });
	},
	setWin: async (bookEvent: BookEventOfType<'setWin'>) => {
		const winLevelData = winLevelMap[bookEvent.winLevel as WinLevel];

		eventEmitter.broadcast({ type: 'winShow' });
		characterReactToWin({ amount: bookEvent.amount, winLevelData });
		winLevelSoundsPlay({ winLevelData });
		await eventEmitter.broadcastAsync({
			type: 'winUpdate',
			amount: bookEvent.amount,
			winLevelData,
		});
		winLevelSoundsStop();
		eventEmitter.broadcast({ type: 'winHide' });
	},
	finalWin: async (bookEvent: BookEventOfType<'finalWin'>) => {
		eventEmitter.broadcast({ type: 'tumbleWinAmountHide' });
	},
	// customised
	createBonusSnapshot: async (bookEvent: BookEventOfType<'createBonusSnapshot'>) => {
		const { bookEvents } = bookEvent;

		function findLastBookEvent<T>(type: T) {
			return _.findLast(bookEvents, (bookEvent) => bookEvent.type === type) as
				BookEventOfType<T> | undefined;
		}

		const lastFreeSpinTriggerEvent = findLastBookEvent('freeSpinTrigger' as const);
		const lastUpdateFreeSpinEvent = findLastBookEvent('updateFreeSpin' as const);
		const lastSetTotalWinEvent = findLastBookEvent('setTotalWin' as const);
		const lastGlintEvent = _.findLast(
			bookEvents,
			(bookEvent) => bookEvent.type === 'updateGlint' || bookEvent.type === 'glintStrike',
		) as BookEventOfType<'updateGlint'> | BookEventOfType<'glintStrike'> | undefined;

		if (lastFreeSpinTriggerEvent) await playBookEvent(lastFreeSpinTriggerEvent, { bookEvents });
		if (lastUpdateFreeSpinEvent) playBookEvent(lastUpdateFreeSpinEvent, { bookEvents });
		if (lastSetTotalWinEvent) playBookEvent(lastSetTotalWinEvent, { bookEvents });
		// a resumed bonus shows the spots as they were, without replaying a strike
		if (lastGlintEvent) stateGame.glint = lastGlintEvent.glint;
		awaitingFirstFreeSpinGlint = false;
	},
};
