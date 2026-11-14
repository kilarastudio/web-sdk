// The dragon is too large to be seen whole: one eye behind the broken back wall, and its claws on
// the pillars, painted into the backgrounds (static/assets/backgrounds). The eye is painted there
// open; the game draws its other frames over it from a strip (static/assets/eye), in the
// background's own art pixels.
export const EYE_FRAMES = [
	'open',
	'half',
	'shut',
	'alert',
	'lookLeft',
	'lookRight',
	'lookDown',
] as const;

export type EyeFrame = (typeof EYE_FRAMES)[number];

// the eye's box in each composition, the same in the base and the bonus hall
export const EYES = {
	Landscape: { x: 234, y: 8, width: 112, height: 66 },
	Portrait: { x: 100, y: 76, width: 128, height: 68 },
} as const;

// the strips are drawn four strip pixels to an art pixel
export const EYE_STRIP_SCALE = 4;

// how long after the eye snaps alert its fire leaves for the board, in ms
export const EYE_FIRE_DELAY = 220;
