//https://svelte.dev/docs/cli/devtools-json
import { dev } from '$app/env';
// the plain modules, not the package index, so the server does not load the Svelte components
import { injectStudioIntro } from 'components-ui-html/src/components/studioIntroShell';
import { injectGameLoader } from 'components-ui-html/src/components/gameLoaderShell';

import { loaderHtml } from './game/loader';

// The studio intro and the loading screen go into the page's HTML, so they show before the
// scripts load: the intro ends on time by itself, onto the loading screen under it.
const page = (html: string) =>
	injectGameLoader(injectStudioIntro(html, { autoEnd: true }), loaderHtml());

export function handle({ event, resolve }) {
	if (dev && event.url.pathname === '/.well-known/appspecific/com.chrome.devtools.json') {
		return new Response(undefined, { status: 404 });
	}

	return resolve(event, { transformPageChunk: ({ html }) => page(html) });
}
