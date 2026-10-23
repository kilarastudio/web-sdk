<script lang="ts">
	import type { Snippet } from 'svelte';

	import { stateUi, stateBet, stateReplay } from 'state-shared';
	import { numberToCurrencyString } from 'utils-shared/amount';

	import UiFadeContainer from './UiFadeContainer.svelte';
	import UiHeader from './UiHeader.svelte';
	import UiStage from './UiStage.svelte';
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
</script>

<UiFadeContainer>
	<UiHeader gameName={props.gameName} logo={props.logo} />

	<!-- stage: the standard size of the current layout type, e.g. 1920 × 1080 -->
	<div class="layout">
		<UiStage>
			{#if stateUi.freeSpinCounterShow && ['portrait', 'tablet'].includes(context.stateLayoutDerived.layoutType())}
				<div class="free-spins">
					<LabelFreeSpinCounter stacked />
				</div>
			{/if}

			<div class="row">
				<div class="column">
					<ButtonMenu />
					<ButtonTurbo />
				</div>

				<div class="column">
					<LabelWin stacked />
					<UiLabel
						stacked
						label={i18nDerived.bet()}
						value={numberToCurrencyString(stateBet.wageredBetAmount)}
					/>
				</div>

				<div class="column real-cost">
					<UiLabel
						stacked
						label={`${i18nDerived.realCost()} (×${stateReplay.costMultiplier})`}
						value={numberToCurrencyString(stateBet.wageredBetAmount * stateReplay.costMultiplier)}
					/>
					<ButtonReplay />
				</div>
			</div>
		</UiStage>

		<UiMenu />
	</div>
</UiFadeContainer>

<style lang="scss">
	.layout {
		--ui-font-size: 36px;
		--ui-button-size: 105px;
		--ui-button-size-large: 156px;
		/* centre of the menu column: half the row (105 + 20 + 482 + 20 + 362) minus half a button */
		--menu-x: calc(50% - 442px);
		/* row bottom + turbo button + column gap */
		--menu-bottom: 175px;
		--menu-gap: 14px;

		position: absolute;
		inset: 0;
	}

	.free-spins {
		position: absolute;
		top: 100px;
		left: 50%;
		transform: translateX(-50%);
	}

	.row {
		position: absolute;
		left: 50%;
		bottom: 58px;
		transform: translateX(-50%);
		display: flex;
		align-items: flex-end;
		gap: 20px;
	}

	.column {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
	}

	.real-cost {
		--ui-font-size: 27px;
	}
</style>
