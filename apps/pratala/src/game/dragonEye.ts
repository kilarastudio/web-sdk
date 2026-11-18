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

// the breach's box in each composition, the same in the base and the bonus hall: the eye drawn
// big (2026-11-18, the user: a small eye loses the dread), each strip frame this many hall art
// pixels (workspace output/dragon/bg-2026-11-18 bigeye.py and eyeframes.py). x and y only say
// where it would stand in the hall; the layer is placed over the board (components/Background).
export const EYES = {
	Landscape: { x: 185, y: 12, width: 270, height: 152 },
	Portrait: { x: 70, y: 40, width: 220, height: 124 },
} as const;

// the strips are drawn four strip pixels to an art pixel
export const EYE_STRIP_SCALE = 4;

// how long after the eye snaps alert its fire leaves for the board, in ms
export const EYE_FIRE_DELAY = 220;
