<script lang="ts">
	import { stateUi } from 'state-shared';

	import UiStage from './UiStage.svelte';
	import UiMenu from './UiMenu.svelte';
	import LabelBalance from './LabelBalance.svelte';
	import LabelBet from './LabelBet.svelte';
	import LabelWin from './LabelWin.svelte';
	import LabelFreeSpinCounter from './LabelFreeSpinCounter.svelte';
	import ButtonMenu from './ButtonMenu.svelte';
	import ButtonBuyBonus from './ButtonBuyBonus.svelte';
	import ButtonAutoSpin from './ButtonAutoSpin.svelte';
	import ButtonBet from './ButtonBet.svelte';
	import ButtonTurbo from './ButtonTurbo.svelte';
	import ButtonDecrease from './ButtonDecrease.svelte';
	import ButtonIncrease from './ButtonIncrease.svelte';
</script>

<!--
	stage: 1920 × 1080 or wider, covering the canvas (UiStage fill); phones held sideways and the
	Stake mini players. No dock: the controls float over the game against the screen edges, so the
	board keeps the middle and the game's art (its character) can stand behind them. The spin
	button sits halfway down the right edge between + above and − below, the buy bonus badge
	opposite it on the left. A footer runs along the bottom: menu, balance and bet on the left, the
	win under the board, autoplay and turbo on the right. During free spins the counter takes the
	bet's place and − and + step aside. The HUD reaches up to the top of the footer, and in from
	each side edge across its column.
-->
<div class="layout">
	<UiStage
		fill
		insetBottom="calc(var(--footer-bottom) + var(--ui-button-size))"
		insetSide="calc(var(--edge) + var(--ui-button-size-large))"
	>
		<div class="column buy-bonus">
			<ButtonBuyBonus />
		</div>

		<div class="column spin">
			<div class="step" class:hidden={stateUi.freeSpinCounterShow}>
				<ButtonIncrease />
			</div>
			<ButtonBet />
			<div class="step" class:hidden={stateUi.freeSpinCounterShow}>
				<ButtonDecrease />
			</div>
		</div>

		<div class="footer">
			<div class="side money">
				<ButtonMenu />
				<div class="labels">
					<LabelBalance stacked />
					{#if stateUi.freeSpinCounterShow}
						<LabelFreeSpinCounter stacked />
					{:else}
						<LabelBet stacked />
					{/if}
				</div>
			</div>

			<div class="win">
				<LabelWin stacked hideZero />
			</div>

			<div class="side play">
				<ButtonAutoSpin />
				<ButtonTurbo />
			</div>
		</div>
	</UiStage>

	<UiMenu fill />
</div>

<style lang="scss">
	.layout {
		/* larger than the docked layouts: phones are held sideways, the controls are thumb targets */
		--ui-font-size: 40px;
		--ui-button-size: 112px;
		--ui-button-size-large: 220px;
		--ui-feature-size: 168px;
		--ui-label-shadow: var(--ui-text-shadow);
		--edge: 40px;
		--footer-bottom: 28px;
		/* the menu opens over the menu button, the first item in the footer */
		--menu-x: calc(var(--edge) + var(--ui-button-size) / 2);
		--menu-bottom: var(--footer-bottom);
		--menu-gap: 14px;

		position: absolute;
		inset: 0;
	}

	/* a column as wide as the spin button, centred on the stage's height */
	.column {
		position: absolute;
		top: 0;
		bottom: 0;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 28px;
		width: var(--ui-button-size-large);
	}

	.spin {
		right: var(--edge);
	}

	.buy-bonus {
		left: var(--edge);
	}

	.step.hidden {
		visibility: hidden;
	}

	.footer {
		/* equal sides keep the win in the middle of the screen, under the board */
		position: absolute;
		left: var(--edge);
		right: var(--edge);
		bottom: var(--footer-bottom);
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
		align-items: center;
		gap: 24px;
		height: var(--ui-button-size);
	}

	.side {
		display: flex;
		align-items: center;
		gap: 16px;
		min-width: 0;
	}

	.money {
		justify-content: flex-start;
	}

	.labels {
		--ui-label-align: start;

		display: flex;
		align-items: center;
		gap: 36px;
		margin-left: 8px;
	}

	.play {
		justify-content: flex-end;
	}
</style>
