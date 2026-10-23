import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
export default () => ({
	preprocess: vitePreprocess(),
	adapter: adapter(),
	files: {
		appTemplate: existsSync(resolve('src/app.html'))
			? 'src/app.html'
			: fileURLToPath(new URL('./app.html', import.meta.url)),
	},
	output: {
		bundleStrategy: 'inline',
	},
});
