<script lang="ts">
	import LabelBet from './LabelBet.svelte';
	import ButtonDecrease from './ButtonDecrease.svelte';
	import ButtonIncrease from './ButtonIncrease.svelte';
</script>

<!-- − BET + in one capsule; the layout sizes it with --stepper-height -->
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
		--ui-icon-scale: 0.5;
		--ui-label-align: center;

		box-sizing: border-box;
		display: flex;
		align-items: center;
		gap: 4px;
		height: var(--stepper-height);
		padding: 0 8px;
		border-radius: 999px;
		background-color: var(--ui-field);
	}

	.value {
		display: flex;
		justify-content: center;
		min-width: calc(var(--ui-font-size) * 5);
	}
</style>
