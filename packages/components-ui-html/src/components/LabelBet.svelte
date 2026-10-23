<script lang="ts">
	import { stateBetDerived, stateModal } from 'state-shared';
	import { numberToCurrencyString } from 'utils-shared/amount';

	import UiLabel from './UiLabel.svelte';
	import { getContext } from '../context';
	import { i18nDerived } from '../i18n/i18nDerived';

	type Props = {
		stacked?: boolean;
	};

	const props: Props = $props();
	const context = getContext();
	const label = $derived(stateBetDerived.activeBetMode()?.text.betAmountLabel || i18nDerived.bet());
	const value = $derived(numberToCurrencyString(stateBetDerived.betCost()));
	const disabled = $derived(!context.stateXstateDerived.isIdle());

	const onpress = () => {
		if (disabled) return;
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		stateModal.modal = { name: 'betAmountMenu' };
	};
</script>

<button type="button" class="label-bet" {disabled} onclick={onpress}>
	<UiLabel {label} {value} stacked={props.stacked} />
</button>

<style lang="scss">
	.label-bet {
		display: block;
		padding: 0;
		border: none;
		background: none;
		font: inherit;
		cursor: pointer;
		pointer-events: auto;
		touch-action: manipulation;

		&:disabled {
			cursor: not-allowed;
		}
	}
</style>
