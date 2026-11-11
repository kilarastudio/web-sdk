<script lang="ts">
	import { untrack } from 'svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	import * as PIXI from 'pixi.js';

	import { BaseSprite } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { ART_PIXEL, BOARD_DIMENSIONS, SYMBOL_SIZE } from '../game/constants';
	import { pixelClock } from '../game/pixelClock.svelte';
	import BoardContainer from './BoardContainer.svelte';

	// The hoard glints while it rests: now and then a twinkle opens and closes on a symbol. Two
	// run out of step with each other, each moving to a new symbol after every twinkle.
	const PERIOD = 11;
	const SIZE = 9 * ART_PIXEL;
	const context = getContext();
	const frames = $derived((context.stateApp.loadedAssets.sparkle ?? []) as PIXI.Texture[]);

	const place = () => ({
		x: (Math.floor(Math.random() * BOARD_DIMENSIONS.x) + 0.28 + Math.random() * 0.44) * SYMBOL_SIZE,
		y: (Math.floor(Math.random() * BOARD_DIMENSIONS.y) + 0.22 + Math.random() * 0.4) * SYMBOL_SIZE,
	});
	const twinkles = $state([
		{ offset: 0, ...place() },
		{ offset: 6, ...place() },
	]);

	$effect(() => {
		const frame = pixelClock.frame;
		untrack(() => {
			for (const twinkle of twinkles)
				if ((frame + twinkle.offset) % PERIOD === 0) Object.assign(twinkle, place());
		});
	});
</script>

{#if !prefersReducedMotion.current && frames.length}
	<BoardContainer>
		{#each twinkles as twinkle}
			{@const at = (pixelClock.frame + twinkle.offset) % PERIOD}
			{#if at < frames.length}
				<BaseSprite
					texture={frames[at]}
					anchor={0.5}
					x={twinkle.x}
					y={twinkle.y}
					width={SIZE}
					height={SIZE}
				/>
			{/if}
		{/each}
	</BoardContainer>
{/if}
