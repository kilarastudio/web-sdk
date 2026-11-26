<script lang="ts">
	import { OnHotkey } from 'components-shared';
	import { stateBetDerived, stateConfig, stateReplay, stateReplayDerived } from 'state-shared';
	import { numberToCurrencyString } from 'utils-shared/amount';

	import ButtonBetProvider from './ButtonBetProvider.svelte';
	import { getContext } from '../context';
	import { i18nDerived } from '../i18n/i18nDerived';

	type Props = {
		// the game is not ready for a round (a choice is missing): the bar is dimmed but still takes a
		// press, so the game can say what is missing
		ready?: boolean;
		// a replay: the bar plays the replayed round, no price
		replay?: boolean;
	};

	const { ready = true, replay = false }: Props = $props();
	const context = getContext();

	const replayDisabled = $derived(
		!stateReplay.bet || stateReplay.phase === 'playing' || !context.stateXstateDerived.isIdle(),
	);
	const replayLabel = $derived(
		stateReplay.phase === 'ready'
			? i18nDerived.play()
			: stateReplay.phase === 'playing'
				? i18nDerived.playing()
				: i18nDerived.playAgain(),
	);
	const playReplay = () => {
		if (replayDisabled || !stateReplayDerived.start()) return;
		context.eventEmitter.broadcast({ type: 'resumeBet' });
	};
</script>

<!--
	The burst HUD's one main action: a square-cornered Kertas bar as wide as its place, with the
	word and what the round takes from the balance. While a round runs it is the stop bar, on the
	HUD's dark surface. The layout sizes it with --burst-play-height and --ui-font-size.
-->
{#if replay}
	<button type="button" class="burst-play" disabled={replayDisabled} onclick={playReplay}>
		<span class="word">{replayLabel}</span>
	</button>
{:else}
	<ButtonBetProvider>
		{#snippet children({ key, onpress })}
			<OnHotkey hotkey="Space" disabled={stateConfig.jurisdiction.disabledSpacebar} {onpress} />
			{@const play = ['spin_default', 'spin_disabled'].includes(key)}
			<button
				type="button"
				class="burst-play"
				class:stop={!play}
				class:muted={['spin_disabled', 'stop_disabled'].includes(key) || (play && !ready)}
				data-test="play"
				onclick={onpress}
			>
				<span class="word">{play ? i18nDerived.play() : i18nDerived.stop()}</span>
				{#if play}
					<span class="price">{numberToCurrencyString(stateBetDerived.betCost())}</span>
				{/if}
			</button>
		{/snippet}
	</ButtonBetProvider>
{/if}

<style lang="scss">
	.burst-play {
		box-sizing: border-box;
		display: flex;
		flex: 1;
		justify-content: center;
		align-items: baseline;
		gap: 0.6em;
		min-width: 0;
		height: var(--burst-play-height);
		padding: 0 0.8em;
		border: none;
		background-color: var(--ui-text);
		color: var(--ui-accent-contrast);
		font-family: inherit;
		font-size: calc(var(--ui-font-size) * 1.1);
		font-weight: 700;
		letter-spacing: 0.08em;
		line-height: var(--burst-play-height);
		text-transform: uppercase;
		white-space: nowrap;
		cursor: pointer;
		pointer-events: auto;
		touch-action: manipulation;
		transition:
			color 0.15s,
			background-color 0.15s;

		@media (hover: hover) {
			&:not(:disabled):not(.muted):not(.stop):hover {
				background-color: #ffffff;
			}
		}

		/* no scale on press: the words dip instead */
		&:not(:disabled):active > span {
			transform: translateY(calc(var(--ui-font-size) * 0.06));
		}

		&:focus-visible {
			outline: 2px solid var(--ui-text);
			outline-offset: 2px;
		}

		&.stop {
			background-color: var(--ui-surface-raised);
			color: var(--ui-text);
		}

		&.muted,
		&:disabled {
			background-color: var(--ui-disabled-bg);
			color: var(--ui-text-disabled);
		}

		&:disabled {
			cursor: not-allowed;
		}
	}

	.word,
	.price {
		display: block;
		transition: transform 0.08s ease-out;
	}

	.price {
		font-variant-numeric: tabular-nums;
		font-weight: 600;
		letter-spacing: 0.02em;
		opacity: 0.7;
	}

	@media (prefers-reduced-motion: reduce) {
		.burst-play > span {
			transform: none !important;
		}
	}
</style>
