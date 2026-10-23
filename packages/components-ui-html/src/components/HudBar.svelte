<script lang="ts">
	import { stateUi } from 'state-shared';

	import UiStage from './UiStage.svelte';
	import UiBar from './UiBar.svelte';
	import UiMenu from './UiMenu.svelte';
	import LabelBalance from './LabelBalance.svelte';
	import LabelWin from './LabelWin.svelte';
	import LabelFreeSpinCounter from './LabelFreeSpinCounter.svelte';
	import BetStepper from './BetStepper.svelte';
	import ButtonMenu from './ButtonMenu.svelte';
	import ButtonBuyBonus from './ButtonBuyBonus.svelte';
	import ButtonAutoSpin from './ButtonAutoSpin.svelte';
	import ButtonBet from './ButtonBet.svelte';
	import ButtonTurbo from './ButtonTurbo.svelte';
</script>

<!--
	The dock: money on the left (menu, balance, win), the spin button in the middle of the screen
	sticking out of the dock, play controls on the right (bet stepper, autoplay, turbo). During free
	spins the counter takes the stepper's place. Buy bonus is its own round badge left of the
	dock. The layout sets the --bar-*, --stepper-height and --ui-feature-size sizes. The HUD reaches
	up to the top of the spin button, the highest thing sticking out of the dock.
-->
<UiStage
	insetBottom="calc(var(--bar-bottom) + (var(--bar-height) + var(--ui-button-size-large)) / 2)"
>
	<div class="buy-bonus">
		<ButtonBuyBonus />
	</div>

	<UiBar notch>
		<div class="dock">
			<div class="side money">
				<ButtonMenu />
				<div class="labels">
					<LabelBalance stacked />
					<LabelWin stacked hideZero />
				</div>
			</div>

			<div class="spin">
				<ButtonBet />
			</div>

			<div class="side play">
				{#if stateUi.freeSpinCounterShow}
					<LabelFreeSpinCounter stacked />
				{:else}
					<BetStepper />
				{/if}
				<ButtonAutoSpin />
				<ButtonTurbo />
			</div>
		</div>
	</UiBar>
</UiStage>

<UiMenu />

<style lang="scss">
	.dock {
		/* equal sides keep the spin button (and the dock's notch) in the middle of the screen */
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
		grid-template-rows: 100%;
		align-items: center;
		width: 100%;
		height: 100%;
	}

	.side {
		display: flex;
		align-items: center;
		gap: 12px;
		min-width: 0;
	}

	.money {
		justify-content: flex-start;
	}

	.labels {
		--ui-label-align: start;

		display: flex;
		align-items: center;
		gap: 28px;
		margin-left: 12px;
	}

	.play {
		justify-content: flex-end;
	}

	/* fills the dock height so the bigger spin button sticks out evenly above and below */
	.spin {
		display: flex;
		align-items: center;
		align-self: stretch;
		margin: 0 32px;
	}

	.buy-bonus {
		position: absolute;
		left: calc(50% - var(--bar-width) / 2 - var(--ui-feature-size) - 20px);
		bottom: calc(var(--bar-bottom) + (var(--bar-height) - var(--ui-feature-size)) / 2);
	}
</style>
