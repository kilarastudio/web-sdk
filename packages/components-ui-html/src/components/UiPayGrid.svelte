<!-- The paytable's grid of symbol cards: four a row on desktop, two on phones and narrow sheets. -->
<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		children: Snippet;
	};

	const props: Props = $props();
</script>

<div class="ui-pay-wrap">
	<div class="ui-pay-grid">
		{@render props.children()}
	</div>
</div>

<style lang="scss">
	/* the grid's own width picks the columns, so it is the same in a sheet, a modal or a full page */
	.ui-pay-wrap {
		container-type: inline-size;
	}

	.ui-pay-grid {
		display: grid;
		--gap: 8px;
		gap: var(--gap);
		/* two cards a row on phones and narrow sheets */
		grid-template-columns: repeat(2, minmax(0, 1fr));

		/* desktop: four cards a row */
		@container (min-width: 760px) {
			grid-template-columns: repeat(4, minmax(0, 1fr));
		}

		/* a very narrow sheet: one card a row */
		@container (max-width: 279px) {
			grid-template-columns: minmax(0, 1fr);
		}

		@media (max-width: 399px), (max-height: 299px) {
			--gap: 6px;
		}
	}
</style>
