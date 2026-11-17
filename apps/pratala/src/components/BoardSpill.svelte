<script lang="ts">
	import { prefersReducedMotion } from 'svelte/motion';

	import { Rectangle } from 'pixi-svelte';

	import BoardContainer from './BoardContainer.svelte';
	import { BOARD_SIZES, FRAME_ART_PIXEL } from '../game/constants';
	import { frameHeat } from '../game/frameHeat.svelte';
	import { pixelClock } from '../game/pixelClock.svelte';
	import { FRAME_SPILL, type FrameVariant } from '../pixel/frame';

	// The molten edge's light over the cells next to it: flat bands, strongest at the edge, laid
	// over the symbols. It breathes a little with the edge, in steps on the pixel clock.
	const BREATH = [1, 1.06, 1.12, 1.06, 1, 0.94];
	const breath = $derived(
		prefersReducedMotion.current ? 1 : BREATH[Math.floor(pixelClock.frame / 2) % BREATH.length],
	);
	const { width, height } = BOARD_SIZES;

	// each band as four strips round the inside of the board, between its inset and the last one's
	const strips = (variant: FrameVariant) =>
		FRAME_SPILL[variant].flatMap(([inset, alpha, color], index) => {
			const from = index ? FRAME_SPILL[variant][index - 1][0] * FRAME_ART_PIXEL : 0;
			const to = inset * FRAME_ART_PIXEL;
			const depth = to - from;
			return [
				{ x: from, y: from, width: width - from * 2, height: depth },
				{ x: from, y: height - to, width: width - from * 2, height: depth },
				{ x: from, y: to, width: depth, height: height - to * 2 },
				{ x: width - to, y: to, width: depth, height: height - to * 2 },
			].map((strip) => ({ ...strip, alpha, color }));
		});
	const layers = $derived(
		[
			{ variant: 'base' as const, share: 1 - frameHeat.hot },
			{ variant: 'fs' as const, share: frameHeat.hot },
		].filter(({ share }) => share > 0),
	);
</script>

<BoardContainer>
	{#each layers as { variant, share } (variant)}
		{#each strips(variant) as strip}
			<Rectangle
				x={strip.x}
				y={strip.y}
				width={strip.width}
				height={strip.height}
				backgroundColor={strip.color}
				backgroundAlpha={Math.min(1, strip.alpha * share * breath)}
			/>
		{/each}
	{/each}
</BoardContainer>
