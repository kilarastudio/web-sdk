<script lang="ts">
	import { onMount } from 'svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	import { quadIn } from 'svelte/easing';

	import { EnablePixiExtension } from 'components-pixi';
	import { EnableHotkey } from 'components-shared';
	import { MainContainer } from 'components-layout';
	import { App, Container } from 'pixi-svelte';
	import { stateConfig, stateMeta, stateModal, stateUrlDerived } from 'state-shared';

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
	import BoardSpill from './BoardSpill.svelte';
	import Anticipations from './Anticipations.svelte';
	import ClusterWinAmounts from './ClusterWinAmounts.svelte';
	import BoardContainer from './BoardContainer.svelte';
	import WinCoins from './WinCoins.svelte';
	import SymbolFx from './SymbolFx.svelte';
	import TumbleBoard from './TumbleBoard.svelte';
	import TumbleWinAmount from './TumbleWinAmount.svelte';
	import GlintSpots from './GlintSpots.svelte';
	import GlintEffects from './GlintEffects.svelte';
	import GlintGaze from './GlintGaze.svelte';
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

	// The HUD is mounted from the welcome screen on, hidden and inert, so the board (and the
	// dragon's eye over it) is laid out round it from the first frame: the eye on the welcome
	// screen stands where, and as big as, it does in play (the user, 2026-11-18). Meanwhile Space
	// only leaves the welcome screen: the spin button's Space is held off until play.
	let spacebarHeld: { jurisdiction: object; was: boolean } | undefined;
	$effect(() => {
		const jurisdiction = stateConfig.jurisdiction;
		if (context.stateLayout.showLoadingScreen) {
			if (spacebarHeld?.jurisdiction !== jurisdiction) {
				spacebarHeld = { jurisdiction, was: jurisdiction.disabledSpacebar };
				jurisdiction.disabledSpacebar = true;
			}
		} else if (spacebarHeld) {
			if (spacebarHeld.jurisdiction === jurisdiction)
				jurisdiction.disabledSpacebar = spacebarHeld.was;
			spacebarHeld = undefined;
		}
	});

	context.eventEmitter.subscribeOnMount({
		buyBonusConfirm: () => {
			stateModal.modal = { name: 'buyBonusConfirm' };
		},
	});
</script>

<App antialias={false}>
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
				<!-- the light behind each winning symbol, under every symbol -->
				<BoardContainer>
					<SymbolFx layer="under" />
				</BoardContainer>
				<Board />
				<!-- the molten edge's light over the cells next to it -->
				<BoardSpill />
				<Anticipations />
			</MainContainer>

			<MainContainer>
				<TumbleBoard />
				<!-- the dust landing symbols throw up, over every symbol -->
				<BoardContainer>
					<SymbolFx layer="over" />
				</BoardContainer>
				<!-- <TumbleAnticipations /> -->
				<!-- the gaze's beam lies under the values, so those it has doubled stay readable -->
				<GlintGaze />
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

<div
	class="hud"
	class:waiting={context.stateLayout.showLoadingScreen}
	inert={context.stateLayout.showLoadingScreen}
>
	<UI>
		{#snippet gameName()}
			<UiGameName name="PRATALA" />
		{/snippet}
	</UI>
</div>

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

<style>
	/* laid out (so its size is known) but not seen while the welcome screen shows */
	.hud.waiting {
		visibility: hidden;
	}
</style>
