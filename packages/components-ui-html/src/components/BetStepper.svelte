<script lang="ts">
	import LabelBet from './LabelBet.svelte';
	import ButtonDecrease from './ButtonDecrease.svelte';
	import ButtonIncrease from './ButtonIncrease.svelte';

	type Props = {
		// ▲ and ▼ stacked right of the amount (mouse); otherwise − amount + (touch, larger targets)
		stacked?: boolean;
	};

	const props: Props = $props();
</script>

<!--
	The bet in one square-cornered field; press the amount for the bet menu. The layout sizes it
	with --stepper-height. A parent may cut the field's background with --bet-stepper-mask and keep
	--bet-stepper-end-inset of extra room on its right for that cut (HudBar, beside the notch).
-->
<div class="bet-stepper" class:stacked={props.stacked}>
	{#if props.stacked}
		<div class="value">
			<LabelBet stacked />
		</div>
		<div class="arrows">
			<ButtonIncrease chevron />
			<ButtonDecrease chevron />
		</div>
	{:else}
		<ButtonDecrease />
		<div class="value">
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

		position: relative;
		isolation: isolate;
		box-sizing: border-box;
		display: flex;
		align-items: center;
		gap: 4px;
		height: var(--stepper-height);
		padding: 0 calc(8px + var(--bet-stepper-end-inset, 0px)) 0 8px;

		/* the fill on its own layer, so a mask cuts the field and never its contents */
		&::before {
			content: '';
			position: absolute;
			inset: 0;
			z-index: -1;
			background-color: var(--ui-field);
			-webkit-mask: var(--bet-stepper-mask, none);
			mask: var(--bet-stepper-mask, none);
		}

		.value {
			display: flex;
			justify-content: center;
			min-width: calc(var(--ui-font-size) * 5);
		}
	}

	.stacked {
		--ui-label-align: start;

		gap: 8px;
		padding: 4px calc(4px + var(--bet-stepper-end-inset, 0px)) 4px 24px;

		.value {
			justify-content: flex-start;
			min-width: calc(var(--ui-font-size) * 4.5);
		}
	}

	/* two half-height buttons, together as tall as the field's inside */
	.arrows {
		--ui-button-size: calc(var(--stepper-height) * 0.7);
		--ui-button-height: calc((var(--stepper-height) - 8px) / 2);
		--ui-icon-scale: 0.6;

		display: flex;
		flex-direction: column;
	}
</style>
