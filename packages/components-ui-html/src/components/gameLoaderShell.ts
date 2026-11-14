// A game's loading screen as plain HTML, for every Kilara game. The game draws its own look (its
// background, logo and bar art) and its server hook writes it into the page with the studio intro
// (see injectGameLoader), so the moment the intro ends the loading screen is already there, before
// any script has run. GameLoader.svelte takes it over once the game's scripts arrive.
//
// The bar: a fill masked to the loaded share, moved with transforms only, so the compositor runs it
// smoothly however busy the page is. Until the scripts run nothing can measure the load, so from
// the end of the intro the bar creeps by itself towards GAME_LOADER_ESTIMATE, slowing as it goes;
// GameLoader then carries it on from wherever it is with the assets' real progress.
import { zIndex } from 'constants-shared/zIndex';

import { STUDIO_INTRO_DURATION } from './studioIntroShell';

export const GAME_LOADER_ID = 'kilara-game-loader';
// where app.html wants the loading screen, outside the element the game mounts into
export const GAME_LOADER_PLACEHOLDER = '<!--kilara-game-loader-->';
// the share of the bar (in %) that stands for the game's scripts loading
export const GAME_LOADER_ESTIMATE = 30;
// the creep: it would reach the estimate after this long, and covers most of it in the first third
const CREEP_DURATION = 9000;

const ID = `#${GAME_LOADER_ID}`;

const BASE_STYLE = `
${ID} {
	position: fixed;
	inset: 0;
	z-index: ${zIndex.loader};
	overflow: hidden;
	-webkit-tap-highlight-color: transparent;
}

${ID} .kilara-loader-bar {
	position: relative;
	overflow: hidden;
}

${ID} .kilara-loader-bar > *,
${ID} .kilara-loader-mask > *,
${ID} .kilara-loader-fill > * {
	position: absolute;
	inset: 0;
	display: block;
	width: 100%;
	height: 100%;
}

/* the mask slides in from the left to the loaded share; the fill inside it slides the other way,
   so the art stays still and only its edge moves */
${ID} .kilara-loader-mask {
	overflow: hidden;
	transform: translateX(-100%);
	will-change: transform;
	animation: kilara-loader-mask ${CREEP_DURATION}ms cubic-bezier(0.15, 0.7, 0.3, 1)
		${STUDIO_INTRO_DURATION}ms forwards;
}

${ID} .kilara-loader-fill {
	transform: translateX(100%);
	will-change: transform;
	animation: kilara-loader-fill ${CREEP_DURATION}ms cubic-bezier(0.15, 0.7, 0.3, 1)
		${STUDIO_INTRO_DURATION}ms forwards;
}

@keyframes kilara-loader-mask {
	to {
		transform: translateX(-${100 - GAME_LOADER_ESTIMATE}%);
	}
}

@keyframes kilara-loader-fill {
	to {
		transform: translateX(${100 - GAME_LOADER_ESTIMATE}%);
	}
}
`;

/**
 * The bar: the game's trough and fill art (each one element, an SVG or an img), in a box the game
 * sizes and places with its own class.
 */
export const gameLoaderBar = ({
	trough,
	fill,
	className = '',
}: {
	trough: string;
	fill: string;
	className?: string;
}) =>
	`<div class="kilara-loader-bar ${className}">${trough}` +
	`<div class="kilara-loader-mask"><div class="kilara-loader-fill">${fill}</div></div></div>`;

/** The whole loading screen: the game's markup (with one gameLoaderBar) and its own CSS. */
export const gameLoaderHtml = ({ content, style }: { content: string; style: string }) =>
	`<div id="${GAME_LOADER_ID}" aria-busy="true"><style>${BASE_STYLE}${style}</style>${content}</div>`;

// for a game's server hook, in transformPageChunk: writes the loader in at app.html's placeholder
export const injectGameLoader = (html: string, loader: string) =>
	html.replace(GAME_LOADER_PLACEHOLDER, loader);
