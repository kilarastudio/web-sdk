import type { SkeletonData } from 'components-pixi';
import { SYMBOL_SIZE } from './constants';

// No rig yet: an empty skeleton draws nothing and its one-shot animations complete at once.
export const glintSkeleton: SkeletonData = {
	format: 'kilara-skeleton',
	version: 1,
	name: 'glint',
	bounds: { x: 0, y: 0, width: 1, height: 1 },
	bones: [],
	slots: [],
	skins: { default: {} },
	animations: {},
};

export const GLINT_LIGHT_DURATION_MS = 400;
export const GLINT_ANIMATION_MS = {
	prime: 300,
	apply: 500,
	light: GLINT_LIGHT_DURATION_MS,
	double: 350,
	tier_up: 500,
} as const;
export const GLINT_TIERS = {
	1: { tile: 'glintTile1', skin: 't1', color: 0x4fd1c5 },
	2: { tile: 'glintTile2', skin: 't2', color: 0xffc53d },
	3: { tile: 'glintTile3', skin: 't3', color: 0xff8a3d },
	4: { tile: 'glintTile4', skin: 't4', color: 0xff4fa3 },
} as const;
export type GlintTier = keyof typeof GLINT_TIERS;
export type GlintAnimation = keyof typeof GLINT_ANIMATION_MS;
export const glintTier = (value: number): GlintTier =>
	value >= 128 ? 4 : value >= 32 ? 3 : value >= 8 ? 2 : 1;

// Expand leftward for longer values, keeping the same right edge and font size.
// Tier 1 retains the approved placement; ×128/×256 use the top edge of the tile.
export const glintMultiplierLayout = (value: number) => {
	const maxWidth = SYMBOL_SIZE * (value >= 100 ? 0.74 : value >= 10 ? 0.6 : 0.42);
	return {
		x: SYMBOL_SIZE * 0.44 - maxWidth / 2,
		y: -SYMBOL_SIZE * 0.32,
		fontSize: SYMBOL_SIZE * 0.3,
		maxWidth,
	};
};

export type GlintCellPosition = { reel: number; row: number };
export type GlintChange = GlintCellPosition & {
	from: number;
	to: number;
	animation: GlintAnimation;
};

// Prime only 0 → 1. Directly initialized lit boards, unchanged values, and
// resets do not replay an upgrade. A strike may skip to the authoritative tier.
export const glintChanges = (previous: number[][], next: number[][]): GlintChange[] =>
	next.flatMap((column, reel) =>
		column.flatMap((to, row): GlintChange[] => {
			const from = previous[reel]?.[row] ?? 0;
			if (from === 0 && to === 1) return [{ reel, row, from, to, animation: 'prime' }];
			if (from < 1 || to < 2 || to <= from) return [];
			const animation =
				from === 1 ? 'light' : glintTier(to) > glintTier(from) ? 'tier_up' : 'double';
			return [{ reel, row, from, to, animation }];
		}),
	);
