<script lang="ts">
	import { prefersReducedMotion } from 'svelte/motion';

	import { Sprite } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import type { Reel } from '../game/stateGame.svelte';
	import { BOARD_DIMENSIONS, SYMBOL_SIZE } from '../game/constants';
	import { animate } from '../game/motion';
	import { pixelClock } from '../game/pixelClock.svelte';

	type Props = {
		reel: Reel;
		oncomplete: () => void;
	};

	const props: Props = $props();
	const context = getContext();

	// A column waiting on a scatter burns: a dithered band of fire down its cells that throbs on
	// the pixel clock, and dies down once the column has landed.
	const THROB = [0.5, 0.65, 0.8, 1, 0.8, 0.65];
	const board = $derived(context.stateGameDerived.boardLayout());
	let fade = $state(1);
	let leaving = false;

	const throb = $derived(
		prefersReducedMotion.current ? 0.8 : THROB[pixelClock.frame % THROB.length],
	);

	$effect(() => {
		if (props.reel.reelState.motion !== 'stopped' || leaving) return;
		leaving = true;
		animate(200, (progress) => (fade = 1 - progress)).then(props.oncomplete);
	});
</script>

{#each Array(BOARD_DIMENSIONS.y) as _, row}
	<Sprite
		key="anticipationBeam"
		x={board.x - board.width * 0.5 + props.reel.reelIndex * SYMBOL_SIZE}
		y={board.y - board.height * 0.5 + row * SYMBOL_SIZE}
		width={SYMBOL_SIZE}
		height={SYMBOL_SIZE}
		alpha={throb * fade}
	/>
{/each}
