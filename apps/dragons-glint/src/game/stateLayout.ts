import { stateUi } from 'state-shared';
import { createLayout } from 'utils-layout';

import { BOARD_SIZES, BOARD_MARGINS, BOARD_FRAME_REACH, BOARD_FIT } from './constants';

const layout = createLayout({
	backgroundRatio: {
		normal: 2039 / 1000,
		portrait: 1242 / 2208,
	},
	mainSizesMap: {
		desktop: { width: 1422, height: 800 },
		tablet: { width: 1000, height: 1000 },
		landscape: { width: 1600, height: 900 },
		portrait: { width: 800, height: 1422 },
	},
});

// The reels are the focus, so the main layout is scaled to make the board as large as the space
// the HUD leaves: the board with its frame and the panels above it fits between the header and the
// controls, and between the side controls, with BOARD_FIT kept clear round it. Everything in the
// main layout (character, celebrations) scales with it.
const mainLayout = () => {
	const base = layout.stateLayoutDerived.mainLayout();
	const canvas = layout.stateLayoutDerived.canvasSizes();
	const margins = layout.stateLayoutDerived.isStacked()
		? BOARD_MARGINS.stacked
		: BOARD_MARGINS.normal;
	const { top, bottom, side } = stateUi.hudInset;
	const width = BOARD_SIZES.width + BOARD_FRAME_REACH.left + BOARD_FRAME_REACH.right;
	const height = BOARD_SIZES.height + margins.top + margins.bottom;
	const roomWidth = canvas.width - (side + BOARD_FIT.edge) * 2;
	const roomHeight = canvas.height - top - bottom - BOARD_FIT.gap * 2;
	const scale = Math.min(roomWidth / width, roomHeight / height);

	return { ...base, scale: Math.max(scale, base.scale * 0.1) };
};

export const { stateLayout } = layout;
export const stateLayoutDerived = { ...layout.stateLayoutDerived, mainLayout };
