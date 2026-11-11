<script lang="ts">
	import { zIndex } from 'constants-shared/zIndex';
	import { stateModal } from 'state-shared';

	import UiSheet from './UiSheet.svelte';
	import UiAction from './UiAction.svelte';
	import { i18nDerived } from '../i18n/i18nDerived';

	const messageMap = $derived({
		lossLimitReached: i18nDerived.lossLimitReached(),
		singleWinLimitReached: i18nDerived.singleWinLimitReached(),
		insufficientFunds: i18nDerived.insufficientFunds(),
	});

	const close = () => (stateModal.modal = null);
</script>

<!-- why autoplay stopped -->
{#if stateModal.modal?.name === 'autoSpinMessage'}
	<UiSheet title={i18nDerived.notification()} size="small" zIndex={zIndex.modal} onclose={close}>
		<p class="lead" data-test="auto-spin-stop-info">{i18nDerived.autoSpinsStopInfo()}</p>
		<p class="reason" data-test="auto-spin-stop-content">
			{messageMap[stateModal.modal.message]}
		</p>

		{#snippet footer()}
			<UiAction block onpress={close}>{i18nDerived.ok()}</UiAction>
		{/snippet}
	</UiSheet>
{/if}

<style lang="scss">
	p {
		margin: 0;
	}

	.lead {
		color: var(--ui-text-muted);
		font-size: 0.8em;
		font-weight: 600;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	.reason {
		font-size: 1.25em;
		font-weight: 800;
		letter-spacing: 0.03em;
		line-height: 1.2;
		text-transform: uppercase;
		text-wrap: balance;
	}
</style>
