<script lang="ts">
	import { stateBet, stateBetDerived, stateConfig, stateModal } from 'state-shared';

	import UiButton from './UiButton.svelte';
	import { getContext } from '../context';
	import { i18nDerived } from '../i18n/i18nDerived';

	const context = getContext();
	const active = $derived(stateBetDerived.hasAutoBetCounter());
	const disabled = $derived.by(() => {
		if (stateConfig.jurisdiction.disabledAutoplay && !stateBetDerived.hasAutoBetCounter()) return true;
		if (stateBet.isSpaceHold) return true;
		if (!context.stateXstateDerived.isIdle() && !stateBetDerived.hasAutoBetCounter()) return true;
		return false;
	});
	const counterFontSize = $derived.by(() => {
		if (stateBet.autoSpinsCounter === Infinity) return 3;
		if (stateBet.autoSpinsCounter > 99) return 1.5;
		if (stateBet.autoSpinsCounter > 9) return 2;
		return 2.5;
	});

	const stopAutoSpin = () => (stateBet.autoSpinsCounter = 0);
	// autoplay the balance cannot cover says why instead of staying dark ([222])
	const openModal = () =>
		(stateModal.modal = stateBetDerived.isBetCostAvailable()
			? { name: 'autoSpin' }
			: { name: 'error', error: { error: 'ERR_IPB' } });
	const onpress = () => {
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		stateBetDerived.hasAutoBetCounter() ? stopAutoSpin() : openModal();
	};
</script>

<UiButton label={i18nDerived.autoSpin()} icon="autoSpin" {active} {disabled} {onpress}>
	{#if stateBet.autoSpinsCounter > 0}
		<span class="counter" style:--counter-font-size={counterFontSize}>
			{stateBet.autoSpinsCounter === Infinity ? '∞' : stateBet.autoSpinsCounter}
		</span>
	{/if}
</UiButton>

<style lang="scss">
	.counter {
		/* a square in the button's own size, right of any room the button keeps on its left */
		position: absolute;
		inset: calc(var(--ui-button-size) * 0.05);
		left: calc(var(--ui-button-inset-start, 0px) + var(--ui-button-size) * 0.05);
		display: flex;
		justify-content: center;
		align-items: center;
		border-radius: inherit;
		background-color: var(--ui-accent);
		color: var(--ui-accent-contrast);
		/* by the shorter side, so it also fits a flat button */
		font-size: calc(
			min(var(--ui-button-size), var(--ui-button-height, var(--ui-button-size))) * 0.2 *
				var(--counter-font-size)
		);
		font-weight: bold;
	}
</style>
