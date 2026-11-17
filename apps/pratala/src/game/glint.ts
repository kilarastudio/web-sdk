import { SYMBOL_SIZE } from './constants';

export const GLINT_LIGHT_DURATION_MS = 520;
export const GLINT_ANIMATION_MS = {
	prime: 300,
	apply: 500,
	light: GLINT_LIGHT_DURATION_MS,
	double: 420,
	tier_up: 620,
} as const;
// What the math sets (math-sdk/games/pratala/game_config.py): a win doubles a lit spot up to
// GLINT_WIN_CAP, the dragon's gaze doubles it up to GLINT_CAP, SUPER and HOARD start free spins
// with every spot lit at these values, and so does a trigger of six or more scatters.
export const GLINT_CAP = 4096;
export const GLINT_WIN_CAP = 8;
export const MODE_START_GLINT = { super: 8, hoard: 4 } as const;
export const SIX_SCATTER_START_GLINT = 128;
// The four tiers follow RPG rarity colours (rare blue, epic violet, legendary orange, mythic red),
// so a brighter tier reads as a rarer one at a glance. Tiles are drawn by src/pixel/ui.ts. The
// twelve values from ×2 to ×4,096 are shared three per tier: ×2–×8, ×16–×64, ×128–×512, ×1,024+.
export const GLINT_TIERS = {
	1: { tile: 'glintTile1', color: 0x00cdf9, flash: 0x94fdff },
	2: { tile: 'glintTile2', color: 0xdb3ffd, flash: 0xfdd2ed },
	3: { tile: 'glintTile3', color: 0xffa214, flash: 0xffeb57 },
	4: { tile: 'glintTile4', color: 0xff0040, flash: 0xffffff },
} as const;
export type GlintTier = keyof typeof GLINT_TIERS;
export type GlintAnimation = keyof typeof GLINT_ANIMATION_MS;
export const glintTier = (value: number): GlintTier =>
	value >= 1024 ? 4 : value >= 128 ? 3 : value >= 16 ? 2 : 1;

// The value stands centred low in the cell, its foot two art pixels (of 64 to a cell) above the
// cell's bottom edge, over the symbol's foot (src/pixel/glintArt.ts draws it, ~17 art pixels
// tall); the same on an empty cell. x and y are its foot's middle from the cell's middle.
export const GLINT_VALUE_FOOT = { x: 0, y: SYMBOL_SIZE * (30 / 64) };
// where a value's middle stands, for what flies from it (GlintEffects)
export const glintMultiplierLayout = () => ({
	x: GLINT_VALUE_FOOT.x,
	y: GLINT_VALUE_FOOT.y - SYMBOL_SIZE * (8.5 / 64),
});

export type GlintCellPosition = { reel: number; row: number };
export type GlintChange = GlintCellPosition & {
	from: number;
	to: number;
	animation: GlintAnimation;
};

// Prime only 0 → 1. Unchanged values and resets do not replay an upgrade. A spot that lights,
// from primed or from nothing (a strike), catches fire from inside, at whatever tier it lands
// on. SUPER, HOARD and a six-scatter trigger light the whole board the same way, every spot at once.
export const glintChanges = (previous: number[][], next: number[][]): GlintChange[] =>
	next.flatMap((column, reel) =>
		column.flatMap((to, row): GlintChange[] => {
			const from = previous[reel]?.[row] ?? 0;
			if (from === 0 && to === 1) return [{ reel, row, from, to, animation: 'prime' }];
			if (to < 2 || to <= from) return [];
			const animation =
				from <= 1 ? 'light' : glintTier(to) > glintTier(from) ? 'tier_up' : 'double';
			return [{ reel, row, from, to, animation }];
		}),
	);

// The dragon's gaze comes down a reel one row at a time, and each spot doubles as it is reached.
export const GAZE_ROW_MS = 80;
export const GAZE_FADE_MS = 260;

// A gaze as the passes the player sees: every gazed reel once, then again the reels gazed at
// twice (two scatters on one reel). A reel's last pass lands on the book's own value.
export const gazePasses = (previous: number[][], reels: number[], final: number[][]) => {
	const times = new Map<number, number>();
	reels.forEach((reel) => times.set(reel, (times.get(reel) ?? 0) + 1));
	const double = (value: number) => (value < 2 ? 2 : Math.min(GLINT_CAP, value * 2));
	let current = previous.map((column) => [...column]);

	return Array.from({ length: Math.max(0, ...times.values()) }, (_, pass) => {
		const gazed = [...times].filter(([, count]) => count > pass).map(([reel]) => reel);
		current = current.map((column, reel) =>
			!gazed.includes(reel)
				? column
				: times.get(reel) === pass + 1
					? [...(final[reel] ?? column)]
					: column.map(double),
		);

		return { reels: gazed.sort((a, b) => a - b), glint: current };
	});
};
