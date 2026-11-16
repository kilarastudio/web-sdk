import _ from 'lodash';

import { stateBet } from 'state-shared';
import { checkIsMultipleRevealEvents } from 'utils-book';
import { createPrimaryMachines, createIntermediateMachines, createGameActor } from 'utils-xstate';

import type { Bet } from './typesBookEvent';
import type { RawSymbol } from './types';
import { stateXstateDerived } from './stateXstate';
import { playBet, convertTorResumableBet, getSymbolY } from './utils';
import { stateGame, stateGameDerived } from './stateGame.svelte';

// What the board showed before a round was asked for. If the request fails, the symbols have
// already fallen out, so the board is put back as it was and the error message has a game
// behind it.
let boardBeforeSpin: RawSymbol[][] = [];

const restoreBoard = () =>
	stateGame.board.forEach((reel, reelIndex) => {
		reel.setSymbolsWithRawSymbols(boardBeforeSpin[reelIndex]);
		reel.reelState.symbols.forEach((reelSymbol) =>
			reelSymbol.symbolY.set(getSymbolY(reelSymbol.symbolIndexOfBoard), { duration: 0 }),
		);
	});

const primaryMachines = createPrimaryMachines<Bet>({
	onResumeGameActive: (betToResume) => convertTorResumableBet(betToResume),
	onResumeGameInactive: (betToResume) => {
		const lastRevealEvent = _.findLast(
			betToResume.state,
			(bookEvent) => bookEvent?.type === 'reveal',
		);

		if (lastRevealEvent) stateGameDerived.enhancedBoard.settle(lastRevealEvent.board);
	},
	onNewGameStart: async () => {
		boardBeforeSpin = stateGame.board.map((reel) =>
			reel.reelState.symbols.map((reelSymbol) => reelSymbol.rawSymbol),
		);
		if ((stateBet.isTurbo && stateXstateDerived.isAutoBetting()) || stateBet.isSpaceHold) return;
		stateBet.winBookEventAmount = 0;
		await stateGameDerived.enhancedBoard.preSpin({});
	},
	onNewGameError: restoreBoard,
	onPlayGame: async (bet) => await playBet(bet),
	checkIsBonusGame: (bet) => checkIsMultipleRevealEvents({ bookEvents: bet.state }),
});

const intermediateMachines = createIntermediateMachines(primaryMachines);

export const gameActor = createGameActor(intermediateMachines);
