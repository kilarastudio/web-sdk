import type * as PIXI from 'pixi.js';

// Where things stand across containers, for an effect that crosses from one to another (the
// Dragon's Gaze leaves the dragon's eye in the background and comes down the board): the board's
// own container (components/BoardAnchor.svelte), and the pupil of the eye in the wall, on the
// stage (components/DragonEye.svelte).
export const boardSpace: {
	container?: PIXI.Container;
	pupil?: () => PIXI.Point;
} = {};
