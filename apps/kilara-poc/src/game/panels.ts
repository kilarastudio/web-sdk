import { ART_PANELS } from './art.generated';

export { gameTextStyle as panelTextStyle } from './typography';

// The Kilara Mine panel art (static/assets/ai/kilara-mine-v4), in source pixels from the
// pack's manifest.json. The padding round each PNG differs, so a panel is laid out by its visible
// object (content) and its text goes in the face's text-safe box. The art carries no text.
type Bounds = readonly [left: number, top: number, right: number, bottom: number];

type PanelArt = {
	size: readonly [width: number, height: number];
	content: Bounds;
	text: Bounds;
};

export const PANELS = ART_PANELS satisfies Record<string, PanelArt>;

export type PanelKey = keyof typeof PANELS;

export type PanelFace = { x: number; y: number; width: number; height: number };

// the visible panel's width in source pixels, to turn a wanted width into a scale
export const panelContentWidth = (key: PanelKey) => {
	const { content } = PANELS[key];
	return content[2] - content[0];
};

// at a scale of source pixels to game units, the sprite centred on the visible panel, that
// panel's sizes, and the face's text box (x, y being its middle) relative to the panel's middle
export const panelLayout = ({ key, scale }: { key: PanelKey; scale: number }) => {
	const { size, content, text } = PANELS[key];
	const middle = { x: (content[0] + content[2]) / 2, y: (content[1] + content[3]) / 2 };

	return {
		sprite: {
			anchor: { x: middle.x / size[0], y: middle.y / size[1] },
			width: size[0] * scale,
			height: size[1] * scale,
		},
		sizes: {
			width: (content[2] - content[0]) * scale,
			height: (content[3] - content[1]) * scale,
		},
		face: {
			x: ((text[0] + text[2]) / 2 - middle.x) * scale,
			y: ((text[1] + text[3]) / 2 - middle.y) * scale,
			width: (text[2] - text[0]) * scale,
			height: (text[3] - text[1]) * scale,
		} satisfies PanelFace,
	};
};
