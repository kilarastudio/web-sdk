import _ from 'lodash';

import { type BookEventHandlerMap } from 'utils-book';
import { stateBet, stateConfig, stateUrlDerived } from 'state-shared';
import { waitForTimeout } from 'utils-shared/wait';

import { eventEmitter } from './eventEmitter';
import config from './config';
import { sound } from './sound';
import { stateGame, stateGameDerived } from './stateGame.svelte';
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
import type { BookEventContext, BookEvent, BookEventOfType } from './typesBookEvent';

// One number every 150 ms, 40 ms in turbo, at an even beat: holding the draw on hits made the
// rhythm irregular, which read as stutter (user, 2026-11-27), so a hit is marked by its token,
// its sound and the meter, not by a pause. The stop button shows the rest at once.
const DRAW_INTERVAL = 150;
const DRAW_INTERVAL_TURBO = 40;
const HOLD_AFTER_DRAW = 120;
const KILAU_MARK = 180;
const KILAU_MARK_TURBO = 90;
// a lucky round marks its 3 numbers one after another and gives them longer before the first
// ball, so the round reads as a different one
const KILAU_ROUND_STAGGER = 120;
const KILAU_ROUND_MARK = 900;
// the last ball, when one more hit would win ten times the round's cost or more: a held beat
const LAST_BALL_WAIT = 520;
const LAST_BALL_STAKES = 10;

// a wait between draws that the stop button cuts short
let cutShort = () => {};
const pause = async (ms: number) => {
	if (stateGame.skip || ms <= 0) return;
	await new Promise<void>((resolve) => {
		cutShort = resolve;
		waitForTimeout(ms).then(resolve);
	});
};

// The book's own numbers must give its draw order, run, lucky balls and multiplier; a board that does
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
			`Lucky balls ${last.kilauHits} vs ${bookEvent.kilauHits}`,
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

		const mode = modeName(bookEvent.level, bookEvent.picks as Picks);
		const { payTable, cost } = config.betModes[mode];
		const turbo = () => stateBet.isTurbo;

		stateGameDerived.showSelection();
		stateGame.win = null;
		stateGame.round = {
			mode,
			selected: shown.selected,
			kilau: [],
			kilauRound: !!bookEvent.kilauRound,
			drawn: [],
			pattern: [],
			draws: bookEvent.draws,
			hits: 0,
			kilauHits: 0,
			bestRun: 0,
			run: 0,
			current: 0,
			best: 0,
			waiting: false,
			done: false,
		};
		// the lucky numbers are marked on the board before the first ball: at once in an ordinary
		// round; in a lucky round one by one, and the first ball waits longer (KILAU_ROUND_MARK
		// from the first mark)
		const marks = _.sortBy(shown.kilau);
		if (stateGame.round.kilauRound && !turbo()) {
			for (const [i, n] of marks.entries()) {
				if (i > 0) await pause(KILAU_ROUND_STAGGER);
				stateGame.round!.kilau.push(n);
			}
			await pause(KILAU_ROUND_MARK - KILAU_ROUND_STAGGER * (marks.length - 1));
		} else {
			stateGame.round.kilau.push(...marks);
			await pause(turbo() ? KILAU_MARK_TURBO : KILAU_MARK);
		}

		for (const [i, n] of shown.numbers.entries()) {
			const round = stateGame.round!;
			const ball = bookEvent.pattern[i];
			if (i === shown.numbers.length - 1 && !turbo() && round.hits < round.selected.length) {
				const level = Math.max(round.bestRun, round.run + 1) + round.kilauHits;
				if (payTable[round.hits + 1] * ladderMultiplier(level) >= LAST_BALL_STAKES * cost) {
					round.waiting = true;
					await pause(LAST_BALL_WAIT);
					round.waiting = false;
				}
			}

			round.drawn.push(n);
			round.pattern.push(ball);
			Object.assign(round, steps[i]);
			if (!stateGame.skip) {
				if (ball === HIT) sound.hit(round.current);
				else if (ball === KILAU) sound.lucky();
				else sound.miss();
			}

			if (i === shown.numbers.length - 1) break;
			await pause(turbo() ? DRAW_INTERVAL_TURBO : DRAW_INTERVAL);
		}
		stateGame.round.done = true;
		await pause(HOLD_AFTER_DRAW);
	},
	finalWin: async (bookEvent: BookEventOfType<'finalWin'>) => {
		stateBet.winBookEventAmount = bookEvent.amount;
		if (!stateGame.round) return;
		const { cost, maxWin } = config.betModes[stateGame.round.mode];
		const times = bookEvent.amount / 100;
		const ratio = times / cost;
		if (!stateUrlDerived.replay()) stateGameDerived.addRecent(times, ratio);
		if (bookEvent.amount <= 0) return;
		await eventEmitter.broadcastAsync({
			type: 'winPresent',
			amount: bookEvent.amount,
			ratio,
			max: times >= maxWin,
		});
	},
};

// the stop button: the rest of the draw at once, where the jurisdiction allows it
export const skipDraw = () => {
	if (stateConfig.jurisdiction?.disabledSlamstop) return;
	stateGame.skip = true;
	cutShort();
};
