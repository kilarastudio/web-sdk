<script lang="ts">
	import type { Snippet } from 'svelte';

	import { EnableSpaceHold } from 'components-shared';
	import { stateBet, stateConfig, stateModal, stateReplay, stateUi } from 'state-shared';
	import { numberToCurrencyString } from 'utils-shared/amount';

	import UI from './UI.svelte';
	import UiFadeContainer from './UiFadeContainer.svelte';
	import UiClock from './UiClock.svelte';
	import UiLabel from './UiLabel.svelte';
	import LabelBalance from './LabelBalance.svelte';
	import LabelWin from './LabelWin.svelte';
	import LabelBet from './LabelBet.svelte';
	import ButtonDecrease from './ButtonDecrease.svelte';
	import ButtonIncrease from './ButtonIncrease.svelte';
	import BurstPlay from './BurstPlay.svelte';
	import ButtonMenu from './ButtonMenu.svelte';
	import ButtonMenuClose from './ButtonMenuClose.svelte';
	import ButtonPayTable from './ButtonPayTable.svelte';
	import ButtonGameRules from './ButtonGameRules.svelte';
	import ButtonSettings from './ButtonSettings.svelte';
	import ButtonSoundSwitch from './ButtonSoundSwitch.svelte';
	import ButtonAutoSpin from './ButtonAutoSpin.svelte';
	import ButtonTurbo from './ButtonTurbo.svelte';
	import { fitText } from './fitText';
	import { getContext } from '../context';
	import { i18nDerived } from '../i18n/i18nDerived';

	type Props = {
		// the game's name, the top bar's title: plain text, or the game's own wordmark once it has one
		gameName: Snippet;
		// the game itself (board, meters, what a round shows), drawn in em: 1em is the HUD's unit.
		// Tall screens give it the HUD's column (COLUMN em wide); wide ones let it take its own width.
		game: Snippet<[{ tall: boolean }]>;
		// what the player chooses before a round, apart from the amount (the HUD's own). Tall screens
		// lay it in the column, wide ones in a narrow panel (PANEL em) beside the game.
		choices?: Snippet<[{ tall: boolean; disabled: boolean }]>;
		// small actions that stand beside the amount (quick pick, clear)
		actions?: Snippet<[{ tall: boolean; disabled: boolean }]>;
		// false while a choice is missing: the play bar is dimmed, a press still reaches the game
		ready?: boolean;
	};

	const props: Props = $props();
	const context = getContext();
	const replay = $derived(stateUi.config.mode === 'replay');
	const idle = $derived(context.stateXstateDerived.isIdle());

	// The HUD for burst games (keno and the like): no dock and no round button. A top bar with the
	// menu, the game's name over the clock (no studio logo: the name is the title here), the win
	// and the balance; the game; and the controls, in the order players of Stake's own games
	// (Keno, Mines, Plinko) already know. Tall screens: the play bar straight under the game, then
	// the amount with the game's quick actions, then the choices. Wide screens: a panel left of the
	// game with the amount, the choices, the quick actions, and the play bar at its foot.
	// Everything is sized in one unit, the largest at which the whole screen fits without
	// scrolling, whatever the game puts in.
	const COLUMN = 39;
	const PANEL = 19;
	const PAD = 1;
	const GAP = 1;
	const LARGEST = 20;

	let width = $state(0);
	let height = $state(0);
	// below this shape the column fits a larger unit than the game beside its panel
	const tall = $derived(width < height * 1.35);

	// The blocks are measured where they stand, at the unit they were laid out with, and turned
	// into units: those hold still when the unit changes, so the unit settles in one or two rounds.
	let topEl = $state<HTMLElement>();
	let gameEl = $state<HTMLElement>();
	let panelEl = $state<HTMLElement>();
	// counts the blocks' own size changes (a choice added, a longer text)
	let resized = $state(0);
	let unit = $state(10);
	let measured = $state(false);

	$effect(() => {
		if (!topEl || !gameEl || !panelEl) return;
		const observer = new ResizeObserver(() => (resized += 1));
		[topEl, gameEl, panelEl].forEach((el) => observer.observe(el));
		return () => observer.disconnect();
	});

	$effect(() => {
		void resized;
		if (!topEl || !gameEl || !panelEl || !width || !height) return;
		const top = topEl.offsetHeight / unit;
		const game = { width: gameEl.offsetWidth / unit, height: gameEl.offsetHeight / unit };
		const panel = panelEl.offsetHeight / unit;
		if (!top || !game.height) return;

		const across = tall ? COLUMN + PAD * 2 : PANEL + GAP * 2 + game.width + PAD * 2;
		const down = tall
			? top + game.height + panel + GAP * 2 + PAD
			: top + Math.max(game.height, panel) + GAP + PAD;
		const next = Math.min(LARGEST, width / across, height / down);
		// whole px measured at a small unit wobble by a fraction: a change that small is not one
		if (Math.abs(next - unit) > unit * 0.004) unit = next;
		else measured = true;
	});

	// once the game is entered, the replay's summary opens before anything plays (ModalReplay)
	let summaryShown = false;
	$effect(() => {
		if (!replay || summaryShown || context.stateLayout.showLoadingScreen) return;
		if (!stateReplay.bet || stateReplay.phase !== 'ready') return;
		summaryShown = true;
		stateModal.modal = { name: 'replay' };
	});

	// a sheet or modal opened from the menu takes its place
	$effect(() => {
		if (stateModal.modal !== null) stateUi.menuOpen = false;
	});

	// this HUD holds the game inside it, so it keeps nothing clear for a game outside
	$effect(() => {
		stateUi.hudInset.top = 0;
		stateUi.hudInset.bottom = 0;
		stateUi.hudInset.side = 0;
	});
</script>

{#if !replay && !stateConfig.jurisdiction.disabledSpacebar}
	<EnableSpaceHold />
{/if}

{#snippet playRow()}
	<div class="play-row">
		{#if replay}
			<BurstPlay replay />
			<ButtonTurbo />
		{:else}
			<BurstPlay ready={props.ready ?? true} />
			<ButtonAutoSpin />
			<ButtonTurbo />
		{/if}
	</div>
{/snippet}

<!-- the amount in one field: − amount +, each a full-size target; press the amount for the menu -->
{#snippet betField()}
	<div class="bet">
		<ButtonDecrease />
		<div class="bet-value" use:fitText>
			<LabelBet stacked />
		</div>
		<ButtonIncrease />
	</div>
{/snippet}

{#snippet actionsBlock()}
	{#if props.actions}
		<div class="actions">
			{@render props.actions({ tall, disabled: !idle })}
		</div>
	{/if}
{/snippet}

{#snippet choicesBlock()}
	{#if props.choices}
		<div class="choices">
			{@render props.choices({ tall, disabled: !idle })}
		</div>
	{/if}
{/snippet}

{#snippet replayLabels()}
	<div class="replay-labels" use:fitText>
		<UiLabel
			stacked
			label={i18nDerived.bet()}
			value={numberToCurrencyString(stateBet.wageredBetAmount)}
		/>
		<UiLabel
			stacked
			label={`${i18nDerived.realCost()} (×${stateReplay.costMultiplier})`}
			value={numberToCurrencyString(stateBet.wageredBetAmount * stateReplay.costMultiplier)}
		/>
	</div>
{/snippet}

<UI>
	<UiFadeContainer>
		<div
			class="burst"
			class:tall
			class:measured
			style:--u="{unit}px"
			style:--column="{COLUMN}em"
			style:--panel="{PANEL}em"
			style:--panel-units={PANEL}
			style:--pad="{PAD}em"
			style:--gap="{GAP}em"
			style:font-size="{unit}px"
			bind:clientWidth={width}
			bind:clientHeight={height}
		>
			<header class="top" bind:this={topEl}>
				{#if stateUi.menuOpen}
					<ButtonMenuClose />
				{:else}
					<ButtonMenu />
				{/if}
				<div class="names">
					<span class="game-name">{@render props.gameName()}</span>
					<UiClock />
				</div>
				<div class="money" use:fitText>
					<LabelWin stacked hideZero={!replay} />
					<!-- a replay does not use the balance -->
					{#if !replay}
						<LabelBalance stacked />
					{/if}
				</div>
			</header>

			<div class="body">
				<div class="game">
					<div class="game-fit" bind:this={gameEl}>
						{@render props.game({ tall })}
					</div>
				</div>

				<!--
					The controls keep the order of Stake's own games. Tall: play, amount, quick actions,
					choices (the play bar is the first thing under the game). Wide: amount, choices, quick
					actions, play (the play bar is the foot of the panel).
				-->
				<div class="panel" bind:this={panelEl}>
					{#if replay}
						{#if tall}
							{@render playRow()}
							{@render replayLabels()}
						{:else}
							{@render replayLabels()}
							{@render playRow()}
						{/if}
					{:else if tall}
						{@render playRow()}
						<div class="amount-row">
							{@render betField()}
							{@render actionsBlock()}
						</div>
						{@render choicesBlock()}
					{:else}
						{@render betField()}
						{@render choicesBlock()}
						{@render actionsBlock()}
						{@render playRow()}
					{/if}
				</div>
			</div>

			{#if stateUi.menuOpen}
				<div
					class="menu-backdrop"
					role="presentation"
					onclick={() => (stateUi.menuOpen = false)}
				></div>
				<nav class="menu-card" style:top="{topEl?.offsetHeight ?? 0}px">
					<ButtonPayTable />
					<ButtonGameRules />
					<ButtonSettings />
					<ButtonSoundSwitch />
				</nav>
			{/if}
		</div>
	</UiFadeContainer>
</UI>

<style lang="scss">
	/*
		Sizes the shared buttons and labels read are lengths in --u (px), never em: a button sets its
		own font size, so an em length would mean something else inside it.
	*/
	.burst {
		--ui-font-size: calc(var(--u) * 1.5);
		--ui-button-size: calc(var(--u) * 4.4);
		--ui-button-bg: var(--ui-field);
		--ui-button-hover-bg: rgba(243, 244, 246, 0.13);
		--burst-play-height: calc(var(--u) * 5);

		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		box-sizing: border-box;
		padding: 0 var(--pad) var(--pad);
		pointer-events: auto;
		user-select: none;
		touch-action: manipulation;
		/* nothing shows until the unit is worked out, so the first frame never shows a wrong size */
		visibility: hidden;

		&.measured {
			visibility: visible;
		}
	}

	.top {
		flex: none;
		display: flex;
		align-items: center;
		gap: 1em;
		padding: 0.8em 0;
		/* above the menu's backdrop: the close button stands where the menu button was */
		position: relative;
		z-index: 2;
	}

	.names {
		flex: none;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.3em;
		/* the clock under the name */
		color: var(--ui-text-muted);
		font-size: 1.05em;
		font-weight: 600;
		letter-spacing: 0.06em;
		line-height: 1.2;
		text-transform: uppercase;
		white-space: nowrap;
	}

	/* the title: the game's name where a studio logo would stand, in the HUD's own text colour */
	.game-name {
		color: var(--ui-text);
		font-size: 1.7em;
		font-weight: 700;
		letter-spacing: 0.05em;
		line-height: 1;
	}

	/* long amounts shrink to fit what the names leave (fitText) */
	.money {
		--ui-label-align: end;

		flex: 1;
		display: flex;
		justify-content: flex-end;
		align-items: center;
		gap: 2em;
		min-width: 0;
	}

	.body {
		flex: 1;
		display: flex;
		min-height: 0;
	}

	.game {
		display: flex;
		justify-content: center;
		align-items: center;
		min-width: 0;
		min-height: 0;
	}

	.game-fit {
		flex: none;
	}

	.panel {
		flex: none;
		display: flex;
		flex-direction: column;
		gap: 0.8em;
	}

	/* tall: one column, the top bar and the controls at the screen's ends, the game on the controls */
	.tall {
		align-items: center;

		.top,
		.body {
			width: var(--column);
		}

		.body {
			flex-direction: column;
			gap: var(--gap);
		}

		/* the game stands on the play bar: room left over on a long screen stays above the game */
		.game {
			flex: 1;
			align-items: flex-end;
		}

		.game-fit,
		.panel {
			width: 100%;
		}
	}

	/* wide: the controls in a panel on the left, the game beside it, both centred as one */
	.burst:not(.tall) {
		.body {
			flex-direction: row-reverse;
			justify-content: center;
			align-items: center;
			gap: calc(var(--gap) * 2);
			padding-top: var(--gap);
		}

		.panel {
			width: var(--panel);
		}

		.bet {
			flex: none;
		}

		.actions {
			display: block;
		}

		/* the panel is narrow: the play bar takes a row, autoplay and turbo share the next */
		.play-row {
			--ui-button-size: calc(var(--u) * 4.4);
			--ui-button-width: calc(var(--u) * (var(--panel-units) - 0.5) / 2);

			flex-wrap: wrap;

			> :global(.burst-play) {
				flex: 1 0 100%;
			}
		}
	}

	.amount-row {
		display: flex;
		align-items: center;
		gap: 0.8em;
	}

	/* the amount's field takes the room the actions leave */
	.bet {
		--ui-button-bg: transparent;
		--ui-button-hover-bg: var(--ui-field);
		--ui-icon-scale: 0.5;

		flex: 1;
		display: flex;
		align-items: center;
		min-width: 0;
		background-color: var(--ui-field);
	}

	.bet-value {
		flex: 1;
		display: flex;
		justify-content: center;
		min-width: 0;
	}

	.actions {
		flex: none;
		display: flex;
		gap: 0.5em;
	}

	.play-row {
		--ui-button-size: var(--burst-play-height);

		display: flex;
		gap: 0.5em;
	}

	.replay-labels {
		display: flex;
		justify-content: space-around;
		align-items: center;
		min-width: 0;
	}

	.menu-backdrop {
		position: absolute;
		inset: 0;
		z-index: 1;
		background-color: var(--ui-scrim);
		cursor: pointer;
	}

	/* under the menu button, which is the close button while the menu is open */
	.menu-card {
		--ui-row-height: calc(var(--ui-button-size) * 0.92);
		--ui-button-hover-bg: var(--ui-field);

		position: absolute;
		z-index: 2;
		left: max(var(--pad), calc((100% - var(--column)) / 2));
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: calc(var(--ui-font-size) * 9.5);
		padding: calc(var(--u) * 0.8);
		background-color: var(--ui-surface-raised);
		box-shadow: var(--ui-shadow);
	}

	.burst:not(.tall) .menu-card {
		left: var(--pad);
	}
</style>
