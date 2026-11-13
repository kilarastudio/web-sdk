// The Kilara Studio intro as plain HTML. A game's server hook writes it into the page itself (see
// injectStudioIntro), so the intro paints with the first HTML, before any script has loaded; the
// StudioIntro component then takes it over and ends it. Where it is not in the page (Storybook, a
// game without the hook), StudioIntro adds the same markup when it mounts.
import { zIndex } from 'constants-shared/zIndex';

import { LOCKUP_VIEWBOX, WORDMARK_BASELINE, KILARA_LETTERS, KILAU_DOT, STUDIO } from './kilaraLogo';

export const STUDIO_INTRO_ID = 'kilara-studio-intro';
// where app.html wants the intro, outside the element the game mounts into
export const STUDIO_INTRO_PLACEHOLDER = '<!--kilara-studio-intro-->';

const LETTER_START = 180;
const LETTER_STAGGER = 50;

const [, , WIDTH] = LOCKUP_VIEWBOX.split(' ').map(Number);

const STYLE = `
#${STUDIO_INTRO_ID} {
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

#${STUDIO_INTRO_ID} svg {
	/* the lockup is about 1.8 : 1, so this keeps it between about 90 and 160 px tall */
	width: min(46vw, 290px);
	min-width: 160px;
	overflow: visible;
}

#${STUDIO_INTRO_ID} .lockup,
#${STUDIO_INTRO_ID} .letter,
#${STUDIO_INTRO_ID} .dot,
#${STUDIO_INTRO_ID} .studio {
	transform-box: fill-box;
	transform-origin: center;
}

#${STUDIO_INTRO_ID} .lockup {
	animation: kilara-intro-push 2200ms var(--intro-ease) both;
}

#${STUDIO_INTRO_ID} .letter {
	fill: var(--intro-ink);
	animation: kilara-intro-rise 620ms var(--intro-ease) var(--delay) both;
}

/* the dot falls in from above and bounces; it squashes from its bottom edge, so each impact
   stays on its resting spot */
#${STUDIO_INTRO_ID} .dot {
	fill: var(--intro-light);
	transform-origin: 50% 100%;
	animation: kilara-intro-bounce 1000ms 620ms both;
}

#${STUDIO_INTRO_ID} .studio {
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
		transform: translateY(var(--rise));
	}
}

/*
	Falls (ease-in), squashes on the hit, rises a third of the way back (ease-out), falls again,
	then a small hop and a last light squash. Each segment's easing sits on its start keyframe.
*/
@keyframes kilara-intro-bounce {
	0% {
		opacity: 0;
		transform: translateY(-140px) scale(0.92, 1.08);
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
		transform: translateY(-34px) scale(0.96, 1.04);
		animation-timing-function: cubic-bezier(0.55, 0, 1, 0.45);
	}
	76% {
		transform: translateY(0) scale(1.12, 0.88);
		animation-timing-function: cubic-bezier(0, 0.55, 0.45, 1);
	}
	86% {
		transform: translateY(-9px) scale(1);
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
		transform: translateY(10px);
	}
}

@keyframes kilara-intro-appear {
	from {
		opacity: 0;
	}
}

/* same timing, no movement: the lockup fades in whole and the dot does not drop */
@media (prefers-reduced-motion: reduce) {
	#${STUDIO_INTRO_ID} .lockup {
		animation: none;
	}

	#${STUDIO_INTRO_ID} .letter,
	#${STUDIO_INTRO_ID} .dot,
	#${STUDIO_INTRO_ID} .studio {
		animation: kilara-intro-appear 300ms ease-out 200ms both;
	}
}
`;

const letters = KILARA_LETTERS.map(
	(d, index) =>
		`<path class="letter" d="${d}" style="--delay:${LETTER_START + index * LETTER_STAGGER}ms"/>`,
).join('');

const MARKUP =
	`<div id="${STUDIO_INTRO_ID}" role="img" aria-label="Kilara Studio">` +
	`<style>${STYLE}</style>` +
	`<svg viewBox="${LOCKUP_VIEWBOX}" aria-hidden="true" style="--rise:${WORDMARK_BASELINE + 8}px">` +
	// the letters rise from below their baseline, so nothing shows under it
	`<defs><clipPath id="${STUDIO_INTRO_ID}-base">` +
	`<rect x="-60" y="-400" width="${WIDTH + 120}" height="${WORDMARK_BASELINE + 400}"/>` +
	`</clipPath></defs>` +
	`<g class="lockup">` +
	`<g clip-path="url(#${STUDIO_INTRO_ID}-base)">${letters}</g>` +
	`<circle class="dot" cx="${KILAU_DOT.cx}" cy="${KILAU_DOT.cy}" r="${KILAU_DOT.r}"/>` +
	`<path class="studio" d="${STUDIO}"/>` +
	`</g></svg></div>`;

export const studioIntroHtml = () => MARKUP;

// for a game's server hook: resolve(event, { transformPageChunk: injectStudioIntro })
export const injectStudioIntro = ({ html }: { html: string }) =>
	html.replace(STUDIO_INTRO_PLACEHOLDER, MARKUP);
