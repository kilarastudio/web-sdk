// Assemble existing art into editable OpenRaster stacks and a Spine import kit.
// The generated tiles are flattened originals; these stacks do not invent missing paint layers.
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const require = createRequire(import.meta.url);
const sharp = require(process.env.KILARA_SHARP_PATH || 'sharp');
const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const glint = path.resolve(app, '../../../output/ai-game-assets/deep-glint-p0/glint');
const kit = path.join(glint, 'production-handoff');
const source = path.join(glint, 'source');
const runtime = path.join(app, 'static/assets/deep-glint');
const images = path.join(kit, 'spine-import/images');
for (const dir of ['layers', 'originals', 'spine-import/images', 'runtime', 'font'])
	await fs.mkdir(path.join(kit, dir), { recursive: true });

// Atlas crops preserve the exact 4.2 runtime texels and attachment names.
const regions = [
	['glint-tile-t1', 2, 2, 512, 512],
	['glint-tile-t2', 518, 2, 512, 512],
	['glint-tile-t3', 2, 518, 512, 512],
	['glint-tile-t4', 518, 518, 512, 512],
	['glint-shine', 1034, 2, 64, 64],
	['glint-primed', 1034, 70, 64, 64],
];
for (const [name, left, top, width, height] of regions)
	await sharp(path.join(runtime, 'glint/glint.png'))
		.extract({ left, top, width, height })
		.png()
		.toFile(path.join(images, `${name}.png`));
const skeleton = JSON.parse(await fs.readFile(path.join(runtime, 'glint/glint.json'), 'utf8'));
skeleton.skeleton.images = './images/';
await fs.writeFile(
	path.join(kit, 'spine-import/glint.json'),
	JSON.stringify(skeleton, null, 2) + '\n',
);

for (const file of [
	'glint.json',
	'glint.atlas',
	'glint.png',
	'glint-primed.webp',
	'glint-tile-t1.webp',
	'glint-tile-t2.webp',
	'glint-tile-t3.webp',
	'glint-tile-t4.webp',
])
	await fs.copyFile(path.join(runtime, 'glint', file), path.join(kit, 'runtime', file));
for (const file of [
	'deep-glint-forge-gold.fnt',
	'deep-glint-forge-gold.png',
	'deep-glint-forge-ink.fnt',
	'deep-glint-forge-ink.png',
	'manifest.json',
])
	await fs.copyFile(path.join(runtime, 'fonts', file), path.join(kit, 'font', file));
await fs.copyFile(
	path.join(app, 'scripts/font/deep-glint-forge.mjs'),
	path.join(kit, 'font/deep-glint-forge.mjs'),
);

// ORA keeps the approved PNG byte-for-byte as the visible base. The original
// imagegen artwork is flattened: the optional hidden light is a copy, not a
// recovered highlight layer. Shine and primed are independent existing art.
for (const tier of [1, 2, 3, 4]) {
	const id = `glint-tile-t${tier}`;
	await fs.copyFile(
		path.join(source, `${id}-generated.png`),
		path.join(kit, 'originals', `${id}-generated.png`),
	);
	await fs.copyFile(
		path.join(source, `${id}.png`),
		path.join(kit, 'originals', `${id}-master.png`),
	);
	const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'deep-glint-ora-'));
	try {
		await fs.mkdir(path.join(temp, 'data'));
		const base = path.join(source, `${id}.png`);
		await fs.writeFile(path.join(temp, 'mimetype'), 'image/openraster');
		await fs.copyFile(base, path.join(temp, 'mergedimage.png'));
		await fs.copyFile(base, path.join(temp, 'data/base.png'));
		await fs.copyFile(base, path.join(temp, 'data/light-copy.png'));
		await fs.copyFile(path.join(source, 'glint-shine.png'), path.join(temp, 'data/shine-a.png'));
		await fs.copyFile(path.join(source, 'glint-shine.png'), path.join(temp, 'data/shine-b.png'));
		const xml = `<?xml version="1.0" encoding="UTF-8"?><image version="0.0.3" w="1024" h="1024" name="${id}"><stack><layer name="Shine B - optional" src="data/shine-b.png" x="92" y="868" opacity="1.0" visibility="hidden" composite-op="svg:src-over"/><layer name="Shine A - optional" src="data/shine-a.png" x="868" y="92" opacity="1.0" visibility="hidden" composite-op="svg:src-over"/><layer name="Light - copy of flattened tile" src="data/light-copy.png" x="0" y="0" opacity="0.45" visibility="hidden" composite-op="svg:src-over"/><layer name="Tile - flattened master" src="data/base.png" x="0" y="0" opacity="1.0" visibility="visible" composite-op="svg:src-over"/></stack></image>`;
		await fs.writeFile(path.join(temp, 'stack.xml'), xml);
		const target = path.join(kit, 'layers', `${id}.ora`);
		await fs.rm(target, { force: true });
		execFileSync('zip', ['-q', '-0', '-X', target, 'mimetype'], { cwd: temp });
		execFileSync('zip', ['-q', '-X', '-r', target, 'stack.xml', 'mergedimage.png', 'data'], {
			cwd: temp,
		});
	} finally {
		await fs.rm(temp, { recursive: true, force: true });
	}
}
await fs.copyFile(path.join(source, 'glint-primed.svg'), path.join(kit, 'layers/glint-primed.svg'));
await fs.copyFile(path.join(source, 'glint-primed.png'), path.join(kit, 'layers/glint-primed.png'));
await fs.copyFile(path.join(source, 'glint-shine.svg'), path.join(kit, 'layers/glint-shine.svg'));
await fs.copyFile(path.join(source, 'glint-shine.png'), path.join(kit, 'layers/glint-shine.png'));
for (const file of ['prompts.json', 'tier-prompts.json'])
	await fs.copyFile(path.join(glint, file), path.join(kit, 'originals', file));

async function inventory(dir, prefix = '') {
	const entries = [];
	for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
		const rel = path.posix.join(prefix, entry.name);
		if (entry.isDirectory()) entries.push(...(await inventory(path.join(dir, entry.name), rel)));
		else if (entry.name !== 'manifest.json' || prefix) {
			const bytes = await fs.readFile(path.join(dir, entry.name));
			entries.push({
				path: rel,
				bytes: bytes.length,
				sha256: createHash('sha256').update(bytes).digest('hex'),
			});
		}
	}
	return entries.sort((a, b) => a.path.localeCompare(b.path));
}
await fs.writeFile(
	path.join(kit, 'manifest.json'),
	JSON.stringify(
		{
			generatedAt: new Date().toISOString(),
			sourceVersion: 'Spine runtime 4.2.120',
			nativeSpineProject: false,
			originalTileLayersRecovered: false,
			files: await inventory(kit),
		},
		null,
		2,
	) + '\n',
);
console.log(`Handoff assembled at ${kit}`);
