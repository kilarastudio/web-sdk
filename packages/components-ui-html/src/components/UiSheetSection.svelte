<!-- A labelled group inside a menu: a small muted heading, an optional value beside it, and its content. -->
<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		label: string;
		// shown at the end of the heading line, e.g. the chosen value
		value?: string;
		disabled?: boolean;
		children: Snippet;
	};

	const props: Props = $props();
</script>

<section class="ui-sheet-section" class:disabled={props.disabled}>
	<div class="heading">
		<h3 class="label">{props.label}</h3>
		{#if props.value}<span class="value">{props.value}</span>{/if}
	</div>
	{@render props.children()}
</section>

<style lang="scss">
	.ui-sheet-section {
		display: flex;
		flex-direction: column;
		gap: 8px;
		min-width: 0;

		&.disabled {
			opacity: 0.45;
			pointer-events: none;
		}
	}

	.heading {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 12px;
	}

	.label {
		margin: 0;
		color: var(--ui-text-muted);
		font-size: 0.75em;
		font-weight: 600;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	.value {
		font-size: 0.9em;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}
</style>
