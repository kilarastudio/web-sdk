<!--
	A level from 0 to 100: a mute button, a flat track with a Kertas fill and a square knob, and
	the value. The mute button puts the level to 0 and back to where it was.
-->
<script lang="ts">
	import { KILARA_ICONS } from './kilaraIcons';

	type Props = {
		value: number;
		label: string;
		// called with the new level whenever it changes
		onchange?: (value: number) => void;
	};

	let { value = $bindable(), label, onchange }: Props = $props();
	// the level to go back to when sound is switched on again
	let before = 50;

	const set = (next: number) => {
		value = next;
		onchange?.(next);
	};
	const toggle = () => {
		if (value > 0) {
			before = value;
			set(0);
		} else set(before || 50);
	};
	const icon = $derived(value > 0 ? KILARA_ICONS.soundOn : KILARA_ICONS.soundOff);
</script>

<div class="ui-slider">
	<button type="button" class="mute" aria-label={label} aria-pressed={value === 0} onclick={toggle}>
		<svg viewBox="0 0 96 96" focusable="false" aria-hidden="true">
			<path d={icon.d} />
		</svg>
	</button>

	<input
		type="range"
		min="0"
		max="100"
		step="1"
		aria-label={label}
		{value}
		style:--level="{value}%"
		oninput={(event) => set(Number(event.currentTarget.value))}
	/>

	<span class="level">{value}</span>
</div>

<style lang="scss">
	.ui-slider {
		--knob: calc(var(--sheet-control, 48px) * 0.42);

		display: flex;
		align-items: center;
		gap: 4px;
		height: var(--sheet-control, 48px);
		background-color: var(--ui-field);
	}

	.mute {
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
			width: 46%;
			height: 46%;
			fill: currentColor;
			transition: transform 0.08s ease-out;
		}

		&[aria-pressed='true'] {
			color: var(--ui-text-muted);
		}

		@media (hover: hover) {
			&:hover {
				background-color: var(--ui-field-hover);
			}
		}

		&:active svg {
			transform: translateY(2px);
		}

		&:focus-visible {
			outline: 2px solid var(--ui-text);
			outline-offset: -3px;
		}
	}

	.level {
		flex: none;
		width: 3.2em;
		padding-right: 0.6em;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		text-align: right;
	}

	input {
		flex: 1 1 auto;
		min-width: 0;
		height: 100%;
		margin: 0;
		background: none;
		cursor: pointer;
		touch-action: pan-y;
		-webkit-appearance: none;
		appearance: none;

		&:focus-visible {
			outline: 2px solid var(--ui-text);
			outline-offset: -3px;
		}
	}

	/* the track: Kertas up to the level, a field beyond it */
	@mixin track {
		height: 4px;
		border: none;
		background: linear-gradient(
			to right,
			var(--ui-text) var(--level),
			rgba(243, 244, 246, 0.18) var(--level)
		);
	}

	/* the knob: a square, like everything else in the menus */
	@mixin knob {
		box-sizing: border-box;
		width: var(--knob);
		height: var(--knob);
		border: none;
		border-radius: 0;
		background: var(--ui-text);
	}

	input::-webkit-slider-runnable-track {
		@include track;
	}

	input::-moz-range-track {
		@include track;
	}

	input::-webkit-slider-thumb {
		@include knob;

		margin-top: calc((4px - var(--knob)) / 2);
		-webkit-appearance: none;
		appearance: none;
	}

	input::-moz-range-thumb {
		@include knob;
	}
</style>
