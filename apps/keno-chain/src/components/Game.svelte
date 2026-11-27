<script lang="ts">
	import { onMount } from 'svelte';

	import { EnablePixiExtension } from 'components-pixi';
	import { EnableHotkey } from 'components-shared';
	import { App } from 'pixi-svelte';
	import { stateMeta, stateModal, stateUrlDerived } from 'state-shared';

	import { GameVersion, Modals } from 'components-ui-html';

	import { version as gameVersion } from '../../package.json';
	import { getContext } from '../game/context';
	import { betModeMeta } from '../game/betModeMeta';
	import EnableGameActor from './EnableGameActor.svelte';
	import ResumeBet from './ResumeBet.svelte';
	import Background from './Background.svelte';
	import LoadingScreen from './LoadingScreen.svelte';
	import KenoTable from './KenoTable.svelte';
	import PayTable from './PayTable.svelte';
	import GameRules from './GameRules.svelte';

	// The canvas is a flat colour; the loading and welcome screens and the game itself (KenoTable)
	// are HTML, drawn by code: no image or sound files.
	const context = getContext();

	stateMeta.betModeMeta = betModeMeta(stateUrlDerived.social());

	onMount(() => (context.stateLayout.showLoadingScreen = true));

	// the shell's mode scene (its feature button lists the Chain modes) asks the game to open the
	// confirmation of the card that was chosen
	context.eventEmitter.subscribeOnMount({
		buyBonusConfirm: () => {
			stateModal.modal = { name: 'buyBonusConfirm' };
		},
	});
</script>

<App>
	<EnableHotkey />
	<EnableGameActor />
	<EnablePixiExtension />

	<Background />

	{#if !context.stateLayout.showLoadingScreen}
		<ResumeBet />
	{/if}
</App>

{#if context.stateLayout.showLoadingScreen}
	<LoadingScreen onloaded={() => (context.stateLayout.showLoadingScreen = false)} />
{:else}
	<KenoTable />
{/if}

<Modals gameRulesSize="large">
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
	/* the bonus modes' names are long (UNBROKEN CHAIN): smaller on their cards, so each keeps to one line */
	:global(:root) {
		--ui-bonus-title-scale: 0.74;
		--ui-bonus-title-wrap: nowrap;
		/* the paytable and the info: larger where the screen has room (user, 2026-11-27) */
		--ui-sheet-large: 1080px;
		--ui-sheet-max-height: 920px;
	}
</style>
