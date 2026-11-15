<script lang="ts" module>
	import type { WinLevelData } from '../game/winLevelMap';

	export type EmitterEventWin =
		| { type: 'winShow' }
		| { type: 'winHide' }
		| { type: 'winUpdate'; amount: number; cost: number; winLevelData: WinLevelData };
</script>

<script lang="ts">
	import { Container } from 'pixi-svelte';
	import { FadeContainer, WinCountUpProvider } from 'components-pixi';
	import GameText from './GameText.svelte';
	import { waitForResolve, waitForTimeout } from 'utils-shared/wait';
	import { bookEventAmountToCountUpCurrencyString } from 'utils-shared/amount';
	import { MainContainer } from 'components-layout';
	import { OnMount } from 'components-shared';

	import BoardDim from './BoardDim.svelte';
	import WinAnimation from './WinAnimation.svelte';
	import PressToContinue from './PressToContinue.svelte';
	import CoinShower from './CoinShower.svelte';
	import WinPunch from './WinPunch.svelte';
	import Slam from './Slam.svelte';
	import { BOARD_FIT, BOARD_SIZES, SYMBOL_SIZE, countUpEasing } from '../game/constants';
	import { getContext } from '../game/context';
	import { gameTextStyle } from '../game/typography';
	import { panelContentWidth, panelTextStyle } from '../game/panels';
	import { winClimb } from '../game/winLevelMap';
	import { winCountUpSoundsEnd } from '../game/winSounds';

	const context = getContext();
	// a little wider than the board, unless the board already fills the screen's width (portrait)
	const panelScale = $derived.by(() => {
		const { scale } = context.stateLayoutDerived.mainLayout();
		const screenWidth =
			(context.stateLayoutDerived.canvasSizes().width - BOARD_FIT.edge * 2) / scale;

		return Math.min(BOARD_SIZES.width * 1.25, screenWidth) / panelContentWidth('celebration');
	});

	let show = $state(false);
	let amount = $state(0);
	let cost = $state(0);
	let winLevelData = $state<WinLevelData>();
	let oncomplete = $state(() => {});

	context.eventEmitter.subscribeOnMount({
		winShow: () => (show = true),
		winHide: () => (show = false),
		winUpdate: async (emitterEvent) => {
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
		<!-- a normal win races up and eases into its amount; a big win climbs its levels -->
		<WinCountUpProvider
			{amount}
			duration={isBigWin ? climb.duration : winLevelData.presentDuration}
			easing={isBigWin ? climb.easing : countUpEasing}
			oncomplete={() => winCountUpSoundsEnd({ winLevelData })}
		>
			{#snippet children({ countUpAmount, startCountUp, finishCountUp, countUpCompleted })}
				{@const level = climb.levelAt({ shown: countUpAmount, completed: countUpCompleted })}
				{#if isBigWin}
					<BoardDim />
					<CoinShower count={16 + level.tier.coins} />
				{/if}

				<OnMount
					onmount={async () => {
						await startCountUp();
						// long enough for the amount's final swell, and for the last level to be seen
						await waitForTimeout(isBigWin ? (winLevelData?.alias === 'max' ? 3000 : 1500) : 500);
						oncomplete();
					}}
				/>

				<MainContainer>
					<Container
						x={context.stateGameDerived.boardLayout().x}
						y={context.stateGameDerived.boardLayout().y}
					>
						{#if isBigWin}
							<WinAnimation {level} levels={climb.levels} panel="celebration" scale={panelScale}>
								{#snippet children({ face })}
									<!-- each level's name comes down and hits its place -->
									{#key level.level}
										<Slam x={face.x} y={face.y - face.height * 0.3}>
											<GameText
												anchor={0.5}
												text={context.i18nDerived.winLevel(level.text)}
												style={panelTextStyle({ fontSize: face.height * 0.34, tone: 'label' })}
												maxWidth={face.width}
											/>
										</Slam>
									{/key}
									<WinPunch x={face.x} y={face.y + face.height * 0.2} completed={countUpCompleted}>
										<GameText
											anchor={0.5}
											text={bookEventAmountToCountUpCurrencyString(countUpAmount, amount)}
											style={panelTextStyle({ fontSize: face.height * 0.46, tone: 'value' })}
											maxWidth={face.width}
										/>
									</WinPunch>
								{/snippet}
							</WinAnimation>
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
