// The dragon is too large to be seen whole: only one eye shows, through a breach in the back wall.
// The halls (static/assets/backgrounds) are painted with the wall intact; the breach with the eye
// in it is its own layer that follows the board (components/Background.svelte), drawn from a strip
// of frames (static/assets/eye), each the breach box's size in the hall's own art pixels.
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

// the breach's box in each composition, where it was painted, the same in the base and the bonus
// hall (workspace output/dragon/bg-2026-11-18/compose.py cut it out)
export const EYES = {
	Landscape: { x: 240, y: 12, width: 164, height: 106 },
	Portrait: { x: 110, y: 58, width: 145, height: 78 },
} as const;

// the strips are drawn four strip pixels to an art pixel
export const EYE_STRIP_SCALE = 4;

// how long after the eye snaps alert its fire leaves for the board, in ms
export const EYE_FIRE_DELAY = 220;
