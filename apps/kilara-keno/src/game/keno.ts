import _ from 'lodash';

import config from './config';

// The rules the frontend needs, as math-sdk/games/kilara_keno/readme.txt states them. Nothing
// here decides an outcome: the books do. This only names modes, relabels a book's board onto the
// player's numbers and replays the meter from a book's draw order.

export type Level = (typeof config.levels)[number];
export type Picks = (typeof config.pickSizes)[number];
export type ModeName = keyof typeof config.betModes;

export const NUMBERS = _.range(1, config.boardNumbers + 1);

export const modeName = (level: Level, picks: Picks) => `${level}_${picks}` as ModeName;

export const parseMode = (key: string): { level: Level; picks: Picks } | null => {
	const mode = config.betModes[key.toLowerCase() as ModeName];
	return mode ? { level: mode.level as Level, picks: mode.picks as Picks } : null;
};

// Chain and Chain Max: above 1×, armed through a confirmation, and a miss lowers the run by one.
export const isPremium = (level: Level) =>
	(config.premiumLevels as readonly string[]).includes(level);

// the pick sizes a level is played with: Low and High 2 to 10, the premium levels 10 only
export const levelPicks = (level: Level) => config.levelPicks[level] as readonly Picks[];

// what a drawn ball is, as the book's pattern writes it
export const MISS = 0;
export const HIT = 1;
export const KILAU = 2;

// The multiplier of a meter level: level 0 and 1 are ×1, every level above the ladder's top
// pays the top.
export const ladderMultiplier = (level: number) =>
	level < 1 ? 1 : config.ladder[Math.min(level, config.ladder.length) - 1];

// Live play: the player's numbers stand in for the book's. The i-th smallest of the book's
// "selected" becomes the player's i-th smallest pick, and the i-th smallest of the book's other
// numbers the i-th smallest number the player did not pick. A relabelling of the board: the
// Kilau numbers are among the other numbers and move with them. The draw order, hits and win
// are the book's.
export const relabel = (
	book: { selected: number[]; kilau: number[]; numbers: number[] },
	picked: number[],
): { selected: number[]; kilau: number[]; numbers: number[] } => {
	const bookSelected = _.sortBy(book.selected);
	const playerSelected = _.sortBy(picked);
	if (bookSelected.length !== playerSelected.length) {
		throw new Error(`relabel: the book picks ${bookSelected.length}, the player ${picked.length}`);
	}
	const bookOther = NUMBERS.filter((n) => !bookSelected.includes(n));
	const playerOther = NUMBERS.filter((n) => !playerSelected.includes(n));
	const map = new Map<number, number>([
		...bookSelected.map((n, i) => [n, playerSelected[i]] as const),
		...bookOther.map((n, i) => [n, playerOther[i]] as const),
	]);

	return {
		selected: playerSelected,
		kilau: book.kilau.map((n) => map.get(n)!),
		numbers: book.numbers.map((n) => map.get(n)!),
	};
};

// The meter after each ball, from the round's draw order. Low and High: the run is the hits drawn
// one after another, a miss ends it. Chain and Chain Max: a hit raises the run by one, a miss
// lowers it by one, never below zero. A Kilau ball leaves the run and adds one step for the rest
// of the round. The meter level is the run plus the Kilau balls so far; the best run plus the
// Kilau balls sets the multiplier.
export const streakSteps = (level: Level, pattern: number[]) => {
	let run = 0;
	let bestRun = 0;
	let hits = 0;
	let kilauHits = 0;

	return pattern.map((ball) => {
		if (ball === HIT) {
			hits += 1;
			run += 1;
		} else if (ball === KILAU) {
			kilauHits += 1;
		} else {
			run = isPremium(level) ? Math.max(0, run - 1) : 0;
		}
		bestRun = Math.max(bestRun, run);
		return {
			hits,
			kilauHits,
			bestRun,
			// a round with no hit yet has nothing to multiply: the meter stays empty
			current: hits ? run + kilauHits : 0,
			best: hits ? bestRun + kilauHits : 0,
		};
	});
};

// The highest meter level a mode can reach: every pick hit in a row plus every Kilau ball.
export const topLevel = (picks: number, kilau: number) =>
	Math.min(picks + kilau, config.ladder.length);

// Fills the slots left with numbers the player has not picked; with no slot left, a fresh set.
// This chooses numbers to play, not an outcome, so it may be random.
export const quickPick = (picked: number[], picks: number) => {
	const keep = picked.length >= picks ? [] : picked;
	const free = _.shuffle(NUMBERS.filter((n) => !keep.includes(n)));
	return [...keep, ...free.slice(0, picks - keep.length)];
};
