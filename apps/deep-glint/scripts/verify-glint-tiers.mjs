// Browser integration checks: live book events, actual skeleton skins and rendered bitmap text.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.resolve(
	app,
	'../../../output/ai-game-assets/deep-glint-p0/glint/verification/all-tiers',
);
const base = process.env.GLINT_STORYBOOK_URL || 'http://localhost:6108';
const report = { views: [], contracts: [], errors: [] };
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });

async function open(viewport, reducedMotion = 'no-preference', story = 'all-tiers') {
	const page = await browser.newPage({ viewport, reducedMotion });
	await page.addInitScript(() => {
		window.__PIXI_APP_INIT__ = (app) => {
			window.qaApp = app;
		};
	});
	page.on('pageerror', (e) => report.errors.push(e.message));
	page.on('console', (m) => {
		if (m.type() === 'error' && !m.location().url.endsWith('/favicon.ico'))
			report.errors.push(m.text());
	});
	page.on('response', (r) => {
		if (r.status() >= 400 && !r.url().endsWith('/favicon.ico'))
			report.errors.push(`${r.status()} ${r.url()}`);
	});
	await page.goto(`${base}/iframe.html?id=components-glintspots--${story}&viewMode=story`, {
		waitUntil: 'networkidle',
	});
	await page.getByRole('button', { name: 'Action', exact: true }).click();
	await page.waitForFunction(() =>
		document.querySelector('.message')?.textContent.includes('Action is resolved ✅'),
	);
	return page;
}

try {
	for (const viewport of [
		{ width: 1200, height: 675 },
		{ width: 390, height: 844 },
		{ width: 400, height: 225 },
	]) {
		const page = await open(viewport);
		const rendered = await page.evaluate(() => {
			function walk(n) {
				if (!n.visible || n.alpha === 0) return [];
				return [n, ...(n.children || []).flatMap(walk)];
			}
			const nodes = walk(window.qaApp.stage);
			return {
				texts: nodes
					.filter((n) => n.text?.startsWith('×'))
					.map((n) => ({
						text: n.text,
						font: n.style.fontFamily,
						type: n.renderPipeId,
						width: n.width,
						bounds: n.getBounds().rectangle,
					})),
				loops: nodes
					.filter((n) => n.label === 'skeleton:glint')
					.map((n) => ({
						skin: n.skin,
						animation: n.animationState.current?.name,
						path: n.textureOf('tile'),
					})),
				badgeRequests: performance
					.getEntriesByType('resource')
					.filter((e) => /glint-badge/.test(e.name)).length,
			};
		});
		assert.equal(rendered.texts.length, 30);
		assert.equal(new Set(rendered.texts.map((n) => n.text)).size, 8);
		for (const text of rendered.texts) {
			assert.equal(text.type, 'bitmapText');
			assert.equal(text.font, 'Deep Glint Forge Gold');
			const value = Number(text.text.slice(1));
			assert(text.width <= (value >= 100 ? 74.01 : value >= 10 ? 60.01 : 42.01));
			assert(text.bounds.x >= -1 && text.bounds.x + text.bounds.width <= viewport.width + 1);
		}
		assert.equal(rendered.loops.length, 3);
		assert(
			rendered.loops.every(
				(n) => n.skin === 't4' && n.animation === 'max_loop' && n.path === 'glint-tile-t4',
			),
		);
		assert.equal(rendered.badgeRequests, 0);
		await page.addStyleTag({ content: '.wrap:has(>button.action){visibility:hidden!important}' });
		await page.screenshot({ path: path.join(output, `board-${viewport.width}.png`) });
		report.views.push({ viewport, ...rendered });
		await page.close();
	}

	for (const reducedMotion of ['no-preference', 'reduce']) {
		const page = await open({ width: 1200, height: 675 }, reducedMotion, 'max-full-board');
		const contract = await page.evaluate(
			async ({ stateBetPath, reducedMotion }) => {
				const importLive = (pathname) =>
					import(
						performance
							.getEntriesByType('resource')
							.findLast((e) => new URL(e.name).pathname === pathname)?.name || pathname
					);
				const { stateGame, emptyGlint } = await importLive('/src/game/stateGame.svelte.ts');
				const { playBookEvent } = await importLive('/src/game/utils.ts');
				const { stateBet } = await importLive(stateBetPath);
				const frame = () =>
					new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
				const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
				const spines = () => {
					const walk = (n) => [n, ...(n.children || []).flatMap(walk)];
					return walk(window.qaApp.stage).filter((n) => n.label === 'skeleton:glint');
				};
				const grid = (value) => {
					const g = emptyGlint();
					g[2][2] = value;
					return g;
				};
				const play = (value) =>
					playBookEvent({ index: 0, type: 'updateGlint', glint: grid(value) }, { bookEvents: [] });
				const fullBoardLoops = spines().filter(
					(n) => n.animationState.current?.name === 'max_loop',
				).length;
				const timings = [];
				for (const turbo of [false, true]) {
					stateBet.isTurbo = turbo;
					stateGame.glint = grid(1);
					await frame();
					for (const value of [2, 4, 8, 16, 32, 64, 128, 256]) {
						const start = performance.now();
						const playback = play(value);
						await frame();
						const active = spines().map((n) => ({
							skin: n.skin,
							animation: n.animationState.current?.name,
							path: n.textureOf('tile'),
						}));
						await playback;
						timings.push({
							value,
							turbo,
							elapsedMs: performance.now() - start,
							actual: stateGame.glint[2][2],
							active,
						});
					}
				}
				stateBet.isTurbo = false;
				await frame();
				const loop = spines()[0];
				const elapsed = loop?.elapsed;
				await sleep(150);
				const loopAdvances = loop ? loop.elapsed > elapsed : false;
				const start = performance.now();
				await play(256);
				const cappedMs = performance.now() - start;
				const resets = [];
				for (const [from, to] of [
					[1, 2],
					[8, 16],
					[16, 32],
					[128, 256],
				]) {
					stateGame.glint = grid(from);
					await frame();
					const playback = play(to);
					await frame();
					stateGame.glint = emptyGlint();
					await playback;
					await frame();
					resets.push({
						from,
						to,
						values: stateGame.glint.flat(),
						remainingSpines: spines().length,
					});
				}
				// A strike can jump several tiers, and an overlapping update must settle both promises.
				stateGame.glint = grid(2);
				await frame();
				const skipped = play(128);
				await frame();
				const skipSkin = spines()[0]?.skin;
				await skipped;
				const first = play(256);
				await frame();
				stateGame.glint = grid(4);
				await frame();
				await first;
				const a = play(8);
				await frame();
				const b = play(32);
				await Promise.all([a, b]);
				const supersededValue = stateGame.glint[2][2];
				stateGame.glint = grid(64);
				await frame();
				const restoredSpines = spines().length;
				return {
					reducedMotion,
					fullBoardLoops,
					timings,
					loopAdvances,
					cappedMs,
					resets,
					skipSkin,
					supersededValue,
					restoredSpines,
				};
			},
			{
				stateBetPath:
					'/@fs' + path.resolve(app, '../../packages/state-shared/src/stateBet.svelte.ts'),
				reducedMotion,
			},
		);
		assert.equal(contract.fullBoardLoops, reducedMotion === 'reduce' ? 0 : 30);
		assert.equal(contract.loopAdvances, reducedMotion !== 'reduce');
		for (const timing of contract.timings) {
			const duration = timing.value === 2 ? 400 : [8, 32, 128].includes(timing.value) ? 500 : 350;
			assert.equal(timing.actual, timing.value);
			assert(
				timing.elapsedMs >= duration / (timing.turbo ? 2 : 1) - 45 &&
					timing.elapsedMs < duration + 500,
				JSON.stringify(timing),
			);
			const tier = timing.value >= 128 ? 4 : timing.value >= 32 ? 3 : timing.value >= 8 ? 2 : 1;
			if (reducedMotion === 'reduce') assert.equal(timing.active.length, 0);
			else {
				assert.equal(timing.active[0]?.skin, `t${tier}`);
				assert.equal(timing.active[0]?.path, `glint-tile-t${tier}`);
			}
		}
		assert(contract.cappedMs < 100, '×256 cap must not await the loop');
		for (const reset of contract.resets) {
			assert(reset.values.every((v) => v === 0));
			assert.equal(reset.remainingSpines, 0);
		}
		assert.equal(contract.skipSkin, reducedMotion === 'reduce' ? undefined : 't4');
		assert.equal(contract.supersededValue, 32);
		assert.equal(contract.restoredSpines, 0, 'snapshot must not replay upgrades');
		report.contracts.push(contract);
		await page.close();
	}
	assert.equal(report.errors.length, 0, report.errors.join('\n'));
	report.passed = true;
} catch (error) {
	report.failure = error.stack;
	process.exitCode = 1;
} finally {
	await browser.close();
	await fs.writeFile(path.join(output, 'browser-qa.json'), JSON.stringify(report, null, 2) + '\n');
	console.log(
		JSON.stringify(
			{
				passed: report.passed,
				views: report.views.length,
				contracts: report.contracts.length,
				errors: report.errors,
				failure: report.failure,
			},
			null,
			2,
		),
	);
}
