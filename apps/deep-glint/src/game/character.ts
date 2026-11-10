import type { SkeletonData } from 'components-pixi';

// No rig yet: an empty skeleton draws nothing and its one-shot animations complete at once.
export const characterSkeleton: SkeletonData = {
	format: 'kilara-skeleton',
	version: 1,
	name: 'character',
	bounds: { x: 0, y: 0, width: 1, height: 1 },
	bones: [],
	slots: [],
	skins: { default: {} },
	animations: {},
};

// idle and anticipation loop; bigWin loops until the celebration ends; the rest play once
export const CHARACTER_LOOPS = {
	idle: true,
	anticipation: true,
	power: false,
	win: false,
	bigWin: true,
	bonus: false,
} as const;
// rig v1 blends poses over 0.14 s
export const CHARACTER_MIX = 0.14;
