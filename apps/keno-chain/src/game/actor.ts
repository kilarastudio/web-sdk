import { stateBet, stateUrlDerived } from 'state-shared';
import { createPrimaryMachines, createIntermediateMachines, createGameActor } from 'utils-xstate';

import type { Bet } from './typesBookEvent';
import { playBet } from './utils';
import { loadPicks, savePicks } from './roundPicks';
import { stateGame, stateGameDerived } from './stateGame.svelte';
import { sound } from './sound';

// A keno round is one draw: no bonus rounds, nothing to rebuild on resume.
const primaryMachines = createPrimaryMachines<Bet>({
	onResumeGameActive: (betToResume) => {
		// The RGS does not know the player's numbers. Where this session kept them (roundPicks) the
		// resumed round plays on them; otherwise it shows the book's board.
		const picks = stateUrlDerived.replay() ? null : loadPicks(betToResume);
		if (picks) stateGame.picked = picks;
		stateGame.resuming = !picks;
		return betToResume;
	},
	onResumeGameInactive: () => {},
	onNewGameStart: async () => {
		stateBet.winBookEventAmount = 0;
		stateGame.round = null;
		// the last round's win leaves with its board, at the press, not when the next draw arrives
		stateGame.win = null;
		// cleared before the round is fetched, so a stop pressed while it is fetched still counts
		stateGame.skip = false;
		// the round's first sound: at the press, or by itself in autoplay
		sound.start();
		// autoplay with a fresh set each round picks it here, before the round is asked for
		stateGameDerived.autoPick();
		// the numbers this round plays, kept for a reload before the round is asked for (roundPicks)
		savePicks(stateBet.activeBetModeKey, stateGame.picked);
	},
	onNewGameError: () => {},
	onPlayGame: async (bet) => await playBet(bet),
	checkIsBonusGame: () => false,
});

const intermediateMachines = createIntermediateMachines(primaryMachines);

export const gameActor = createGameActor(intermediateMachines);
