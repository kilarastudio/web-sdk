import _ from 'lodash';

import config from './config';

// The rules the frontend needs, as math-sdk/games/keno_chain/readme.txt states them. Nothing
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

// the pick sizes a level is played with (config.levelPicks: Calm, Bold and Wild play 3, 4, 5, 6, 8
// or 10 numbers, the premium levels 10 only)
export const levelPicks = (level: Level) => config.levelPicks[level] as readonly Picks[];

// only modes the math publishes may reach the RGS: no level plays 1, 2, 7 or 9 numbers
export const isMode = (level: Level, picks: number) =>
	modeName(level, picks as Picks) in config.betModes;

// what a drawn ball is, as the book's pattern writes it. "Kilau" is the math's and this code's
// name for what the player reads as a lucky number: a marked number they did not pick.
export const MISS = 0;
export const HIT = 1;
export const KILAU = 2;

// The multiplier of a meter level: level 0 and 1 are ×1, every level above the ladder's top
// pays the top.
export const ladderMultiplier = (level: number) =>
	level < 1 ? 1 : config.ladder[Math.min(level, config.ladder.length) - 1];

type Board = { selected: number[]; kilau: number[]; numbers: number[] };

// Live play: the player's numbers stand in for the book's. The i-th smallest of the book's
// "selected" becomes the player's i-th smallest pick, and the i-th smallest of the book's other
// numbers the i-th smallest number the player did not pick. A relabelling of the board: the
// lucky numbers are among the other numbers and move with them. The draw order, hits, lucky
// balls and win are the book's.
export const relabel = (book: Board, picked: number[]): Board => {
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
// lowers it by one, never below zero. A lucky ball leaves the run and adds one step for the rest
// of the round. The meter level is the run plus the lucky balls so far; the best run plus the
// Lucky balls sets the multiplier.
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
			run,
			// a round with no hit yet has nothing to multiply: the meter stays empty
			current: hits ? run + kilauHits : 0,
			best: hits ? bestRun + kilauHits : 0,
		};
	});
};

// The highest meter level a round can reach: every pick hit in a row plus every lucky ball. With
// a mode's usual count of lucky numbers it is what an ordinary round reaches, with kilauMost a lucky round.
export const topLevel = (picks: number, kilau: number) =>
	Math.min(picks + kilau, config.ladder.length);

// The hits that make the run in play, and those of the best run so far (the chain that sets the
// multiplier), from the numbers drawn and what each ball was. A lucky ball leaves both alone.
export const chains = (level: Level, drawn: number[], pattern: number[]) => {
	let chain: number[] = [];
	let best: number[] = [];

	drawn.forEach((n, i) => {
		if (pattern[i] === HIT) {
			chain = [...chain, n];
			if (chain.length > best.length) best = chain;
		} else if (pattern[i] === MISS) {
			chain = isPremium(level) ? chain.slice(1) : [];
		}
	});
	return { chain, best };
};

// Which balls of the draw are joined to the one before them: a hit or a lucky ball that follows a
// hit with no miss between.
export const linked = (pattern: number[]) => {
	let alive = false;
	return pattern.map((ball) => {
		const link = ball !== MISS && alive;
		if (ball === HIT) alive = true;
		if (ball === MISS) alive = false;
		return link;
	});
};

// How many numbers the level plays when this many are picked: the count itself where the level
// plays it, else the next size up that it does (7 picked is on the way to 8, 1 to 3), and its
// largest size above that.
export const playedSize = (level: Level, count: number) => {
	const sizes = levelPicks(level);
	return sizes.find((size) => size >= count) ?? sizes[sizes.length - 1];
};

// A fresh set of numbers, as many as are picked now, or the next size the level plays (7 picked
// gives 8); with none picked, the level's usual 10. This chooses numbers to play, not an outcome,
// so it may be random.
export const randomPick = (level: Level, count: number) => {
	const sizes = levelPicks(level);
	const size = count === 0 || isPremium(level) ? sizes[sizes.length - 1] : playedSize(level, count);
	return _.shuffle(NUMBERS).slice(0, size);
};
