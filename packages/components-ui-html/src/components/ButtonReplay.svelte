<script lang="ts">
	import { stateReplay, stateReplayDerived } from 'state-shared';

	import { getContext } from '../context';
	import { i18nDerived } from '../i18n/i18nDerived';

	const context = getContext();
	const disabled = $derived(
		!stateReplay.bet || stateReplay.phase === 'playing' || !context.stateXstateDerived.isIdle(),
	);
	const label = $derived(
		stateReplay.phase === 'ready'
			? i18nDerived.play()
			: stateReplay.phase === 'playing'
				? i18nDerived.playing()
				: i18nDerived.playAgain(),
	);

	const onpress = () => {
		if (disabled || !stateReplayDerived.start()) return;
		context.eventEmitter.broadcast({ type: 'resumeBet' });
	};
</script>

<button type="button" class="button-replay" {disabled} onclick={onpress}>{label}</button>

<style lang="scss">
	.button-replay {
		width: 224px;
		height: 70px;
		padding: 0;
		border: none;
		background-color: #000000;
		color: #ffffff;
		font-family: inherit;
		font-size: 25px;
		font-weight: 600;
		cursor: pointer;
		pointer-events: auto;
		touch-action: manipulation;

		&:disabled {
			background-color: #555555;
			cursor: not-allowed;
		}
	}
</style>
