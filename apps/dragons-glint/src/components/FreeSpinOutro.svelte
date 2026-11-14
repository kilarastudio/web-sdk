<script lang="ts" module>
	import type { WinLevelData } from '../game/winLevelMap';

	export type EmitterEventFreeSpinOutro =
		| { type: 'freeSpinOutroShow' }
		| { type: 'freeSpinOutroHide' }
		| {
				type: 'freeSpinOutroCountUp';
				amount: number;
				cost: number;
				winLevelData: WinLevelData;
		  };
</script>

<script lang="ts">
	import { FadeContainer, WinCountUpProvider } from 'components-pixi';
	import { bookEventAmountToCountUpCurrencyString } from 'utils-shared/amount';
	import { waitForResolve } from 'utils-shared/wait';
	import { OnMount } from 'components-shared';

	import { getContext } from '../game/context';
	import { countUpEasing } from '../game/constants';
	import { winCountUpSoundsEnd } from '../game/winSounds';
	import { winClimb } from '../game/winLevelMap';
	import BoardDim from './BoardDim.svelte';
	import FreeSpinAnimation from './FreeSpinAnimation.svelte';
	import SpotsOut from './SpotsOut.svelte';
	import PressToContinue from './PressToContinue.svelte';
	import CoinShower from './CoinShower.svelte';

	const context = getContext();

	let show = $state(true);
	let amount = $state(0);
	let cost = $state(0);
	let winLevelData = $state<WinLevelData>();
	let oncomplete = $state(() => {});

	context.eventEmitter.subscribeOnMount({
		freeSpinOutroShow: () => (show = true),
		freeSpinOutroHide: async () => (show = false),
		freeSpinOutroCountUp: async (emitterEvent) => {
			amount = emitterEvent.amount;
			cost = emitterEvent.cost;
			winLevelData = emitterEvent.winLevelData;
			await waitForResolve((resolve) => (oncomplete = resolve));
		},
	});
</script>

<FadeContainer {show}>
	{#if winLevelData}
		{@const isBigWin = winLevelData.type === 'big'}
		{@const climb = winClimb({ amount, cost, level: winLevelData })}
		<WinCountUpProvider
			{amount}
			duration={isBigWin ? climb.duration : winLevelData.presentDuration}
			easing={isBigWin ? climb.easing : countUpEasing}
			oncomplete={() => winCountUpSoundsEnd({ winLevelData })}
		>
			{#snippet children({ countUpAmount, startCountUp, finishCountUp, countUpCompleted })}
				{@const level = isBigWin
					? climb.levelAt({ shown: countUpAmount, completed: countUpCompleted })
					: undefined}
				<OnMount onmount={() => startCountUp()} />

				<BoardDim />
				<SpotsOut
					duration={isBigWin ? climb.duration : winLevelData.presentDuration}
					completed={countUpCompleted}
				/>
				{#if level}
					<CoinShower count={16 + level.tier.coins} />
				{/if}

				<FreeSpinAnimation
					key="panelFreeSpinsOutro"
					label={level?.alias === 'max'
						? context.i18nDerived.winLevel(level.text)
						: context.i18nDerived.totalWin()}
					value={bookEventAmountToCountUpCurrencyString(countUpAmount, amount)}
					caption={context.i18nDerived.freeSpinsComplete()}
					completed={countUpCompleted}
					{level}
					levels={climb.levels}
				/>

				<PressToContinue
					underBoard
					onpress={() => (countUpCompleted ? oncomplete() : finishCountUp())}
				/>
			{/snippet}
		</WinCountUpProvider>
	{/if}
</FadeContainer>
