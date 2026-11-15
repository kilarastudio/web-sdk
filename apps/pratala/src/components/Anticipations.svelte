<script lang="ts">
	import { untrack } from 'svelte';

	import { OnMount } from 'components-shared';
	import { SECOND } from 'constants-shared/time';

	import { getContext } from '../game/context';
	import { setAnticipating } from '../game/anticipation.svelte';
	import Anticipation from './Anticipation.svelte';

	const context = getContext();
	const hasAnticipation = $derived(
		context.stateGame.board.some((reel) => reel.reelState.anticipating),
	);

	// only a change in the reels' waiting sets it: the free spins intro darkens the board too
	$effect(() => {
		const on = hasAnticipation;
		untrack(() => setAnticipating(on));
	});
</script>

{#if hasAnticipation}
	<OnMount
		onmount={() => {
			context.eventEmitter.broadcast({ type: 'soundLoop', name: 'sfx_anticipation' });
			context.eventEmitter.broadcast({
				type: 'soundFade',
				name: 'sfx_anticipation',
				from: 0,
				to: 1,
				duration: SECOND,
			});

			return () => {
				context.eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_anticipation' });
			};
		}}
	/>
{/if}

{#each context.stateGame.board as reel}
	{#if reel.reelState.anticipating}
		<Anticipation {reel} oncomplete={() => (reel.reelState.anticipating = false)} />
	{/if}
{/each}
