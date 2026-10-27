// Don't convert this to a ts file, because of this https://github.com/vitejs/vite/issues/5370
import { sveltekit } from '@sveltejs/kit/vite';
import { lingui } from '@lingui/vite-plugin';
import { defineConfig } from 'vite';
import configSvelte from 'config-svelte';

const dev = process.env.NODE_ENV === 'development';

// Vite always accepts localhost and IP addresses (e.g. a Tailscale IP); also accept
// Tailscale MagicDNS names so other tailnet devices can open the dev and preview servers.
const allowedHosts = ['.ts.net'];

export default ({ i18n = true } = {}) =>
	defineConfig({
		plugins: [sveltekit(configSvelte()), ...(i18n ? [lingui()] : [])],
		logLevel: 'info',
		server: { allowedHosts },
		preview: { allowedHosts },
		build: {
			// Keep the SDK's existing browser baseline when upgrading the bundler.
			target: ['chrome87', 'edge88', 'firefox78', 'safari14'],
			assetsInlineLimit: Infinity,
			sourcemap: dev,
		},
		css: {
			preprocessorOptions: {
				scss: {
					api: 'modern',
				},
			},
		},
	});
