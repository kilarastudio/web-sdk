<script lang="ts">
	import { onMount } from 'svelte';

	import { stateBet } from 'state-shared';

	import { gameActor } from '../game/actor';
	import { skipDraw } from '../game/bookEventHandlerMap';
	import { parseMode } from '../game/keno';
	import { getContext } from '../game/context';

	const context = getContext();

	onMount(() => {
		const { unsubscribe } = gameActor.subscribe((snapshot) => {
			context.stateXstate.value = snapshot.value;
		});

		gameActor.start();
		gameActor.send({ type: 'RENDERED' });

		return () => {
			// Equivalent to onDestroy(); Leave this comment for searching.
			unsubscribe();
			gameActor.stop();
		};
	});

	// A round needs as many numbers as the level plays and a mode the RGS plays. The play bar, the
	// space bar and autoplay all arrive here as "bet" or "autoBet"; one that comes too early shakes
	// the line that says what is missing instead of playing.
	const canPlay = () => {
		if (context.stateGameDerived.ready() && parseMode(stateBet.activeBetModeKey)) return true;
		context.stateGameDerived.nudge();
		stateBet.autoSpinsCounter = 0;
		return false;
	};

	context.eventEmitter.subscribeOnMount({
		bet: () => canPlay() && gameActor.send({ type: 'BET' }),
		autoBet: () => canPlay() && gameActor.send({ type: 'AUTO_BET' }),
		resumeBet: () => gameActor.send({ type: 'RESUME_BET' }),
		stopButtonClick: () => skipDraw(),
	});
</script>
