<script lang="ts">
	import { zIndex } from 'constants-shared/zIndex';
	import { stateBet, stateModal, stateUi, INFINITY_MARK } from 'state-shared';
	import { getContextEventEmitter } from 'utils-event-emitter';
	import { numberToCurrencyString } from 'utils-shared/amount';

	import UiSheet from './UiSheet.svelte';
	import UiAction from './UiAction.svelte';
	import { stateBonus, stateBonusDerived } from '../stateBonus.svelte';
	import { i18nDerived } from '../i18n/i18nDerived';
	import type { EmitterEventModal } from '../types';

	const { eventEmitter } = getContextEventEmitter<EmitterEventModal>();

	const mode = $derived(stateBonusDerived.selectedBetModeData());
	const cost = $derived(stateBet.betAmount * mode.costMultiplier);

	const confirm = () => {
		stateBet.activeBetModeKey = stateBonus.selectedBetModeKey;

		if (mode.type === 'buy') {
			eventEmitter.broadcast({ type: 'bet' });
		}

		if (mode.type === 'activate') {
			eventEmitter.broadcast({ type: 'soundBetMode', betModeKey: stateBonus.selectedBetModeKey });
			stateUi.autoSpinsLossLimitText = INFINITY_MARK;
			stateUi.autoSpinsSingleWinLimitText = INFINITY_MARK;
		}

		eventEmitter.broadcast({ type: 'soundPressGeneral' });
		stateModal.modal = null;
	};
</script>

<!--
	The step between choosing a mode and paying for it: the mode's picture, what confirming does,
	and what it costs at the current bet. Closing it goes back to the list of modes.
-->
{#if stateModal.modal?.name === 'buyBonusConfirm'}
	<UiSheet
		title={mode.text.title}
		size="small"
		zIndex={zIndex.dialog}
		onclose={() => (stateModal.modal = { name: 'buyBonus' })}
	>
		<div class="summary">
			{#if mode.image}
				<img src={mode.image} alt="" draggable="false" />
			{/if}
			<p>{mode.text.dialog}</p>
		</div>

		<div class="cost">
			<span class="label">{i18nDerived.realCost()}</span>
			<span class="amount">{numberToCurrencyString(cost)}</span>
			<span class="times">{mode.costMultiplier}×</span>
		</div>

		{#snippet footer()}
			<UiAction block data-test="confirm-button" onpress={confirm}>
				{i18nDerived.confirm()}
			</UiAction>
		{/snippet}
	</UiSheet>
{/if}

<style lang="scss">
	.summary {
		display: flex;
		align-items: center;
		gap: 1em;
	}

	img {
		flex: none;
		width: 5.4em;
		height: 5.4em;
		object-fit: contain;
		/* the games' mode pictures are pixel art: scaled without smoothing */
		image-rendering: pixelated;
	}

	p {
		margin: 0;
		color: #d5d9df;
		line-height: 1.45;
		text-wrap: pretty;
		white-space: pre-line;
	}

	.cost {
		display: flex;
		align-items: baseline;
		gap: 0.6em;
		padding: 0.7em 0.9em;
		background-color: var(--ui-field);
	}

	.label {
		margin-right: auto;
		color: var(--ui-text-muted);
		font-size: 0.75em;
		font-weight: 600;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	.amount {
		font-size: 1.3em;
		font-weight: 800;
		font-variant-numeric: tabular-nums;
	}

	.times {
		color: var(--ui-text-muted);
		font-size: 0.85em;
		font-weight: 600;
	}

	@media (max-height: 299px) {
		img {
			width: 4em;
			height: 4em;
		}
	}
</style>
