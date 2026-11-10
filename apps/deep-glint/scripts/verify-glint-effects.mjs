import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.resolve(
	app,
	'../../../output/ai-game-assets/deep-glint-p0/glint/verification/effects',
);
const base = process.env.GLINT_STORYBOOK_URL || 'http://localhost:6108';
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const report = { cases: [], errors: [] };
try {
	for (const viewport of [
		{ width: 1200, height: 675 },
		{ width: 400, height: 225 },
	]) {
		for (const reducedMotion of ['no-preference', 'reduce']) {
			for (const story of ['apply-and-reset', 'super-start']) {
				const page = await browser.newPage({ viewport, reducedMotion });
				page.on('pageerror', (e) => report.errors.push(e.message));
				page.on('response', (r) => {
					if (r.status() >= 400 && !r.url().endsWith('/favicon.ico'))
						report.errors.push(`${r.status()} ${r.url()}`);
				});
				await page.goto(`${base}/iframe.html?id=components-glintspots--${story}&viewMode=story`, {
					waitUntil: 'networkidle',
				});
				await page.waitForFunction(
					() =>
						document.querySelector('button.action') &&
						!document.querySelector('button.action').disabled,
				);
				await page.evaluate(async () => {
					const live = (p) =>
						import(
							performance
								.getEntriesByType('resource')
								.findLast((e) => new URL(e.name).pathname === p)?.name || p
						);
					const { eventEmitter } = await live('/src/game/eventEmitter.ts');
					const { stateGame } = await live('/src/game/stateGame.svelte.ts');
					window.effectTrace = [];
					for (const method of ['broadcast', 'broadcastAsync']) {
						const original = eventEmitter[method];
						eventEmitter[method] = (e) => {
							if (e.type.startsWith('glint'))
								window.effectTrace.push({
									type: e.type,
									spots: e.spots,
									time: performance.now(),
									values: stateGame.glint.map((c) => [...c]),
								});
							return original(e);
						};
					}
				});
				const start = Date.now();
				await page.getByRole('button', { name: 'Action', exact: true }).click();
				await page.waitForFunction(
					() => document.querySelector('.message')?.textContent.includes('Action is resolved ✅'),
					{ timeout: 30000 },
				);
				const data = await page.evaluate(async () => {
					const p = performance
						.getEntriesByType('resource')
						.findLast((e) => new URL(e.name).pathname === '/src/game/stateGame.svelte.ts')?.name;
					const { stateGame } = await import(p);
					return { trace: window.effectTrace, final: stateGame.glint.map((c) => [...c]) };
				});
				if (story === 'apply-and-reset') {
					const apply = data.trace.find((e) => e.type === 'glintApplyFly');
					assert.equal(apply?.spots[0]?.value, 16);
					assert.equal(apply.spots[0].reel, 2);
					assert(data.trace.some((e) => e.type === 'glintResetShow'));
					assert(data.final.flat().every((v) => v === 0));
				} else {
					assert(data.trace.some((e) => e.type === 'glintSuperShow'));
					assert(data.final.flat().every((v) => v === 2));
				}
				report.cases.push({
					viewport,
					reducedMotion,
					story,
					elapsedMs: Date.now() - start,
					trace: data.trace.map((e) => ({ type: e.type, spots: e.spots })),
				});
				await page.close();
			}
		}
	}
	for (const reducedMotion of ['no-preference', 'reduce']) {
		for (const turbo of [false, true]) {
			const page = await browser.newPage({ viewport: { width: 1200, height: 675 }, reducedMotion });
			page.on('pageerror', (e) => report.errors.push(e.message));
			await page.goto(`${base}/iframe.html?id=components-glintspots--super-start&viewMode=story`, {
				waitUntil: 'networkidle',
			});
			const timings = await page.evaluate(
				async ({ stateBetPath, turbo }) => {
					const live = (p) =>
						import(
							performance
								.getEntriesByType('resource')
								.findLast((e) => new URL(e.name).pathname === p)?.name || p
						);
					const { eventEmitter } = await live('/src/game/eventEmitter.ts');
					const { stateGame, emptyGlint } = await live('/src/game/stateGame.svelte.ts');
					const { stateBet } = await live(stateBetPath);
					stateBet.isTurbo = turbo;
					const elapsed = async (event) => {
						const start = performance.now();
						await eventEmitter.broadcastAsync(event);
						return performance.now() - start;
					};
					stateGame.glint = emptyGlint().map((c) => c.map(() => 2));
					const superMs = await elapsed({ type: 'glintSuperShow' });
					const applyMs = await elapsed({
						type: 'glintApplyFly',
						spots: [{ reel: 0, row: 0, value: 2, targetReel: 2, targetRow: 2 }],
					});
					const resetMs = await elapsed({ type: 'glintResetShow' });
					return { superMs, applyMs, resetMs };
				},
				{
					stateBetPath:
						'/@fs' + path.resolve(app, '../../packages/state-shared/src/stateBet.svelte.ts'),
					turbo,
				},
			);
			for (const [name, target] of [
				['superMs', 800],
				['applyMs', 500],
				['resetMs', 250],
			]) {
				const expected = target / (turbo ? 2 : 1);
				assert(
					timings[name] >= expected - 45 && timings[name] < expected + 400,
					JSON.stringify({ name, turbo, reducedMotion, timings }),
				);
			}
			report.cases.push({ reducedMotion, turbo, timings });
			await page.close();
		}
	}
	assert.deepEqual(report.errors, []);
	report.passed = true;
} catch (e) {
	report.failure = e.stack;
	process.exitCode = 1;
} finally {
	await browser.close();
	await fs.writeFile(path.join(output, 'browser-qa.json'), JSON.stringify(report, null, 2) + '\n');
	console.log(
		JSON.stringify(
			{
				passed: report.passed,
				cases: report.cases.length,
				errors: report.errors,
				failure: report.failure,
			},
			null,
			2,
		),
	);
}
