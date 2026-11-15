<script lang="ts">
	import { CanvasSizeRectangle, MainContainer } from 'components-layout';
	import { Rectangle } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { BOARD_FRAME } from '../game/constants';

	// The dark a win's words stand on: the board goes dark under them, the hall only a little, so
	// what the hall does for the win is still seen.
	const context = getContext();
	const board = $derived(context.stateGameDerived.boardLayout());
</script>

<CanvasSizeRectangle backgroundColor={0x000000} backgroundAlpha={0.28} />
<MainContainer>
	<Rectangle
		x={board.x - board.width / 2 - BOARD_FRAME.border}
		y={board.y - board.height / 2 - BOARD_FRAME.border}
		width={board.width + BOARD_FRAME.border * 2}
		height={board.height + BOARD_FRAME.border * 2}
		backgroundColor={0x000000}
		backgroundAlpha={0.55}
	/>
</MainContainer>
