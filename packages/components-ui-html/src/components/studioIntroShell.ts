// The Kilara Studio intro as plain HTML. A game's server hook writes it into the page itself (see
// injectStudioIntro), so the intro paints with the first HTML, before any script has loaded; the
// StudioIntro component then takes it over and ends it. Where it is not in the page (Storybook, a
// game without the hook), StudioIntro adds the same markup when it mounts.
//
// The intro plays while the game's scripts load and run, which can hold the main thread for a
// second on a phone. So every moving part is its own HTML layer and only transform and opacity
// animate: the browser's compositor runs those off the main thread, and the motion stays smooth
// however busy the page is. (Animating shapes inside one SVG runs on the main thread and froze.)
import { zIndex } from 'constants-shared/zIndex';

import {
	LOCKUP_VIEWBOX,
	WORDMARK_VIEWBOX,
	WORDMARK_BASELINE,
	KILARA_LETTERS,
	KILAU_DOT,
	STUDIO,
} from './kilaraLogo';

export const STUDIO_INTRO_ID = 'kilara-studio-intro';
// where app.html wants the intro, outside the element the game mounts into
export const STUDIO_INTRO_PLACEHOLDER = '<!--kilara-studio-intro-->';

// how long the intro stays up at least (the motion settles at about 1.7 s; the rest is time to
// read the logo), and its fade out
export const STUDIO_INTRO_DURATION = 2300;
export const STUDIO_INTRO_FADE = 400;

const LETTER_START = 180;
const LETTER_STAGGER = 50;

// the logo's units: the lockup (kilara over STUDIO) and the wordmark band above the baseline
const [, , WIDTH, HEIGHT] = LOCKUP_VIEWBOX.split(' ').map(Number);
const BASELINE = WORDMARK_BASELINE;

// a share of a box in logo units: places and sizes layers, and moves them (a translate in % is a
// share of the layer's own size), so the motion keeps the logo's proportions at any size
const pct = (value: number, of: number) => `${+((value / of) * 100).toFixed(4)}%`;

const DOT_SIZE = KILAU_DOT.r * 2;
const ID = `#${STUDIO_INTRO_ID}`;

const STYLE = `
${ID} {
	/* palette A: Malam, Kertas, Kabut, Kilau */
	--intro-background: #0e1014;
	--intro-ink: #f3f4f6;
	--intro-sub: #8a92a0;
	--intro-light: #ffc53d;
	/* firm ease-out, the same feel as the reel settle: fast in, no bounce */
	--intro-ease: cubic-bezier(0.16, 1, 0.3, 1);

	position: fixed;
	inset: 0;
	z-index: ${zIndex.intro};
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: var(--intro-background);
	-webkit-tap-highlight-color: transparent;
}

/* With a loading screen of its own under it (a game's HTML loader), the intro needs no script to
   end: it fades out on time by itself, whenever the game's scripts arrive. */
${ID}[data-auto-end] {
	animation: kilara-intro-out ${STUDIO_INTRO_FADE}ms ease-out ${STUDIO_INTRO_DURATION}ms forwards;
}

@keyframes kilara-intro-out {
	to {
		opacity: 0;
		visibility: hidden;
	}
}

/* the lockup is about 1.8 : 1, so this keeps it between about 90 and 160 px tall */
${ID} .lockup {
	position: relative;
	width: min(46vw, 290px);
	min-width: 160px;
	aspect-ratio: ${WIDTH} / ${HEIGHT};
	animation: kilara-intro-push 2200ms var(--intro-ease) both;
}

${ID} .layer {
	position: absolute;
	will-change: transform, opacity;
}

${ID} svg {
	display: block;
	width: 100%;
	height: 100%;
}

/* the band above the baseline; the letters rise into it from below, so nothing shows under it */
${ID} .wordmark {
	position: absolute;
	left: 0;
	top: 0;
	width: 100%;
	height: ${pct(BASELINE, HEIGHT)};
	overflow: hidden;
}

${ID} .letter {
	inset: 0;
	fill: var(--intro-ink);
	animation: kilara-intro-rise 620ms var(--intro-ease) var(--delay) both;
}

/* the dot falls in from above and bounces; it squashes from its bottom edge, so each impact
   stays on its resting spot */
${ID} .dot {
	left: ${pct(KILAU_DOT.cx - KILAU_DOT.r, WIDTH)};
	top: ${pct(KILAU_DOT.cy - KILAU_DOT.r, HEIGHT)};
	width: ${pct(DOT_SIZE, WIDTH)};
	aspect-ratio: 1;
	border-radius: 50%;
	background-color: var(--intro-light);
	transform-origin: 50% 100%;
	animation: kilara-intro-bounce 1000ms 620ms both;
}

${ID} .studio {
	inset: 0;
	fill: var(--intro-sub);
	animation: kilara-intro-follow 600ms var(--intro-ease) 1300ms both;
}

@keyframes kilara-intro-push {
	from {
		transform: scale(0.95);
	}
}

@keyframes kilara-intro-rise {
	from {
		transform: translateY(${pct(BASELINE + 8, BASELINE)});
	}
}

/*
	Falls (ease-in), squashes on the hit, rises a third of the way back (ease-out), falls again,
	then a small hop and a last light squash. Each segment's easing sits on its start keyframe.
	Heights are in logo units, as a share of the dot's own size.
*/
@keyframes kilara-intro-bounce {
	0% {
		opacity: 0;
		transform: translateY(${pct(-140, DOT_SIZE)}) scale(0.92, 1.08);
		animation-timing-function: cubic-bezier(0.55, 0, 1, 0.45);
	}
	10% {
		opacity: 1;
	}
	40% {
		transform: translateY(0) scale(1.22, 0.78);
		animation-timing-function: cubic-bezier(0, 0.55, 0.45, 1);
	}
	60% {
		transform: translateY(${pct(-34, DOT_SIZE)}) scale(0.96, 1.04);
		animation-timing-function: cubic-bezier(0.55, 0, 1, 0.45);
	}
	76% {
		transform: translateY(0) scale(1.12, 0.88);
		animation-timing-function: cubic-bezier(0, 0.55, 0.45, 1);
	}
	86% {
		transform: translateY(${pct(-9, DOT_SIZE)}) scale(1);
		animation-timing-function: cubic-bezier(0.55, 0, 1, 0.45);
	}
	94% {
		transform: translateY(0) scale(1.05, 0.95);
		animation-timing-function: ease-out;
	}
	100% {
		opacity: 1;
		transform: translateY(0) scale(1);
	}
}

@keyframes kilara-intro-follow {
	from {
		opacity: 0;
		transform: translateY(${pct(10, HEIGHT)});
	}
}

@keyframes kilara-intro-appear {
	from {
		opacity: 0;
	}
}

/* same timing, no movement: the lockup fades in whole and the dot does not drop */
@media (prefers-reduced-motion: reduce) {
	${ID} .lockup {
		animation: none;
	}

	${ID} .letter,
	${ID} .dot,
	${ID} .studio {
		animation: kilara-intro-appear 300ms ease-out 200ms both;
	}
}
`;

// each letter is its own layer over the whole band, so it keeps its place in the wordmark
const letters = KILARA_LETTERS.map(
	(d, index) =>
		`<div class="layer letter" style="--delay:${LETTER_START + index * LETTER_STAGGER}ms">` +
		`<svg viewBox="${WORDMARK_VIEWBOX}"><path d="${d}"/></svg></div>`,
).join('');

const markup = (autoEnd: boolean) =>
	`<div id="${STUDIO_INTRO_ID}" role="img" aria-label="Kilara Studio"${autoEnd ? ' data-auto-end' : ''}>` +
	`<style>${STYLE}</style>` +
	`<div class="lockup" aria-hidden="true">` +
	`<div class="wordmark">${letters}</div>` +
	`<div class="layer dot"></div>` +
	`<div class="layer studio"><svg viewBox="${LOCKUP_VIEWBOX}"><path d="${STUDIO}"/></svg></div>` +
	`</div></div>`;

type Options = {
	/** end on time by itself, for a page with its own HTML loading screen under the intro */
	autoEnd?: boolean;
};

export const studioIntroHtml = ({ autoEnd = false }: Options = {}) => markup(autoEnd);

// for a game's server hook, in transformPageChunk: writes the intro in at app.html's placeholder
export const injectStudioIntro = (html: string, options: Options = {}) =>
	html.replace(STUDIO_INTRO_PLACEHOLDER, studioIntroHtml(options));
