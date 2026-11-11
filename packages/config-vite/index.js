// Don't convert this to a ts file, because of this https://github.com/vitejs/vite/issues/5370
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { sveltekit } from '@sveltejs/kit/vite';
import { lingui } from '@lingui/vite-plugin';
import { defineConfig } from 'vite';
import configSvelte from 'config-svelte';

const dev = process.env.NODE_ENV === 'development';

// Vite always accepts localhost and IP addresses (e.g. a Tailscale IP); also accept
// Tailscale MagicDNS names so other tailnet devices can open the dev and preview servers.
const allowedHosts = ['.ts.net'];

// Device testing: with DEV_TLS_DIR (a folder holding localhost.pem and localhost.key.pem) the dev
// server speaks HTTPS, and with DEV_RGS_PROXY (the local game server's origin) it passes the RGS
// paths on to it. The game and its RGS then share one origin, so a phone accepts one certificate
// when it opens the page instead of needing a second one for the game server.
const tlsDir = process.env.DEV_TLS_DIR;
const rgsProxy = process.env.DEV_RGS_PROXY;
const https = tlsDir
	? {
			key: readFileSync(join(tlsDir, 'localhost.key.pem')),
			cert: readFileSync(join(tlsDir, 'localhost.pem')),
		}
	: undefined;
const proxy = rgsProxy
	? Object.fromEntries(
			['/api/rgs', '/bet'].map((path) => [
				path,
				{ target: rgsProxy, secure: false, changeOrigin: true },
			]),
		)
	: undefined;

export default ({ i18n = true } = {}) =>
	defineConfig({
		plugins: [sveltekit(configSvelte()), ...(i18n ? [lingui()] : [])],
		logLevel: 'info',
		server: { allowedHosts, ...(https ? { https } : {}), ...(proxy ? { proxy } : {}) },
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
