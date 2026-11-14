// Pratala's loading screen as plain HTML (see gameLoaderShell in components-ui-html).
// hooks.server.ts writes it into the page, so it is there the moment the studio intro ends, before
// the game's scripts have run; LoadingScreen hands it the load's progress once they do.
//
// The order the user asked for (2026-11-13): the Kilara Studio intro, then this screen on the same
// solid dark as the intro (Malam), then the welcome screen, which is the first to stand in the
// game's hall. On it, one centred column: the game's logo, the stone trough the molten gold fills,
// and a small "by kilara" close under the bar (the studio's locked wordmark in its one-colour white
// version, dot included, as the user asked), so the intro fades into it with only the logo changing.
//
// Sizes are in game units, as large as the game draws its own art on a phone (720 × 1280 tall,
// 1600 × 900 wide); the bar is drawn by the same code as the game's art (pixel/ui.ts).
// Plain module, no DOM or Pixi: the server imports it.
import { gameLoaderBar, gameLoaderHtml } from 'components-ui-html/src/components/gameLoaderShell';
import {
	KILARA_PATH,
	KILAU_DOT,
	WORDMARK_VIEWBOX,
} from 'components-ui-html/src/components/kilaraLogo';
import {
	STUDIO_INTRO_DURATION,
	STUDIO_INTRO_FADE,
} from 'components-ui-html/src/components/studioIntroShell';

import { toSvg } from '../pixel/svg';
import { loadingBar } from '../pixel/ui';
import { ART_PIXEL, LOADING_LOGO } from './constants';

// Malam behind, as in the studio intro; the credit is all white (brand/logo/kilara-logo-white.svg)
const MALAM = '#0e1014';
const WHITE = '#ffffff';

// the bar's size in art pixels; the column's sizes and gaps in game units
const BAR = { width: 120, height: 12 };
const LOGO_GAP = 52;
const CREDIT_GAP = 20;
const CREDIT = { height: 17, by: 14, gap: 6 };
// the column shows once the intro has faded right out, so the two logos never overlap
const SHOW_AT = STUDIO_INTRO_DURATION + STUDIO_INTRO_FADE;
const SHOW_FADE = 300;

// relative to the page, which is the game's root in every build
const asset = (path: string) => `./assets/${path}`;

const { trough, fill } = loadingBar(BAR.width);

const u = (units: number) => `calc(${units} * var(--u))`;

const [, , WORDMARK_WIDTH, WORDMARK_HEIGHT] = WORDMARK_VIEWBOX.split(' ').map(Number);

const STYLE = `
#kilara-game-loader {
	/* one game unit in CSS px: the main layout fitted to the screen */
	--u: min(calc(100vw / 720), calc(100vh / 1280));
	--u: min(calc(100vw / 720), calc(100dvh / 1280));
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	background: ${MALAM};
}

#kilara-game-loader > :not(style) {
	animation: glint-loader-show ${SHOW_FADE}ms ease-out ${SHOW_AT}ms both;
}

@keyframes glint-loader-show {
	from {
		opacity: 0;
	}
}

@media (min-aspect-ratio: 1 / 1) {
	#kilara-game-loader {
		--u: min(calc(100vw / 1600), calc(100vh / 900));
		--u: min(calc(100vw / 1600), calc(100dvh / 900));
	}
}

#kilara-game-loader .glint-loader-logo {
	display: block;
	width: ${u(LOADING_LOGO.width)};
	height: ${u(LOADING_LOGO.width / LOADING_LOGO.ratio)};
	margin-bottom: ${u(LOGO_GAP)};
	image-rendering: pixelated;
}

#kilara-game-loader .glint-loader-bar {
	flex: none;
	width: ${u(BAR.width * ART_PIXEL)};
	height: ${u(BAR.height * ART_PIXEL)};
	margin-bottom: ${u(CREDIT_GAP)};
}

/* "by" sits on the wordmark's baseline: an svg's baseline is its bottom edge, which is the
   wordmark's baseline. The system font, so nothing swaps when the game's own font arrives. */
#kilara-game-loader .glint-loader-credit {
	display: flex;
	align-items: baseline;
	gap: ${u(CREDIT.gap)};
	color: ${WHITE};
	font: 500 ${u(CREDIT.by)} / 1 system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
	letter-spacing: 0.02em;
}

#kilara-game-loader .glint-loader-credit svg {
	display: block;
	height: ${u(CREDIT.height)};
	width: ${u((CREDIT.height * WORDMARK_WIDTH) / WORDMARK_HEIGHT)};
}
`;

const credit =
	'<div class="glint-loader-credit" aria-label="by Kilara"><span aria-hidden="true">by</span>' +
	`<svg viewBox="${WORDMARK_VIEWBOX}" aria-hidden="true">` +
	`<path fill="${WHITE}" d="${KILARA_PATH}"/>` +
	`<circle fill="${WHITE}" cx="${KILAU_DOT.cx}" cy="${KILAU_DOT.cy}" r="${KILAU_DOT.r}"/>` +
	'</svg></div>';

export const loaderHtml = () =>
	gameLoaderHtml({
		style: STYLE,
		content:
			`<img class="glint-loader-logo" src="${asset('ui/logo.png')}" alt="Pratala" />` +
			gameLoaderBar({ trough: toSvg(trough), fill: toSvg(fill), className: 'glint-loader-bar' }) +
			credit,
	});
