<script lang="ts">
	import { zIndex } from 'constants-shared/zIndex';
	import {
		stateUi,
		stateBet,
		stateModal,
		stateBetDerived,
		AUTO_SPINS_TEXT_OPTIONS,
		LOSS_LIMIT_TEXT_OPTIONS,
		SINGLE_WIN_LIMIT_TEXT_OPTIONS,
		AUTO_SPINS_TEXT_OPTION_MAP,
		AUTO_SPINS_LOSS_LIMIT_MULTIPLIER_MAP,
		AUTO_SPINS_SINGLE_WIN_LIMIT_MULTIPLIER_MAP,
	} from 'state-shared';
	import { getContextEventEmitter } from 'utils-event-emitter';

	import UiSheet from './UiSheet.svelte';
	import UiSheetSection from './UiSheetSection.svelte';
	import UiChoiceGrid from './UiChoiceGrid.svelte';
	import UiAction from './UiAction.svelte';
	import { i18nDerived } from '../i18n/i18nDerived';
	import type { EmitterEventModal } from '../types';

	const { eventEmitter } = getContextEventEmitter<EmitterEventModal>();

	// an armed mode plays without limits (they are cleared when it is armed)
	const limitsOff = $derived(stateBetDerived.activeBetMode().type === 'activate');

	const press = () => eventEmitter.broadcast({ type: 'soundPressGeneral' });

	const start = () => {
		stateBet.autoSpinsCounter = AUTO_SPINS_TEXT_OPTION_MAP[stateUi.autoSpinsText];
		stateBet.autoSpinsLossLimitAmount = stateBet.betAmount * AUTO_SPINS_LOSS_LIMIT_MULTIPLIER_MAP[stateUi.autoSpinsLossLimitText]; // prettier-ignore
		stateBet.autoSpinsSingleWinLimitAmount = stateBet.betAmount * AUTO_SPINS_SINGLE_WIN_LIMIT_MULTIPLIER_MAP[stateUi.autoSpinsSingleWinLimitText]; // prettier-ignore
		if (stateBetDerived.activeBetMode().type === 'buy') stateBet.activeBetModeKey = 'BASE';
		press();
		eventEmitter.broadcast({ type: 'autoBet' });
		stateModal.modal = null;
	};
</script>

<!--
	Autoplay: how many rounds, when to stop on a loss or on one big win, and the button that
	starts it. Nothing plays until that button is pressed.
-->
{#if stateModal.modal?.name === 'autoSpin'}
	<UiSheet
		title={i18nDerived.autoSpins()}
		size="medium"
		zIndex={zIndex.modal}
		onclose={() => (stateModal.modal = null)}
	>
		<UiSheetSection label={i18nDerived.numberOfRounds()}>
			<UiChoiceGrid
				data-test="round-options"
				value={stateUi.autoSpinsText}
				options={AUTO_SPINS_TEXT_OPTIONS}
				onchange={(value) => {
					stateUi.autoSpinsText = value;
					press();
				}}
			/>
		</UiSheetSection>

		<UiSheetSection label={i18nDerived.lossLimit()} disabled={limitsOff}>
			<UiChoiceGrid
				data-test="loss-limit"
				value={stateUi.autoSpinsLossLimitText}
				options={LOSS_LIMIT_TEXT_OPTIONS}
				onchange={(value) => {
					stateUi.autoSpinsLossLimitText = value;
					press();
				}}
			/>
		</UiSheetSection>

		<UiSheetSection label={i18nDerived.singleWinLimit()} disabled={limitsOff}>
			<UiChoiceGrid
				data-test="single-win-limit"
				value={stateUi.autoSpinsSingleWinLimitText}
				options={SINGLE_WIN_LIMIT_TEXT_OPTIONS}
				onchange={(value) => {
					stateUi.autoSpinsSingleWinLimitText = value;
					press();
				}}
			/>
		</UiSheetSection>

		{#snippet footer()}
			<UiAction block disabled={!stateBetDerived.isBetCostAvailable()} onpress={start}>
				{i18nDerived.startAutoplay()}
			</UiAction>
		{/snippet}
	</UiSheet>
{/if}
