import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = process.env.GLINT_STORYBOOK_URL || 'http://localhost:6108';
const output = path.resolve(
	app,
	'../../../output/ai-game-assets/deep-glint-p0/glint/verification/primed',
);
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const report = { views: [], contracts: [], errors: [] };
try {
	for (const viewport of [
		{ width: 1200, height: 675 },
		{ width: 390, height: 844 },
		{ width: 400, height: 225 },
	]) {
		const page = await browser.newPage({ viewport });
		page.on('pageerror', (e) => report.errors.push(e.message));
		page.on('response', (r) => {
			if (r.status() >= 400 && !r.url().endsWith('/favicon.ico'))
				report.errors.push(`${r.status()} ${r.url()}`);
		});
		await page.goto(
			`${base}/iframe.html?id=components-glintspots--prime&viewMode=story`,
			{ waitUntil: 'networkidle' },
		);
		await page.getByRole('button', { name: 'Action', exact: true }).click();
		await page.waitForFunction(() =>
			document.querySelector('.message')?.textContent.includes('Action is resolved ✅'),
		);
		await page.addStyleTag({ content: '.wrap:has(>button.action){visibility:hidden!important}' });
		await page.screenshot({ path: path.join(output, `board-${viewport.width}.png`) });
		report.views.push(viewport);
		await page.close();
	}
	for (const reducedMotion of ['no-preference', 'reduce']) {
		const page = await browser.newPage({ viewport: { width: 1200, height: 675 }, reducedMotion });
		await page.addInitScript(() => {
			window.__PIXI_APP_INIT__ = (app) => {
				window.qaApp = app;
			};
		});
		page.on('pageerror', (e) => report.errors.push(e.message));
		await page.goto(
			`${base}/iframe.html?id=components-glintspots--prime&viewMode=story`,
			{ waitUntil: 'networkidle' },
		);
		const result = await page.evaluate(
			async (stateBetPath) => {
				const live = (p) =>
					import(
						performance.getEntriesByType('resource').findLast((e) => new URL(e.name).pathname === p)
							?.name || p
					);
				const { stateGame, emptyGlint } = await live('/src/game/stateGame.svelte.ts');
				const { playBookEvent } = await live('/src/game/utils.ts');
				const { stateBet } = await live(stateBetPath);
				const frame = () =>
					new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
				const grid = (v) => {
					const g = emptyGlint();
					g[2][2] = v;
					return g;
				};
				const play = (v) =>
					playBookEvent({ index: 0, type: 'updateGlint', glint: grid(v) }, { bookEvents: [] });
				const spines = () => {
					const walk = (n) => [n, ...(n.children || []).flatMap(walk)];
					return walk(window.qaApp.stage).filter((n) => n.label === 'skeleton:glint');
				};
				const timings = [];
				for (const turbo of [false, true]) {
					stateBet.isTurbo = turbo;
					stateGame.glint = emptyGlint();
					await frame();
					const start = performance.now();
					const p = play(1);
					await frame();
					const active = spines().map((n) => n.animationState.current?.name);
					await p;
					timings.push({
						turbo,
						elapsed: performance.now() - start,
						value: stateGame.glint[2][2],
						active,
					});
				}
				stateBet.isTurbo = false;
				stateGame.glint = emptyGlint();
				await frame();
				const interrupted = play(1);
				await frame();
				stateGame.glint = emptyGlint();
				await interrupted;
				await frame();
				const resetSpines = spines().length;
				const first = play(1);
				await frame();
				const second = play(2);
				await Promise.all([first, second]);
				return { timings, resetSpines, final: stateGame.glint[2][2] };
			},
			'/@fs' + path.resolve(app, '../../packages/state-shared/src/stateBet.svelte.ts'),
		);
		for (const t of result.timings) {
			assert.equal(t.value, 1);
			assert(t.elapsed >= (t.turbo ? 110 : 255) && t.elapsed < 850, JSON.stringify(t));
			assert.equal(t.active.includes('prime'), reducedMotion !== 'reduce');
		}
		assert.equal(result.resetSpines, 0);
		assert.equal(result.final, 2);
		report.contracts.push({ reducedMotion, ...result });
		await page.close();
	}
	assert.deepEqual(report.errors, []);
	report.passed = true;
} catch (error) {
	report.failure = error.stack;
	process.exitCode = 1;
} finally {
	await browser.close();
	await fs.writeFile(path.join(output, 'browser-qa.json'), JSON.stringify(report, null, 2) + '\n');
	console.log(JSON.stringify(report, null, 2));
}
