<script lang="ts">
	import { onMount } from 'svelte';

	import { EnablePixiExtension } from 'components-pixi';
	import { EnableHotkey } from 'components-shared';
	import { MainContainer } from 'components-layout';
	import { App } from 'pixi-svelte';
	import { stateMeta, stateModal, stateUrlDerived } from 'state-shared';

	import { UI, UiGameName, GameVersion, Modals } from 'components-ui-html';

	import { version as gameVersion } from '../../package.json';
	import { getContext } from '../game/context';
	import { betModeMeta } from '../game/betModeMeta';
	import EnableSound from './EnableSound.svelte';
	import EnableGameActor from './EnableGameActor.svelte';
	import ResumeBet from './ResumeBet.svelte';
	import Sound from './Sound.svelte';
	import Background from './Background.svelte';
	import LoadingScreen from './LoadingScreen.svelte';
	import BoardFrame from './BoardFrame.svelte';
	import Character from './Character.svelte';
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
	import Transition from './Transition.svelte';
	import GeneratedArt from './GeneratedArt.svelte';
	import PayTable from './PayTable.svelte';
	import GameRules from './GameRules.svelte';
	import TransitionAnimation from './TransitionAnimation.svelte';

	const context = getContext();

	stateMeta.betModeMeta = betModeMeta(stateUrlDerived.social());

	// the wipe that closed the welcome screen opens on the game
	let entering = $state(false);

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
				entering = true;
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

		<MainContainer>
			<BoardFrame />
		</MainContainer>

		<MainContainer>
			<Character />
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

		<Win />
		<FreeSpinIntro />
		<FreeSpinOutro />
		<Transition />
		{#if entering}
			<TransitionAnimation mode="uncover" oncomplete={() => (entering = false)} />
		{/if}
	{/if}
</App>

{#if !context.stateLayout.showLoadingScreen}
	<UI>
		{#snippet gameName()}
			<UiGameName name="DRAGON'S GLINT" />
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
