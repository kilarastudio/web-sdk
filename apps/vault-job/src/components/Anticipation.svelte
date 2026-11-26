<script lang="ts">
	import { Rectangle } from 'pixi-svelte';

	import BoardContainer from './BoardContainer.svelte';
	import type { Reel } from '../game/stateGame.svelte';
	import { SYMBOL_SIZE, BOARD_SIZES, GREY } from '../game/constants';

	// Grey box: a reel still to land that could bring the last scatter is lit until it stops.
	type Props = {
		reel: Reel;
		oncomplete: () => void;
	};

	const props: Props = $props();

	$effect(() => {
		if (props.reel.reelState.motion === 'stopped') props.oncomplete();
	});
</script>

<BoardContainer>
	<Rectangle
		x={props.reel.reelIndex * SYMBOL_SIZE}
		width={SYMBOL_SIZE}
		height={BOARD_SIZES.height}
		backgroundColor={GREY.text}
		backgroundAlpha={0.12}
		borderColor={GREY.text}
		borderWidth={2}
	/>
</BoardContainer>
