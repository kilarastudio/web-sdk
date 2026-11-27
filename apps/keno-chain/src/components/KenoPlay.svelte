<script lang="ts">
	import { OnHotkey } from 'components-shared';
	import {
		stateBetDerived,
		stateConfig,
		stateReplay,
		stateReplayDerived,
		stateUrlDerived,
	} from 'state-shared';
	import { i18nDerived } from 'components-ui-html';
	// the shell's own play logic (what a press does in each state); the package does not export it
	import ButtonBetProvider from 'components-ui-html/src/components/ButtonBetProvider.svelte';
	import { numberToCurrencyString } from 'utils-shared/amount';

	import { getContext } from '../game/context';

	// The one main action: a green bar with a hard edge under it. A level that costs more than the
	// bet shows the round's real cost beside the word. While a round runs it stays the play bar, held
	// down a little, and takes no press: there is no stop button (user, 2026-11-27); a round is
	// over in about two seconds and autoplay is stopped from its own button. Not
	// ready (numbers missing) it is dimmed but still takes a press, so the game can say what is
	// missing.
	type Props = { ready: boolean; replay: boolean };

	const props: Props = $props();
	const context = getContext();
	// the UI's PLAY in sentence case, by the language's own rules (Turkish I lowers to ı)
	const sentence = (word: string) =>
		word.charAt(0) + word.slice(1).toLocaleLowerCase(stateUrlDerived.lang());

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

{#if props.replay}
	<button
		type="button"
		class="play"
		disabled={replayDisabled}
		data-test="play"
		onclick={playReplay}
	>
		<span>{sentence(replayLabel)}</span>
	</button>
{:else}
	<ButtonBetProvider>
		{#snippet children({ key, onpress })}
			{@const play = ['spin_default', 'spin_disabled'].includes(key)}
			<OnHotkey
				hotkey="Space"
				disabled={stateConfig.jurisdiction.disabledSpacebar}
				onpress={() => play && onpress()}
			/>
			<button
				type="button"
				class="play"
				class:busy={!play}
				class:muted={key === 'spin_disabled' || (play && !props.ready)}
				data-test="play"
				data-busy={!play}
				aria-disabled={!play}
				onclick={() => play && onpress()}
			>
				<span>{sentence(i18nDerived.play())}</span>
				{#if (stateBetDerived.activeBetMode()?.costMultiplier ?? 1) > 1}
					<small>{numberToCurrencyString(stateBetDerived.betCost())}</small>
				{/if}
			</button>
		{/snippet}
	</ButtonBetProvider>
{/if}

<style lang="scss">
	/* lengths in the HUD's unit: the bar's own text is 2.2 of it */
	.play {
		display: flex;
		align-items: baseline;
		justify-content: center;
		gap: 0.5em;
		width: 100%;
		height: calc(var(--play-h) / 2.2 / var(--ctl, 1));
		margin-bottom: calc(var(--play-lip) / 2.2 / var(--ctl, 1));
		padding: 0;
		border: none;
		background-color: var(--play);
		box-shadow: 0 calc(var(--play-lip) / 2.2 / var(--ctl, 1)) 0 var(--play-edge);
		color: var(--play-ink);
		font-family: inherit;
		font-size: calc(2.2em * var(--ctl, 1));
		font-weight: 700;
		line-height: calc(var(--play-h) / 2.2 / var(--ctl, 1));
		white-space: nowrap;
		cursor: pointer;
		pointer-events: auto;
		touch-action: manipulation;
		/* the press goes down and comes back in a short move, not in a jump */
		transition:
			background-color 0.12s,
			opacity 0.15s,
			transform 0.08s ease-out,
			box-shadow 0.08s ease-out;

		small {
			font-size: 0.76em;
			font-weight: 600;
			opacity: 0.75;
			font-variant-numeric: tabular-nums;
		}

		@media (hover: hover) {
			&:not(:disabled):not(.muted):not(.busy):hover {
				background-color: var(--play-hover);
			}
		}

		&:not(:disabled):not(.busy):active {
			transform: translateY(calc(var(--play-lip) / 2.2 / var(--ctl, 1) - 1px));
			box-shadow: 0 1px 0 var(--play-edge);
		}

		&:focus-visible {
			outline: 2px solid var(--text);
			outline-offset: 2px;
		}

		/* a round is running: the bar stays what it is, a little quieter */
		&.busy {
			opacity: 0.8;
			cursor: default;
		}

		&.muted,
		&:disabled {
			opacity: 0.55;
		}

		&:disabled {
			cursor: not-allowed;
		}
	}
</style>
