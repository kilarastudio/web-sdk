<script lang="ts">
	import { Rectangle } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { GREY } from '../game/constants';

	// One flat colour, the game screen's own.
	const context = getContext();
</script>

<Rectangle
	{...context.stateLayoutDerived.canvasSizes()}
	backgroundColor={GREY.canvas}
	zIndex={-3}
/>
