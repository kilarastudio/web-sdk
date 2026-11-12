<script lang="ts">
	import { OnHotkey } from 'components-shared';
	import { stateConfig } from 'state-shared';

	import UiButton from './UiButton.svelte';
	import ButtonBetProvider from './ButtonBetProvider.svelte';
	import { i18nDerived } from '../i18n/i18nDerived';
</script>

<ButtonBetProvider>
	{#snippet children({ key, onpress })}
		<OnHotkey
			hotkey="Space"
			disabled={stateConfig.jurisdiction.disabledSpacebar}
			{onpress}
		/>
		{@const spin = ['spin_default', 'spin_disabled'].includes(key)}
		<UiButton
			kind={spin ? 'spin' : 'stop'}
			label={spin ? i18nDerived.bet() : i18nDerived.stop()}
			icon={spin ? 'spin' : 'stop'}
			muted={['spin_disabled', 'stop_disabled'].includes(key)}
			{onpress}
		/>
	{/snippet}
</ButtonBetProvider>
