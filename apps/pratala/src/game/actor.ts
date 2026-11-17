import _ from 'lodash';

import { stateBet } from 'state-shared';
import { checkIsMultipleRevealEvents } from 'utils-book';
import { createPrimaryMachines, createIntermediateMachines, createGameActor } from 'utils-xstate';

import type { Bet } from './typesBookEvent';
import type { RawSymbol } from './types';
import { stateXstateDerived } from './stateXstate';
import { playBet, convertTorResumableBet } from './utils';
import { failSpin, startSpin } from './spin.svelte';
import { stateGame, stateGameDerived } from './stateGame.svelte';

// What the board showed before a round was asked for: if the request fails, it comes back down.
let boardBeforeSpin: RawSymbol[][] = [];

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
		// the board falls out and the stream runs while the round is on its way: not waited for, so
		// the request leaves at the press (game/spin.svelte.ts)
		startSpin();
		if ((stateBet.isTurbo && stateXstateDerived.isAutoBetting()) || stateBet.isSpaceHold) return;
		stateBet.winBookEventAmount = 0;
	},
	onNewGameError: () => failSpin(boardBeforeSpin),
	onPlayGame: async (bet) => await playBet(bet),
	checkIsBonusGame: (bet) => checkIsMultipleRevealEvents({ bookEvents: bet.state }),
});

const intermediateMachines = createIntermediateMachines(primaryMachines);

export const gameActor = createGameActor(intermediateMachines);
