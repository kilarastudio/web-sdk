<script lang="ts">
	import { onDestroy } from 'svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	import { cubicIn, cubicOut } from 'svelte/easing';
	import * as PIXI from 'pixi.js';

	import { getContextParent } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { ART_PIXEL } from '../game/constants';
	import { frameAt } from '../game/motion';
	import { symbolFx, WIN_BREATH, type GlowCell, type Puff } from '../game/symbolFx.svelte';
	import { anticipationDim } from '../game/anticipation.svelte';
	import { PALETTE, RAMPS, type RampName } from '../pixel/palette';
	import { LAND_PUFF, WIN_GLOW_SIZE } from '../pixel/ui';

	// scope: the lights this one draws (none: the board's)
	type Props = { layer: 'under' | 'over'; scope?: string };

	const props: Props = $props();
	const context = getContext();

	// Drawn in the board's units, so it sits inside a BoardContainer. `under` (behind every symbol):
	// the light of each winner, which opens white with the hit, then beats with a band running out
	// from the middle to its rim, in time with the winners' breath; it draws in to nothing as they
	// break.
	// `over`: the dust and embers a landing symbol throws up from its foot, a few frames long.
	const GLOW = { open: 140, flash: 90, close: 220 };
	const PUFF_FRAME = 48;
	// where a symbol's foot is, below its cell's middle, in art pixels
	const FOOT = 19;

	const container = new PIXI.Container();
	getContextParent().addToParent(container);

	const texture = (key: string) =>
		(context.stateApp.loadedAssets[key] ?? PIXI.Texture.EMPTY) as PIXI.Texture;
	const frames = (key: string) => (context.stateApp.loadedAssets[key] ?? []) as PIXI.Texture[];
	const hex = (ramp: string, step: number) => PALETTE[RAMPS[ramp as RampName][step]];

	type Light = {
		cell: GlowCell;
		root: PIXI.Container;
		wave: PIXI.Sprite;
		flash: PIXI.Sprite;
		// when it began to close
		closing?: number;
	};
	const lights = new Map<number, Light>();
	const dusts = new Map<number, { puff: Puff; sprite: PIXI.Sprite }>();
	let request = 0;

	const size = WIN_GLOW_SIZE * ART_PIXEL;
	const openLight = (cell: GlowCell): Light => {
		const root = new PIXI.Container();
		root.position.set(cell.x, cell.y);
		const base = new PIXI.Sprite({ texture: texture(`winGlow_${cell.ramp}`), anchor: 0.5 });
		const wave = new PIXI.Sprite({ texture: frames('winGlowWave')[0], anchor: 0.5 });
		wave.tint = hex(cell.ramp, 5);
		const flash = new PIXI.Sprite({ texture: texture('winGlowFlash'), anchor: 0.5 });
		flash.tint = hex(cell.ramp, 6);
		for (const sprite of [base, wave, flash]) sprite.setSize(size);
		root.addChild(base, wave, flash);
		container.addChild(root);

		return { cell, root, wave, flash };
	};

	const tick = (now: number) => {
		request = 0;
		const reduced = prefersReducedMotion.current;
		const waves = frames('winGlowWave');
		for (const [id, light] of lights) {
			const age = now - light.cell.start;
			// a scatter's landing light stays while the reels wait on another
			if (light.cell.anticipated && light.cell.until !== undefined && anticipationDim.target > 0)
				light.cell.until = Math.max(light.cell.until, now + 250);
			if (light.cell.until !== undefined && now >= light.cell.until && !light.closing)
				light.closing = now;
			if (light.closing !== undefined) {
				const closed = (now - light.closing) / GLOW.close;
				if (closed >= 1 || reduced) {
					light.root.destroy({ children: true });
					lights.delete(id);
					// gone for good: off the list, so it is never opened again
					symbolFx.glows = symbolFx.glows.filter((glow) => glow.id !== id);
					continue;
				}
				// it draws in on itself, solid to the end
				light.root.scale.set(1 - cubicIn(closed));
				continue;
			}
			light.root.scale.set(reduced ? 1 : 0.55 + 0.45 * cubicOut(Math.min(1, age / GLOW.open)));
			light.flash.visible = !reduced && age < GLOW.flash;
			light.wave.visible = !reduced && age >= GLOW.flash;
			if (waves.length)
				light.wave.texture =
					waves[frameAt((now % WIN_BREATH.period) / WIN_BREATH.period, waves.length)];
		}
		for (const [id, dust] of dusts) {
			const run = frames(dust.puff.embers ? 'landEmbers' : 'landDust');
			const frame = Math.floor((now - dust.puff.start) / PUFF_FRAME);
			if (frame >= run.length || !run.length) {
				dust.sprite.destroy();
				dusts.delete(id);
				continue;
			}
			dust.sprite.texture = run[frame];
		}
		// the light of a short glow goes by itself; the others wait for the winners to go
		if (lights.size || dusts.size) request = requestAnimationFrame(tick);
	};
	const wake = () => {
		if (!request) request = requestAnimationFrame(tick);
	};

	$effect(() => {
		if (props.layer !== 'under') return;
		const cells = symbolFx.glows.filter((cell) => cell.scope === props.scope);
		const ids = new Set(cells.map((cell) => cell.id));
		const now = performance.now();
		for (const cell of cells)
			if (!lights.has(cell.id) && (cell.until ?? Infinity) > now)
				lights.set(cell.id, openLight(cell));
		for (const [id, light] of lights)
			if (!ids.has(id) && light.closing === undefined) light.closing = now;
		wake();
	});

	$effect(() => {
		if (props.layer !== 'over') return;
		const puffs = symbolFx.puffs;
		if (!puffs.length) return;
		for (const puff of puffs) {
			if (prefersReducedMotion.current) continue;
			const first = frames(puff.embers ? 'landEmbers' : 'landDust')[0];
			if (!first) continue;
			const sprite = new PIXI.Sprite({ texture: first, anchor: { x: 0.5, y: 1 } });
			sprite.setSize(LAND_PUFF.width * ART_PIXEL, LAND_PUFF.height * ART_PIXEL);
			sprite.position.set(puff.x, puff.y + (FOOT + 2) * ART_PIXEL);
			container.addChild(sprite);
			dusts.set(puff.id, { puff, sprite });
		}
		// handed over: the list only carries what is new
		symbolFx.puffs = [];
		wake();
	});

	onDestroy(() => {
		cancelAnimationFrame(request);
		container.destroy({ children: true });
	});
</script>
