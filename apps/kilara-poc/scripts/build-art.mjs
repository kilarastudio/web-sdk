import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';

// Uses an optional local Sharp installation; the browser consumes only the generated WebP files.
const require = createRequire(import.meta.url);
// a local art tool run by hand, not a turbo task, so its environment is no build input
// eslint-disable-next-line turbo/no-undeclared-env-vars
const sharp = require(process.env.KILARA_SHARP_PATH || 'sharp');
const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const version = 'kilara-mine-v4';
const source = path.resolve(app, `../../../output/ai-game-assets/${version}/source`);
const publicDir = path.join(app, 'static/assets/ai', version);
const runtime = path.join(publicDir, 'runtime');
await fs.mkdir(runtime, { recursive: true });

const symbols = {
	symbolH1: 'symbol-h1-gold-ore',
	symbolH2: 'symbol-h2-ruby-ore',
	symbolH3: 'symbol-h3-emerald-ore',
	symbolH4: 'symbol-h4-amethyst-ore',
	symbolL1: 'symbol-l1-k-copper',
	symbolL2: 'symbol-l2-q-steel',
	symbolL3: 'symbol-l3-j-tin',
	symbolScatter: 'symbol-scatter',
	symbolMultiplierLow: 'symbol-multiplier-low',
	symbolMultiplierMid: 'symbol-multiplier-mid',
	symbolMultiplierHigh: 'symbol-multiplier-high',
};
const panels = {
	panelTumble: 'panel-tumble',
	panelGlobalMultiplier: 'panel-global-multiplier',
	panelFreeSpinsIntro: 'panel-free-spins-intro',
	panelFreeSpinsOutro: 'panel-free-spins-outro',
	celebrationBig: 'celebration-big',
	celebrationSuper: 'celebration-super',
	celebrationMega: 'celebration-mega',
	celebrationEpic: 'celebration-epic',
	celebrationMax: 'celebration-max',
};
const panelV1 = JSON.parse(
	await fs.readFile(path.join(app, 'static/assets/ai/kilara-mine-panels-v1/manifest.json'), 'utf8'),
);
const entries = [];
const generated = { panels: {}, character: null, background: { width: 2560, height: 1440 } };

async function bounds(input) {
	const { data, info } = await sharp(input)
		.ensureAlpha()
		.raw()
		.toBuffer({ resolveWithObject: true });
	let left = info.width,
		top = info.height,
		right = 0,
		bottom = 0;
	for (let y = 0; y < info.height; y++)
		for (let x = 0; x < info.width; x++) {
			if (data[(y * info.width + x) * info.channels + 3] < 128) continue;
			left = Math.min(left, x);
			top = Math.min(top, y);
			right = Math.max(right, x + 1);
			bottom = Math.max(bottom, y + 1);
		}
	if (right <= left || bottom <= top) throw Error('Empty image: ' + input);
	return [left, top, right, bottom];
}

async function save(key, id, pipeline, group, sourcePath = path.join(source, id + '.png')) {
	const file = id + '.webp';
	const output = path.join(runtime, file);
	await pipeline
		.webp({ quality: group === 'background' ? 84 : 90, alphaQuality: 100, effort: 6 })
		.toFile(output);
	const meta = await sharp(output).metadata();
	const sourceMeta = await sharp(sourcePath).metadata();
	const data = await fs.readFile(output);
	const entry = {
		key,
		file: 'runtime/' + file,
		group,
		width: meta.width,
		height: meta.height,
		bytes: data.length,
		sourceBytes: (await fs.stat(sourcePath)).size,
		sourceWidth: sourceMeta.width,
		sourceHeight: sourceMeta.height,
		upscaled: meta.width > sourceMeta.width || meta.height > sourceMeta.height,
		sha256: createHash('sha256').update(data).digest('hex'),
		content: await bounds(output),
	};
	entries.push(entry);
	return entry;
}

for (const [key, id] of Object.entries(symbols)) {
	const input = path.join(source, id + '.png');
	const [l, t, r, b] = await bounds(input);
	const extracted = await sharp(input)
		.extract({ left: l, top: t, width: r - l, height: b - t })
		.resize(224, 224, { fit: 'inside' })
		.toBuffer();
	const e = await sharp(extracted).metadata();
	const pipeline = sharp({
		create: { width: 256, height: 256, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
	}).composite([
		{
			input: extracted,
			left: Math.floor((256 - e.width) / 2),
			top: Math.floor((256 - e.height) / 2),
		},
	]);
	await save(key, id, pipeline, 'symbol');
}

for (const [key, id] of Object.entries(panels)) {
	const input = path.join(source, id + '.png');
	const entry = await save(key, id, sharp(input).resize({ width: 2048 }), 'panel');
	const prior = panelV1.assets.find((a) => a.file === id + '.png');
	const before = prior.contentBoundsAtAlpha128Px;
	const text = prior.textSafeBoundsPx.map((v, i) => {
		const axis = i % 2;
		return Math.round(
			entry.content[axis] +
				((v - before[axis]) / (before[axis + 2] - before[axis])) *
					(entry.content[axis + 2] - entry.content[axis]),
		);
	});
	entry.text = text;
	generated.panels[key] = { size: [entry.width, entry.height], content: entry.content, text };
}

for (const [key, id] of [
	['backgroundBase', 'background-base'],
	['backgroundBonus', 'background-bonus'],
]) {
	await save(
		key,
		id,
		sharp(path.join(source, id + '.png')).resize(2560, 1440, { fit: 'fill' }),
		'background',
	);
}

const character = await save(
	'characterIdle',
	'character-idle',
	sharp(path.join(source, 'character-idle.png'))
		.resize({ height: 1168 })
		.extend({
			top: 16,
			bottom: 16,
			left: 16,
			right: 16,
			background: { r: 0, g: 0, b: 0, alpha: 0 },
		}),
	'character',
);
generated.character = {
	width: character.width,
	height: character.height,
	figure: {
		left: character.content[0],
		top: character.content[1],
		right: character.content[2],
		bottom: character.content[3],
	},
};
await save(
	'boardFrame',
	'board-frame',
	sharp(path.join(source, 'board-frame.png')).resize(1374, 1145, { fit: 'fill' }),
	'frame',
);

// Compatibility for existing SDK component stories, not newly generated release symbols.
for (const [key, id] of [
	['symbolH5', 'symbol-h5-lantern'],
	['symbolL4', 'symbol-l4-spade'],
	['symbolWild', 'symbol-wild'],
]) {
	const input = path.join(app, 'static/assets/ai/kilara-mine-v2', id + '.png');
	await save(key, id, sharp(input).resize(256, 256), 'legacy-story', input);
}

const totalBytes = entries.reduce((n, a) => n + a.bytes, 0);
await fs.writeFile(
	path.join(publicDir, 'manifest.json'),
	JSON.stringify(
		{
			version,
			encoding: 'WebP',
			regularSymbols: Object.keys(symbols).slice(0, 7),
			totalBytes,
			assets: entries,
		},
		null,
		2,
	) + '\n',
);
await fs.writeFile(
	path.join(app, 'src/game/art.generated.ts'),
	'// Generated by scripts/build-art.mjs. Layout coordinates are in runtime texture pixels.\n' +
		'export const ART_PANELS = ' +
		JSON.stringify(generated.panels, null, 2) +
		' as const;\n' +
		'export const CHARACTER_ART = ' +
		JSON.stringify(generated.character, null, 2) +
		' as const;\n' +
		'export const BACKGROUND_ART = ' +
		JSON.stringify(generated.background) +
		' as const;\n',
);
console.log(
	JSON.stringify(
		{ assets: entries.length, regularSymbols: 7, totalBytes, megabytes: totalBytes / 1e6 },
		null,
		2,
	),
);
