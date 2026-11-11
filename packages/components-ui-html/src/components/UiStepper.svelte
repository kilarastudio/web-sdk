<!--
	Step through a list of values: − and + either side of the current one, shown large. Used for
	the bet amount wherever a menu lets the player change it.
-->
<script lang="ts" generics="TValue extends string | number">
	import { KILARA_ICONS } from './kilaraIcons';

	type Props = {
		value: TValue;
		options: Readonly<TValue[]>;
		onchange: (value: TValue) => void;
		format?: (value: TValue) => string;
		// a small caption above the value
		label?: string;
	};

	const props: Props = $props();

	const index = $derived(props.options.indexOf(props.value));
	const step = (by: number) => {
		const next = props.options[index + by];
		if (next !== undefined) props.onchange(next);
	};
</script>

<div class="ui-stepper">
	<button
		type="button"
		class="step"
		data-test="down-button"
		aria-label="Decrease"
		disabled={index <= 0}
		onclick={() => step(-1)}
	>
		<svg viewBox="0 0 96 96" focusable="false" aria-hidden="true">
			<path d={KILARA_ICONS.decrease.d} />
		</svg>
	</button>

	<div class="readout">
		{#if props.label}<span class="label">{props.label}</span>{/if}
		<span class="value">{props.format ? props.format(props.value) : props.value}</span>
	</div>

	<button
		type="button"
		class="step"
		data-test="up-button"
		aria-label="Increase"
		disabled={index < 0 || index >= props.options.length - 1}
		onclick={() => step(1)}
	>
		<svg viewBox="0 0 96 96" focusable="false" aria-hidden="true">
			<path d={KILARA_ICONS.increase.d} />
		</svg>
	</button>
</div>

<style lang="scss">
	.ui-stepper {
		display: flex;
		align-items: stretch;
		min-width: 0;
		height: calc(var(--sheet-control, 48px) * 1.15);
		background-color: var(--ui-field);
	}

	.readout {
		flex: 1 1 auto;
		min-width: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		line-height: 1.1;
	}

	.label {
		color: var(--ui-text-muted);
		font-size: 0.68em;
		font-weight: 600;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	.value {
		font-size: 1.2em;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.step {
		flex: none;
		display: grid;
		place-items: center;
		aspect-ratio: 1;
		height: 100%;
		padding: 0;
		border: none;
		background: none;
		color: var(--ui-text);
		cursor: pointer;
		touch-action: manipulation;
		transition: background-color 0.15s;

		svg {
			width: 36%;
			height: 36%;
			fill: currentColor;
			transition: transform 0.08s ease-out;
		}

		@media (hover: hover) {
			&:hover:not(:disabled) {
				background-color: var(--ui-field-hover);
			}
		}

		&:active:not(:disabled) svg {
			transform: translateY(2px);
		}

		&:disabled {
			color: var(--ui-text-disabled);
			cursor: not-allowed;
		}

		&:focus-visible {
			outline: 2px solid var(--ui-text);
			outline-offset: -3px;
		}
	}
</style>
