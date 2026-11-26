<script lang="ts" module>
	export type EmitterEventBoardFrame =
		{ type: 'boardFrameGlowShow' } | { type: 'boardFrameGlowHide' };
</script>

<script lang="ts">
	import _ from 'lodash';
	import { Rectangle } from 'pixi-svelte';

	import BoardContainer from './BoardContainer.svelte';
	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BOARD_SIZES, BOARD_DIMENSIONS, GREY } from '../game/constants';

	// Grey box: the board is a dark panel with its 20 cells marked. In The Job its edge is white.
	const context = getContext();
	const EDGE = 6;
	let feature = $state(false);

	context.eventEmitter.subscribeOnMount({
		boardFrameGlowShow: () => (feature = true),
		boardFrameGlowHide: () => (feature = false),
	});
</script>

<BoardContainer>
	<Rectangle
		x={-EDGE}
		y={-EDGE}
		width={BOARD_SIZES.width + EDGE * 2}
		height={BOARD_SIZES.height + EDGE * 2}
		backgroundColor={GREY.board}
		borderColor={feature ? GREY.text : GREY.line}
		borderWidth={feature ? 4 : 2}
	/>
	{#each _.range(BOARD_DIMENSIONS.x) as reel}
		{#each _.range(BOARD_DIMENSIONS.y) as row}
			<Rectangle
				x={reel * SYMBOL_SIZE + 2}
				y={row * SYMBOL_SIZE + 2}
				width={SYMBOL_SIZE - 4}
				height={SYMBOL_SIZE - 4}
				backgroundColor={GREY.cell}
			/>
		{/each}
	{/each}
</BoardContainer>
