// The torches painted into the backgrounds (static/assets/backgrounds) have no flame of their
// own: the game draws it, moving, on each cup. Places and sizes are in the background's own art
// pixels: x is the middle of the cup, y its top edge, where the flame stands; width and height are
// the flame's canvas, which the flame itself fills about halfway on average, flaring higher. The bonus hall burns higher.
import { FLAME_LIGHT } from '../pixel/textures';

// `floor` is the pool the torch throws on the floor in front of it: its middle's height and its
// size across and deep, in the background's art pixels
export type Torch = {
	x: number;
	y: number;
	width: number;
	height: number;
	floor: { y: number; width: number; height: number };
};

// the floor's flagstones start about art y 280 in the wide hall and 450 in the tall one; the tall
// hall's torches stand at the screen's edges, so their pools reach in under the board
const LANDSCAPE_FLOOR = { y: 296, width: 240, height: 64 };
const PORTRAIT_FLOOR = { y: 505, width: 330, height: 110 };

export const TORCHES: Record<'Landscape' | 'Portrait', Record<'base' | 'bonus', Torch[]>> = {
	Landscape: {
		base: [
			{ x: 124, y: 185, width: 24, height: 64, floor: LANDSCAPE_FLOOR },
			{ x: 514, y: 185, width: 24, height: 64, floor: LANDSCAPE_FLOOR },
		],
		bonus: [
			{ x: 124, y: 185, width: 38, height: 78, floor: LANDSCAPE_FLOOR },
			{ x: 514, y: 185, width: 38, height: 78, floor: LANDSCAPE_FLOOR },
		],
	},
	Portrait: {
		base: [
			{ x: 33, y: 138, width: 20, height: 54, floor: PORTRAIT_FLOOR },
			{ x: 335, y: 138, width: 20, height: 54, floor: PORTRAIT_FLOOR },
		],
		bonus: [
			{ x: 33, y: 147, width: 28, height: 64, floor: PORTRAIT_FLOOR },
			{ x: 330, y: 147, width: 28, height: 64, floor: PORTRAIT_FLOOR },
		],
	},
};

export const flameKey = ({ width, height }: Torch) => `flame${width}x${height}`;
export const sootKey = ({ width, height }: Torch) => `soot${width}x${height}`;

// every flame size the backgrounds need, once each
export const FLAME_SIZES = [
	...new Map(
		Object.values(TORCHES)
			.flatMap((halls) => Object.values(halls).flat())
			.map((torch) => [flameKey(torch), [torch.width, torch.height] as const]),
	).values(),
];

// a flame steps to its next frame this often, and each torch starts this many frames on from the
// one before it, so neighbours never burn in step
export const TORCH_FRAME_MS = 70;
export const TORCH_OFFSET = 5;

// the frame a torch's flame shows at a step of the clock
export const torchFrame = (step: number, index: number, frames: number) =>
	(step + index * TORCH_OFFSET) % Math.max(1, frames);

// how much light a torch gives at a step of its clock, about 1 on average: its flame's reach
// (FLAME_LIGHT) eased over the frames either side so the light does not jump, carried on the slow
// draught of the hall, which neither repeats with the flame's loop nor keeps two torches in step
const DRAUGHT = { periods: [5300, 3700], depth: [0.12, 0.08] };

export const torchLight = (torch: Torch, step: number, index: number) => {
	const reach = FLAME_LIGHT.get(flameKey(torch)) ?? [];
	const frame = torchFrame(step, index, reach.length);
	const at = (offset: number) => reach[(frame + offset + reach.length) % reach.length];
	const flame = reach.length ? (at(-1) + at(0) * 2 + at(1)) / 4 : 1;
	const time = step * TORCH_FRAME_MS;
	const draught = DRAUGHT.periods.reduce(
		(sum, period, wave) =>
			sum + DRAUGHT.depth[wave] * Math.sin((2 * Math.PI * time) / period + index * 2.1 + wave),
		1,
	);

	return flame * draught;
};
