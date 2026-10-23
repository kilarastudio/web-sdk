import { stateBet, type BetToResume } from './stateBet.svelte';

export const stateReplay = $state({
	bet: null as BetToResume,
	costMultiplier: 1,
	phase: 'ready' as 'ready' | 'playing' | 'finished',
});

export const stateReplayDerived = {
	prepare: (bet: NonNullable<BetToResume>, costMultiplier: number) => {
		stateReplay.bet = structuredClone(bet);
		stateReplay.costMultiplier = costMultiplier;
		stateReplay.phase = 'ready';
		stateBet.betToResume = null;
	},
	start: () => {
		if (!stateReplay.bet || stateReplay.phase === 'playing') return false;
		stateBet.betToResume = structuredClone($state.snapshot(stateReplay.bet));
		stateBet.winBookEventAmount = 0;
		stateReplay.phase = 'playing';
		return true;
	},
};
