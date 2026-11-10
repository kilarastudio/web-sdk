// QA for the character skeleton: the six poses in Storybook (contract and key frames) and
// the reactions in the running game. Needs Storybook (CHARACTER_STORYBOOK_URL, default 6108),
// the game (CHARACTER_GAME_URL, default 3031 with the LGS on 3012), playwright
// (PLAYWRIGHT_MODULE) and sharp for the contact sheet (KILARA_SHARP_PATH).
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const sharp = require(process.env.KILARA_SHARP_PATH || 'sharp');
const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const storybook = process.env.CHARACTER_STORYBOOK_URL || 'http://localhost:6108';
const game =
	process.env.CHARACTER_GAME_URL ||
	'http://localhost:3031/?replay=true&game=deep_glint&version=1&mode=base&event=144&rgs_url=localhost:3012&currency=USD&amount=1000000&lang=en&device=desktop';
const output = path.resolve(
	app,
	'../../../output/ai-game-assets/deep-glint-p0/character/verification',
);
// the moments worth looking at in each pose, in seconds: power at the wind-up, the strike with its
// trail and flash, and the follow-through
const FRAMES = {
	idle: [0, 1.8],
	anticipation: [0.5],
	power: [0.3, 0.48, 0.8],
	win: [0.05, 0.38],
	bigWin: [0.22, 0.4],
	bonus: [0.4],
};
// the drawing each pose starts on (scripts/character-poses.mjs)
const DRAWINGS = {
	idle: 'idle',
	anticipation: 'anticipation',
	power: 'power-1-windup',
	win: 'win',
	bigWin: 'bigwin',
	bonus: 'bonus',
};
const LOOPS = {
	idle: true,
	anticipation: true,
	power: false,
	win: false,
	bigWin: true,
	bonus: false,
};

const hookApp = () => {
	window.__PIXI_APP_INIT__ = (pixi) => {
		window.qaApp = pixi;
	};
};
// In-page helpers: the character's SkeletonContainer and two animation frames.
const helpers = `
	window.qaCharacter = () => {
		const walk = (n) => [n, ...(n.children || []).flatMap(walk)];
		return walk(window.qaApp.stage).find((n) => n.label === 'skeleton:character');
	};
	window.qaFrame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
`;

// frames in rows of `columns`, as one image in the output folder
const contactSheet = async (frames, columns, name) => {
	const tile = { width: 300, height: 290 };
	const tiles = await Promise.all(
		frames.map(async ({ file }, i) => ({
			input: await sharp(path.join(output, file)).resize(tile.width, tile.height).toBuffer(),
			left: (i % columns) * tile.width,
			top: Math.floor(i / columns) * tile.height,
		})),
	);
	await sharp({
		create: {
			width: columns * tile.width,
			height: Math.ceil(frames.length / columns) * tile.height,
			channels: 4,
			background: '#07131e',
		},
	})
		.composite(tiles)
		.png()
		.toFile(path.join(output, name));
};

await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const report = { poses: [], frames: [], game: {}, errors: [] };
const track = (page) => {
	page.on('pageerror', (e) => report.errors.push(e.message));
	page.on('console', (m) => {
		// failed requests are reported with their URL below
		if (m.type() === 'error' && !m.text().startsWith('Failed to load resource'))
			report.errors.push(m.text());
	});
	page.on('response', (r) => {
		if (r.status() >= 400 && !r.url().endsWith('/favicon.ico'))
			report.errors.push(`${r.status()} ${r.url()}`);
	});
};

try {
	const page = await browser.newPage({ viewport: { width: 1200, height: 675 } });
	track(page);
	await page.addInitScript(hookApp);
	await page.goto(`${storybook}/iframe.html?id=components-character-rig--poses&viewMode=story`, {
		waitUntil: 'networkidle',
	});
	await page.waitForFunction(() => window.qaApp);
	await page.addScriptTag({ content: helpers });
	await page.waitForFunction(() => window.qaCharacter());

	// each button plays its pose; one-shots settle back to idle
	for (const pose of Object.keys(LOOPS)) {
		await page.getByRole('button', { name: pose, exact: true }).click();
		const state = await page.evaluate(async () => {
			await window.qaFrame();
			const node = window.qaCharacter();
			return {
				animation: node.animationState.current?.name,
				loop: node.animationState.current?.loop,
				body: node.textureOf('body'),
				lamp: node.textureOf('lamp-glow'),
			};
		});
		assert.equal(state.animation, pose);
		assert.equal(state.loop, LOOPS[pose]);
		assert.equal(state.body, `character-${DRAWINGS[pose]}`);
		assert.equal(state.lamp, 'character-lamp-glow');
		if (!LOOPS[pose]) {
			await page.waitForFunction(
				(name) => document.querySelector('.message')?.textContent.includes(`${name} is resolved`),
				pose,
			);
			const after = await page.evaluate(() => window.qaCharacter().animationState.current?.name);
			assert.equal(after, 'idle');
		}
		report.poses.push({ pose, ...state });
	}

	// power releases the beam once, at 0.5 s
	await page.getByRole('button', { name: 'power', exact: true }).click();
	await page.waitForFunction(() =>
		document.querySelector('.message')?.textContent.includes('event glint-strike'),
	);
	report.strikeEvent = true;

	// key frames: play the pose, move it to the moment, then hold it there
	await page.addStyleTag({ content: '.sample-controls{visibility:hidden!important}' });
	for (const [pose, times] of Object.entries(FRAMES))
		for (const time of times) {
			await page.evaluate(
				async ({ pose, time, loop }) => {
					const state = window.qaCharacter().animationState;
					state.timeScale = 1;
					state.play(pose, { loop });
					state.update(time);
					state.timeScale = 0;
					await window.qaFrame();
				},
				{ pose, time, loop: LOOPS[pose] },
			);
			const file = path.join(output, `${pose}-${time.toFixed(2)}.png`);
			await page.screenshot({ path: file, clip: { x: 250, y: 0, width: 700, height: 675 } });
			report.frames.push({ pose, time, file: path.basename(file) });
		}
	await page.close();

	await contactSheet(report.frames, 6, 'poses-contact.png');

	// in the game: idle by default, reactions from the event emitter, bind pose under reduced motion
	for (const reducedMotion of ['no-preference', 'reduce']) {
		const gamePage = await browser.newPage({
			viewport: { width: 1200, height: 675 },
			reducedMotion,
			ignoreHTTPSErrors: true,
		});
		track(gamePage);
		await gamePage.addInitScript(hookApp);
		await gamePage.goto(game, { waitUntil: 'networkidle' });
		await gamePage.waitForFunction(() => window.qaApp, null, { timeout: 30000 });
		await gamePage.addScriptTag({ content: helpers });
		// past the "press anywhere" intro
		await gamePage.waitForTimeout(6000);
		await gamePage.mouse.click(600, 600);
		await gamePage.waitForFunction(() => window.qaCharacter(), null, { timeout: 30000 });
		await gamePage.waitForTimeout(1000);
		const result = await gamePage.evaluate(async () => {
			const live = (p) =>
				import(
					performance.getEntriesByType('resource').findLast((e) => new URL(e.name).pathname === p)
						?.name || p
				);
			const { eventEmitter } = await live('/src/game/eventEmitter.ts');
			const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
			const node = window.qaCharacter();
			const name = () => node.animationState.current?.name ?? null;
			const bounds = node.getBounds();
			const start = name();
			const reactions = {};
			for (const reaction of ['power', 'win', 'bonus', 'bigWin']) {
				eventEmitter.broadcast({ type: 'characterReact', reaction });
				await window.qaFrame();
				const playing = name();
				await sleep(reaction === 'bigWin' ? 3300 : 1800);
				reactions[reaction] = { playing, after: name() };
			}
			// the same reaction twice starts it over
			eventEmitter.broadcast({ type: 'characterReact', reaction: 'win' });
			await sleep(600);
			eventEmitter.broadcast({ type: 'characterReact', reaction: 'win' });
			await window.qaFrame();
			await window.qaFrame();
			const restartTime = node.animationState.current?.time;
			return {
				start,
				reactions,
				restart: { animation: name(), time: restartTime },
				bounds: { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height },
			};
		});
		if (reducedMotion === 'no-preference') {
			await gamePage.screenshot({ path: path.join(output, 'game.png') });
			assert.equal(result.start, 'idle');
			for (const [reaction, { playing, after }] of Object.entries(result.reactions)) {
				assert.equal(playing, reaction);
				assert.equal(after, 'idle');
			}
			assert.equal(result.restart.animation, 'win');
			assert(result.restart.time < 0.3, JSON.stringify(result.restart));
		} else {
			assert.equal(result.start, null);
			for (const { playing } of Object.values(result.reactions)) assert.equal(playing, null);
		}
		assert(result.bounds.height > 100, JSON.stringify(result.bounds));
		report.game[reducedMotion] = result;
		await gamePage.close();
	}

	assert.deepEqual(report.errors, []);
	report.passed = true;
} catch (error) {
	report.failure = error.stack;
	process.exitCode = 1;
} finally {
	await browser.close();
	await fs.writeFile(path.join(output, 'browser-qa.json'), JSON.stringify(report, null, 2) + '\n');
	console.log(JSON.stringify({ ...report, frames: report.frames.length }, null, 2));
}
