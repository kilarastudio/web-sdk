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
		<div class="labels">
			<LabelBalance stacked />
			<LabelWin stacked />
			<LabelBet stacked />
		</div>

		<div class="group left">
			<ButtonMenu />
			<ButtonBuyBonus />
		</div>

		<div class="group center">
			<ButtonAutoSpin />
			<ButtonBet />
			<ButtonTurbo />
		</div>

		<div class="group right">
			<ButtonDecrease />
			<ButtonIncrease />
		</div>
	</UiStage>

	<UiMenu />
</div>

<style lang="scss">
	.layout {
		--ui-font-size: 36px;
		--ui-button-size: 120px;
		--ui-button-size-large: 156px;
		--menu-x: 298px;
		--menu-bottom: 18px;
		--menu-gap: 14px;

		position: absolute;
		inset: 0;
	}

	.labels {
		position: absolute;
		left: 50%;
		bottom: 146px;
		transform: translateX(-50%);
		display: flex;
		gap: 18px;
	}

	.group {
		position: absolute;
		bottom: 18px;
		display: flex;
		gap: 30px;

		&.left {
			left: calc(var(--menu-x) - var(--ui-button-size) / 2);
			bottom: var(--menu-bottom);
		}

		&.center {
			left: 50%;
			transform: translateX(-50%);
		}

		&.right {
			right: 192px;
		}
	}
</style>
