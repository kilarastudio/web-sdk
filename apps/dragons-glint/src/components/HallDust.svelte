<script lang="ts">
	import { untrack } from 'svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	import * as PIXI from 'pixi.js';

	import { BaseSprite } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { hallMood } from '../game/hallMood.svelte';

	// Dust and grit shaken out of the vault when a big win from SUPER up lands: it falls from the
	// top of the screen, the grit faster than the dust, and is gone before it reaches the floor's
	// front. `scale` is the size of one of the hall's art pixels.
	type Props = { scale: number };

	const props: Props = $props();
	const context = getContext();
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());
	const pixel = $derived(
		(context.stateApp.loadedAssets.pixel ?? PIXI.Texture.EMPTY) as PIXI.Texture,
	);

	const STONE = [0x8b93af, 0x6b7191, 0x4a5272];
	const LIFE = 1700;

	type Mote = { x: number; from: number; fall: number; size: number; tint: number; drift: number };
	let motes = $state<Mote[]>([]);
	let now = $state(0);
	let request = 0;

	const tick = (time: number) => {
		now = time;
		motes = motes.filter((mote) => time < mote.from + LIFE);
		request = motes.length ? requestAnimationFrame(tick) : 0;
	};

	$effect(() => {
		const landed = hallMood.landed;
		untrack(() => {
			if (!landed || hallMood.tier < 2 || prefersReducedMotion.current) return;
			const start = performance.now();
			const count = 22 + hallMood.tier * 10;
			motes = [
				...motes,
				...Array.from({ length: count }, () => {
					const grit = Math.random() < 0.3;

					return {
						x: Math.random(),
						from: start + Math.random() * 500,
						fall: (grit ? 0.9 : 0.45) + Math.random() * 0.3,
						size: grit ? 2 : 1,
						tint: STONE[Math.floor(Math.random() * STONE.length)],
						drift: (Math.random() - 0.5) * 0.03,
					};
				}),
			];
			if (!request) request = requestAnimationFrame(tick);
		});
	});

	$effect(() => () => cancelAnimationFrame(request));
</script>

{#each motes as mote}
	{@const age = (now - mote.from) / LIFE}
	{#if age > 0}
		<BaseSprite
			texture={pixel}
			tint={mote.tint}
			alpha={Math.min(1, (1 - age) * 2.5)}
			x={Math.round(((mote.x + mote.drift * age) * canvas.width) / props.scale) * props.scale}
			y={Math.round((mote.fall * age * age * canvas.height) / props.scale) * props.scale}
			width={mote.size * props.scale}
			height={mote.size * props.scale}
		/>
	{/if}
{/each}
