import _ from 'lodash';

import { recordBookEvent, checkIsMultipleRevealEvents, type BookEventHandlerMap } from 'utils-book';
import { stateBet } from 'state-shared';

import { eventEmitter } from './eventEmitter';
import { playBookEvent } from './utils';
import { winLevelMap, type WinLevel } from './winLevelMap';
import { stateGame, stateGameDerived } from './stateGame.svelte';
import { HOME_CELL, RABBITS_BY_SCATTERS } from './constants';
import type { BookEvent, BookEventOfType, BookEventContext } from './typesBookEvent';
import type { Position } from './types';

// Book positions count the padding row above the board; the rabbits and footprints do not.
const toCell = (position: Position): Position => ({ reel: position.reel, row: position.row - 1 });

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

		// Footprints belong to one base game round; in Flop Time they stay.
		if (bookEvent.gameType === 'basegame') eventEmitter.broadcast({ type: 'footprintsClear' });
		stateGame.gameType = bookEvent.gameType;
		await stateGameDerived.enhancedBoard.spin({ revealEvent: bookEvent });
		eventEmitter.broadcast({ type: 'soundScatterCounterClear' });
	},
	rabbitHop: async (bookEvent: BookEventOfType<'rabbitHop'>) => {
		await eventEmitter.broadcastAsync({
			type: 'rabbitHop',
			rabbit: bookEvent.rabbit,
			to: toCell(bookEvent.to),
		});
		eventEmitter.broadcast({
			type: 'footprintsUpdate',
			grid: bookEvent.footprints,
			changed: [toCell(bookEvent.to)],
		});
	},
	rabbitFlop: async (bookEvent: BookEventOfType<'rabbitFlop'>) => {
		await eventEmitter.broadcastAsync({ type: 'rabbitFlop', rabbit: bookEvent.rabbit });
		eventEmitter.broadcast({
			type: 'footprintsUpdate',
			grid: bookEvent.footprints,
			changed: 'all',
		});
		await eventEmitter.broadcastAsync({ type: 'rabbitFlopHold' });
	},
	rabbitsEnter: async (bookEvent: BookEventOfType<'rabbitsEnter'>) => {
		eventEmitter.broadcast({ type: 'footprintsClear' });
		await eventEmitter.broadcastAsync({
			type: 'rabbitsEnter',
			cells: bookEvent.rabbits.map(toCell),
		});
		eventEmitter.broadcast({
			type: 'footprintsUpdate',
			grid: bookEvent.footprints,
			changed: bookEvent.rabbits.map(toCell),
		});
	},
	winInfo: async (bookEvent: BookEventOfType<'winInfo'>) => {
		const symbols = async () => {
			eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_winlevel_small' });
			await animateSymbols({ positions: _.flatten(bookEvent.wins.map((win) => win.positions)) });
		};

		const amounts = async () => {
			await eventEmitter.broadcastAsync({
				type: 'showClusterWinAmounts',
				wins: bookEvent.wins.map((win) => ({
					win: win.meta.winWithoutMult,
					mult: win.meta.clusterMult,
					result: win.win,
					reel: win.meta.overlay.reel,
					row: win.meta.overlay.row,
				})),
			});
		};

		await Promise.all([symbols(), amounts()]);
	},
	updateTumbleWin: async (bookEvent: BookEventOfType<'updateTumbleWin'>) => {
		if (bookEvent.amount > 0) {
			eventEmitter.broadcast({ type: 'tumbleWinAmountShow' });
			eventEmitter.broadcast({ type: 'tumbleWinAmountUpdate', amount: bookEvent.amount });
		}
	},
	setTotalWin: async (bookEvent: BookEventOfType<'setTotalWin'>) => {
		stateBet.winBookEventAmount = bookEvent.amount;
	},
	wincap: async () => {
		// The max win ends the round; the win and total events that follow show the amount.
	},
	freeSpinTrigger: async (bookEvent: BookEventOfType<'freeSpinTrigger'>) => {
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_scatter_win_v2' });
		await animateSymbols({ positions: bookEvent.positions });
		await eventEmitter.broadcastAsync({ type: 'uiHide' });
		await eventEmitter.broadcastAsync({ type: 'transition' });
		eventEmitter.broadcast({ type: 'freeSpinIntroShow' });
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_freespin' });
		await eventEmitter.broadcastAsync({
			type: 'freeSpinIntroUpdate',
			totalFreeSpins: bookEvent.totalFs,
			rabbits: RABBITS_BY_SCATTERS(bookEvent.positions.length),
		});
		stateGame.gameType = 'freegame';
		eventEmitter.broadcast({ type: 'freeSpinIntroHide' });
		eventEmitter.broadcast({ type: 'boardFrameGlowShow' });
		eventEmitter.broadcast({ type: 'freeSpinCounterShow' });
		eventEmitter.broadcast({
			type: 'freeSpinCounterUpdate',
			current: undefined,
			total: bookEvent.totalFs,
		});
		await eventEmitter.broadcastAsync({ type: 'uiShow' });
		await eventEmitter.broadcastAsync({ type: 'drawerButtonShow' });
		eventEmitter.broadcast({ type: 'drawerFold' });
	},
	freeSpinRetrigger: async (bookEvent: BookEventOfType<'freeSpinRetrigger'>) => {
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_scatter_win_v2' });
		await animateSymbols({ positions: bookEvent.positions });
		eventEmitter.broadcast({
			type: 'freeSpinCounterUpdate',
			current: undefined,
			total: bookEvent.totalFs,
		});
		await eventEmitter.broadcastAsync({ type: 'freeSpinCounterRetrigger', added: 5 });
	},
	updateFreeSpin: async (bookEvent: BookEventOfType<'updateFreeSpin'>) => {
		eventEmitter.broadcast({ type: 'freeSpinCounterShow' });
		eventEmitter.broadcast({
			type: 'freeSpinCounterUpdate',
			current: bookEvent.amount,
			total: bookEvent.total,
		});
	},
	freeSpinEnd: async (bookEvent: BookEventOfType<'freeSpinEnd'>) => {
		const winLevelData = winLevelMap[bookEvent.winLevel as WinLevel];

		await eventEmitter.broadcastAsync({ type: 'uiHide' });
		eventEmitter.broadcast({ type: 'freeSpinOutroShow' });
		await eventEmitter.broadcastAsync({
			type: 'freeSpinOutroCountUp',
			amount: bookEvent.amount,
			winLevelData,
		});
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_main' });
		stateGame.gameType = 'basegame';
		eventEmitter.broadcast({ type: 'boardFrameGlowHide' });
		eventEmitter.broadcast({ type: 'freeSpinOutroHide' });
		eventEmitter.broadcast({ type: 'freeSpinCounterHide' });
		eventEmitter.broadcast({ type: 'tumbleWinAmountHide' });
		// Flop Time is over: its footprints go and one rabbit goes back to the middle.
		eventEmitter.broadcast({ type: 'footprintsClear' });
		await eventEmitter.broadcastAsync({ type: 'rabbitsEnter', cells: [HOME_CELL] });
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
		await eventEmitter.broadcastAsync({
			type: 'winUpdate',
			amount: bookEvent.amount,
			winLevelData,
		});
		eventEmitter.broadcast({ type: 'winHide' });
	},
	finalWin: async () => {
		eventEmitter.broadcast({ type: 'tumbleWinAmountHide' });
	},
	// customised: a round resumed in the middle of Flop Time is brought back to where it was
	createBonusSnapshot: async (bookEvent: BookEventOfType<'createBonusSnapshot'>) => {
		const { bookEvents } = bookEvent;

		function findLastBookEvent<T>(type: T) {
			return _.findLast(bookEvents, (event) => event.type === type) as
				BookEventOfType<T> | undefined;
		}

		const lastFreeSpinTriggerEvent = findLastBookEvent('freeSpinTrigger' as const);
		const lastUpdateFreeSpinEvent = findLastBookEvent('updateFreeSpin' as const);
		const lastSetTotalWinEvent = findLastBookEvent('setTotalWin' as const);

		if (lastFreeSpinTriggerEvent) await playBookEvent(lastFreeSpinTriggerEvent, { bookEvents });
		if (lastUpdateFreeSpinEvent) playBookEvent(lastUpdateFreeSpinEvent, { bookEvents });
		if (lastSetTotalWinEvent) playBookEvent(lastSetTotalWinEvent, { bookEvents });

		// where the rabbits stand and what the board holds, from the rabbit events so far
		let cells: Position[] | undefined;
		let footprints: number[][] | undefined;
		for (const event of bookEvents) {
			if (event.type === 'rabbitsEnter') {
				cells = event.rabbits.map(toCell);
				footprints = event.footprints;
			} else if (event.type === 'rabbitHop' && cells) {
				cells[event.rabbit] = toCell(event.to);
				footprints = event.footprints;
			} else if (event.type === 'rabbitFlop' && cells) {
				footprints = event.footprints;
			}
		}
		if (lastFreeSpinTriggerEvent && cells && footprints) {
			await eventEmitter.broadcastAsync({ type: 'rabbitsEnter', cells });
			eventEmitter.broadcast({ type: 'footprintsUpdate', grid: footprints, changed: [] });
		}
	},
};
