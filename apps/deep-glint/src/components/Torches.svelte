<script lang="ts">
	import { onMount } from 'svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	import * as PIXI from 'pixi.js';

	import { BaseSprite } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { flameKey, type Torch } from '../game/torches';

	type Props = {
		torches: Torch[];
		// where the background's art pixel (0, 0) is on the canvas, and how big one art pixel is
		origin: { x: number; y: number };
		scale: number;
	};

	const props: Props = $props();
	const context = getContext();

	// Each torch burns on its own: its flame runs through its frames, starting at a different frame
	// from its neighbour, and throws a light on the wall that wavers with it.
	const GLOW = {
		tint: 0xffa214,
		rings: [
			{ size: 3.6, alpha: 0.1 },
			{ size: 2.2, alpha: 0.14 },
		],
		waver: [0.8, 1, 0.7, 1.15, 0.85, 1.2, 0.75, 1.05],
	};

	const frames = (key: string) => (context.stateApp.loadedAssets[key] ?? []) as PIXI.Texture[];
	const glow = $derived(
		(context.stateApp.loadedAssets.flameGlow ?? PIXI.Texture.EMPTY) as PIXI.Texture,
	);
	// the flames run faster than the pixel clock, on their own
	const FRAME_MS = 70;
	let step = $state(0);

	onMount(() => {
		let request = 0;
		const update = (now: number) => {
			request = requestAnimationFrame(update);
			const next = Math.floor(now / FRAME_MS);
			if (next !== step) step = next;
		};
		request = requestAnimationFrame(update);

		return () => cancelAnimationFrame(request);
	});

	const tick = $derived(prefersReducedMotion.current ? 0 : step);
</script>

{#each props.torches as torch, index}
	{@const run = frames(flameKey(torch))}
	{@const frame = (tick + index * 5) % Math.max(1, run.length)}
	{@const x = props.origin.x + torch.x * props.scale}
	{@const y = props.origin.y + torch.y * props.scale}
	{#each GLOW.rings as ring}
		<BaseSprite
			texture={glow}
			anchor={0.5}
			{x}
			y={y - torch.height * props.scale * 0.4}
			width={torch.width * props.scale * ring.size}
			height={torch.width * props.scale * ring.size}
			tint={GLOW.tint}
			alpha={ring.alpha * GLOW.waver[frame % GLOW.waver.length]}
			blendMode="add"
		/>
	{/each}
	{#if run.length}
		<BaseSprite
			texture={run[frame]}
			anchor={{ x: 0.5, y: 1 }}
			{x}
			{y}
			width={torch.width * props.scale}
			height={torch.height * props.scale}
		/>
	{/if}
{/each}
