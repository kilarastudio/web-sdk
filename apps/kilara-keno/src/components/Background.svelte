<script lang="ts">
	import { Rectangle } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { GREY } from '../game/constants';

	// Grey box: one flat colour.
	const context = getContext();
</script>

<Rectangle
	{...context.stateLayoutDerived.canvasSizes()}
	backgroundColor={GREY.canvas}
	zIndex={-3}
/>
