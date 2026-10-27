import type { StorybookConfig } from '@storybook/sveltekit';

const config: StorybookConfig = {
	stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|ts|svelte)'],
	addons: ['@storybook/addon-svelte-csf', '@storybook/addon-docs'],
	framework: {
		name: '@storybook/sveltekit',
		options: {},
	},
	staticDirs: ['../static'],
	core: {
		// Like config-vite: besides localhost and this machine's own IPs (e.g. its Tailscale IP),
		// accept Tailscale MagicDNS names so other tailnet devices can open Storybook.
		allowedHosts: ['.ts.net'],
	},
};

export default config;
