<script lang="ts">
	import { Rectangle } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { GREY } from '../game/constants';

	// Grey box: one flat colour, a shade lighter in the Duel.
	const context = getContext();
	const color = $derived(
		context.stateGame.gameType === 'freegame' ? GREY.canvasFeature : GREY.canvas,
	);
</script>

<Rectangle {...context.stateLayoutDerived.canvasSizes()} backgroundColor={color} zIndex={-3} />
