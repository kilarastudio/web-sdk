<script lang="ts">
	import type { Snippet } from 'svelte';

	import { zIndex } from 'constants-shared/zIndex';
	import { stateModal } from 'state-shared';

	import UiSheet from './UiSheet.svelte';
	import { i18nDerived } from '../i18n/i18nDerived';

	type Props = {
		children: Snippet;
		// how wide the sheet may grow: a game whose rules hold tables or pictures asks for 'large'
		size?: 'medium' | 'large';
	};

	const props: Props = $props();
</script>

{#if stateModal.modal?.name === 'gameRules'}
	<UiSheet
		title={i18nDerived.info()}
		size={props.size ?? 'medium'}
		zIndex={zIndex.modal}
		onclose={() => (stateModal.modal = null)}
	>
		{@render props.children()}
	</UiSheet>
{/if}
