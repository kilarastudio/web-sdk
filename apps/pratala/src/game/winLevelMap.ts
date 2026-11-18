import { SECOND } from 'constants-shared/time';
import { i18nKey } from 'utils-shared/i18n';

// A win's level is measured against the base bet, in every mode, as the math's own winLevel is:
// a free spin that pays 160x the bet is a MEGA WIN whether the bonus came from the reels or was
// bought (the user, 2026-11-18). `above` is how many times the base bet a win must pass to reach
// the level. MAX is not a multiple of the bet: it is the game's max win, reached in any mode.
//
// The five big levels are events of their own, each a step up from the last as the count climbs:
// its own panel (`tier`, drawn in src/pixel/ui.ts winPanel), music, landing sound, hit and burst
// of coins. Rarity in the base game, from the published books: BIG (10x) 1 in 80 spins, SUPER
// (25x) 1 in 240, MEGA (75x) 1 in 800, EPIC (250x) 1 in 4,900. A bought bonus shows 1.5 (BONUS)
// to 2.7 (HOARD) big wins of single free spins on average, so those climb quicker (winClimb).
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
		text: i18nKey('BIG WIN'),
		presentDuration: 4 * SECOND,
		sound: { sfx: 'sfx_winlevel_big', bgm: 'bgm_winlevel_big' },
		tier: { art: 1, coins: 14, shake: 2 },
	},
	7: {
		level: 7,
		alias: 'superwin',
		type: 'big',
		above: 25,
		text: i18nKey('SUPER WIN'),
		presentDuration: 8 * SECOND,
		sound: { sfx: 'sfx_winlevel_super', bgm: 'bgm_winlevel_superwin' },
		tier: { art: 2, coins: 24, shake: 3 },
	},
	8: {
		level: 8,
		alias: 'mega',
		type: 'big',
		above: 75,
		text: i18nKey('MEGA WIN'),
		presentDuration: 12 * SECOND,
		sound: { sfx: 'sfx_winlevel_mega', bgm: 'bgm_winlevel_mega' },
		tier: { art: 3, coins: 36, shake: 4 },
	},
	9: {
		level: 9,
		alias: 'epic',
		type: 'big',
		above: 250,
		text: i18nKey('EPIC WIN!'),
		presentDuration: 16 * SECOND,
		sound: { sfx: 'sfx_winlevel_epic', bgm: 'bgm_winlevel_epic' },
		tier: { art: 4, coins: 48, shake: 5 },
	},
	10: {
		level: 10,
		alias: 'max',
		type: 'big',
		above: Infinity,
		text: i18nKey('MAX WIN'),
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

// How a big win's count climbs. The panel lands as BIG at once and the count bursts up to where
// BIG starts; then one stage for each big level it passes, all the same length, each counting up
// to where the next level starts, faster as it nears it, so each new level arrives on a rush; the
// last stage eases into the amount. A max win climbs the levels its amount passes, and MAX lands
// when the count is full. A single free spin's big win climbs quicker (`quick`): the bonus goes on.
const CLIMB = { burst: 0.6 * SECOND, stage: 4 * SECOND };
const QUICK_CLIMB = { burst: 0.3 * SECOND, stage: 1.5 * SECOND };

export const winClimb = ({
	amount,
	cost,
	level,
	quick = false,
}: {
	amount: number;
	cost: number;
	level: WinLevelData;
	quick?: boolean;
}) => {
	const { burst, stage } = quick ? QUICK_CLIMB : CLIMB;
	// `level` may be a copy (held in component state), so levels are compared by number
	const starts = BIG_LEVELS.filter((data) => data.level < MAX.level && data.level <= level.level)
		.map((data) => ({ data, from: data.above * cost }))
		.filter(({ from }) => from < amount);
	// the burst from nothing to where BIG starts, then the stages
	const opening = Math.min(amount, BIG_LEVELS[0].above * cost);
	const segments = [
		{ from: 0, to: opening, duration: burst, ease: (t: number) => 1 - (1 - t) ** 2 },
		...starts.map(({ from }, index) => {
			const last = index === starts.length - 1;
			return {
				from,
				to: last ? amount : starts[index + 1].from,
				duration: stage,
				ease: last ? (t: number) => 1 - (1 - t) ** 3 : (t: number) => t * t,
			};
		}),
	];
	const duration = segments.reduce((sum, { duration }) => sum + duration, 0);

	return {
		// the levels the count lands on, in order
		levels: [
			...starts.map(({ data }) => data),
			...(level.level === MAX.level ? [MAX] : []),
		] as BigWinLevelData[],
		duration,
		// the share of the amount shown at a share of the duration
		easing: (t: number) => {
			if (t >= 1 || amount <= 0) return 1;
			let at = t * duration;
			for (const segment of segments) {
				if (at < segment.duration) {
					const value =
						segment.from + (segment.to - segment.from) * segment.ease(at / segment.duration);
					return value / amount;
				}
				at -= segment.duration;
			}
			return 1;
		},
		// the big level shown at a point of the count
		levelAt: ({ shown, completed }: { shown: number; completed: boolean }): BigWinLevelData =>
			completed && level.level === MAX.level
				? MAX
				: (starts.findLast(({ from }) => shown >= from)?.data ?? BIG_LEVELS[0]),
	};
};
