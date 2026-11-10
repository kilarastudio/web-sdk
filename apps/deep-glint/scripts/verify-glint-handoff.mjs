import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const sharp = createRequire(import.meta.url)(process.env.KILARA_SHARP_PATH || 'sharp');
const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const glint = path.resolve(app, '../../../output/ai-game-assets/deep-glint-p0/glint');
const kit = path.join(glint, 'production-handoff');
const manifest = JSON.parse(await fs.readFile(path.join(kit, 'manifest.json'), 'utf8'));
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const report = { layers: [], atlasRegions: [], files: manifest.files.length };
for (const entry of manifest.files) {
	const bytes = await fs.readFile(path.join(kit, entry.path));
	assert.equal(bytes.length, entry.bytes, entry.path);
	assert.equal(hash(bytes), entry.sha256, entry.path);
}
for (let tier = 1; tier <= 4; tier++) {
	const archive = path.join(kit, `layers/glint-tile-t${tier}.ora`);
	execFileSync('unzip', ['-tqq', archive]);
	const read = (name) =>
		execFileSync('unzip', ['-p', archive, name], { maxBuffer: 8 * 1024 * 1024 });
	assert.equal(read('mimetype').toString(), 'image/openraster');
	const xml = read('stack.xml').toString();
	assert.equal((xml.match(/<layer /g) || []).length, 4);
	assert.equal((xml.match(/visibility="visible"/g) || []).length, 1);
	const master = await fs.readFile(path.join(kit, `originals/glint-tile-t${tier}-master.png`));
	assert.equal(hash(read('mergedimage.png')), hash(master));
	assert.equal(hash(read('data/base.png')), hash(master));
	assert.equal(hash(read('data/light-copy.png')), hash(master));
	const dimensions = await sharp(master).metadata();
	assert.equal(dimensions.width, 1024);
	assert.equal(dimensions.height, 1024);
	report.layers.push({ tier, layers: 4, defaultCompositeMatchesMaster: true });
}
const atlas = path.join(kit, 'runtime/glint.png');
for (const [name, left, top, width, height] of [
	['glint-tile-t1', 2, 2, 512, 512],
	['glint-tile-t2', 518, 2, 512, 512],
	['glint-tile-t3', 2, 518, 512, 512],
	['glint-tile-t4', 518, 518, 512, 512],
	['glint-shine', 1034, 2, 64, 64],
	['glint-primed', 1034, 70, 64, 64],
]) {
	const a = await sharp(atlas).extract({ left, top, width, height }).ensureAlpha().raw().toBuffer();
	const b = await sharp(path.join(kit, `spine-import/images/${name}.png`))
		.ensureAlpha()
		.raw()
		.toBuffer();
	assert(a.equals(b), name);
	report.atlasRegions.push({ name, width, height, pixelMatch: true });
}
const runtime = JSON.parse(await fs.readFile(path.join(kit, 'runtime/glint.json'), 'utf8'));
const candidate = JSON.parse(await fs.readFile(path.join(kit, 'spine-import/glint.json'), 'utf8'));
assert.equal(candidate.skeleton.images, './images/');
candidate.skeleton.images = runtime.skeleton.images;
assert.deepEqual(candidate, runtime);
for (const name of ['prime', 'light', 'double', 'tier_up', 'max_loop', 'apply', 'reset'])
	assert(runtime.animations[name], name);
report.spineEditorImportTested = false;
report.nativeSpineProject = false;
report.passed = true;
await fs.writeFile(
	path.join(glint, 'verification/production-handoff.json'),
	JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
