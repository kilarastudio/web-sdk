<!--
	Pick one of a set: a grid of flat chips, the chosen one filled Kertas. The grid fits as many
	columns as the width allows, never narrower than `min` px a chip.
-->
<script lang="ts" generics="TValue extends string | number">
	type Props = {
		value: TValue;
		options: Readonly<TValue[]>;
		onchange: (value: TValue) => void;
		// what a chip shows; the option itself when not given
		format?: (option: TValue) => string;
		// the narrowest a chip may be, in px
		min?: number;
		'data-test'?: string;
	};

	const props: Props = $props();
</script>

<div class="ui-choice-grid" role="radiogroup" style:--chip-min="{props.min ?? 72}px">
	{#each props.options as option (option)}
		<button
			type="button"
			class="chip"
			class:chosen={option === props.value}
			role="radio"
			aria-checked={option === props.value}
			data-test={props['data-test'] ? `${props['data-test']}-${option}` : undefined}
			onclick={() => props.onchange(option)}
		>
			<span>{props.format ? props.format(option) : option}</span>
		</button>
	{/each}
</div>

<style lang="scss">
	.ui-choice-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(var(--chip-min), 1fr));
		gap: 6px;
	}

	.chip {
		box-sizing: border-box;
		display: grid;
		place-items: center;
		min-width: 0;
		height: calc(var(--sheet-control, 48px) * 0.88);
		padding: 0 6px;
		border: none;
		background-color: var(--ui-field);
		color: var(--ui-text);
		font-family: inherit;
		font-size: 1em;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
		cursor: pointer;
		touch-action: manipulation;
		transition:
			background-color 0.15s,
			color 0.15s;

		span {
			transition: transform 0.08s ease-out;
		}

		@media (hover: hover) {
			&:hover:not(.chosen) {
				background-color: var(--ui-field-hover);
			}
		}

		&:active span {
			transform: translateY(2px);
		}

		&.chosen {
			background-color: var(--ui-text);
			color: #0e1014;
			font-weight: 800;
		}

		&:focus-visible {
			outline: 2px solid var(--ui-text);
			outline-offset: 2px;
		}
	}
</style>
