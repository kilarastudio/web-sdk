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
	import Board from './Board.svelte';
	import Anticipations from './Anticipations.svelte';
	import AuctionBoard from './AuctionBoard.svelte';
	import WinLines from './WinLines.svelte';
	import Banner from './Banner.svelte';
	import Win from './Win.svelte';
	import FreeSpinIntro from './FreeSpinIntro.svelte';
	import FreeSpinOutro from './FreeSpinOutro.svelte';
	import Transition from './Transition.svelte';
	import PayTable from './PayTable.svelte';
	import GameRules from './GameRules.svelte';

	// Grey box: the whole game with squares and words in place of art. Every screen and every
	// mode plays from the math's books; nothing here is meant to be kept as a look.
	const context = getContext();

	stateMeta.betModeMeta = betModeMeta(stateUrlDerived.social());

	onMount(() => (context.stateLayout.showLoadingScreen = true));

	context.eventEmitter.subscribeOnMount({
		buyBonusConfirm: () => {
			stateModal.modal = { name: 'buyBonusConfirm' };
		},
	});
</script>

<App>
	<EnableSound />
	<EnableHotkey />
	<EnableGameActor />
	<EnablePixiExtension />

	<Background />

	{#if context.stateLayout.showLoadingScreen}
		<LoadingScreen onloaded={() => (context.stateLayout.showLoadingScreen = false)} />
	{:else}
		<ResumeBet />
		<!--
			<Sound /> is rendered after the press on the loading screen: sound may only start once
			the player has interacted with the page.
		-->
		<Sound />

		<MainContainer>
			<BoardFrame />
		</MainContainer>

		<MainContainer>
			<Board />
			<Anticipations />
		</MainContainer>

		<MainContainer>
			<!-- the paid line is drawn over the reels; the Auction's board covers them -->
			<WinLines />
			<AuctionBoard />
			<Banner />
		</MainContainer>

		<Win />
		<FreeSpinIntro />
		<FreeSpinOutro />
		<Transition />
	{/if}
</App>

{#if !context.stateLayout.showLoadingScreen}
	<UI>
		{#snippet gameName()}
			<UiGameName name="GOING ONCE" />
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
