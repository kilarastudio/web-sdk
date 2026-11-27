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
		PROFIT_LIMIT_TEXT_OPTIONS,
		AUTO_SPINS_TEXT_OPTION_MAP,
		AUTO_SPINS_LOSS_LIMIT_MULTIPLIER_MAP,
		AUTO_SPINS_SINGLE_WIN_LIMIT_MULTIPLIER_MAP,
		AUTO_SPINS_PROFIT_LIMIT_MULTIPLIER_MAP,
	} from 'state-shared';
	import { getContextEventEmitter } from 'utils-event-emitter';

	import UiSheet from './UiSheet.svelte';
	import UiSheetSection from './UiSheetSection.svelte';
	import UiChoiceGrid from './UiChoiceGrid.svelte';
	import UiAction from './UiAction.svelte';
	import { i18nDerived } from '../i18n/i18nDerived';
	import type { AutoplayOptions, EmitterEventModal } from '../types';

	type Props = { options?: AutoplayOptions };

	const props: Props = $props();
	const options = $derived(props.options ?? {});

	const { eventEmitter } = getContextEventEmitter<EmitterEventModal>();

	// an armed mode plays without limits (they are cleared when it is armed), unless the game
	// keeps them
	const limitsOff = $derived(
		!options.limitsInModes && stateBetDerived.activeBetMode().type === 'activate',
	);
	// the unit of a limit: the bet, or what a round really costs where the limits hold in a mode
	const unit = () => (options.limitsInModes ? stateBetDerived.betCost() : stateBet.betAmount);

	const press = () => eventEmitter.broadcast({ type: 'soundPressGeneral' });

	const start = () => {
		stateBet.autoSpinsCounter = AUTO_SPINS_TEXT_OPTION_MAP[stateUi.autoSpinsText];
		stateBet.autoSpinsLossLimitAmount = unit() * AUTO_SPINS_LOSS_LIMIT_MULTIPLIER_MAP[stateUi.autoSpinsLossLimitText]; // prettier-ignore
		stateBet.autoSpinsSingleWinLimitAmount = unit() * AUTO_SPINS_SINGLE_WIN_LIMIT_MULTIPLIER_MAP[stateUi.autoSpinsSingleWinLimitText]; // prettier-ignore
		stateBet.autoSpinsProfitLimitAmount = options.profitLimit
			? unit() * AUTO_SPINS_PROFIT_LIMIT_MULTIPLIER_MAP[stateUi.autoSpinsProfitLimitText]
			: Infinity;
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

		{@render options.extra?.()}

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

		{#if options.profitLimit}
			<UiSheetSection label={i18nDerived.profitLimit()} disabled={limitsOff}>
				<UiChoiceGrid
					data-test="profit-limit"
					value={stateUi.autoSpinsProfitLimitText}
					options={PROFIT_LIMIT_TEXT_OPTIONS}
					onchange={(value) => {
						stateUi.autoSpinsProfitLimitText = value;
						press();
					}}
				/>
			</UiSheetSection>
		{/if}

		{#snippet footer()}
			<div class="start">
				{#if options.blocked}
					<p class="blocked" data-test="autoplay-blocked">{options.blocked}</p>
				{/if}
				<UiAction
					block
					disabled={!stateBetDerived.isBetCostAvailable() || !!options.blocked}
					onpress={start}
				>
					{i18nDerived.startAutoplay()}
				</UiAction>
			</div>
		{/snippet}
	</UiSheet>
{/if}

<style lang="scss">
	/* why autoplay waits stands over the start button, across the sheet */
	.start {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: 0.6em;
		min-width: 0;
	}

	.blocked {
		margin: 0;
		color: var(--ui-text-muted);
		font-size: 0.9em;
		text-align: center;
	}
</style>
