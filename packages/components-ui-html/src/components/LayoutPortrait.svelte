<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicInOut } from 'svelte/easing';

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
	import ButtonDrawer from './ButtonDrawer.svelte';
	import { getContext } from '../context';

	const context = getContext();

	const DRAWER_Y = {
		unfold: 0,
		fold: 550,
	};
	const drawerTween = new Tween(stateUi.drawerFold ? DRAWER_Y.fold : DRAWER_Y.unfold, {
		easing: cubicInOut,
	});

	const DRAWER_BUTTON_Y = {
		unfold: 0,
		fold: 50,
	};
	const drawerButtonTween = new Tween(
		stateUi.drawerFold ? DRAWER_BUTTON_Y.fold : DRAWER_BUTTON_Y.unfold,
		{
			easing: cubicInOut,
		},
	);

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
				drawerButtonTween.set(DRAWER_BUTTON_Y.unfold);
				await drawerTween.set(DRAWER_Y.unfold);
			}
		},
		drawerFold: async () => {
			if (!stateUi.drawerFold) {
				drawerButtonTween.set(DRAWER_BUTTON_Y.fold);
				await drawerTween.set(DRAWER_Y.fold);
			}
		},
	});
</script>

<!-- stage: 1080 × 1920 -->
<div class="layout">
	<UiStage>
		<!-- slides out of the screen when the drawer folds -->
		<div
			class="slide"
			style:transform="translateY({drawerTween.current}px)"
			inert={drawerTween.current !== DRAWER_Y.unfold}
		>
			<div class="group">
				<ButtonMenu />
				<div class="spin">
					<ButtonAutoSpin />
					<ButtonBet />
					<ButtonTurbo />
				</div>
				<ButtonBuyBonus />
			</div>

			<div class="balance">
				<LabelBalance stacked />
			</div>
		</div>

		<div class="slide" style:transform="translateY({Math.min(drawerTween.current, 350)}px)">
			<div class="win">
				<LabelWin stacked />
			</div>
		</div>

		{#if stateUi.freeSpinCounterShow}
			<div class="bet">
				<LabelFreeSpinCounter stacked />
			</div>
		{:else}
			<div class="bet">
				<LabelBet stacked />
			</div>

			<div class="decrease">
				<ButtonDecrease />
			</div>

			<div class="increase">
				<ButtonIncrease />
			</div>
		{/if}

		<div
			class="drawer-button"
			class:hidden={drawerButtonOpacity.current === 0}
			style:opacity={drawerButtonOpacity.current}
			style:transform="translateY({drawerButtonTween.current}px)"
		>
			<ButtonDrawer disabled={!stateUi.drawerButtonShow} />
		</div>
	</UiStage>

	<UiMenu />
</div>

<style lang="scss">
	.layout {
		--ui-font-size: 45px;
		--ui-button-size: 150px;
		--ui-button-size-large: 195px;
		--menu-x: 100px;
		--menu-bottom: 325px;
		--menu-gap: 15px;

		position: absolute;
		inset: 0;
	}

	.slide {
		position: absolute;
		inset: 0;
	}

	.group {
		position: absolute;
		left: calc(var(--menu-x) - var(--ui-button-size) / 2);
		right: calc(var(--menu-x) - var(--ui-button-size) / 2);
		bottom: var(--menu-bottom);
		display: flex;
		justify-content: space-between;
	}

	.spin {
		display: flex;
		gap: 30px;
	}

	.balance,
	.win,
	.bet {
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
	}

	.balance {
		bottom: 155px;
	}

	.win {
		bottom: 555px;
	}

	.bet {
		bottom: 15px;
	}

	.decrease,
	.increase {
		position: absolute;
		bottom: 10px;
	}

	.decrease {
		left: 75px;
	}

	.increase {
		right: 75px;
	}

	.drawer-button {
		position: absolute;
		right: 25px;
		bottom: 30px;

		&.hidden {
			visibility: hidden;
		}
	}
</style>
