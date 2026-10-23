<script lang="ts">
	import LabelBet from './LabelBet.svelte';
	import ButtonDecrease from './ButtonDecrease.svelte';
	import ButtonIncrease from './ButtonIncrease.svelte';
</script>

<!--
	− BET + in one field, its corners in the same proportion as the dock's (--ui-corner); the
	layout sizes it with --stepper-height
-->
<div class="bet-stepper">
	<ButtonDecrease />
	<div class="value">
		<LabelBet stacked />
	</div>
	<ButtonIncrease />
</div>

<style lang="scss">
	.bet-stepper {
		--ui-button-size: calc(var(--stepper-height) - 16px);
		--ui-button-bg: transparent;
		--ui-button-hover-bg: var(--ui-field);
		/* − and + hover corners concentric with the stepper's: its radius minus the 8px gap */
		--ui-squircle: max(4px, calc(var(--stepper-height) * var(--ui-corner) - 8px));
		/* larger than the dock's 0.56: the stepper's buttons are smaller, the glyphs should not be */
		--ui-icon-scale: 0.62;
		--ui-label-align: center;

		box-sizing: border-box;
		display: flex;
		align-items: center;
		gap: 4px;
		height: var(--stepper-height);
		padding: 0 8px;
		border-radius: calc(var(--stepper-height) * var(--ui-corner));
		background-color: var(--ui-field);
	}

	.value {
		display: flex;
		justify-content: center;
		min-width: calc(var(--ui-font-size) * 5);
	}
</style>
