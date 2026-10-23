<script lang="ts">
	import { stateReplay, stateReplayDerived } from 'state-shared';

	import UiIcon from './UiIcon.svelte';
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

<button type="button" class="button-replay" {disabled} onclick={onpress}>
	<UiIcon name={stateReplay.phase === 'finished' ? 'playAgain' : 'play'} weight="fill" />
	{label}
</button>

<style lang="scss">
	.button-replay {
		display: flex;
		flex-shrink: 0;
		justify-content: center;
		align-items: center;
		gap: 0.45em;
		min-width: 260px;
		height: 84px;
		padding: 0 1.1em;
		border: none;
		border-radius: 999px;
		background-color: var(--ui-accent);
		color: var(--ui-accent-contrast);
		font-family: inherit;
		font-size: 28px;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		cursor: pointer;
		pointer-events: auto;
		touch-action: manipulation;
		transition: transform 0.1s ease-out;

		&:disabled {
			background-color: var(--ui-disabled-bg);
			color: var(--ui-text-disabled);
			cursor: not-allowed;
		}

		&:not(:disabled):active {
			transform: scale(0.96);
		}
	}
</style>
