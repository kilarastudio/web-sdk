import { stateBet } from 'state-shared';
import { createPrimaryMachines, createIntermediateMachines, createGameActor } from 'utils-xstate';

import type { Bet } from './typesBookEvent';
import { playBet } from './utils';
import { stateGame } from './stateGame.svelte';

// A keno round is one draw: no bonus rounds, nothing to rebuild on resume.
const primaryMachines = createPrimaryMachines<Bet>({
	onResumeGameActive: (betToResume) => {
		// the player's numbers are gone after a reload: the resumed round shows the book's board
		stateGame.resuming = true;
		return betToResume;
	},
	onResumeGameInactive: () => {},
	onNewGameStart: async () => {
		stateBet.winBookEventAmount = 0;
		stateGame.round = null;
		// cleared before the round is fetched, so a stop pressed while it is fetched still counts
		stateGame.skip = false;
	},
	onNewGameError: () => {},
	onPlayGame: async (bet) => await playBet(bet),
	checkIsBonusGame: () => false,
});

const intermediateMachines = createIntermediateMachines(primaryMachines);

export const gameActor = createGameActor(intermediateMachines);
