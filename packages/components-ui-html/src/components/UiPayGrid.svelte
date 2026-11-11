<!-- The paytable's grid of symbol cards: as many columns as fit, each at least `min` px wide. -->
<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		min?: number;
		children: Snippet;
	};

	const props: Props = $props();
</script>

<div class="ui-pay-grid" style:--card-min="{props.min ?? 150}px">
	{@render props.children()}
</div>

<style lang="scss">
	.ui-pay-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(var(--card-min), 1fr));
		gap: 8px;

		/* small screens: two cards a row at the least */
		@media (max-width: 399px), (max-height: 299px) {
			grid-template-columns: repeat(auto-fill, minmax(min(var(--card-min), 118px), 1fr));
			gap: 6px;
		}
	}
</style>
