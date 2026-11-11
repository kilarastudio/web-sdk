<script lang="ts" module>
	// oncovered runs while the screen is dark, to change the scene behind the wipe
	export type EmitterEventTransition = { type: 'transition'; oncovered?: () => void };
</script>

<script lang="ts">
	import { waitForResolve } from 'utils-shared/wait';

	import TransitionAnimation from './TransitionAnimation.svelte';
	import { getContext } from '../game/context';

	const context = getContext();

	let transitioning = $state(false);
	let oncomplete = $state(() => {});
	let oncovered = $state<() => void>();

	context.eventEmitter.subscribeOnMount({
		transition: async (emitterEvent) => {
			oncovered = emitterEvent.oncovered;
			transitioning = true;
			await waitForResolve((resolve) => (oncomplete = resolve));
		},
	});
</script>

{#if transitioning}
	<TransitionAnimation
		{oncovered}
		oncomplete={() => {
			oncomplete();
			transitioning = false;
		}}
	/>
{/if}
