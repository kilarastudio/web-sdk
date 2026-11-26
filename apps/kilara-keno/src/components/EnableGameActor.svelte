<script lang="ts">
	import { onMount } from 'svelte';

	import { stateBet, stateI18nDerived } from 'state-shared';

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

	// A round needs exactly the pick size's count of numbers and a mode the RGS plays. The shell's
	// play button, space bar and autoplay all arrive here as "bet" or "autoBet"; one that comes too
	// early says what is missing instead of playing.
	const canPlay = () => {
		const { picks, ready } = context.stateGameDerived;
		if (ready() && parseMode(stateBet.activeBetModeKey)) return true;
		const missing = picks() - context.stateGame.picked.length;
		context.stateGameDerived.notify(
			missing === 1
				? stateI18nDerived.translate('PICK 1 MORE NUMBER TO PLAY.')
				: stateI18nDerived.translate('PICK {count} MORE NUMBERS TO PLAY.', { count: missing }),
		);
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
