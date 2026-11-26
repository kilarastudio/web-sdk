import { type BookEventHandlerMap } from 'utils-book';
import { stateBet, stateBetDerived, stateConfig, stateUrlDerived } from 'state-shared';
import { waitForTimeout } from 'utils-shared/wait';

import { eventEmitter } from './eventEmitter';
import { stateGame } from './stateGame.svelte';
import {
	HIT,
	KILAU,
	MISS,
	ladderMultiplier,
	modeName,
	relabel,
	streakSteps,
	type Picks,
} from './keno';
import { winLevel } from './winLevel';
import type { BookEventContext, BookEvent, BookEventOfType } from './typesBookEvent';

// one number every 250 ms, twice as fast in turbo; the stop button shows the rest at once
const DRAW_INTERVAL = 250;
const HOLD_AFTER_DRAW = 300;
const KILAU_MARK = 450;

// a wait between draws that the stop button cuts short
let cutShort = () => {};
const pause = async (ms: number) => {
	if (stateGame.skip) return;
	await new Promise<void>((resolve) => {
		cutShort = resolve;
		waitForTimeout(ms / stateBetDerived.timeScale()).then(resolve);
	});
};

// The book's own numbers must give its draw order, run, Kilau balls and multiplier; a board that does
// not is a bug in this file, not a round to show.
const check = (
	bookEvent: BookEventOfType<'draw'>,
	shown: { selected: number[]; kilau: number[]; numbers: number[] },
) => {
	const ball = (n: number) =>
		shown.selected.includes(n) ? HIT : shown.kilau.includes(n) ? KILAU : MISS;
	const steps = streakSteps(bookEvent.level, bookEvent.pattern);
	const last = steps[steps.length - 1];
	const problems = [
		shown.numbers.some((n, i) => ball(n) !== bookEvent.pattern[i]) &&
			'balls on the board differ from the pattern',
		shown.numbers.filter((n) => shown.selected.includes(n)).length !== bookEvent.hits &&
			'hit count differs',
		last.bestRun !== bookEvent.streak && `run ${last.bestRun} vs ${bookEvent.streak}`,
		last.kilauHits !== bookEvent.kilauHits &&
			`Kilau balls ${last.kilauHits} vs ${bookEvent.kilauHits}`,
		ladderMultiplier(last.best) !== bookEvent.multiplier &&
			`multiplier ${ladderMultiplier(last.best)} vs ${bookEvent.multiplier}`,
	].filter(Boolean);
	if (problems.length) console.error('draw does not match its book', problems, bookEvent);
	return steps;
};

export const bookEventHandlerMap: BookEventHandlerMap<BookEvent, BookEventContext> = {
	draw: async (bookEvent: BookEventOfType<'draw'>) => {
		// A replay, or a round resumed after a reload, does not know the player's numbers: it shows
		// the book's own board. Live play relabels the book onto the player's numbers.
		const bookBoard = stateUrlDerived.replay() || stateGame.resuming;
		const shown = bookBoard
			? { selected: bookEvent.selected, kilau: bookEvent.kilau, numbers: bookEvent.numbers }
			: relabel(bookEvent, stateGame.picked);
		const steps = check(bookEvent, shown);

		stateGame.round = {
			mode: modeName(bookEvent.level, bookEvent.picks as Picks),
			selected: shown.selected,
			kilau: shown.kilau,
			drawn: [],
			pattern: [],
			draws: bookEvent.draws,
			hits: 0,
			kilauHits: 0,
			bestRun: 0,
			current: 0,
			best: 0,
			done: false,
		};
		// the Kilau numbers are marked on the board before the first ball
		await pause(KILAU_MARK);
		for (const [i, n] of shown.numbers.entries()) {
			if (i > 0) await pause(DRAW_INTERVAL);
			const round = stateGame.round!;
			round.drawn.push(n);
			round.pattern.push(bookEvent.pattern[i]);
			Object.assign(round, steps[i]);
		}
		stateGame.round.done = true;
		await pause(HOLD_AFTER_DRAW);
	},
	finalWin: async (bookEvent: BookEventOfType<'finalWin'>) => {
		stateBet.winBookEventAmount = bookEvent.amount;
		if (bookEvent.amount <= 0 || !stateGame.round) return;
		await eventEmitter.broadcastAsync({
			type: 'winPresent',
			amount: bookEvent.amount,
			level: winLevel(bookEvent.amount, stateGame.round.mode),
		});
	},
};

// the stop button: the rest of the draw at once, where the jurisdiction allows it
export const skipDraw = () => {
	if (stateConfig.jurisdiction?.disabledSlamstop) return;
	stateGame.skip = true;
	cutShort();
};
