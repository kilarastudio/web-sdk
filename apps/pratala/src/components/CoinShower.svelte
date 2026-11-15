<script lang="ts">
	import { onMount } from 'svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	import * as PIXI from 'pixi.js';

	import { getContextParent } from 'pixi-svelte';

	import { getContext } from '../game/context';

	// Coins rain down the whole screen for as long as this is mounted: each one a spinning pixel
	// coin with its own size, speed and turn. Drawn by code and moved in one loop. The rain thickens
	// when `count` grows (a big win reaching a higher level).
	type Props = { count?: number };

	const props: Props = $props();
	const context = getContext();
	const container = new PIXI.Container();
	getContextParent().addToParent(container);

	onMount(() => {
		const frames = (context.stateApp.loadedAssets.coin ?? []) as PIXI.Texture[];
		if (prefersReducedMotion.current || !frames.length) return;

		const canvas = () => context.stateLayoutDerived.canvasSizes();
		const make = () => {
			const sprite = new PIXI.Sprite({ texture: frames[0], anchor: 0.5 });
			container.addChild(sprite);

			return { sprite, speed: 0, spin: 0, phase: 0, drift: 0 };
		};
		const coins = Array.from({ length: props.count ?? 44 }, make);
		const drop = (coin: (typeof coins)[number], spread: boolean) => {
			const { width, height } = canvas();
			// sized by the screen's short side, so a tall phone screen is not crowded with big coins
			const size = Math.min(width, height) * (0.045 + Math.random() * 0.035);
			coin.sprite.setSize(size);
			coin.sprite.position.set(
				Math.random() * width,
				spread ? -Math.random() * height : -size - Math.random() * height * 0.2,
			);
			coin.speed = height * (0.55 + Math.random() * 0.7);
			coin.spin = 9 + Math.random() * 8;
			coin.phase = Math.random() * frames.length;
			coin.drift = (Math.random() - 0.5) * height * 0.08;
		};
		coins.forEach((coin) => drop(coin, true));

		let request = 0;
		let last = performance.now();
		const tick = (now: number) => {
			request = requestAnimationFrame(tick);
			const seconds = Math.min(0.05, (now - last) / 1000);
			last = now;
			const { height } = canvas();
			// more coins join from above the screen as the rain thickens
			while (coins.length < (props.count ?? 44)) {
				const coin = make();
				drop(coin, false);
				coins.push(coin);
			}
			for (const coin of coins) {
				coin.sprite.x += coin.drift * seconds;
				coin.sprite.y += coin.speed * seconds;
				coin.sprite.texture =
					frames[Math.floor(coin.phase + (now / 1000) * coin.spin) % frames.length];
				if (coin.sprite.y > height + coin.sprite.height) drop(coin, false);
			}
		};
		request = requestAnimationFrame(tick);

		return () => {
			cancelAnimationFrame(request);
			container.removeChildren().forEach((child) => child.destroy());
		};
	});
</script>
