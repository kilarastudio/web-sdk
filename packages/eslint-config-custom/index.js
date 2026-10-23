const js = require('@eslint/js');
const typescript = require('@typescript-eslint/eslint-plugin');
const parser = require('@typescript-eslint/parser');
const svelte = require('eslint-plugin-svelte');
const globals = require('globals');
const prettier = require('eslint-config-prettier');
const turbo = require('eslint-config-turbo/flat').default;

module.exports = [
	{
		ignores: [
			'**/node_modules/**',
			'**/dist/**',
			'**/build/**',
			'**/.svelte-kit/**',
			'**/.turbo/**',
			'**/storybook-static/**',
			'**/src/stories/data/**',
			'**/src/i18n/locales/**',
		],
	},
	js.configs.recommended,
	...typescript.configs['flat/recommended'],
	...svelte.configs['flat/base'],
	...turbo,
	{
		languageOptions: { globals: { ...globals.browser, ...globals.node } },
		rules: {
			// The SDK exposes generic event payloads and retains legacy TypeScript suppressions.
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/ban-ts-comment': 'off',
			'@typescript-eslint/no-unused-expressions': ['error', { allowTernary: true }],
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{ argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
			],
			'prefer-const': 'warn',
			'no-empty': ['error', { allowEmptyCatch: true }],
		},
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: { parserOptions: { parser, extraFileExtensions: ['.svelte'] } },
	},
	{
		files: ['**/*.js', '**/*.cjs'],
		rules: { '@typescript-eslint/no-require-imports': 'off' },
	},
	prettier,
];
