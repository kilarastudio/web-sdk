// Keno Chain's loading screen as plain HTML (see gameLoaderShell in components-ui-html).
// hooks.server.ts writes it into the page, so it is there the moment the studio intro ends, before
// the game's scripts have run; LoadingScreen hands it the load's progress once they do.
//
// The studio's order for every game: the Kilara Studio intro, then this screen on the same solid
// dark as the intro (Malam), then the welcome screen, the first to stand on the game's own navy.
// One centred column: the game's name as the game screen writes it, a flat square bar that fills
// in the game's gold, and a small "by kilara" close under it.
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

const MALAM = '#0e1014';
const WHITE = '#ffffff';
const TEXT = '#f3f5fb';
const GOLD = '#ffc93c';
const TROUGH = '#1c2537';

// the column shows once the intro has faded right out, so the two logos never overlap
const SHOW_AT = STUDIO_INTRO_DURATION + STUDIO_INTRO_FADE;
const SHOW_FADE = 300;

const [, , WORDMARK_WIDTH, WORDMARK_HEIGHT] = WORDMARK_VIEWBOX.split(' ').map(Number);
const CREDIT_HEIGHT = 1.5;

// The system font, as bold as the game writes its name, so nothing swaps when the game's font
// arrives.
const STYLE = `
#kilara-game-loader {
	/* one unit: the column fitted to the screen */
	--u: min(calc(100vw / 40), calc(100vh / 60), 16px);
	--u: min(calc(100vw / 40), calc(100dvh / 60), 16px);
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	background: ${MALAM};
}

#kilara-game-loader > :not(style) {
	animation: keno-loader-show ${SHOW_FADE}ms ease-out ${SHOW_AT}ms both;
}

@keyframes keno-loader-show {
	from {
		opacity: 0;
	}
}

#kilara-game-loader .keno-loader-name {
	margin: 0 0 calc(var(--u) * 2.6);
	color: ${TEXT};
	font: 700 calc(var(--u) * 4.4) / 1 system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
	letter-spacing: 0.02em;
	white-space: nowrap;
}

#kilara-game-loader .keno-loader-name b {
	color: ${GOLD};
	font-weight: inherit;
}

#kilara-game-loader .keno-loader-bar {
	flex: none;
	width: calc(var(--u) * 22);
	height: calc(var(--u) * 0.8);
	margin-bottom: calc(var(--u) * 1.6);
}

/* "by" sits on the wordmark's baseline: an svg's baseline is its bottom edge */
#kilara-game-loader .keno-loader-credit {
	display: flex;
	align-items: baseline;
	gap: calc(var(--u) * 0.5);
	color: ${WHITE};
	font: 500 calc(var(--u) * 1.2) / 1 system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
	letter-spacing: 0.02em;
}

#kilara-game-loader .keno-loader-credit svg {
	display: block;
	height: calc(var(--u) * ${CREDIT_HEIGHT});
	width: calc(var(--u) * ${(CREDIT_HEIGHT * WORDMARK_WIDTH) / WORDMARK_HEIGHT});
}
`;

const block = (colour: string) => `<div style="background:${colour}"></div>`;

const credit =
	'<div class="keno-loader-credit" aria-label="by Kilara"><span aria-hidden="true">by</span>' +
	`<svg viewBox="${WORDMARK_VIEWBOX}" aria-hidden="true">` +
	`<path fill="${WHITE}" d="${KILARA_PATH}"/>` +
	`<circle fill="${WHITE}" cx="${KILAU_DOT.cx}" cy="${KILAU_DOT.cy}" r="${KILAU_DOT.r}"/>` +
	'</svg></div>';

export const loaderHtml = () =>
	gameLoaderHtml({
		style: STYLE,
		content:
			'<p class="keno-loader-name">KENO <b>CHAIN</b></p>' +
			gameLoaderBar({ trough: block(TROUGH), fill: block(GOLD), className: 'keno-loader-bar' }) +
			credit,
	});
