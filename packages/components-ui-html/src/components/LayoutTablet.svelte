<script lang="ts">
	import { stateUi } from 'state-shared';

	import UiStage from './UiStage.svelte';
	import UiMenu from './UiMenu.svelte';
	import LabelBalance from './LabelBalance.svelte';
	import LabelWin from './LabelWin.svelte';
	import LabelBet from './LabelBet.svelte';
	import LabelFreeSpinCounter from './LabelFreeSpinCounter.svelte';
	import ButtonMenu from './ButtonMenu.svelte';
	import ButtonBuyBonus from './ButtonBuyBonus.svelte';
	import ButtonAutoSpin from './ButtonAutoSpin.svelte';
	import ButtonBet from './ButtonBet.svelte';
	import ButtonTurbo from './ButtonTurbo.svelte';
	import ButtonDecrease from './ButtonDecrease.svelte';
	import ButtonIncrease from './ButtonIncrease.svelte';
</script>

<!-- stage: 1920 × 1920 -->
<div class="layout">
	<UiStage>
		{#if stateUi.freeSpinCounterShow}
			<div class="free-spins">
				<LabelFreeSpinCounter />
			</div>
		{/if}

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
		--ui-font-size: 45px;
		--ui-button-size: 150px;
		--ui-button-size-large: 195px;
		--menu-x: 98px;
		--menu-bottom: 22px;
		--menu-gap: 15px;

		position: absolute;
		inset: 0;
	}

	.free-spins {
		position: absolute;
		left: 50%;
		bottom: 350px;
		transform: translateX(-50%);
	}

	.labels {
		position: absolute;
		left: 50%;
		bottom: 202px;
		transform: translateX(-50%);
		display: flex;
		gap: 37px;
	}

	.group {
		position: absolute;
		bottom: 22px;
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
			right: 27px;
		}
	}
</style>
