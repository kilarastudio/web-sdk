<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicInOut } from 'svelte/easing';

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
	import ButtonDrawer from './ButtonDrawer.svelte';
	import ButtonDecrease from './ButtonDecrease.svelte';
	import ButtonIncrease from './ButtonIncrease.svelte';
	import { getContext } from '../context';

	const context = getContext();

	const DRAWER_Y = {
		unfold: 0,
		fold: 600,
	};
	const drawerTween = new Tween(stateUi.drawerFold ? DRAWER_Y.fold : DRAWER_Y.unfold, {
		easing: cubicInOut,
	});

	const drawerButtonOpacity = new Tween(stateUi.drawerButtonShow ? 1 : 0);

	context.eventEmitter.subscribeOnMount({
		drawerButtonShow: async () => {
			if (!stateUi.drawerButtonShow) {
				stateUi.drawerButtonShow = true;
				await drawerButtonOpacity.set(1);
			}
		},
		drawerButtonHide: async () => {
			if (stateUi.drawerButtonShow) {
				stateUi.drawerButtonShow = false;
				await drawerButtonOpacity.set(0);
			}
		},
		drawerUnfold: async () => {
			if (stateUi.drawerFold) {
				await drawerTween.set(DRAWER_Y.unfold);
			}
		},
		drawerFold: async () => {
			if (!stateUi.drawerFold) {
				await drawerTween.set(DRAWER_Y.fold);
			}
		},
	});
</script>

<!--
	stage: 1080 wide or more, covering the canvas (UiStage fill). No dock: the controls float over
	the game, so the game's art (its character) can stand behind them. From the bottom: a footer
	with the menu, balance and bet on the left and autoplay and turbo on the right; above it the
	spin button between − and +, with the buy bonus badge at the left edge and the drawer button at
	the right edge; above that the win line. Everything above the footer folds away with the drawer.
	During free spins the counter takes the bet's place and − and + step aside. The HUD reaches up
	to the top of the win line, a stacked label about 1.9 × the font size tall, with the drawer open.
-->
<div class="layout">
	<UiStage fill insetBottom="calc(var(--win-bottom) + var(--ui-font-size) * 1.9)">
		<!-- slides out of the screen when the drawer folds -->
		<div
			class="slide"
			style:transform="translateY({drawerTween.current}px)"
			inert={drawerTween.current !== DRAWER_Y.unfold}
		>
			<div class="buy-bonus">
				<ButtonBuyBonus />
			</div>

			<div class="spin-row">
				<div class="step" class:hidden={stateUi.freeSpinCounterShow}>
					<ButtonDecrease />
				</div>
				<ButtonBet />
				<div class="step" class:hidden={stateUi.freeSpinCounterShow}>
					<ButtonIncrease />
				</div>
			</div>
		</div>

		<!-- the win line follows the drawer down until it rests above the footer -->
		<div class="slide" style:transform="translateY({Math.min(drawerTween.current, 400)}px)">
			<div class="win">
				<LabelWin stacked hideZero />
			</div>
		</div>

		<div class="footer">
			<ButtonMenu />
			<div class="labels">
				<LabelBalance stacked />
				{#if stateUi.freeSpinCounterShow}
					<LabelFreeSpinCounter stacked />
				{:else}
					<LabelBet stacked />
				{/if}
			</div>
			<ButtonAutoSpin />
			<ButtonTurbo />
		</div>

		<div
			class="drawer-button"
			class:hidden={drawerButtonOpacity.current === 0}
			style:opacity={drawerButtonOpacity.current}
		>
			<ButtonDrawer disabled={!stateUi.drawerButtonShow} />
		</div>
	</UiStage>

	<UiMenu fill />
</div>

<style lang="scss">
	.layout {
		--ui-font-size: 42px;
		--ui-button-size: 108px;
		--ui-button-size-large: 236px;
		--ui-feature-size: 168px;
		--ui-label-shadow: var(--ui-text-shadow);
		--edge: 40px;
		--footer-bottom: 28px;
		--spin-row-bottom: calc(var(--footer-bottom) + var(--ui-button-size) + 40px);
		--win-bottom: calc(var(--spin-row-bottom) + var(--ui-button-size-large) + 32px);
		/* the menu opens over the menu button, the first item in the footer */
		--menu-x: calc(var(--edge) + var(--ui-button-size) / 2);
		--menu-bottom: var(--footer-bottom);
		--menu-gap: 16px;

		position: absolute;
		inset: 0;
	}

	.slide {
		position: absolute;
		inset: 0;
	}

	.spin-row,
	.win {
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
	}

	.spin-row {
		bottom: var(--spin-row-bottom);
		display: flex;
		align-items: center;
		gap: 48px;
	}

	.step.hidden {
		visibility: hidden;
	}

	.buy-bonus {
		position: absolute;
		left: var(--edge);
		bottom: calc(
			var(--spin-row-bottom) + (var(--ui-button-size-large) - var(--ui-feature-size)) / 2
		);
	}

	.win {
		bottom: var(--win-bottom);
	}

	.footer {
		position: absolute;
		left: var(--edge);
		right: var(--edge);
		bottom: var(--footer-bottom);
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.labels {
		--ui-label-align: start;

		flex: 1;
		display: flex;
		align-items: center;
		gap: 40px;
		min-width: 0;
		margin-left: 8px;
	}

	.drawer-button {
		--ui-button-size: 88px;

		position: absolute;
		right: var(--edge);
		bottom: calc(
			var(--spin-row-bottom) + (var(--ui-button-size-large) - var(--ui-button-size)) / 2
		);

		&.hidden {
			visibility: hidden;
		}
	}
</style>
