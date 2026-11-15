<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	import * as PIXI from 'pixi.js';

	import { getContextParent } from 'pixi-svelte';

	import { SYMBOL_SIZE } from '../game/constants';
	import { getContext } from '../game/context';

	// A burst of coins thrown up from behind a panel each time `level` changes: `count` spinning
	// pixel coins fly out over its top edge, arc and fall away under gravity. Drawn in the
	// panel's own units, with (0, 0) its middle; `width` is the panel's.
	type Props = { level: number; count: number; width: number };

	const props: Props = $props();
	const context = getContext();
	const container = new PIXI.Container();
	getContextParent().addToParent(container);

	const GRAVITY = SYMBOL_SIZE * 26;
	const SPIN = 12;

	type Coin = { sprite: PIXI.Sprite; vx: number; vy: number; phase: number };
	let coins: Coin[] = [];
	let request = 0;
	let last = 0;

	const frames = () => (context.stateApp.loadedAssets.coin ?? []) as PIXI.Texture[];

	const tick = (now: number) => {
		const seconds = Math.min(0.05, (now - last) / 1000);
		last = now;
		const run = frames();
		coins = coins.filter((coin) => {
			coin.vy += GRAVITY * seconds;
			coin.sprite.x += coin.vx * seconds;
			coin.sprite.y += coin.vy * seconds;
			coin.sprite.texture = run[Math.floor(coin.phase + (now / 1000) * SPIN) % run.length];
			if (coin.sprite.y < SYMBOL_SIZE * 12) return true;
			coin.sprite.destroy();

			return false;
		});
		request = coins.length ? requestAnimationFrame(tick) : 0;
	};

	const burst = (count: number) => {
		const run = frames();
		if (prefersReducedMotion.current || !run.length) return;
		for (let index = 0; index < count; index++) {
			const sprite = new PIXI.Sprite({ texture: run[0], anchor: 0.5 });
			sprite.setSize(SYMBOL_SIZE * (0.34 + Math.random() * 0.16));
			sprite.position.set((Math.random() - 0.5) * props.width * 0.7, 0);
			container.addChild(sprite);
			coins.push({
				sprite,
				vx: (Math.random() - 0.5) * SYMBOL_SIZE * 14,
				vy: -SYMBOL_SIZE * (11 + Math.random() * 9),
				phase: Math.random() * run.length,
			});
		}
		if (!request) {
			last = performance.now();
			request = requestAnimationFrame(tick);
		}
	};

	$effect(() => {
		// a new level lands
		const { count } = props;
		void props.level;
		untrack(() => burst(count));
	});

	onMount(() => () => {
		cancelAnimationFrame(request);
		container.removeChildren().forEach((child) => child.destroy());
	});
</script>
