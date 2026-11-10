// Integration checks against the running Deep Glint Storybook, using Pixi's
// devtools hook to inspect actual rendered nodes (including locale fallback).
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.resolve(app, '../../../output/ai-game-assets/deep-glint-font/verification');
const base = process.env.GLINT_STORYBOOK_URL || 'http://localhost:6108';
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const report = { checks: [], errors: [], knownWarnings: [] };
async function open(id, viewport) {
	const page = await browser.newPage({ viewport });
	await page.addInitScript(() => {
		window.__PIXI_APP_INIT__ = (app) => {
			window.fontQaApp = app;
		};
	});
	page.on('pageerror', (e) => report.errors.push(e.message));
	page.on('console', (m) => {
		if (m.type() !== 'error') return;
		(m.location().url.endsWith('/favicon.ico') ? report.knownWarnings : report.errors).push(
			m.text(),
		);
	});
	page.on('response', (r) => {
		if (r.status() >= 400 && !r.url().endsWith('/favicon.ico'))
			report.errors.push(`${r.status()} ${r.url()}`);
	});
	await page.goto(`${base}/iframe.html?id=${id}&viewMode=story`, { waitUntil: 'networkidle' });
	await page.waitForFunction(() => window.fontQaApp?.stage?.children.length > 0);
	return page;
}
async function texts(page) {
	return page.evaluate(() => {
		function walk(n) {
			if (!n.visible || n.alpha === 0) return [];
			const bounds = n.text !== undefined ? n.getBounds() : null;
			return [
				...(bounds
					? [
							{
								text: n.text,
								type: n.renderPipeId,
								font: n.style.fontFamily,
								width: n.width,
								bounds: { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height },
							},
						]
					: []),
				...(n.children || []).flatMap(walk),
			];
		}
		return walk(window.fontQaApp.stage);
	});
}
async function screenshot(page, name) {
	await page.screenshot({ path: path.join(output, name + '.png') });
}
async function emit(page, events) {
	await page.evaluate(async (events) => {
		const { eventEmitter } = await import('/src/game/eventEmitter.ts');
		for (const event of events) eventEmitter.broadcast(event);
	}, events);
	await page.waitForTimeout(650);
}
try {
	const page = await open('components-gametext--specimen', { width: 1200, height: 675 });
	report.fonts = await page.evaluate(async () => {
		const url = performance
			.getEntriesByType('resource')
			.find((e) => e.name.includes('/deps/pixi__js.js')).name;
		const { Cache, BitmapText } = await import(url);
		return ['Deep Glint Forge Gold', 'Deep Glint Forge Ink'].map((name) => {
			const font = Cache.get(`${name}-bitmap`);
			const widths = [...'0123456789'].map((digit) => {
				const text = new BitmapText({
					text: digit.repeat(8),
					style: { fontFamily: name, fontSize: 100 },
				});
				const width = text.width;
				text.destroy();
				return width;
			});
			return {
				name,
				class: font.constructor.name,
				glyphs: Object.keys(font.chars).length,
				digitWidths: widths,
				nativeSize: font.baseRenderedFontSize,
			};
		});
	});
	for (const font of report.fonts) {
		assert.equal(font.class, 'BitmapFont', 'must load original atlas, not generate a system font');
		assert.equal(font.glyphs, 98);
		assert.equal(font.nativeSize, 128);
		assert.equal(new Set(font.digitWidths).size, 1, 'count-up digits must be tabular');
	}
	for (const sample of [
		'$1,234.56',
		'Rp 999.999.999,99',
		'€ 1\u202f234,50',
		'免费旋转 12',
		'$0.00',
	]) {
		await page.getByRole('button', { name: sample, exact: true }).click();
		await page.waitForTimeout(100);
		const node = (await texts(page)).find((n) => n.text === sample);
		assert(node, `visible sample ${sample}`);
		assert.equal(node.type, sample.startsWith('免费') ? 'text' : 'bitmapText');
		assert(node.width <= 1000.01, 'long currency must stay inside panel width');
		report.checks.push({ sample, type: node.type, width: node.width });
		if (sample.startsWith('免费')) await screenshot(page, 'locale-fallback');
	}
	await page.getByRole('button', { name: '$1,234.56', exact: true }).click();
	await page.addStyleTag({ content: '.font-controls { visibility:hidden }' });
	await screenshot(page, 'specimen');
	await page.close();

	for (const viewport of [
		{ width: 1200, height: 675 },
		{ width: 390, height: 844 },
		{ width: 400, height: 225 },
	]) {
		const page = await open('components-glintspots--tier-comparison', viewport);
		await page.getByRole('button', { name: 'Action', exact: true }).click();
		await page.waitForFunction(
			() => document.querySelector('.message')?.textContent === 'ⓘ Action is resolved ✅',
		);
		await page.addStyleTag({ content: '.wrap:has(>button.action) { visibility:hidden }' });
		const badgeNodes = (await texts(page)).filter((n) => n.text.startsWith('×'));
		assert(badgeNodes.some((n) => n.text === '×256'));
		for (const badge of badgeNodes) {
			assert.equal(badge.type, 'bitmapText');
			const value = Number(badge.text.slice(1));
			assert.equal(badge.font, 'Deep Glint Forge Gold');
			assert(badge.width <= (value >= 100 ? 74.01 : value >= 10 ? 60.01 : 42.01));
		}
		report.checks.push({
			viewport,
			badges: badgeNodes.map((n) => ({ text: n.text, width: n.width })),
		});
		await screenshot(page, `board-${viewport.width}`);
		const uiFonts = await page.evaluate(() => [
			...new Set(
				[...document.querySelectorAll('button')]
					.filter((n) => n.offsetWidth > 0)
					.map((n) => getComputedStyle(n).fontFamily),
			),
		]);
		report.checks.push({ viewport, uiFonts });
		for (const [level, title, panel] of [
			[6, 'BIG WIN', 'celebrationBig'],
			[7, 'SUPER WIN', 'celebrationSuper'],
			[8, 'MEGA WIN', 'celebrationMega'],
			[9, 'EPIC WIN!', 'celebrationEpic'],
			[10, 'MAX WIN', 'celebrationMax'],
		]) {
			await emit(page, [
				{ type: 'winShow' },
				{
					type: 'winUpdate',
					amount: 123456,
					winLevelData: { level, type: 'big', text: title, panel, presentDuration: 200 },
				},
			]);
			const nodes = await texts(page);
			const headline = nodes.find((n) => n.text === title);
			assert.equal(headline?.type, 'bitmapText', `${title} uses custom atlas`);
			assert(
				headline.bounds.x >= -1 && headline.bounds.x + headline.bounds.width <= viewport.width + 1,
			);
			const values = nodes.filter(
				(n) => n.font === 'Deep Glint Forge Gold' && /[0-9]/.test(n.text),
			);
			assert(values.length > 0);
			for (const value of values)
				assert(value.bounds.x >= -1 && value.bounds.x + value.bounds.width <= viewport.width + 1);
			report.checks.push({
				viewport,
				title,
				headline: headline.bounds,
				amounts: values.map((n) => n.text),
			});
			if (level === 6 || level === 10) await screenshot(page, `win-${level}-${viewport.width}`);
			await emit(page, [{ type: 'winHide' }]);
		}
		await emit(page, [
			{ type: 'freeSpinIntroShow' },
			{ type: 'freeSpinIntroUpdate', totalFreeSpins: 12 },
		]);
		assert((await texts(page)).some((n) => n.text === '12' && n.type === 'bitmapText'));
		await screenshot(page, `free-spins-${viewport.width}`);
		await page.keyboard.press('Space');
		await emit(page, [
			{ type: 'freeSpinIntroHide' },
			{ type: 'freeSpinOutroShow' },
			{
				type: 'freeSpinOutroCountUp',
				amount: 1500000,
				winLevelData: { type: 'big', presentDuration: 200 },
			},
		]);
		const outro = (await texts(page)).find((n) => n.text === 'FREE SPINS COMPLETE');
		assert.equal(outro?.type, 'bitmapText');
		assert(outro.bounds.x >= -1 && outro.bounds.x + outro.bounds.width <= viewport.width + 1);
		await screenshot(page, `free-spins-complete-${viewport.width}`);
		report.checks.push({ viewport, freeSpinsIntroAndOutro: true });
		await page.keyboard.press('Space');
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
	console.log(JSON.stringify(report, null, 2));
}
