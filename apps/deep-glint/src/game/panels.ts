import { ART_PIXEL } from './constants';

export { gameTextStyle as panelTextStyle } from './typography';

// Panels are one nine-slice drawn by code (src/pixel/ui.ts panel): a night-blue face inside a
// gold rule. Sizes are in art pixels, so every panel keeps the game's pixel density at scale 1.
const PANEL_PIXELS = {
	panelTumble: [120, 26],
	panelFreeSpinsIntro: [240, 150],
	panelFreeSpinsOutro: [240, 150],
	celebrationBig: [300, 120],
	celebrationSuper: [300, 120],
	celebrationMega: [300, 120],
	celebrationEpic: [300, 120],
	celebrationMax: [300, 120],
	welcomeCard: [150, 140],
	welcomeRow: [300, 100],
} as const;

// the face keeps clear of the rule and its corner studs, in art pixels
const FACE_INSET = 9;

export type PanelKey = keyof typeof PANEL_PIXELS;
export type PanelFace = { x: number; y: number; width: number; height: number };

// the panel's width in game units at scale 1, to turn a wanted width into a scale
export const panelContentWidth = (key: PanelKey) => PANEL_PIXELS[key][0] * ART_PIXEL;

// at a scale, the panel's sizes and the face's text box (x, y being its middle) relative to the
// panel's middle, all in game units
export const panelLayout = ({ key, scale }: { key: PanelKey; scale: number }) => {
	const [width, height] = PANEL_PIXELS[key];

	return {
		sizes: { width: width * ART_PIXEL * scale, height: height * ART_PIXEL * scale },
		face: {
			x: 0,
			y: 0,
			width: (width - FACE_INSET * 2) * ART_PIXEL * scale,
			height: (height - FACE_INSET * 2) * ART_PIXEL * scale,
		} satisfies PanelFace,
	};
};
