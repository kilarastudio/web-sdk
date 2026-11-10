<script lang="ts" module>
	import type { WinLevelData } from '../game/winLevelMap';

	export type EmitterEventFreeSpinOutro =
		| { type: 'freeSpinOutroShow' }
		| { type: 'freeSpinOutroHide' }
		| { type: 'freeSpinOutroCountUp'; amount: number; winLevelData: WinLevelData };
</script>

<script lang="ts">
	import { FadeContainer, WinCountUpProvider } from 'components-pixi';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';
	import { waitForResolve } from 'utils-shared/wait';
	import { CanvasSizeRectangle } from 'components-layout';
	import { OnMount } from 'components-shared';

	import { getContext } from '../game/context';
	import FreeSpinAnimation from './FreeSpinAnimation.svelte';
	import PressToContinue from './PressToContinue.svelte';

	const context = getContext();

	let show = $state(true);
	let amount = $state(0);
	let winLevelData = $state<WinLevelData>();
	let oncomplete = $state(() => {});
	let onCountUpComplete = $state(() => {});

	context.eventEmitter.subscribeOnMount({
		freeSpinOutroShow: () => (show = true),
		freeSpinOutroHide: async () => (show = false),
		freeSpinOutroCountUp: async (emitterEvent) => {
			amount = emitterEvent.amount;
			winLevelData = emitterEvent.winLevelData;
			await waitForResolve((resolve) => (oncomplete = resolve));
		},
	});
</script>

<FadeContainer {show}>
	{#if winLevelData}
		{@const duration = winLevelData.presentDuration}
		<WinCountUpProvider {amount} {duration} oncomplete={() => onCountUpComplete()}>
			{#snippet children({ countUpAmount, startCountUp, finishCountUp, countUpCompleted })}
				<OnMount onmount={() => startCountUp()} />

				<CanvasSizeRectangle backgroundColor={0x000000} backgroundAlpha={0.5} />

				<FreeSpinAnimation
					key="panelFreeSpinsOutro"
					label={context.i18nDerived.totalWin()}
					value={bookEventAmountToCurrencyString(countUpAmount)}
					caption={context.i18nDerived.freeSpinsComplete()}
				/>

				<PressToContinue onpress={() => (countUpCompleted ? oncomplete() : finishCountUp())} />
			{/snippet}
		</WinCountUpProvider>
	{/if}
</FadeContainer>
