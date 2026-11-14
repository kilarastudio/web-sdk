<script lang="ts">
	import { zIndex } from 'constants-shared/zIndex';
	import { stateBet, stateConfig, stateModal } from 'state-shared';
	import { getContextEventEmitter } from 'utils-event-emitter';
	import { numberToCurrencyString } from 'utils-shared/amount';
	import { CURRENCY_META } from 'utils-shared/currency';

	import UiSheet from './UiSheet.svelte';
	import UiSheetSection from './UiSheetSection.svelte';
	import UiChoiceGrid from './UiChoiceGrid.svelte';
	import UiStepper from './UiStepper.svelte';
	import UiAction from './UiAction.svelte';
	import { i18nDerived } from '../i18n/i18nDerived';
	import type { EmitterEventModal } from '../types';

	const { eventEmitter } = getContextEventEmitter<EmitterEventModal>();

	// short enough for a chip: 1.50, 2.5K, 1.2M
	const compact = (value: number) => {
		if (value === stateConfig.betMenuOptions.at(-1)) return i18nDerived.max();
		if (value > 999999) return `${(value / 1000000).toFixed(2)}M`;
		if (value > 999) return `${(value / 1000).toFixed(2)}K`;

		// the currency's own decimals: 100 for JPY, 0.000010 for BTC
		return value.toFixed(CURRENCY_META[stateBet.currency]?.decimals ?? 2);
	};

	const choose = (value: number) => {
		stateBet.betAmount = value;
		eventEmitter.broadcast({ type: 'soundPressGeneral' });
	};
</script>

<!-- the bet: step through the levels, or pick one straight from the list the server allows -->
{#if stateModal.modal?.name === 'betAmountMenu'}
	<UiSheet
		title={i18nDerived.betMenu()}
		size="medium"
		zIndex={zIndex.modal}
		onclose={() => (stateModal.modal = null)}
	>
		<UiStepper
			value={stateBet.betAmount}
			options={stateConfig.betAmountOptions}
			format={numberToCurrencyString}
			onchange={choose}
		/>

		<UiSheetSection label={i18nDerived.selectYourBet()}>
			<UiChoiceGrid
				value={stateBet.betAmount}
				options={stateConfig.betMenuOptions}
				format={compact}
				min={84}
				onchange={choose}
			/>
		</UiSheetSection>

		{#snippet footer()}
			<UiAction block data-test="confirm-button" onpress={() => (stateModal.modal = null)}>
				{i18nDerived.confirm()}
			</UiAction>
		{/snippet}
	</UiSheet>
{/if}
