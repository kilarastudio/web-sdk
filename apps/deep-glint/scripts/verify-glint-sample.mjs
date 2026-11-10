import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.resolve(app, '../../../output/ai-game-assets/deep-glint-p0/glint/verification');
const base = process.env.GLINT_STORYBOOK_URL || 'http://localhost:6108';
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const report = { tests: [], errors: [], httpErrors: [], consoleErrors: [], knownWarnings: [] };
const viewports = [
	{ width: 1200, height: 675 },
	{ width: 400, height: 225 },
];

async function openStory(id, viewport, reducedMotion = 'no-preference') {
	const context = await browser.newContext({ viewport, reducedMotion });
	const page = await context.newPage();
	page.on('pageerror', (error) => report.errors.push({ id, error: error.message }));
	page.on('console', (message) => {
		if (message.type() !== 'error') return;
		const entry = { id, error: message.text(), url: message.location().url };
		// Storybook has no favicon. Keep this visible in the report without confusing it
		// with a failed game asset or runtime exception.
		if (entry.url === `${base}/favicon.ico`) report.knownWarnings.push(entry);
		else report.consoleErrors.push(entry);
	});
	page.on('response', (response) => {
		if (response.status() >= 400)
			report.httpErrors.push({ id, url: response.url(), status: response.status() });
	});
	await page.goto(`${base}/iframe.html?id=${id}&viewMode=story`, { waitUntil: 'networkidle' });
	await page.locator('canvas').waitFor({ state: 'visible' });
	await page.waitForFunction(() => {
		const button = [...document.querySelectorAll('button')].find(
			(node) => node.textContent.trim() === 'Action',
		);
		return button && !button.disabled;
	});
	return { context, page };
}

try {
	for (const viewport of viewports) {
		for (const reducedMotion of ['no-preference', 'reduce']) {
			for (const story of ['light', 'light-turbo', 'light-multiple', 'tier-comparison']) {
				if (reducedMotion === 'reduce' && !['light', 'light-turbo'].includes(story)) continue;
				const id = `components-glintspots--${story}`;
				const { context, page } = await openStory(id, viewport, reducedMotion);
				try {
					await page.getByRole('button', { name: 'Action', exact: true }).click();
					await page.waitForFunction(
						() => document.querySelector('.message')?.textContent === 'ⓘ Action is resolved ✅',
						null,
						{ timeout: 10000 },
					);
					assert(await page.getByRole('button', { name: 'Action', exact: true }).isEnabled());
					const glint = await page.evaluate(async () =>
						(await import('/src/game/stateGame.svelte.ts')).stateGame.glint.map((column) => [
							...column,
						]),
					);
					assert.equal(
						glint.flat().filter((value) => value === 2).length,
						story === 'light-multiple' ? 3 : 1,
					);
					await page.addStyleTag({
						content: '.wrap:has(>button.action){visibility:hidden!important}',
					});
					const screenshot = `${story}-${viewport.width}x${viewport.height}-${reducedMotion}.png`;
					await page.screenshot({ path: path.join(output, screenshot) });
					report.tests.push({ story, viewport, reducedMotion, actionResolved: true, screenshot });
					console.log('PASS', story, viewport.width, reducedMotion);
				} finally {
					await context.close();
				}
			}
		}
	}

	const { context, page } = await openStory('components-glintspots--light', viewports[0]);
	try {
		// Exercise the actual event handler: await animation completion, keep values intact,
		// animate doubles and resolve when reset during playback.
		report.eventContract = await page.evaluate(
			async (stateBetModule) => {
				// Vite adds HMR timestamps to modules after edits. Import the URL
				// already used by the game, not a second copy of its state singleton.
				const importLive = (pathname) => {
					const resource = performance
						.getEntriesByType('resource')
						.findLast((entry) => new URL(entry.name).pathname === pathname);
					return import(resource?.name || pathname);
				};
				const { stateGame, emptyGlint } = await importLive('/src/game/stateGame.svelte.ts');
				const { glintSkeleton } = await importLive('/src/game/glint.ts');
				const { playBookEvent } = await importLive('/src/game/utils.ts');
				const { stateBet } = await importLive(stateBetModule);
				const nextFrame = () =>
					new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
				const timings = [];
				for (const turbo of [false, true]) {
					stateBet.isTurbo = turbo;
					stateGame.glint = emptyGlint();
					stateGame.glint[2][2] = 1;
					await nextFrame();
					const glint = emptyGlint();
					glint[2][2] = 2;
					const start = performance.now();
					await playBookEvent({ index: 0, type: 'updateGlint', glint }, { bookEvents: [] });
					timings.push({
						turbo,
						elapsedMs: performance.now() - start,
						value: stateGame.glint[2][2],
					});
				}
				stateBet.isTurbo = false;
				const glint = emptyGlint();
				glint[2][2] = 4;
				const start = performance.now();
				await playBookEvent({ index: 0, type: 'updateGlint', glint }, { bookEvents: [] });
				const doubleElapsedMs = performance.now() - start;
				stateGame.glint = emptyGlint();
				stateGame.glint[2][2] = 1;
				await nextFrame();
				const lit = emptyGlint();
				lit[2][2] = 2;
				const playback = playBookEvent(
					{ index: 0, type: 'updateGlint', glint: lit },
					{ bookEvents: [] },
				);
				await nextFrame();
				stateGame.glint = emptyGlint();
				await playback;
				return {
					timings,
					doubleElapsedMs,
					resetResolved: true,
					resetValues: stateGame.glint.flat(),
					skeleton: {
						width: glintSkeleton.bounds.width,
						height: glintSkeleton.bounds.height,
						duration: glintSkeleton.animations.light.duration,
					},
				};
			},
			'/@fs' + path.resolve(app, '../../packages/state-shared/src/stateBet.svelte.ts'),
		);
		assert(Math.abs(report.eventContract.skeleton.duration - 0.4) < 0.00001);
		assert.equal(report.eventContract.skeleton.width, 100);
		assert.equal(report.eventContract.skeleton.height, 100);
		for (const timing of report.eventContract.timings) {
			assert.equal(timing.value, 2);
			assert(timing.elapsedMs >= (timing.turbo ? 180 : 360) && timing.elapsedMs < 1200);
		}
		assert(
			report.eventContract.doubleElapsedMs >= 315 && report.eventContract.doubleElapsedMs < 1000,
		);
		assert(report.eventContract.resetValues.every((value) => value === 0));
		console.log('PASS event contract', JSON.stringify(report.eventContract));
	} finally {
		await context.close();
	}

	for (const viewport of viewports) {
		const { context, page } = await openStory('components-glinttierone--light-on-dark', viewport);
		try {
			await page.getByRole('button', { name: 'Action', exact: true }).click();
			await page.waitForFunction(
				() => document.querySelector('.message')?.textContent === 'Action is resolved ✅',
				null,
				{ timeout: 10000 },
			);
			report.tests.push({ story: 'light-on-dark', viewport, actionResolved: true });
		} finally {
			await context.close();
		}
	}
} catch (error) {
	report.failure = error.stack;
	process.exitCode = 1;
} finally {
	await browser.close();
	await fs.writeFile(path.join(output, 'browser-qa.json'), JSON.stringify(report, null, 2) + '\n');
	console.log(JSON.stringify(report, null, 2));
	if (report.errors.length || report.httpErrors.length || report.consoleErrors.length)
		process.exitCode = 1;
}
