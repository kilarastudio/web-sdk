import { SECOND } from 'constants-shared/time';

// A win's level is measured against what the round cost (the base bet times the mode's cost), so
// a bought round celebrates what it paid back, not what it paid out. `above` is how many times the
// round's cost a win must pass to reach the level. MAX is not a multiple of the cost: it is the
// game's max win, reached in any mode.
//
// The five big levels are events of their own, each a step up from the last as the count climbs:
// its own panel (`tier`, drawn in src/pixel/ui.ts winPanel), music, landing sound, hit and burst
// of coins. Rarity in the base game, from the published books: BIG (10×) 1 in 78 spins, SUPER
// (30×) 1 in 363, MEGA (150×) 1 in 2,376, EPIC (1,000×) 1 in 26,322, MAX (25,000×) 1 in 2.55 m.
// A bought round reaches BIG and SUPER at about the same odds; its cost puts MEGA and up out of
// reach of the bigger buys, whose top wins end in MAX instead.
export const winLevelMap = {
	1: {
		level: 1,
		alias: 'zero',
		type: 'small',
		above: 0,
		text: null,
		presentDuration: 0,
		sound: { sfx: undefined, bgm: undefined },
		tier: undefined,
	},
	2: {
		level: 2,
		alias: 'standard',
		type: 'small',
		above: 0,
		text: null,
		presentDuration: 0.6 * SECOND,
		sound: { sfx: undefined, bgm: undefined },
		tier: undefined,
	},
	3: {
		level: 3,
		alias: 'small',
		type: 'small',
		above: 1,
		text: null,
		presentDuration: 1 * SECOND,
		sound: { sfx: undefined, bgm: undefined },
		tier: undefined,
	},
	4: {
		level: 4,
		alias: 'nice',
		type: 'medium',
		above: 2,
		text: null,
		presentDuration: 1.5 * SECOND,
		sound: { sfx: undefined, bgm: undefined },
		tier: undefined,
	},
	5: {
		level: 5,
		alias: 'substantial',
		type: 'medium',
		above: 5,
		text: null,
		presentDuration: 2.0 * SECOND,
		sound: { sfx: undefined, bgm: undefined },
		tier: undefined,
	},
	6: {
		level: 6,
		alias: 'big',
		type: 'big',
		above: 10,
		text: 'BIG WIN',
		presentDuration: 4 * SECOND,
		sound: { sfx: 'sfx_winlevel_big', bgm: 'bgm_winlevel_big' },
		tier: { art: 1, coins: 14, shake: 2 },
	},
	7: {
		level: 7,
		alias: 'superwin',
		type: 'big',
		above: 30,
		text: 'SUPER WIN',
		presentDuration: 8 * SECOND,
		sound: { sfx: 'sfx_winlevel_super', bgm: 'bgm_winlevel_superwin' },
		tier: { art: 2, coins: 24, shake: 3 },
	},
	8: {
		level: 8,
		alias: 'mega',
		type: 'big',
		above: 150,
		text: 'MEGA WIN',
		presentDuration: 12 * SECOND,
		sound: { sfx: 'sfx_winlevel_mega', bgm: 'bgm_winlevel_mega' },
		tier: { art: 3, coins: 36, shake: 4 },
	},
	9: {
		level: 9,
		alias: 'epic',
		type: 'big',
		above: 1000,
		text: 'EPIC WIN!',
		presentDuration: 16 * SECOND,
		sound: { sfx: 'sfx_winlevel_epic', bgm: 'bgm_winlevel_epic' },
		tier: { art: 4, coins: 48, shake: 5 },
	},
	10: {
		level: 10,
		alias: 'max',
		type: 'big',
		above: Infinity,
		text: 'MAX WIN',
		presentDuration: 16 * SECOND,
		sound: { sfx: 'sfx_winlevel_max', bgm: 'bgm_winlevel_max' },
		tier: { art: 5, coins: 72, shake: 6 },
	},
} as const;

export type WinLevelMap = typeof winLevelMap;
export type WinLevel = keyof typeof winLevelMap;
export type WinLevelData = WinLevelMap[WinLevel];
export type WinLevelAlias = WinLevelData['alias'];
export type BigWinLevelData = Extract<WinLevelData, { type: 'big' }>;

const LEVELS = Object.values(winLevelMap);
const BIG_LEVELS = LEVELS.filter((data): data is BigWinLevelData => data.type === 'big');
const MAX = winLevelMap[10];

// amounts are book amounts; cost is the round's cost and maxWin the game's max win, both in book
// amounts too
export const winLevelFor = ({
	amount,
	cost,
	maxWin,
}: {
	amount: number;
	cost: number;
	maxWin: number;
}): WinLevelData => {
	if (amount <= 0) return winLevelMap[1];
	if (amount >= maxWin) return MAX;

	return LEVELS.findLast((data) => amount > data.above * cost) ?? winLevelMap[2];
};

// How a big win's count climbs: one stage for each big level it passes, all the same length. The
// panel lands as BIG at once, and each stage counts up to where the next level starts, faster as
// it nears it, so each new level arrives on a rush; the last stage eases into the amount. A max
// win climbs the levels its amount passes, and MAX lands when the count is full.
const STAGE = 4 * SECOND;

export const winClimb = ({
	amount,
	cost,
	level,
}: {
	amount: number;
	cost: number;
	level: WinLevelData;
}) => {
	// `level` may be a copy (held in component state), so levels are compared by number
	const starts = BIG_LEVELS.filter((data) => data.level < MAX.level && data.level <= level.level)
		.map((data, index) => ({ data, from: index === 0 ? 0 : data.above * cost }))
		.filter(({ from }) => from < amount);
	const bounds = [...starts.map(({ from }) => from), amount];
	const count = Math.max(1, starts.length);

	return {
		// the levels the count lands on, in order
		levels: [
			...starts.map(({ data }) => data),
			...(level.level === MAX.level ? [MAX] : []),
		] as BigWinLevelData[],
		duration: count * STAGE,
		// the share of the amount shown at a share of the duration
		easing: (t: number) => {
			if (t >= 1 || amount <= 0) return 1;
			const index = Math.min(count - 1, Math.floor(t * count));
			const local = t * count - index;
			const last = index === count - 1;
			const eased = last ? 1 - (1 - local) ** 3 : local * local;

			return (bounds[index] + (bounds[index + 1] - bounds[index]) * eased) / amount;
		},
		// the big level shown at a point of the count
		levelAt: ({ shown, completed }: { shown: number; completed: boolean }): BigWinLevelData =>
			completed && level.level === MAX.level
				? MAX
				: (starts.findLast(({ from }) => shown >= from)?.data ?? BIG_LEVELS[0]),
	};
};
