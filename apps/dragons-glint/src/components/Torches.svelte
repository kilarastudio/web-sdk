<script lang="ts">
	import { onMount } from 'svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	import * as PIXI from 'pixi.js';

	import { BaseSprite } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import {
		flameKey,
		sootKey,
		torchFrame,
		torchLight,
		TORCH_FRAME_MS,
		type Torch,
	} from '../game/torches';

	type Props = {
		torches: Torch[];
		// where the background's art pixel (0, 0) is on the canvas, and how big one art pixel is
		origin: { x: number; y: number };
		scale: number;
	};

	const props: Props = $props();
	const context = getContext();

	// Each torch burns on its own: its flame runs through its frames, starting at a different frame
	// from its neighbour, its soot climbs behind it, and it lights the wall and the stone round it.
	// The pool of light swells and shrinks and brightens and dims with the flame (torchLight), so
	// the walls flicker with the fire that lights them.
	const LIGHT = {
		tint: 0xffa214,
		// the pool across, in flame heights, and how strongly it adds to the picture
		size: 3.4,
		alpha: 0.6,
		// how far the flame's heat swings the pool's size and strength
		swell: 0.12,
		flicker: 1,
	};

	const frames = (key: string) => (context.stateApp.loadedAssets[key] ?? []) as PIXI.Texture[];
	const glow = $derived(
		(context.stateApp.loadedAssets.flameGlow ?? PIXI.Texture.EMPTY) as PIXI.Texture,
	);
	// the soot over each flame climbs at half the flame's pace, its foot hidden in the flame
	const SOOT = { every: 2, foot: 0.3, height: 1.5, alpha: 0.55 };

	// the flames run faster than the pixel clock, on their own
	let step = $state(0);

	onMount(() => {
		let request = 0;
		const update = (now: number) => {
			request = requestAnimationFrame(update);
			const next = Math.floor(now / TORCH_FRAME_MS);
			if (next !== step) step = next;
		};
		request = requestAnimationFrame(update);

		return () => cancelAnimationFrame(request);
	});

	const tick = $derived(prefersReducedMotion.current ? 0 : step);
</script>

{#each props.torches as torch, index}
	{@const run = frames(flameKey(torch))}
	{@const frame = torchFrame(tick, index, run.length)}
	{@const light = torchLight(torch, tick, index)}
	{@const x = props.origin.x + torch.x * props.scale}
	{@const y = props.origin.y + torch.y * props.scale}
	<BaseSprite
		texture={glow}
		anchor={0.5}
		{x}
		y={y - torch.height * props.scale * 0.35}
		width={torch.height * props.scale * LIGHT.size * (1 + (light - 1) * LIGHT.swell)}
		height={torch.height * props.scale * LIGHT.size * (1 + (light - 1) * LIGHT.swell)}
		tint={LIGHT.tint}
		alpha={Math.min(0.95, Math.max(0, LIGHT.alpha * (1 + (light - 1) * LIGHT.flicker)))}
		blendMode="add"
	/>
	{@const soot = frames(sootKey(torch))}
	{#if soot.length}
		<BaseSprite
			texture={soot[torchFrame(Math.floor(tick / SOOT.every), index, soot.length)]}
			anchor={{ x: 0.5, y: 1 }}
			{x}
			y={y - torch.height * props.scale * SOOT.foot}
			width={torch.width * props.scale}
			height={torch.height * props.scale * SOOT.height}
			alpha={SOOT.alpha}
		/>
	{/if}
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
