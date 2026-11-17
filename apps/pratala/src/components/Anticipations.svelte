<script lang="ts">
	import { onMount, untrack } from 'svelte';

	import { OnMount } from 'components-shared';
	import { SECOND } from 'constants-shared/time';

	import { getContext } from '../game/context';
	import { setAnticipating } from '../game/anticipation.svelte';
	import Anticipation from './Anticipation.svelte';
	import { BOARD_DIMENSIONS } from '../game/constants';
	import { anticipationBed, anticipationWalls } from '../pixel/textures';

	const context = getContext();
	const hasAnticipation = $derived(
		context.stateGame.board.some((reel) => reel.reelState.anticipating),
	);

	// the walls of fire are drawn once, a little after the game is up, so the first wait does not
	// stall on them
	onMount(() => {
		const timer = setTimeout(() => {
			anticipationWalls(1, BOARD_DIMENSIONS.y * 64);
			anticipationWalls(2, BOARD_DIMENSIONS.y * 64);
			anticipationBed(64, 18);
		}, 2500);
		return () => clearTimeout(timer);
	});

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
