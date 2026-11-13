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

	type Props = {
		// the bet's ▲ ▼ stacked beside the amount (desktop, mouse) or − and + on its sides (tablet,
		// touch: stacked halves would be too small for a finger)
		stackedBetArrows?: boolean;
	};

	const props: Props = $props();
</script>

<!--
	The dock, left to right: menu, balance, win (hidden while it is zero), then the play group on
	the right: bet, the spin button sticking out of the dock, autoplay and turbo. The bet sits right
	next to the spin so setting a bet and spinning is one short move. During free spins the counter
	takes the bet's place. Buy bonus is its own square badge left of the dock. The layout sets the
	--bar-*, --stepper-height and --ui-feature-size sizes. The HUD reaches up to the top of the spin
	button, the highest thing sticking out of the dock.
-->
<UiStage
	insetBottom="calc(var(--bar-bottom) + (var(--bar-height) + var(--ui-button-size-large)) / 2)"
>
	<div class="buy-bonus">
		<ButtonBuyBonus />
	</div>

	<!--
		The notch's centre is worked out from the play group's sizes below: the spin's distance from
		the dock's right edge (inset, turbo, gap, autoplay with its inset, notch radius).
	-->
	<UiBar
		--play-gap="12px"
		notch
		notchX="calc(100% - var(--bar-padding) * 2 - var(--ui-button-size) * 2 - var(--play-gap) - var(--notch-radius))"
	>
		<div class="dock">
			<div class="side money">
				<ButtonMenu />
				<div class="labels">
					<LabelBalance stacked />
					<LabelWin stacked hideZero />
				</div>
			</div>

			<div class="side play">
				<div class="bet">
					{#if stateUi.freeSpinCounterShow}
						<div class="free-spins">
							<LabelFreeSpinCounter stacked />
						</div>
					{:else}
						<BetStepper stacked={props.stackedBetArrows} />
					{/if}
				</div>
				<div class="spin">
					<ButtonBet />
				</div>
				<div class="autoplay">
					<ButtonAutoSpin />
				</div>
				<ButtonTurbo />
			</div>
		</div>
	</UiBar>
</UiStage>

<UiMenu />

<style lang="scss">
	.dock {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 20px;
		width: 100%;
		height: 100%;
	}

	.side {
		display: flex;
		align-items: center;
		min-width: 0;
	}

	.money {
		gap: 12px;
	}

	.labels {
		--ui-label-align: start;

		display: flex;
		align-items: center;
		gap: 28px;
		min-width: 0;
		margin-left: 12px;
	}

	/*
		The spin's neighbours reach right up to the notch, and their backgrounds stop on a curve
		round it, the dock's inset further out, so the gap to the notch is the inset all along it,
		as on every other side.
	*/
	.play {
		--curve: calc(var(--notch-radius) + var(--bar-padding));

		flex-shrink: 0;
	}

	.bet {
		--bet-stepper-end-inset: var(--bar-padding);
		--bet-stepper-mask: radial-gradient(
			circle at calc(100% + var(--notch-radius)) 50%,
			transparent var(--curve),
			#000 calc(var(--curve) + 1px)
		);

		display: flex;
	}

	.free-spins {
		padding-right: var(--bar-padding);
	}

	/* as wide as the notch, and as tall as the dock so the spin sticks out evenly above and below */
	.spin {
		display: flex;
		justify-content: center;
		align-items: center;
		align-self: stretch;
		width: calc(var(--notch-radius) * 2);
	}

	/* the autoplay button is the inset wider; that room on its left is where its background curves */
	.autoplay {
		--ui-button-width: calc(var(--ui-button-size) + var(--bar-padding));
		--ui-button-inset-start: var(--bar-padding);
		--ui-button-mask: radial-gradient(
			circle at calc(var(--notch-radius) * -1) 50%,
			transparent var(--curve),
			#000 calc(var(--curve) + 1px)
		);

		display: flex;
		margin-right: var(--play-gap);
	}

	.buy-bonus {
		position: absolute;
		left: calc(50% - var(--bar-width) / 2 - var(--ui-feature-size) - 20px);
		bottom: calc(var(--bar-bottom) + (var(--bar-height) - var(--ui-feature-size)) / 2);
	}
</style>
