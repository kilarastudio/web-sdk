<script lang="ts">
	type Props = {
		label: string;
		value: string;
		// label above the value; otherwise label and value side by side
		stacked?: boolean;
	};

	const props: Props = $props();
</script>

<!-- the layout aligns stacked labels with --ui-label-align (start, center or end) -->
<div class="ui-label" class:stacked={props.stacked}>
	<span class="name">{props.label}</span>
	<span class="value">{props.value}</span>
</div>

<style lang="scss">
	.ui-label {
		display: flex;
		align-items: baseline;
		gap: 0.4em;
		color: var(--ui-text);
		font-size: var(--ui-font-size);
		line-height: 1.15;
		white-space: nowrap;
		text-shadow: var(--ui-label-shadow, none);

		&.stacked {
			flex-direction: column;
			align-items: var(--ui-label-align, center);
			gap: 0.1em;
		}
	}

	.name {
		color: var(--ui-text-muted);
		font-size: 0.55em;
		font-weight: 500;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.value {
		color: var(--ui-label-value-color, var(--ui-text));
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}
</style>
