<script lang="ts">
	import type { Snippet } from 'svelte';

	import { Container } from 'pixi-svelte';
	import { getContextBoard } from 'components-shared';

	import { SYMBOL_SIZE, BOARD_DIMENSIONS } from '../game/constants';

	type Props = {
		x: number;
		y: number;
		animating: boolean;
		children: Snippet;
	};

	const props: Props = $props();
	const boardContext = getContextBoard();
	const show = $derived(
		(boardContext.animate && props.animating) || (!boardContext.animate && !props.animating),
	);
	// a symbol is drawn while any part of it is inside the board; the board's mask clips the rest
	const top = -SYMBOL_SIZE * 0.5;
	const bottom = SYMBOL_SIZE * (BOARD_DIMENSIONS.y + 0.5);
	const inFrame = $derived(props.y > top && props.y < bottom);
</script>

<!-- hidden rather than removed outside the board, so nothing is built while the reels move -->
{#if show}
	<Container x={props.x} y={props.y} visible={inFrame}>
		{@render props.children()}
	</Container>
{/if}
