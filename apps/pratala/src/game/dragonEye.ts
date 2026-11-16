// The dragon is too large to be seen whole: only one eye shows, behind the broken back wall,
// painted into the backgrounds (static/assets/backgrounds). The eye is painted there
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
	Landscape: { x: 171, y: 0, width: 234, height: 94 },
	Portrait: { x: 30, y: 0, width: 264, height: 179 },
} as const;

// where the gaze leaves the eye when it looks down: the foot of the pupil, and its half-width
export const EYE_PUPILS = {
	Landscape: { x: 288, y: 60, half: 4 },
	Portrait: { x: 161, y: 122, half: 8 },
} as const;

// the hall's pictures, in art pixels; each covers the canvas
export const HALL_SIZES = {
	Landscape: { width: 576, height: 324 },
	Portrait: { width: 324, height: 576 },
} as const;

// the strips are drawn four strip pixels to an art pixel
export const EYE_STRIP_SCALE = 4;

// the strips lay the frames out in a grid, row by row in EYE_FRAMES order, this many to a row
export const EYE_STRIP_COLUMNS = 3;

// how long after the eye snaps alert its fire leaves for the board, in ms
export const EYE_FIRE_DELAY = 220;
