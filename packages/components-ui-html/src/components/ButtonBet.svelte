<script lang="ts">
	import { OnHotkey } from 'components-shared';
	import { stateBetDerived } from 'state-shared';

	import UiButton from './UiButton.svelte';
	import ButtonBetProvider from './ButtonBetProvider.svelte';
	import { getContext } from '../context';
	import { i18nDerived } from '../i18n/i18nDerived';

	const context = getContext();
	// Only block a new bet: STOP must stay usable even when the balance left can't cover another bet.
	const disabled = $derived(
		context.stateXstateDerived.isIdle() && !stateBetDerived.isBetCostAvailable(),
	);
</script>

<ButtonBetProvider>
	{#snippet children({ key, onpress })}
		<OnHotkey hotkey="Space" {disabled} {onpress} />
		<UiButton
			label={['spin_default', 'spin_disabled'].includes(key)
				? i18nDerived.bet()
				: i18nDerived.stop()}
			muted={['spin_disabled', 'stop_disabled'].includes(key)}
			{disabled}
			{onpress}
		/>
	{/snippet}
</ButtonBetProvider>
