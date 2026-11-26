<script lang="ts">
	import { Rectangle } from 'pixi-svelte';

	import { SYMBOL_SIZE, BOARD_SIZES } from '../game/constants';
</script>

<!-- drawn inside the board container, so in the board's own units -->
<Rectangle
	isMask
	x={-SYMBOL_SIZE}
	width={BOARD_SIZES.width + SYMBOL_SIZE * 2}
	height={BOARD_SIZES.height}
/>
