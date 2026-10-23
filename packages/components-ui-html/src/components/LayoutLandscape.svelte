<script lang="ts">
	import UiStage from './UiStage.svelte';
	import UiMenu from './UiMenu.svelte';
	import LabelBalance from './LabelBalance.svelte';
	import LabelWin from './LabelWin.svelte';
	import LabelBet from './LabelBet.svelte';
	import ButtonMenu from './ButtonMenu.svelte';
	import ButtonBuyBonus from './ButtonBuyBonus.svelte';
	import ButtonAutoSpin from './ButtonAutoSpin.svelte';
	import ButtonBet from './ButtonBet.svelte';
	import ButtonTurbo from './ButtonTurbo.svelte';
	import ButtonDecrease from './ButtonDecrease.svelte';
	import ButtonIncrease from './ButtonIncrease.svelte';
</script>

<!-- stage: 1920 × 1080 -->
<div class="layout">
	<UiStage>
		<div class="group left">
			<ButtonMenu />
			<ButtonBuyBonus />
		</div>

		<div class="group right">
			<ButtonDecrease />
			<ButtonIncrease />
		</div>

		<div class="labels">
			<LabelBalance stacked />
			<LabelWin stacked />
			<LabelBet stacked />
		</div>

		<div class="spin">
			<ButtonAutoSpin />
			<ButtonBet />
			<ButtonTurbo />
		</div>
	</UiStage>

	<UiMenu />
</div>

<style lang="scss">
	.layout {
		--ui-font-size: 36px;
		--ui-button-size: 120px;
		--ui-button-size-large: 156px;
		--menu-x: 166px;
		--menu-bottom: 152px;
		--menu-gap: 14px;

		position: absolute;
		inset: 0;
	}

	.group {
		position: absolute;
		bottom: var(--menu-bottom);
		display: flex;
		gap: 15px;

		&.left {
			left: calc(var(--menu-x) - var(--ui-button-size) / 2);
		}

		&.right {
			right: 84px;
		}
	}

	.labels {
		position: absolute;
		left: 50%;
		bottom: 30px;
		transform: translateX(-50%);
		display: flex;
		gap: 8px;
	}

	.spin {
		position: absolute;
		right: 82px;
		top: 50%;
		transform: translateY(-50%);
		display: flex;
		flex-direction: column;
		gap: 20px;
	}
</style>
