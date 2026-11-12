// The dragon: frame strips made with an image model and locked to the game's palette and pixel
// grid (static/assets/character). These numbers mirror character.json beside the strips; sizes
// are in strip pixels.
export const CHARACTER = {
	cell: { width: 800, height: 800 },
	// the opaque box of idle frame 0 inside a cell
	figure: { left: 164, top: 164, right: 636, bottom: 800 },
	animations: {
		idle: { frames: 6, fps: 5, loop: true },
		anticipation: { frames: 4, fps: 6, loop: true },
		power: { frames: 6, fps: 8, loop: false },
		win: { frames: 6, fps: 8, loop: false },
		bigWin: { frames: 4, fps: 6, loop: true },
		bonus: { frames: 6, fps: 8, loop: false },
		// a pleased snort of smoke, and one beat of the wing: its answers to a run of wins
		puff: { frames: 6, fps: 8, loop: false },
		flap: { frames: 6, fps: 8, loop: false },
	},
} as const;

export type CharacterAnimation = keyof typeof CHARACTER.animations;

// where the fire leaves the dragon's mouth, as fractions of the figure's box from its top left
export const CHARACTER_MOUTH = { x: 0.06, y: 0.26 };
// how far into the power animation the fire leaves, in ms
export const CHARACTER_FIRE_DELAY = 380;
