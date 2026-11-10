import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.resolve(
	app,
	process.env.GLINT_PREVIEW_OUTPUT ||
		'../../../output/ai-game-assets/deep-glint-p0/glint/preview/seamless',
);
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const targets = process.env.GLINT_CAPTURE_EFFECTS
	? [
			['apply-reset', 'components-glintspots--apply-and-reset', { width: 1200, height: 675 }, true],
			['super-start', 'components-glintspots--super-start', { width: 1200, height: 675 }, true],
		]
	: process.env.GLINT_CAPTURE_PRIME
		? [['prime-on-board', 'components-glintspots--prime', { width: 1200, height: 675 }, true]]
		: process.env.GLINT_CAPTURE_TIERS
			? [
					[
						'progression-on-board',
						'components-glintspots--progression',
						{ width: 1200, height: 675 },
						true,
					],
					[
						'progression-turbo',
						'components-glintspots--progression-turbo',
						{ width: 1200, height: 675 },
						true,
					],
					[
						'all-tiers-on-dark',
						'components-glinttiers--all-on-dark',
						{ width: 1000, height: 600 },
						false,
					],
				]
			: [
					['light-on-board', 'components-glintspots--light', { width: 1200, height: 675 }, true],
					[
						'light-on-dark',
						'components-glinttierone--light-on-dark',
						{ width: 400, height: 250 },
						true,
					],
				];
try {
	for (const [label, story, viewport, hasAction] of targets) {
		const page = await browser.newPage({ viewport });
		await page.goto(`http://localhost:6108/iframe.html?id=${story}&viewMode=story`, {
			waitUntil: 'networkidle',
		});
		await page.locator('canvas').waitFor();
		if (hasAction)
			await page.waitForFunction(() =>
				[...document.querySelectorAll('button')].some(
					(button) => button.textContent.trim() === 'Action' && !button.disabled,
				),
			);
		await page.evaluate(() => {
			const stream = document.querySelector('canvas').captureStream(60);
			const recorder = new MediaRecorder(stream, {
				mimeType: 'video/webm;codecs=vp9',
				videoBitsPerSecond: 6000000,
			});
			const chunks = [];
			recorder.ondataavailable = (event) => chunks.push(event.data);
			window.sampleRecording = {
				recorder,
				done: new Promise((resolve) => {
					recorder.onstop = async () => {
						const bytes = new Uint8Array(await new Blob(chunks).arrayBuffer());
						let binary = '';
						for (const byte of bytes) binary += String.fromCharCode(byte);
						stream.getTracks().forEach((track) => track.stop());
						resolve(btoa(binary));
					};
				}),
			};
			recorder.start();
		});
		await page.waitForTimeout(500);
		if (hasAction) {
			await page.getByRole('button', { name: 'Action', exact: true }).click();
			await page.waitForFunction(() =>
				document.querySelector('.message')?.textContent.includes('Action is resolved ✅'),
			);
		}
		await page.waitForTimeout(1100);
		const encoded = await page.evaluate(async () => {
			window.sampleRecording.recorder.stop();
			return await window.sampleRecording.done;
		});
		const webm = path.join(output, `${label}.webm`);
		await fs.writeFile(webm, Buffer.from(encoded, 'base64'));
		execFileSync('ffmpeg', [
			'-y',
			'-loglevel',
			'error',
			'-i',
			webm,
			'-an',
			'-vf',
			'pad=ceil(iw/2)*2:ceil(ih/2)*2',
			'-c:v',
			'libx264',
			'-crf',
			'18',
			'-pix_fmt',
			'yuv420p',
			'-movflags',
			'+faststart',
			path.join(output, `${label}.mp4`),
		]);
		await fs.unlink(webm);
		await page.addStyleTag({
			content: '.wrap:has(>button.action), .sample-controls { visibility: hidden!important; }',
		});
		await page.screenshot({ path: path.join(output, `${label}.png`) });
		await page.close();
		console.log(label);
	}
} finally {
	await browser.close();
}
