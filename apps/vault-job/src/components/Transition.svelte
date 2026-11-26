<script lang="ts" module>
	export type EmitterEventTransition = { type: 'transition' };
</script>

<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { Rectangle } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { GREY } from '../game/constants';

	// Grey box: between the base game and The Job the screen dips to dark and comes back.
	const context = getContext();
	const alpha = new Tween(0);

	context.eventEmitter.subscribeOnMount({
		transition: async () => {
			await alpha.set(1, { duration: 180 });
			await alpha.set(0, { duration: 220 });
		},
	});
</script>

{#if alpha.current > 0}
	<Rectangle
		{...context.stateLayoutDerived.canvasSizes()}
		backgroundColor={GREY.board}
		alpha={alpha.current}
	/>
{/if}
