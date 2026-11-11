<script lang="ts" module>
	import type { WinLevelData } from '../game/winLevelMap';

	export type EmitterEventWin =
		| { type: 'winShow' }
		| { type: 'winHide' }
		| { type: 'winUpdate'; amount: number; winLevelData: WinLevelData };
</script>

<script lang="ts">
	import { Container } from 'pixi-svelte';
	import { FadeContainer, WinCountUpProvider } from 'components-pixi';
	import GameText from './GameText.svelte';
	import { waitForResolve, waitForTimeout } from 'utils-shared/wait';
	import { bookEventAmountToCountUpCurrencyString } from 'utils-shared/amount';
	import { CanvasSizeRectangle, MainContainer } from 'components-layout';
	import { OnMount } from 'components-shared';

	import WinAnimation from './WinAnimation.svelte';
	import PressToContinue from './PressToContinue.svelte';
	import CoinShower from './CoinShower.svelte';
	import WinPunch from './WinPunch.svelte';
	import { SYMBOL_SIZE, countUpEasing } from '../game/constants';
	import { getContext } from '../game/context';
	import { gameTextStyle } from '../game/typography';
	import { winCountUpSoundsEnd } from '../game/winSounds';

	const context = getContext();

	let show = $state(false);
	let amount = $state(0);
	let winLevelData = $state<WinLevelData>();
	let oncomplete = $state(() => {});

	context.eventEmitter.subscribeOnMount({
		winShow: () => (show = true),
		winHide: () => (show = false),
		winUpdate: async (emitterEvent) => {
			amount = emitterEvent.amount;
			winLevelData = emitterEvent.winLevelData;
			await waitForResolve((resolve) => (oncomplete = resolve));
		},
	});
</script>

<FadeContainer {show}>
	{#if winLevelData}
		{@const isBigWin = winLevelData.type === 'big'}
		{@const duration = winLevelData.presentDuration}
		<!-- a normal win races up and eases into its amount; a big win climbs steadily -->
		<WinCountUpProvider
			{amount}
			{duration}
			easing={isBigWin ? undefined : countUpEasing}
			oncomplete={() => winCountUpSoundsEnd({ winLevelData })}
		>
			{#snippet children({ countUpAmount, startCountUp, finishCountUp, countUpCompleted })}
				{#if isBigWin}
					<CanvasSizeRectangle backgroundColor={0x000000} backgroundAlpha={0.5} />
					<CoinShower />
				{/if}

				<OnMount
					onmount={async () => {
						await startCountUp();
						// long enough for the amount's final swell
						await waitForTimeout(500);
						oncomplete();
					}}
				/>

				<MainContainer>
					<Container
						x={context.stateGameDerived.boardLayout().x}
						y={context.stateGameDerived.boardLayout().y}
					>
						{#if winLevelData.panel}
							<WinAnimation
								panel={winLevelData.panel}
								title={context.i18nDerived.winLevel(winLevelData.text)}
								amount={bookEventAmountToCountUpCurrencyString(countUpAmount, amount)}
								completed={countUpCompleted}
							/>
						{:else}
							<WinPunch appear completed={countUpCompleted}>
								<GameText
									anchor={0.5}
									maxWidth={context.stateGameDerived.boardLayout().width * 0.9}
									text={bookEventAmountToCountUpCurrencyString(countUpAmount, amount)}
									style={gameTextStyle({ fontSize: SYMBOL_SIZE, tone: 'value', onArt: true })}
								/>
							</WinPunch>
						{/if}
					</Container>
				</MainContainer>

				<PressToContinue onpress={() => (countUpCompleted ? oncomplete() : finishCountUp())} />
			{/snippet}
		</WinCountUpProvider>
	{/if}
</FadeContainer>
