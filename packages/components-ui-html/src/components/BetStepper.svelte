<script lang="ts">
	import LabelBet from './LabelBet.svelte';
	import ButtonDecrease from './ButtonDecrease.svelte';
	import ButtonIncrease from './ButtonIncrease.svelte';
	import { fitText } from './fitText';

	type Props = {
		// ▲ and ▼ stacked right of the amount (mouse); otherwise − amount + (touch, larger targets)
		stacked?: boolean;
		// left of the dock's notch: the field reaches the notch and its right side, and the buttons at
		// that end, stop on curves round it. The dock sets --notch-radius and --curve (the field's
		// curve: the notch radius plus the dock's inset).
		besideNotch?: boolean;
	};

	const props: Props = $props();
</script>

<!--
	The bet in one square-cornered field; press the amount for the bet menu. The layout sizes it
	with --stepper-height.
-->
<div class="bet-stepper" class:stacked={props.stacked} class:beside-notch={props.besideNotch}>
	{#if props.stacked}
		<div class="value" use:fitText>
			<LabelBet stacked />
		</div>
		<div class="arrows">
			<ButtonIncrease chevron />
			<ButtonDecrease chevron />
		</div>
	{:else}
		<ButtonDecrease />
		<div class="value" use:fitText>
			<LabelBet stacked />
		</div>
		<ButtonIncrease />
	{/if}
</div>

<style lang="scss">
	.bet-stepper {
		--ui-button-size: calc(var(--stepper-height) - 16px);
		--ui-button-bg: transparent;
		--ui-button-hover-bg: var(--ui-field);
		/* larger than the dock's 0.56: the stepper's buttons are smaller, the glyphs should not be */
		--ui-icon-scale: 0.62;
		--ui-label-align: center;

		/* the field's padding on its right, also its gap above and below the buttons */
		--pad-end: 8px;

		position: relative;
		isolation: isolate;
		box-sizing: border-box;
		display: flex;
		align-items: center;
		gap: 4px;
		height: var(--stepper-height);
		padding: 0 var(--pad-end) 0 8px;

		/* the fill on its own layer, so a mask cuts the field and never its contents */
		&::before {
			content: '';
			position: absolute;
			inset: 0;
			z-index: -1;
			background-color: var(--ui-field);
		}

		/* a long amount shrinks to fit (fitText) rather than widening the field past this */
		.value {
			display: flex;
			justify-content: center;
			min-width: calc(var(--ui-font-size) * 5);
			max-width: calc(var(--ui-font-size) * 6);
		}
	}

	.stacked {
		--ui-label-align: start;
		--pad-end: 4px;

		gap: 4px;
		padding: var(--pad-end) var(--pad-end) var(--pad-end) 16px;

		/* wide enough for amounts up to $100.00 without the field changing width; longer ones grow it */
		.value {
			justify-content: flex-start;
			min-width: calc(var(--ui-font-size) * 4);
		}
	}

	/* two narrow half-height buttons, together as tall as the field's inside */
	.arrows {
		--ui-button-size: calc(var(--stepper-height) * 0.52);
		--ui-button-height: calc((var(--stepper-height) - 8px) / 2);
		/* the chevron keeps the size it had in a wider button */
		--ui-icon-scale: 0.8;

		display: flex;
		flex-direction: column;
	}

	/*
		Beside the notch the field's box reaches the notch. Its fill stops on the dock's curve, and
		the buttons at its end stop on a curve --pad-end further in, so they keep the field's padding
		all along it. Those buttons are the masked strip wider, with that strip as room on their
		right, so their icons stay where they were.
	*/
	.beside-notch {
		--room: calc(var(--curve) - var(--notch-radius));
		--end-curve: calc(var(--curve) + var(--pad-end));

		&::before {
			-webkit-mask: radial-gradient(
				circle at calc(100% + var(--notch-radius)) 50%,
				transparent var(--curve),
				#000 calc(var(--curve) + 1px)
			);
			mask: radial-gradient(
				circle at calc(100% + var(--notch-radius)) 50%,
				transparent var(--curve),
				#000 calc(var(--curve) + 1px)
			);
		}

		/* ▲ ▼, or + at the end of − amount + */
		.arrows > :global(.ui-button),
		&:not(.stacked) > :global(.ui-button:last-child) {
			--ui-button-width: calc(var(--ui-button-size) + var(--room));
			--ui-button-inset-end: var(--room);
			--ui-button-mask: radial-gradient(
				circle at calc(100% + var(--pad-end) + var(--notch-radius)) var(--end-y, 50%),
				transparent var(--end-curve),
				#000 calc(var(--end-curve) + 1px)
			);
		}

		/* the notch's centre is level with the field's middle: the foot of ▲, the top of ▼ */
		.arrows > :global(.ui-button:first-child) {
			--end-y: 100%;
		}

		.arrows > :global(.ui-button:last-child) {
			--end-y: 0%;
		}
	}
</style>
