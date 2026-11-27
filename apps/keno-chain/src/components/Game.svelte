<script lang="ts">
	import { onMount } from 'svelte';

	import { EnablePixiExtension } from 'components-pixi';
	import { EnableHotkey } from 'components-shared';
	import { App } from 'pixi-svelte';
	import { stateI18nDerived, stateMeta, stateModal, stateUrlDerived } from 'state-shared';

	import { GameVersion, Modals, UiChoiceGrid, UiSheetSection } from 'components-ui-html';

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

	// Autoplay, as keno players know it: the numbers of each round (the same set, or a fresh
	// Random Pick each time) and a stop on profit beside the shell's limits. The limits also hold
	// in Unbroken Chain and Golden Chain, counted in what their rounds really cost, and autoplay
	// waits until the board holds a set the level plays.
	const t = stateI18nDerived.translate;
	const AUTO_NUMBERS = ['same', 'random'] as const;
	const autoNumbersLabel = (option: (typeof AUTO_NUMBERS)[number]) =>
		option === 'same' ? t('Same numbers') : t('New Random Pick');
	const autoplayBlocked = $derived(
		context.stateGameDerived.ready()
			? ''
			: t('Numbers still to pick: {count}', {
					count: Math.max(1, context.stateGameDerived.missing()),
				}),
	);

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

{#snippet autoNumbers()}
	<UiSheetSection label={t('NUMBERS EACH ROUND')}>
		<UiChoiceGrid
			data-test="auto-numbers"
			value={context.stateGame.autoNumbers}
			options={AUTO_NUMBERS}
			format={autoNumbersLabel}
			min={130}
			onchange={(value) => {
				context.stateGame.autoNumbers = value;
				context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
			}}
		/>
	</UiSheetSection>
{/snippet}

<Modals
	gameRulesSize="large"
	autoplay={{
		extra: autoNumbers,
		profitLimit: true,
		limitsInModes: true,
		blocked: autoplayBlocked,
	}}
>
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
