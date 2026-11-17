<script lang="ts" module>
	export type EmitterEventBoardFrame =
		{ type: 'boardFrameGlowShow' } | { type: 'boardFrameGlowHide' };
</script>

<script lang="ts">
	import { prefersReducedMotion, Tween } from 'svelte/motion';
	import * as PIXI from 'pixi.js';

	import { BaseSprite, Container, Sprite } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { BOARD_DIMENSIONS, FRAME_ART_PIXEL } from '../game/constants';
	import { impact } from '../game/impact.svelte';
	import { pixelClock } from '../game/pixelClock.svelte';
	import { frameHeat } from '../game/frameHeat.svelte';
	import { EDGE_FRAMES, CREST_EYE_FRAMES, frameGeometry, type FrameVariant } from '../pixel/frame';

	const context = getContext();

	const board = $derived(context.stateGameDerived.boardLayout());
	// the flagstones the symbols land on, and the frame round them, all drawn by code; they shake
	// with the board
	const floor = $derived({
		x: board.x - board.width * 0.5 + impact.x,
		y: board.y - board.height * 0.5 + impact.y,
		width: board.width,
		height: board.height,
	});

	// The frame (pixel/frame.ts): heavy dark stone with a molten inner edge, carved corners and the
	// crest with the dragon's eye. During free spins it is the red-hot frame, faded in over the
	// other. Its molten edge and the crest's eye breathe in colour steps on the pixel clock; nothing
	// on it moves.
	const geometry = (variant: FrameVariant) =>
		frameGeometry(BOARD_DIMENSIONS.x, BOARD_DIMENSIONS.y, variant);
	const place = (variant: FrameVariant, dx = 0, dy = 0) => {
		const g = geometry(variant);
		return {
			x: floor.x + (dx - g.ox) * FRAME_ART_PIXEL,
			y: floor.y + (dy - g.oy) * FRAME_ART_PIXEL,
			width: g.canvasWidth * FRAME_ART_PIXEL,
			height: g.canvasHeight * FRAME_ART_PIXEL,
		};
	};

	const hot = new Tween(0);
	context.eventEmitter.subscribeOnMount({
		boardFrameGlowShow: () => {
			frameHeat.burning = true;
			hot.set(1, { duration: 900 });
		},
		boardFrameGlowHide: () => {
			frameHeat.burning = false;
			hot.set(0, { duration: 400 });
		},
	});
	$effect(() => {
		frameHeat.hot = hot.current;
	});

	const textures = (key: string) => (context.stateApp.loadedAssets[key] ?? []) as PIXI.Texture[];
	const reduced = $derived(prefersReducedMotion.current);
	// the edge steps about five times a second, the eye a little slower
	const edgeFrame = $derived(reduced ? 0 : Math.floor(pixelClock.frame / 2) % EDGE_FRAMES);
	const eyeFrame = $derived(reduced ? 0 : Math.floor(pixelClock.frame / 3) % CREST_EYE_FRAMES);
	const layers = $derived(
		(['base', 'fs'] as const)
			.map((variant) => ({ variant, alpha: variant === 'base' ? 1 : hot.current }))
			.filter(({ variant, alpha }) => alpha > 0 && (variant === 'fs' || hot.current < 1)),
	);
	const solid = (variant: FrameVariant) => [
		...textures(`frame_${variant}_stone`),
		...textures(`frame_${variant}_edge0`),
		...textures(`frame_${variant}_corners`),
		...textures(`frame_${variant}_crest`),
	];
</script>

<Sprite key="boardFloor" {...floor} />

{#each layers as { variant, alpha } (variant)}
	<Container {alpha}>
		<!-- a heavy shadow down and to the right -->
		{#each solid(variant) as texture}
			<BaseSprite {texture} {...place(variant, 2, 3)} tint={0x000000} alpha={0.6} />
		{/each}
		{#each textures(`frame_${variant}_stone`) as texture}
			<BaseSprite {texture} {...place(variant)} />
		{/each}
		{#each textures(`frame_${variant}_edge${edgeFrame}`) as texture}
			<BaseSprite {texture} {...place(variant)} />
		{/each}
		{#each textures(`frame_${variant}_corners`) as texture}
			<BaseSprite {texture} {...place(variant)} />
		{/each}
		{#each textures(`frame_${variant}_crest`) as texture}
			<BaseSprite {texture} {...place(variant)} />
		{/each}
		{#if textures(`frame_${variant}_eye`)[eyeFrame]}
			<BaseSprite texture={textures(`frame_${variant}_eye`)[eyeFrame]} {...place(variant)} />
		{/if}
	</Container>
{/each}
