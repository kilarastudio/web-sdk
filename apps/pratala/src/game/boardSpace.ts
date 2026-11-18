import type * as PIXI from 'pixi.js';

// Where things stand across containers, for an effect that crosses from one to another (the
// Dragon's Gaze leaves the dragon's eye in the background and comes down the board): the board's
// own container (components/BoardAnchor.svelte), and the pupil of the eye in the wall, on the
// stage (components/DragonEye.svelte). Each hall's eye adds its pupil while it is up; the last one
// up is the one the gaze leaves from, so when the boss hall's eye goes the base hall's takes over.
const pupils: (() => PIXI.Point)[] = [];

export const boardSpace: {
	container?: PIXI.Container;
	pupil: () => PIXI.Point | undefined;
	addPupil: (pupil: () => PIXI.Point) => () => void;
} = {
	pupil: () => pupils.at(-1)?.(),
	addPupil: (pupil) => {
		pupils.push(pupil);
		return () => {
			const index = pupils.indexOf(pupil);
			if (index >= 0) pupils.splice(index, 1);
		};
	},
};
