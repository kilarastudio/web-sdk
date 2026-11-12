// The torches painted into the backgrounds (static/assets/backgrounds) have no flame of their
// own: the game draws it, moving, on each cup. Places and sizes are in the background's own art
// pixels: x is the middle of the cup, y its top edge, where the flame stands; width and height are
// the flame's canvas, which the flame itself fills about halfway on average, flaring higher. The bonus hall burns higher.
export type Torch = { x: number; y: number; width: number; height: number };

export const TORCHES: Record<'Landscape' | 'Portrait', Record<'base' | 'bonus', Torch[]>> = {
	Landscape: {
		base: [
			{ x: 71.5, y: 118, width: 22, height: 60 },
			{ x: 504.5, y: 118, width: 22, height: 60 },
		],
		bonus: [
			{ x: 64.5, y: 118, width: 38, height: 72 },
			{ x: 510.5, y: 118, width: 38, height: 72 },
		],
	},
	Portrait: {
		base: [
			{ x: 45.5, y: 58, width: 24, height: 60 },
			{ x: 278.5, y: 58, width: 24, height: 60 },
		],
		bonus: [
			{ x: 42.5, y: 58, width: 30, height: 66 },
			{ x: 280, y: 58, width: 30, height: 66 },
		],
	},
};

export const flameKey = ({ width, height }: Torch) => `flame${width}x${height}`;

// every flame size the backgrounds need, once each
export const FLAME_SIZES = [
	...new Map(
		Object.values(TORCHES)
			.flatMap((halls) => Object.values(halls).flat())
			.map((torch) => [flameKey(torch), [torch.width, torch.height] as const]),
	).values(),
];
