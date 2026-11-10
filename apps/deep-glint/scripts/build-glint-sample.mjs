import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { GLINT_REGIONS, GLINT_SHEET_SIZE, writeGlintSkeleton } from './glint-skeleton.mjs';

const require = createRequire(import.meta.url);
const sharp = require(process.env.KILARA_SHARP_PATH || 'sharp');
const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const handoff = path.resolve(app, '../../../output/ai-game-assets/deep-glint-p0/glint');
const source = path.join(handoff, 'source');
const runtime = path.join(app, 'static/assets/deep-glint/glint');
const exported = path.join(handoff, 'export');
await fs.mkdir(runtime, { recursive: true });
await fs.mkdir(exported, { recursive: true });

// The old framed badge is superseded by runtime Forge text. Preserve its source
// artwork for history, but exclude the obsolete export from the game/build.
await fs.rm(path.join(runtime, 'glint-badge-t1.webp'), { force: true });
await fs.rm(path.join(exported, 'glint-badge-t1.webp'), { force: true });

// Transparent trim and resize only: preserve the image generator's original art and alpha.
for (const [id, masterWidth, masterHeight, width, height] of [
	['glint-tile-t1', 1024, 1024, 240, 240],
	['glint-tile-t2', 1024, 1024, 240, 240],
	['glint-tile-t3', 1024, 1024, 240, 240],
	['glint-tile-t4', 1024, 1024, 240, 240],
]) {
	const master = path.join(source, `${id}.png`);
	await sharp(path.join(source, `${id}-generated.png`))
		.trim({ background: '#00000000', threshold: 8 })
		.resize(masterWidth, masterHeight, { fit: 'fill' })
		.png()
		.toFile(master);
	await sharp(master)
		.resize(width, height)
		.webp({ quality: 92, alphaQuality: 100, effort: 6 })
		.toFile(path.join(runtime, `${id}.webp`));
}

// Four 512 px tile regions with 2 px transparent gutters (GLINT_REGIONS). The procedural star
// lives in a separate strip, outside every tile rectangle, so it cannot bleed
// into the transparent cell centers. Straight alpha, as Pixi expects from a PNG.
const shineSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><defs><radialGradient id="shine"><stop stop-color="white"/><stop offset=".55" stop-color="#fff4c9"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient></defs><path d="M32 2 38 25 62 32 38 39 32 62 26 39 2 32 26 25Z" fill="url(#shine)"/><path d="M32 12 35 29 52 32 35 35 32 52 29 35 12 32 29 29Z" fill="white"/></svg>`;
// A small irregular fissure rather than a framed badge; it stays legible over symbols.
const primedSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><defs><radialGradient id="halo"><stop stop-color="#fff4c4" stop-opacity=".72"/><stop offset=".55" stop-color="#ffc95b" stop-opacity=".25"/><stop offset="1" stop-color="#ffc95b" stop-opacity="0"/></radialGradient><linearGradient id="core" x2=".8" y2="1"><stop stop-color="#fffef2"/><stop offset="1" stop-color="#ffd478"/></linearGradient></defs><circle cx="128" cy="128" r="122" fill="url(#halo)"/><path d="M42 34 104 78 123 48 131 103 187 72 159 118 220 128 162 142 183 196 139 160 123 224 113 163 66 188 91 143 32 133 91 114Z" fill="#80501d" opacity=".75"/><path d="M49 42 108 87 124 58 132 112 186 79 153 122 214 129 155 138 177 188 136 150 123 212 117 150 73 181 99 139 40 133 99 120Z" fill="url(#core)"/><path d="M69 62 112 100 124 83 127 120 162 99 140 127 181 130 140 134 155 165 130 142 123 180 120 142 91 161 107 135 70 132 107 125Z" fill="#fffdf0"/></svg>`;
await fs.writeFile(path.join(source, 'glint-shine.svg'), shineSvg);
await sharp(Buffer.from(shineSvg)).png().toFile(path.join(source, 'glint-shine.png'));
await fs.writeFile(path.join(source, 'glint-primed.svg'), primedSvg);
await sharp(Buffer.from(primedSvg))
	.resize(1024)
	.png()
	.toFile(path.join(source, 'glint-primed.png'));
await sharp(Buffer.from(primedSvg))
	.resize(128)
	.webp({ quality: 95, alphaQuality: 100 })
	.toFile(path.join(runtime, 'glint-primed.webp'));
const images = [];
for (let tier = 1; tier <= 4; tier++) {
	const left = 2 + ((tier - 1) % 2) * 516;
	const top = 2 + Math.floor((tier - 1) / 2) * 516;
	images.push({
		input: await sharp(path.join(source, `glint-tile-t${tier}.png`))
			.resize(512, 512)
			.png()
			.toBuffer(),
		left,
		top,
	});
}
images.push({
	input: path.join(source, 'glint-shine.png'),
	left: GLINT_REGIONS['glint-shine'][0],
	top: GLINT_REGIONS['glint-shine'][1],
});
images.push({
	input: await sharp(Buffer.from(primedSvg)).resize(64).png().toBuffer(),
	left: GLINT_REGIONS['glint-primed'][0],
	top: GLINT_REGIONS['glint-primed'][1],
});
await sharp({
	create: {
		width: GLINT_SHEET_SIZE[0],
		height: GLINT_SHEET_SIZE[1],
		channels: 4,
		background: '#00000000',
	},
})
	.composite(images)
	.png()
	.toFile(path.join(runtime, 'glint.png'));

// The skeleton and frame sheet come from glint-skeleton.mjs (kilara-skeleton v1).
await writeGlintSkeleton(runtime);

const assets = [];
for (const file of [
	'glint-tile-t1.webp',
	'glint-tile-t2.webp',
	'glint-tile-t3.webp',
	'glint-tile-t4.webp',
	'glint-primed.webp',
	'glint.skeleton.json',
	'glint.sheet.json',
	'glint.png',
]) {
	const data = await fs.readFile(path.join(runtime, file));
	assets.push({
		file,
		bytes: data.length,
		sha256: createHash('sha256').update(data).digest('hex'),
	});
	await fs.copyFile(path.join(runtime, file), path.join(exported, file));
}
const manifest = {
	status: 'all-tiers-integrated',
	multiplier: 'Deep Glint Forge Gold bitmap text; no badge frame',
	tiers: [1, 2, 3, 4],
	skeleton: 'kilara-skeleton v1',
	animationsMs: {
		prime: 300,
		light: 400,
		double: 350,
		tier_up: 500,
		max_loop: 1200,
		apply: 500,
		reset: 250,
	},
	turboTimeScale: 2,
	reducedMotion: 'static sprites, opacity fade only',
	assets,
	totalBytes: assets.reduce((sum, entry) => sum + entry.bytes, 0),
};
await fs.writeFile(path.join(exported, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify(manifest, null, 2));
