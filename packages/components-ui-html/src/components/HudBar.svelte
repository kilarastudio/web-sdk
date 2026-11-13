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
	import { fitText } from './fitText';

	type Props = {
		// desktop (mouse): the bet's ▲ ▼ stacked beside the amount, and autoplay over turbo in one
		// column. Otherwise (tablet, touch) − and + beside the amount and autoplay and turbo in a row:
		// stacked halves would be too small for a finger.
		stackedControls?: boolean;
	};

	const props: Props = $props();

	// the spin's distance from the dock's right edge: inset, the autoplay and turbo controls (each
	// keeping an inset on its left for the curve), notch radius
	const notchX = $derived(
		props.stackedControls
			? 'calc(100% - var(--bar-padding) * 2 - var(--stack-width) - var(--notch-radius))'
			: 'calc(100% - var(--bar-padding) * 2 - var(--ui-button-size) * 2 - var(--play-gap) - var(--notch-radius))',
	);
</script>

<!--
	The dock, left to right: menu, balance, win (hidden while it is zero), then the play group on
	the right: bet, the spin button sticking out of the dock, autoplay and turbo. The bet sits right
	next to the spin so setting a bet and spinning is one short move. During free spins the counter
	takes the bet's place. Buy bonus is its own square badge left of the dock. The layout sets the
	--bar-*, --stepper-height and --ui-feature-size sizes. Amounts too long for their place shrink
	to fit it (fitText). The HUD reaches up to the top of the spin button, the highest thing
	sticking out of the dock.
-->
<UiStage
	insetBottom="calc(var(--bar-bottom) + (var(--bar-height) + var(--ui-button-size-large)) / 2)"
>
	<!-- the play group's sizes, which the notch's centre is worked out from -->
	<UiBar
		--play-gap="12px"
		--stack-width="calc(var(--ui-button-size) * 0.75)"
		notch
		{notchX}
	>
		<!-- left of the dock -->
		<div class="buy-bonus">
			<ButtonBuyBonus />
		</div>

		<div class="dock">
			<div class="side money">
				<ButtonMenu />
				<div class="labels" use:fitText>
					<LabelBalance stacked />
					<LabelWin stacked hideZero />
				</div>
			</div>

			<div class="side play" class:stacked={props.stackedControls}>
				<div class="bet">
					{#if stateUi.freeSpinCounterShow}
						<div class="free-spins">
							<LabelFreeSpinCounter stacked />
						</div>
					{:else}
						<BetStepper stacked={props.stackedControls} besideNotch />
					{/if}
				</div>
				<div class="spin">
					<ButtonBet />
				</div>
				<div class="controls">
					<div class="autoplay">
						<ButtonAutoSpin />
					</div>
					<div class="turbo">
						<ButtonTurbo />
					</div>
				</div>
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

	/* takes the room the play group leaves; long amounts shrink to fit it (fitText) */
	.money {
		flex: 1;
		gap: 12px;
	}

	.labels {
		--ui-label-align: start;

		flex: 1;
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

	.controls {
		display: flex;
		align-items: center;
	}

	/*
		A button beside the notch is the inset wider; that room on its left is where its background
		curves. --curve-y puts the notch's centre level with the dock's middle.
	*/
	.autoplay,
	.stacked .turbo {
		--ui-button-width: calc(var(--ui-button-size) + var(--bar-padding));
		--ui-button-inset-start: var(--bar-padding);
		--ui-button-mask: radial-gradient(
			circle at calc(var(--notch-radius) * -1) var(--curve-y, 50%),
			transparent var(--curve),
			#000 calc(var(--curve) + 1px)
		);

		display: flex;
	}

	.autoplay {
		margin-right: var(--play-gap);
	}

	/* autoplay over turbo, two half-height buttons together as tall as a dock button */
	.stacked {
		.controls {
			--ui-button-size: var(--stack-width);
			--ui-button-height: calc(var(--bar-height) / 2 - var(--bar-padding));
			--ui-icon-scale: 0.5;

			flex-direction: column;
		}

		.autoplay {
			--curve-y: 100%;

			margin-right: 0;
		}

		.turbo {
			--curve-y: 0%;
		}
	}

	.buy-bonus {
		position: absolute;
		top: 50%;
		right: calc(100% + 20px);
		translate: 0 -50%;
	}
</style>
