<script lang="ts">
	import { zIndex } from 'constants-shared/zIndex';
	import {
		stateBet,
		stateBetDerived,
		stateI18nDerived,
		stateModal,
		stateReplay,
		stateReplayDerived,
		stateUrlDerived,
	} from 'state-shared';
	import { numberToCurrencyString } from 'utils-shared/amount';

	import UiSheet from './UiSheet.svelte';
	import UiAction from './UiAction.svelte';
	import { fitText } from './fitText';
	import { getContext } from '../context';
	import { i18nDerived } from '../i18n/i18nDerived';

	const context = getContext();

	// the mode as the game names it, and as the math files name it where that is written otherwise
	const mathMode = $derived(stateReplay.bet?.mode ?? stateUrlDerived.mode());
	const gameMode = $derived(stateBetDerived.activeBetMode()?.text.title || mathMode.toUpperCase());

	const bet = $derived(stateBet.wageredBetAmount);
	const payoutMultiplier = $derived(stateReplay.bet?.payoutMultiplier ?? 0);

	const rows = $derived([
		{ label: i18nDerived.replayBaseBet(), value: numberToCurrencyString(bet) },
		{
			label: i18nDerived.replayCostMultiplier(),
			value: stateI18nDerived.times(stateReplay.costMultiplier),
		},
		{
			label: i18nDerived.realCost(),
			value: numberToCurrencyString(bet * stateReplay.costMultiplier),
			total: true,
		},
		{ label: i18nDerived.replayWinMultiplier(), value: stateI18nDerived.times(payoutMultiplier) },
		{
			label: i18nDerived.replayTotalWin(),
			value: numberToCurrencyString(bet * payoutMultiplier),
			total: true,
			win: true,
		},
	]);

	const close = () => (stateModal.modal = null);
	const start = () => {
		if (!context.stateXstateDerived.isIdle() || !stateReplayDerived.start()) return;
		close();
		context.eventEmitter.broadcast({ type: 'resumeBet' });
	};
</script>

<!--
	What the replayed round was, before it plays: its mode (the game's name and the math's), the
	bet, the mode's multiplier and what the round cost, then the payout multiplier and the win. Stake
	wants all of it in view before the replay starts, in social wording in social play. Closing it
	leaves the PLAY button in the bar.
-->
{#if stateModal.modal?.name === 'replay'}
	<UiSheet title={i18nDerived.replay()} size="small" zIndex={zIndex.dialog} onclose={close}>
		<dl class="summary">
			<div class="row mode">
				<dt>{i18nDerived.replayMode()}</dt>
				<dd use:fitText>
					<span class="value">
						{gameMode}
						{#if mathMode && mathMode !== gameMode}
							<span class="math">({mathMode})</span>
						{/if}
					</span>
				</dd>
			</div>
			{#each rows as row}
				<div class="row" class:total={row.total} class:win={row.win}>
					<dt>{row.label}</dt>
					<dd use:fitText><span class="value">{row.value}</span></dd>
				</div>
			{/each}
		</dl>

		<p class="note">{i18nDerived.replayNote()}</p>

		{#snippet footer()}
			<UiAction block data-test="start-replay-button" disabled={!stateReplay.bet} onpress={start}>
				{i18nDerived.replayStart()}
			</UiAction>
		{/snippet}
	</UiSheet>
{/if}

<style lang="scss">
	.summary {
		display: flex;
		flex-direction: column;
		gap: 2px;
		margin: 0;
	}

	.row {
		display: flex;
		align-items: baseline;
		gap: 1em;
		padding: 0.55em 0.9em;

		&.total {
			background-color: var(--ui-field);
		}

		&.mode {
			margin-bottom: 0.4em;
			border-bottom: 1px solid var(--ui-field);
		}
	}

	dt {
		flex: none;
		color: var(--ui-text-muted);
		font-size: 0.75em;
		font-weight: 600;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	/* the value takes the rest of the row and shrinks to it, so the largest amount stays whole */
	dd {
		flex: 1;
		min-width: 0;
		margin: 0;
		overflow: hidden;
		font-size: calc(1em * var(--ui-fit, 1));
		text-align: right;
		white-space: nowrap;
	}

	.value {
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}

	.mode .value {
		color: var(--ui-accent);
		font-weight: 800;
		letter-spacing: 0.06em;
	}

	.math {
		color: var(--ui-text-muted);
		font-weight: 600;
		letter-spacing: 0;
	}

	.total .value {
		font-size: 1.2em;
		font-weight: 800;
	}

	.win .value {
		color: var(--ui-win);
	}

	.note {
		margin: 0;
		color: var(--ui-text-muted);
		font-size: 0.8em;
		text-align: center;
	}

	/*
		Short screens (the mini player): the figures in two columns, so all of it fits at once, the
		mode across the top, what the round took on the left and what it won on the right.
	*/
	@media (max-height: 299px) {
		.summary {
			display: grid;
			grid-template-columns: 1fr 1fr;
			grid-template-rows: repeat(4, auto);
			grid-auto-flow: column;
			column-gap: 8px;
			align-content: start;
		}

		.row {
			padding: 0.35em 0.6em;

			&.mode {
				grid-row: 1;
				grid-column: 1 / -1;
				margin-bottom: 0;
			}
		}
	}
</style>
