<!--
	One symbol in the paytable: its picture beside what it pays, a row for each count, the pay in
	Kilau. Also used, with text in place of rows, for a symbol that does something other than pay.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		image: string;
		// pixel art is scaled without smoothing
		pixelated?: boolean;
		rows?: { label: string; value: string }[];
		children?: Snippet;
	};

	const props: Props = $props();
</script>

<div class="ui-pay-card" class:wide={!props.rows}>
	<img class:pixelated={props.pixelated} src={props.image} alt="" draggable="false" />
	{#if props.rows}
		<dl>
			{#each props.rows as row}
				<div class="row">
					<dt>{row.label}</dt>
					<dd>{row.value}</dd>
				</div>
			{/each}
		</dl>
	{/if}
	{#if props.children}
		<div class="text">{@render props.children()}</div>
	{/if}
</div>

<style lang="scss">
	.ui-pay-card {
		display: flex;
		align-items: center;
		gap: 0.8em;
		min-width: 0;
		padding: 0.6em 0.8em;
		background-color: var(--ui-field);

		/* a card with text takes the whole row of the grid */
		&.wide {
			grid-column: 1 / -1;
		}
	}

	img {
		flex: none;
		/* shrinks on a narrow card so the pays keep their room */
		width: clamp(2.5em, 30%, 4em);
		aspect-ratio: 1;
		object-fit: contain;

		&.pixelated {
			image-rendering: pixelated;
		}
	}

	dl {
		flex: 1 1 auto;
		min-width: 0;
		/* counts flush left, pays flush right against the card's edge */
		display: grid;
		grid-template-columns: max-content max-content;
		justify-content: space-between;
		column-gap: 0.6em;
		row-gap: 0.1em;
		margin: 0;
		font-size: 0.93em;
		font-variant-numeric: tabular-nums;
	}

	.row {
		display: contents;
	}

	dt {
		justify-self: start;
		text-align: left;
		color: var(--ui-text-muted);
		white-space: nowrap;
	}

	dd {
		justify-self: end;
		margin: 0;
		text-align: right;
		color: var(--ui-accent);
		font-weight: 700;
		white-space: nowrap;
	}

	.text {
		flex: 1 1 auto;
		min-width: 0;
		color: #d5d9df;
		line-height: 1.45;
		text-wrap: pretty;

		:global(p) {
			margin: 0;
		}

		:global(p + p) {
			margin-top: 0.3em;
		}

		:global(strong) {
			color: var(--ui-text);
		}
	}
</style>
