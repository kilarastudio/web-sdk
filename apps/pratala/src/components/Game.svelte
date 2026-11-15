<script lang="ts">
	import { onMount } from 'svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	import { quadIn } from 'svelte/easing';

	import { EnablePixiExtension } from 'components-pixi';
	import { EnableHotkey } from 'components-shared';
	import { MainContainer } from 'components-layout';
	import { App, Container } from 'pixi-svelte';
	import { stateMeta, stateModal, stateUrlDerived } from 'state-shared';

	import { UI, UiGameName, GameVersion, Modals } from 'components-ui-html';

	import { version as gameVersion } from '../../package.json';
	import { getContext } from '../game/context';
	import { animate } from '../game/motion';
	import { shake } from '../game/impact.svelte';
	import { betModeMeta } from '../game/betModeMeta';
	import EnableSound from './EnableSound.svelte';
	import EnableGameActor from './EnableGameActor.svelte';
	import ResumeBet from './ResumeBet.svelte';
	import Sound from './Sound.svelte';
	import Background from './Background.svelte';
	import LoadingScreen from './LoadingScreen.svelte';
	import BoardFrame from './BoardFrame.svelte';
	import Board from './Board.svelte';
	import Anticipations from './Anticipations.svelte';
	import ClusterWinAmounts from './ClusterWinAmounts.svelte';
	import BoardContainer from './BoardContainer.svelte';
	import WinCoins from './WinCoins.svelte';
	import TumbleBoard from './TumbleBoard.svelte';
	import TumbleWinAmount from './TumbleWinAmount.svelte';
	import GlintSpots from './GlintSpots.svelte';
	import GlintEffects from './GlintEffects.svelte';
	import Win from './Win.svelte';
	import FreeSpinIntro from './FreeSpinIntro.svelte';
	import FreeSpinOutro from './FreeSpinOutro.svelte';
	import GeneratedArt from './GeneratedArt.svelte';
	import PayTable from './PayTable.svelte';
	import GameRules from './GameRules.svelte';

	const context = getContext();

	stateMeta.betModeMeta = betModeMeta(stateUrlDerived.social());

	// The welcome screen left the hall; the board comes down into it: one fall from above the
	// screen, no bounce, and a jolt as it lands. With reduced motion it fades in.
	const ENTER = 460;
	let entered = $state(1);
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());
	const enter = async () => {
		entered = 0;
		await animate(ENTER, (progress) => (entered = progress), { timeScaled: false });
		shake(2, 200);
	};
	const entrance = $derived(
		prefersReducedMotion.current
			? { y: 0, alpha: entered }
			: { y: -canvas.height * (1 - quadIn(entered)), alpha: 1 },
	);

	onMount(() => (context.stateLayout.showLoadingScreen = true));

	context.eventEmitter.subscribeOnMount({
		buyBonusConfirm: () => {
			stateModal.modal = { name: 'buyBonusConfirm' };
		},
	});
</script>

<App>
	<GeneratedArt />
	<EnableSound />
	<EnableHotkey />
	<EnableGameActor />
	<EnablePixiExtension />

	<Background />

	{#if context.stateLayout.showLoadingScreen}
		<LoadingScreen
			onloaded={() => {
				context.stateLayout.showLoadingScreen = false;
				enter();
			}}
		/>
	{:else}
		<ResumeBet />
		<!--
			The reason why <Sound /> is rendered after clicking the loading screen:
			"Autoplay with sound is allowed if: The user has interacted with the domain (click, tap, etc.)."
			Ref: https://developer.chrome.com/blog/autoplay
		-->
		<Sound />

		<Container {...entrance}>
			<MainContainer>
				<BoardFrame />
			</MainContainer>

			<MainContainer>
				<GlintSpots layer="under" />
				<Board />
				<Anticipations />
			</MainContainer>

			<MainContainer>
				<TumbleBoard />
				<!-- <TumbleAnticipations /> -->
				<GlintSpots layer="over" />
				<GlintEffects />
				<!-- the coins fly under every amount: the cluster amounts and the tumble win they pay into -->
				<BoardContainer>
					<WinCoins />
				</BoardContainer>
				<ClusterWinAmounts />
				<TumbleWinAmount />
			</MainContainer>
		</Container>

		<Win />
		<FreeSpinIntro />
		<FreeSpinOutro />
	{/if}
</App>

{#if !context.stateLayout.showLoadingScreen}
	<UI>
		{#snippet gameName()}
			<UiGameName name="PRATALA" />
		{/snippet}
	</UI>
{/if}

<Modals>
	{#snippet payTable()}
		<PayTable />
	{/snippet}
	{#snippet gameRules()}
		<GameRules />
	{/snippet}
	{#snippet version()}
		<GameVersion version={gameVersion} />
	{/snippet}
</Modals>
