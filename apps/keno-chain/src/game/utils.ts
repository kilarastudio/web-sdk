import { stateBet, stateBetDerived } from 'state-shared';
import { createPlayBookUtils } from 'utils-book';
import { waitForTimeout } from 'utils-shared/wait';

import { eventEmitter } from './eventEmitter';
import { stateGame } from './stateGame.svelte';
import type { Bet } from './typesBookEvent';
import { bookEventHandlerMap } from './bookEventHandlerMap';

const { playBookEvents } = createPlayBookUtils({ bookEventHandlerMap });

const REST_AFTER_ROUND = 300;
const REST_AFTER_WIN = 700;

export const playBet = async (bet: Bet) => {
	stateBet.winBookEventAmount = 0;
	await playBookEvents(bet.state);
	// Autoplay, or Space held, starts the next round by itself: the finished board rests first,
	// long enough to be read (longer when it won), so one round does not cut into the next. A
	// single press needs no rest: the player starts the next round when they have seen this one.
	if (stateBetDerived.isContinuousBet() && !stateGame.skip) {
		const rest = stateGame.win ? REST_AFTER_WIN : REST_AFTER_ROUND;
		await waitForTimeout(stateBet.isTurbo ? rest / 2 : rest);
	}
	stateGame.resuming = false;
	stateGame.skip = false;
	eventEmitter.broadcast({ type: 'stopButtonEnable' });
};
