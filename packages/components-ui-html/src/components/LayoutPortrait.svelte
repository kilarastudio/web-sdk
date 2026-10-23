<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicInOut } from 'svelte/easing';

	import { stateUi } from 'state-shared';

	import UiStage from './UiStage.svelte';
	import UiBar from './UiBar.svelte';
	import UiMenu from './UiMenu.svelte';
	import LabelBalance from './LabelBalance.svelte';
	import LabelWin from './LabelWin.svelte';
	import LabelFreeSpinCounter from './LabelFreeSpinCounter.svelte';
	import ButtonMenu from './ButtonMenu.svelte';
	import ButtonBuyBonus from './ButtonBuyBonus.svelte';
	import ButtonAutoSpin from './ButtonAutoSpin.svelte';
	import ButtonBet from './ButtonBet.svelte';
	import ButtonTurbo from './ButtonTurbo.svelte';
	import ButtonDrawer from './ButtonDrawer.svelte';
	import BetStepper from './BetStepper.svelte';
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
	stage: 1080 × 1920. One centred column: win line, buy bonus, the spin button with autoplay and
	turbo beside it, and the dock along the bottom (menu, balance, bet stepper). Everything above
	the dock folds away with the drawer.
-->
<div class="layout">
	<UiStage>
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
				<ButtonAutoSpin />
				<ButtonBet />
				<ButtonTurbo />
			</div>
		</div>

		<!-- the win line follows the drawer down until it rests above the dock -->
		<div class="slide" style:transform="translateY({Math.min(drawerTween.current, 400)}px)">
			<div class="win">
				<LabelWin stacked hideZero />
			</div>
		</div>

		<UiBar>
			<ButtonMenu />
			<div class="balance">
				<LabelBalance stacked />
			</div>
			{#if stateUi.freeSpinCounterShow}
				<LabelFreeSpinCounter stacked />
			{:else}
				<BetStepper />
			{/if}
		</UiBar>

		<div
			class="drawer-button"
			class:hidden={drawerButtonOpacity.current === 0}
			style:opacity={drawerButtonOpacity.current}
		>
			<ButtonDrawer disabled={!stateUi.drawerButtonShow} />
		</div>
	</UiStage>

	<UiMenu />
</div>

<style lang="scss">
	.layout {
		--ui-font-size: 42px;
		--ui-button-size: 108px;
		--ui-button-size-large: 236px;
		--ui-feature-width: 260px;
		--ui-feature-height: 92px;
		--ui-feature-font-size: 28px;
		--ui-label-shadow: var(--ui-text-shadow);
		--bar-width: calc(100% - 48px);
		--bar-height: 132px;
		--bar-bottom: 28px;
		--bar-padding: 16px;
		--stepper-height: 100px;
		--spin-row-bottom: 224px;
		/* the menu opens over the menu button, the first item in the dock */
		--menu-x: calc(24px + var(--bar-padding) + var(--ui-button-size) / 2);
		--menu-bottom: calc(var(--bar-bottom) + (var(--bar-height) - var(--ui-button-size)) / 2);
		--menu-gap: 16px;

		position: absolute;
		inset: 0;
	}

	.slide {
		position: absolute;
		inset: 0;
	}

	.spin-row,
	.buy-bonus,
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

	.buy-bonus {
		bottom: calc(var(--spin-row-bottom) + var(--ui-button-size-large) + 32px);
	}

	.win {
		bottom: calc(
			var(--spin-row-bottom) + var(--ui-button-size-large) + var(--ui-feature-height) + 56px
		);
	}

	.balance {
		--ui-label-align: start;
		--ui-label-shadow: none;

		flex: 1;
		min-width: 0;
	}

	.drawer-button {
		--ui-button-size: 88px;

		position: absolute;
		right: 40px;
		bottom: var(--spin-row-bottom);

		&.hidden {
			visibility: hidden;
		}
	}
</style>
