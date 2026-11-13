//https://svelte.dev/docs/cli/devtools-json
import { dev } from '$app/env';
// the plain module, not the package index, so the server does not load the Svelte components
import { injectStudioIntro } from 'components-ui-html/src/components/studioIntroShell';

export function handle({ event, resolve }) {
	if (dev && event.url.pathname === '/.well-known/appspecific/com.chrome.devtools.json') {
		return new Response(undefined, { status: 404 });
	}

	// the Kilara Studio intro goes into the page's HTML, so it shows before the scripts load
	return resolve(event, { transformPageChunk: injectStudioIntro });
}
