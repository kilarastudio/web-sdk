import { ART_PIXEL } from './constants';
import { WIN_PANEL_BORDER } from '../pixel/ui';

export { gameTextStyle as panelTextStyle } from './typography';

// Panels are one nine-slice drawn by code (src/pixel/ui.ts panel): a night-blue face inside a
// gold rule. The big win panel and the free spins total are drawn whole instead, in the frame of
// the win's level (src/pixel/ui.ts winPanel), with a thicker border. Sizes are in art pixels, so
// every panel keeps the game's pixel density at scale 1.
const PANEL_PIXELS = {
	panelTumble: [120, 26],
	panelFreeSpinsIntro: [240, 150],
	panelFreeSpinsOutro: [240, 150],
	celebration: [300, 120],
	welcomeCard: [150, 140],
	welcomeRow: [300, 100],
} as const;

// the face keeps clear of the rule and its corner studs, in art pixels
const FACE_INSET: Partial<Record<keyof typeof PANEL_PIXELS, number>> = {
	celebration: WIN_PANEL_BORDER + 1,
	panelFreeSpinsIntro: WIN_PANEL_BORDER + 1,
	panelFreeSpinsOutro: WIN_PANEL_BORDER + 1,
};

export type PanelKey = keyof typeof PANEL_PIXELS;
export type PanelFace = { x: number; y: number; width: number; height: number };

// the panel's width in game units at scale 1, to turn a wanted width into a scale
export const panelContentWidth = (key: PanelKey) => PANEL_PIXELS[key][0] * ART_PIXEL;

// at a scale, the panel's sizes and the face's text box (x, y being its middle) relative to the
// panel's middle, all in game units
export const panelLayout = ({ key, scale }: { key: PanelKey; scale: number }) => {
	const [width, height] = PANEL_PIXELS[key];
	const inset = FACE_INSET[key] ?? 9;

	return {
		pixels: { width, height },
		sizes: { width: width * ART_PIXEL * scale, height: height * ART_PIXEL * scale },
		face: {
			x: 0,
			y: 0,
			width: (width - inset * 2) * ART_PIXEL * scale,
			height: (height - inset * 2) * ART_PIXEL * scale,
		} satisfies PanelFace,
	};
};
