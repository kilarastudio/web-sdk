<script lang="ts">
	import type { Snippet } from 'svelte';

	import { zIndex } from 'constants-shared/zIndex';
	import { stateModal } from 'state-shared';

	import UiSheet from './UiSheet.svelte';
	import { i18nDerived } from '../i18n/i18nDerived';

	type Props = {
		children: Snippet;
	};

	const props: Props = $props();
</script>

{#if stateModal.modal?.name === 'payTable'}
	<UiSheet
		title={i18nDerived.payTable()}
		size="large"
		zIndex={zIndex.modal}
		onclose={() => (stateModal.modal = null)}
	>
		{@render props.children()}
	</UiSheet>
{/if}
