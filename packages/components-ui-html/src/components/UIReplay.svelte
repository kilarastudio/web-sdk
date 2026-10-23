<script lang="ts">
	import type { Snippet } from 'svelte';

	import { stateUi, stateBet, stateReplay } from 'state-shared';
	import { numberToCurrencyString } from 'utils-shared/amount';

	import UiFadeContainer from './UiFadeContainer.svelte';
	import UiHeader from './UiHeader.svelte';
	import UiStage from './UiStage.svelte';
	import UiBar from './UiBar.svelte';
	import UiMenu from './UiMenu.svelte';
	import UiLabel from './UiLabel.svelte';
	import LabelWin from './LabelWin.svelte';
	import LabelFreeSpinCounter from './LabelFreeSpinCounter.svelte';
	import ButtonReplay from './ButtonReplay.svelte';
	import ButtonTurbo from './ButtonTurbo.svelte';
	import ButtonMenu from './ButtonMenu.svelte';
	import { getContext } from '../context';
	import { i18nDerived } from '../i18n/i18nDerived';

	type Props = {
		gameName: Snippet;
		logo?: Snippet;
	};

	const props: Props = $props();
	const context = getContext();
	// portrait is too narrow for PLAY inside the bar, so it sits above it
	const portrait = $derived(context.stateLayoutDerived.layoutType() === 'portrait');
</script>

<UiFadeContainer>
	<UiHeader gameName={props.gameName} logo={props.logo} />

	<!-- stage: the standard size of the current layout type, e.g. 1920 × 1080 -->
	<div class="layout" class:portrait>
		<UiStage>
			{#if portrait}
				<div class="play-above">
					<ButtonReplay />
				</div>
			{/if}

			<UiBar>
				<ButtonMenu />
				<ButtonTurbo />

				<div class="labels">
					<LabelWin stacked />
					{#if stateUi.freeSpinCounterShow}
						<LabelFreeSpinCounter stacked />
					{/if}
					<UiLabel
						stacked
						label={i18nDerived.bet()}
						value={numberToCurrencyString(stateBet.wageredBetAmount)}
					/>
					<UiLabel
						stacked
						label={`${i18nDerived.realCost()} (×${stateReplay.costMultiplier})`}
						value={numberToCurrencyString(stateBet.wageredBetAmount * stateReplay.costMultiplier)}
					/>
				</div>

				{#if !portrait}
					<ButtonReplay />
				{/if}
			</UiBar>
		</UiStage>

		<UiMenu />
	</div>
</UiFadeContainer>

<style lang="scss">
	.layout {
		--ui-font-size: 36px;
		--ui-button-size: 96px;
		--ui-button-size-large: 176px;
		--bar-width: 1440px;
		--bar-height: 120px;
		--bar-bottom: 40px;
		--bar-padding: 24px;
		/* the menu opens over the menu button, the first item in the bar */
		--menu-x: calc(50% - var(--bar-width) / 2 + var(--bar-padding) + var(--ui-button-size) / 2);
		--menu-bottom: calc(var(--bar-bottom) + (var(--bar-height) - var(--ui-button-size)) / 2);
		--menu-gap: 14px;

		position: absolute;
		inset: 0;

		&.portrait {
			--bar-width: 1032px;
			--bar-bottom: 60px;
		}
	}

	.labels {
		display: flex;
		flex: 1;
		justify-content: space-around;
		align-items: center;
		min-width: 0;
	}

	.play-above {
		position: absolute;
		left: 50%;
		bottom: calc(var(--bar-bottom) + var(--bar-height) + 32px);
		transform: translateX(-50%);
	}
</style>
