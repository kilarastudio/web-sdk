#!/usr/bin/env node
// Checks the translations of the shared UI and of each game against the text the code uses.
//
//   node tools/i18n/check.mjs            every layer: missing, unused and broken entries
//   node tools/i18n/check.mjs --keys     prints each layer's keys with where they are used (JSON)
//
// Two layers, each with one catalog per language in <layer>/i18n/locales/<lang>.ts:
//   ui        packages/components-ui-html/src: HUD, menus, autoplay, settings, errors (every game)
//   <game>    apps/<game>/src: that game's own text; a key it shares with ui overrides ui
// A key is the English text inside translate(...), t(...), translateSafe(...) or i18nKey(...).
// English needs no catalog. Exits 1 when a catalog lacks a key or breaks a {placeholder}.

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const LOCALES = [
	...fs
		.readFileSync(path.join(ROOT, 'packages/config-lingui/index.ts'), 'utf8')
		.matchAll(/^\s*"([a-z]{2})",?$/gm),
].map((match) => match[1]);
// a translation may leave these out and write the word itself, in the form its sentence needs
// (only real-money play has other languages, so {amount} is always "bet" there)
const OPTIONAL_PLACEHOLDERS = new Set(['amount']);

const ui = {
	name: 'ui',
	src: path.join(ROOT, 'packages/components-ui-html/src'),
	locales: path.join(ROOT, 'packages/components-ui-html/src/i18n/locales'),
};
const games = fs
	.readdirSync(path.join(ROOT, 'apps'))
	.filter((app) => fs.existsSync(path.join(ROOT, 'apps', app, 'src/i18n/locales')))
	.map((app) => ({
		name: app,
		src: path.join(ROOT, 'apps', app, 'src'),
		locales: path.join(ROOT, 'apps', app, 'src/i18n/locales'),
	}));
const layers = [ui, ...games];

const walk = (dir) =>
	fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory())
			return ['node_modules', 'stories', 'locales', 'messagesMap'].includes(entry.name)
				? []
				: walk(full);
		return /\.(ts|svelte)$/.test(entry.name) && !/\.stories\./.test(entry.name) ? [full] : [];
	});

const unquote = (literal) => {
	const quote = literal[0];
	const body = literal.slice(1, -1);
	return body.replace(/\\(.)/g, (_, char) => (char === 'n' ? '\n' : char === quote ? quote : char));
};

const STRING = /'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`/g;
const CALL = /(?<![\w.])(?:stateI18nDerived\.translate|translateSafe|translate|i18nKey|t)\(/g;

// the first argument of a call starting at `from`: up to its top-level comma or closing bracket
const firstArgument = (code, from) => {
	let depth = 0;
	for (let at = from; at < code.length; at++) {
		const char = code[at];
		if (char === "'" || char === '"' || char === '`') {
			STRING.lastIndex = at;
			const match = STRING.exec(code);
			if (match && match.index === at) at += match[0].length - 1;
			continue;
		}
		if ('([{'.includes(char)) depth++;
		if (')]}'.includes(char)) {
			if (depth === 0) return code.slice(from, at);
			depth--;
		}
		if (char === ',' && depth === 0) return code.slice(from, at);
	}
	return code.slice(from);
};

const keysOf = (layer) => {
	const keys = new Map();
	const dynamic = [];
	for (const file of walk(layer.src)) {
		const code = fs.readFileSync(file, 'utf8');
		for (const call of code.matchAll(CALL)) {
			const argument = firstArgument(code, call.index + call[0].length);
			const literals = argument.match(STRING) ?? [];
			const line = code.slice(0, call.index).split('\n').length;
			const where = `${path.relative(ROOT, file)}:${line}`;
			if (!literals.length) {
				if (!/^\s*\w+\s*$/.test(argument)) continue;
				dynamic.push(`${where} ${argument.trim()}`);
				continue;
			}
			for (const literal of literals) {
				if (literal.startsWith('`') && literal.includes('${')) {
					dynamic.push(`${where} ${literal}`);
					continue;
				}
				const key = unquote(literal);
				if (!keys.has(key)) keys.set(key, []);
				keys.get(key).push(where);
			}
		}
	}
	return { keys, dynamic };
};

const readCatalog = (file) => {
	if (!fs.existsSync(file)) return undefined;
	const body = fs
		.readFileSync(file, 'utf8')
		.replace(/^\s*\/\/.*$/gm, '')
		.replace(/export default/, 'return')
		.replace(/\s+satisfies\s+\w+\s*;?\s*$/, ';');
	return new Function(body)();
};

const placeholders = (text) => new Set([...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]));

const found = Object.fromEntries(layers.map((layer) => [layer.name, keysOf(layer)]));

if (process.argv.includes('--keys')) {
	const out = Object.fromEntries(
		layers.map((layer) => [
			layer.name,
			Object.fromEntries([...found[layer.name].keys].map(([key, where]) => [key, where])),
		]),
	);
	console.log(JSON.stringify(out, null, 2));
	process.exit(0);
}

let errors = 0;
const report = [];
for (const layer of layers) {
	const { keys, dynamic } = found[layer.name];
	report.push(`\n${layer.name}: ${keys.size} keys (${path.relative(ROOT, layer.locales)})`);
	for (const entry of dynamic) report.push(`  note  key not checked (no literal): ${entry}`);
	if (layer !== ui) {
		const shared = [...keys.keys()].filter((key) => found.ui.keys.has(key));
		if (shared.length)
			report.push(
				`  note  also a ui key, this game's text wins: ${shared.map((k) => JSON.stringify(k)).join(', ')}`,
			);
	}
	for (const lang of LOCALES.filter((lang) => lang !== 'en')) {
		const catalog = readCatalog(path.join(layer.locales, `${lang}.ts`));
		if (!catalog) {
			report.push(`  ERROR ${lang}: no catalog file`);
			errors++;
			continue;
		}
		// a game may leave a key it shares with ui to the ui catalog
		const uiCatalog = layer === ui ? {} : (readCatalog(path.join(ui.locales, `${lang}.ts`)) ?? {});
		const missing = [...keys.keys()].filter((key) => !(key in catalog) && !(key in uiCatalog));
		const unused = Object.keys(catalog).filter((key) => !keys.has(key));
		const broken = Object.entries(catalog).flatMap(([key, text]) => {
			if (typeof text !== 'string' || !text.trim()) return [`${JSON.stringify(key)}: empty`];
			const want = placeholders(key);
			const have = placeholders(text);
			const extra = [...have].filter((name) => !want.has(name));
			const lost = [...want].filter((name) => !have.has(name) && !OPTIONAL_PLACEHOLDERS.has(name));
			return extra.length || lost.length
				? [
						`${JSON.stringify(key)}: placeholders ${[...extra.map((n) => `+{${n}}`), ...lost.map((n) => `-{${n}}`)].join(' ')}`,
					]
				: [];
		});
		if (missing.length) errors++;
		if (broken.length) errors++;
		const status = missing.length || broken.length ? 'ERROR' : 'ok   ';
		report.push(
			`  ${status} ${lang}: ${keys.size - missing.length}/${keys.size}` +
				(unused.length ? `, ${unused.length} unused` : ''),
		);
		for (const key of missing) report.push(`          missing ${JSON.stringify(key)}`);
		for (const line of broken) report.push(`          broken  ${line}`);
		for (const key of unused) report.push(`          unused  ${JSON.stringify(key)}`);
	}
}

console.log(report.join('\n'));
process.exit(errors ? 1 : 0);
