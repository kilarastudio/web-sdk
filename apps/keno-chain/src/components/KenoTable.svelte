<script lang="ts">
	import { EnableSpaceHold } from 'components-shared';
	import {
		stateBet,
		stateConfig,
		stateI18nDerived,
		stateModal,
		stateReplay,
		stateUi,
		stateUrlDerived,
	} from 'state-shared';
	import { UI, i18nDerived } from 'components-ui-html';
	// the shell's own controls, each with its rules (limits, jurisdiction switches, menus); the
	// package exports its HUDs, not their parts
	import UiFadeContainer from 'components-ui-html/src/components/UiFadeContainer.svelte';
	import UiLabel from 'components-ui-html/src/components/UiLabel.svelte';
	import LabelBalance from 'components-ui-html/src/components/LabelBalance.svelte';
	import ButtonDecrease from 'components-ui-html/src/components/ButtonDecrease.svelte';
	import ButtonIncrease from 'components-ui-html/src/components/ButtonIncrease.svelte';
	import ButtonMenu from 'components-ui-html/src/components/ButtonMenu.svelte';
	import ButtonMenuClose from 'components-ui-html/src/components/ButtonMenuClose.svelte';
	import ButtonPayTable from 'components-ui-html/src/components/ButtonPayTable.svelte';
	import ButtonGameRules from 'components-ui-html/src/components/ButtonGameRules.svelte';
	import ButtonSoundSwitch from 'components-ui-html/src/components/ButtonSoundSwitch.svelte';
	import ButtonAutoSpin from 'components-ui-html/src/components/ButtonAutoSpin.svelte';
	import ButtonTurbo from 'components-ui-html/src/components/ButtonTurbo.svelte';
	import { fitText } from 'components-ui-html/src/components/fitText';
	import {
		bookEventAmountToCountUpCurrencyString,
		bookEventAmountToCurrencyString,
		numberToCurrencyString,
	} from 'utils-shared/amount';

	import config from '../game/config';
	import { getContext } from '../game/context';
	import { sound } from '../game/sound';
	import KenoBoard from './KenoBoard.svelte';
	import KenoChoices from './KenoChoices.svelte';
	import KenoActions from './KenoActions.svelte';
	import KenoPlay from './KenoPlay.svelte';
	import StreakMeter from './StreakMeter.svelte';
	import DrawPips from './DrawPips.svelte';
	import PayStrip from './PayStrip.svelte';
	import ResultCard from './ResultCard.svelte';

	// Keno Chain's own screen: the frame players know from Stake's Keno, in flat square blocks on
	// navy. Tall screens: the name and the last results, the game (multiplier stairs, the draw, the
	// 8 × 5 board, what the hits win), then balance and win beside the play bar, the amount, the
	// level and the picking tools with autoplay and turbo. Wide screens: no head; the controls
	// stand left of the game with the name at their top and autoplay, turbo and the menu at their
	// foot, the last results over the game. Everything is sized in one unit, the largest at which the whole screen fits
	// without scrolling; on a long phone the tiles take the room left over.
	const context = getContext();
	const replay = stateUrlDerived.replay();
	// the shell's bet label reads "SPIN" in social play; keno has no spin, so it is the play amount
	const betLabel = $derived(stateUrlDerived.social() ? 'PLAY AMOUNT' : i18nDerived.bet());

	const idle = $derived(context.stateXstateDerived.isIdle());
	const editable = $derived(idle && !replay);
	const ready = $derived(context.stateGameDerived.ready());
	const win = $derived(context.stateGame.win);

	// the measures of both layouts, in the unit
	const TALL = { column: 39, gap: 0.6, lip: 0.4, tileFont: 1.95, tile: [4.1, 5.2] };
	const WIDE = { panel: 27 * 0.72, stage: 66, inner: 60, gap: 1, lip: 0.6, tileFont: 2.7, tile: 5.6 };
	const PAD = 1;
	const TOP = 0.6;
	const GAP = 1.1;
	// wide: air around the game and between its two halves, and a cap so a large monitor does not
	// blow it up to the edges
	const GAP_WIDE = 3.2;
	const PAD_WIDE = 3;
	const PAD_WIDE_DOWN = 1.6;
	const LARGEST_WIDE = 16;
	const ROWS = 5;
	const LARGEST = 20;

	let width = $state(0);
	let height = $state(0);
	// below this shape the column fits a larger unit than the game beside its panel
	const tall = $derived(width < height * 1.35);

	// The blocks are measured where they stand, at the unit they were laid out with, and turned
	// into units: those hold still when the unit changes, so the unit settles in one or two rounds.
	let headEl = $state<HTMLElement>();
	let stageEl = $state<HTMLElement>();
	let panelEl = $state<HTMLElement>();
	let resized = $state(0);
	let unit = $state(10);
	let tileTall = $state(TALL.tile[0]);
	let measured = $state(false);

	// the wide layout has no head: the name and the menu stand in its panel
	$effect(() => {
		if (!stageEl || !panelEl) return;
		const observer = new ResizeObserver(() => (resized += 1));
		[headEl, stageEl, panelEl].forEach((el) => el && observer.observe(el));
		return () => observer.disconnect();
	});

	$effect(() => {
		void resized;
		if (!stageEl || !panelEl || !width || !height) return;
		if (tall && !headEl) return;
		const head = (headEl?.offsetHeight ?? 0) / unit;
		const stage = stageEl.offsetHeight / unit;
		// the wide panel stretches to the game's height: what it holds is what it needs
		const panel = (tall ? panelEl.offsetHeight : panelEl.scrollHeight) / unit;
		if ((tall && !head) || !stage) return;

		let nextUnit: number;
		let nextTile = tileTall;
		if (tall) {
			// everything but the tiles' own height, which follows the room left over
			const fixed = TOP + head + GAP + stage - ROWS * tileTall + GAP + panel + PAD;
			nextUnit = Math.min(
				LARGEST,
				width / (TALL.column + PAD * 2),
				height / (fixed + ROWS * TALL.tile[0]),
			);
			nextTile = Math.min(TALL.tile[1], Math.max(TALL.tile[0], (height / nextUnit - fixed) / ROWS));
		} else {
			const across = WIDE.panel + GAP_WIDE + WIDE.stage + PAD_WIDE * 2;
			const down = Math.max(stage, panel) + PAD_WIDE_DOWN * 2;
			nextUnit = Math.min(LARGEST_WIDE, width / across, height / down);
		}
		// whole px measured at a small unit wobble by a fraction: a change that small is not one
		const settled =
			Math.abs(nextUnit - unit) <= unit * 0.004 && Math.abs(nextTile - tileTall) <= 0.02;
		if (settled) measured = true;
		else {
			unit = nextUnit;
			tileTall = nextTile;
		}
	});

	const board = $derived(
		tall
			? {
					width: TALL.column,
					gap: TALL.gap,
					lip: TALL.lip,
					tileFont: TALL.tileFont,
					tileHeight: tileTall,
				}
			: {
					width: WIDE.inner,
					gap: WIDE.gap,
					lip: WIDE.lip,
					tileFont: WIDE.tileFont,
					tileHeight: WIDE.tile,
				},
	);

	// how many times the amount the mode in play costs (a bonus mode: 10 or 100)
	const modeCost = $derived(config.levelCost[context.stateGameDerived.level()]);

	// the last results, as multiples of the base bet (the win table's unit)
	const recent = $derived(context.stateGame.recent.slice(tall ? -3 : -6));
	// two decimals, none from 100× up, so a large win keeps to its chip
	const ratio = (value: number) => {
		const digits = value >= 100 ? 0 : 2;
		return `${stateI18nDerived.number(value, { minimumFractionDigits: digits, maximumFractionDigits: digits })}×`;
	};

	// the round's win beside the balance: it counts with the card on the board
	const winText = $derived(
		win
			? bookEventAmountToCountUpCurrencyString(win.shown, win.amount)
			: bookEventAmountToCurrencyString(stateBet.winBookEventAmount),
	);
	const winSize = $derived(
		!win ? 'none' : win.ratio >= 10 ? 'big' : win.ratio >= 1 ? 'won' : 'some',
	);

	// the shell's "BASE" (before the first choice, or Chain switched off from a menu) becomes a
	// mode the RGS plays
	$effect(() => {
		void stateBet.activeBetModeKey;
		context.stateGameDerived.settleMode();
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

	// this screen holds the game inside it, so it keeps nothing clear for a game outside
	$effect(() => {
		stateUi.hudInset.top = 0;
		stateUi.hudInset.bottom = 0;
		stateUi.hudInset.side = 0;
	});

	// The menu opens beside its button: under it at the top of a tall screen, over it at the foot
	// of the wide panel. Paytable, info and the sound switch: no settings sheet, since the game has
	// no music and its only setting would be the sound the switch already covers (user, 2026-11-27).
	let menuEl = $state<HTMLElement>();
	let hudEl = $state<HTMLElement>();
	const menuPlace = $derived.by(() => {
		void unit;
		if (!stateUi.menuOpen || !menuEl || !hudEl) return '';
		const button = menuEl.getBoundingClientRect();
		const hud = hudEl.getBoundingClientRect();
		const gap = unit * 0.6;
		if (tall) return `top:${button.bottom - hud.top + gap}px;right:${hud.right - button.right}px`;
		// wide: as wide as the controls and flush with them, over the row the button stands in
		const panel = panelEl?.getBoundingClientRect() ?? button;
		return `bottom:${hud.bottom - button.top + gap}px;left:${panel.left - hud.left}px;width:${panel.width}px`;
	});

	// the shell's buttons ask for their press sound
	context.eventEmitter.subscribeOnMount({
		soundPressGeneral: () => sound.press(),
		soundPressBet: () => sound.press(),
	});
</script>

{#if !replay && !stateConfig.jurisdiction.disabledSpacebar}
	<EnableSpaceHold />
{/if}

{#snippet money()}
	<div class="money" use:fitText>
		<!-- a replay does not use the balance -->
		{#if !replay}
			<div class="balance"><LabelBalance stacked /></div>
		{/if}
		<div class="win {winSize}" data-test="win" aria-live="polite">
			<UiLabel stacked label={i18nDerived.win()} value={winText} />
		</div>
	</div>
{/snippet}

{#snippet logo()}
	<div class="logo" aria-label="Keno Chain">KENO<span>CHAIN</span></div>
{/snippet}

{#snippet recentResults()}
	<div class="recent" aria-label={stateI18nDerived.translate('Recent results')}>
		{#each recent as result (result.id)}
			<span class:won={result.ratio >= 1 && result.ratio < 10} class:big={result.ratio >= 10}>
				{ratio(result.times)}
			</span>
		{/each}
	</div>
{/snippet}

{#snippet menuButton()}
	<div class="menu-button" bind:this={menuEl}>
		{#if stateUi.menuOpen}
			<ButtonMenuClose />
		{:else}
			<ButtonMenu />
		{/if}
	</div>
{/snippet}

{#snippet betField()}
	<div class="bet" class:locked={!idle}>
		<ButtonDecrease />
		<div class="bet-value" use:fitText>
			<!-- The amount is always the base one, as players of Keno know it; a bonus mode's times
				stand beside the word, and what a round costs is on the bonus button and the play bar. -->
			<button
				type="button"
				class="bet-amount"
				data-test="bet-amount"
				disabled={!idle}
				onclick={() => {
					sound.press();
					stateModal.modal = { name: 'betAmountMenu' };
				}}
			>
				<span class="name">
					{betLabel}
					{#if modeCost > 1}<b>{stateI18nDerived.times(modeCost)}</b>{/if}
				</span>
				<span class="value">{numberToCurrencyString(stateBet.betAmount)}</span>
			</button>
		</div>
		<ButtonIncrease />
	</div>
{/snippet}

{#snippet replayLabels()}
	<div class="replay-labels" use:fitText>
		<UiLabel
			stacked
			label={betLabel}
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
			class="hud"
			class:tall
			class:measured
			style:--u="{unit}px"
			style:--hud-u="{unit}px"
			style:font-size="{unit}px"
			bind:clientWidth={width}
			bind:clientHeight={height}
			bind:this={hudEl}
		>
			<!-- tall: the name, the last results and the menu in a row over the game. Wide: no head;
				the name stands at the top of the panel, the menu at its foot, the results over the game -->
			{#if tall}
				<header class="head" bind:this={headEl}>
					{@render logo()}
					{@render recentResults()}
					{@render menuButton()}
				</header>
			{/if}

			<div class="body">
				<div class="stage" bind:this={stageEl}>
					{#if !tall}
						{@render recentResults()}
					{/if}
					<StreakMeter />
					<DrawPips />
					<div class="board">
						<KenoBoard {editable} {unit} {...board} />
						<ResultCard />
					</div>
					<PayStrip />
				</div>

				<!--
					The controls keep the order of Stake's own games. Tall: balance and win, play, amount,
					level, tools (the play bar is the first thing under the game). Wide: amount, level,
					tools, then balance and win over the play bar at the panel's foot.
				-->
				<div class="panel" bind:this={panelEl}>
					{#if !tall}
						{@render logo()}
					{/if}
					{#if replay}
						{@render money()}
						<KenoPlay {ready} replay />
						<div class="toggles one"><ButtonTurbo /></div>
						{@render replayLabels()}
						{#if !tall}
							<div class="toggles foot one">{@render menuButton()}</div>
						{/if}
					{:else if tall}
						{@render money()}
						<KenoPlay ready={ready || !idle} replay={false} />
						{@render betField()}
						<KenoChoices disabled={!idle} />
						<div class="actions toggles">
							<KenoActions disabled={!idle} />
							<ButtonAutoSpin />
							<ButtonTurbo />
						</div>
					{:else}
						{@render betField()}
						<KenoChoices disabled={!idle} />
						<div class="actions"><KenoActions disabled={!idle} /></div>
						{@render money()}
						<KenoPlay ready={ready || !idle} replay={false} />
						<div class="toggles foot three">
							<ButtonAutoSpin />
							<ButtonTurbo />
							{@render menuButton()}
						</div>
					{/if}
				</div>
			</div>

			{#if stateUi.menuOpen}
				<div
					class="menu-backdrop"
					role="presentation"
					onclick={() => (stateUi.menuOpen = false)}
				></div>
				<nav class="menu-card" style={menuPlace}>
					<ButtonPayTable />
					<ButtonGameRules />
					<ButtonSoundSwitch />
				</nav>
			{/if}
		</div>
	</UiFadeContainer>
</UI>

<style lang="scss">
	/*
		One dark look, by choice: flat square blocks on navy, 1px lines, smooth type and line icons.
		The tiles keep the meanings players know from Stake's Keno: violet is picked, green is a hit,
		a drawn tile that was not picked sinks dark with a red number; gold is the multiplier and the
		wins. Nothing is pixelated.
	*/
	.hud {
		--bg: #0e1422;
		--panel: #121929;
		--line: #243049;
		--field: #1c2537;
		--field-hover: #27334b;
		--tile: #28344c;
		--tile-lip: #171f2f;
		--tile-hover: #344363;
		--sunk: #0c1220;
		--sunk-edge: #010204;
		--text: #f3f5fb;
		--muted: #95a3bc;
		--faint: #5d6b86;
		--pick: #9b87ff;
		--pick-lip: #6450d6;
		--pick-ink: #150c40;
		--pick-hit: #6f5be0;
		--pick-wait: #c9bcff;
		--hit: #3fe082;
		--hit-edge: #1c9f55;
		--hit-ink: #06381a;
		--hit-dim: #17402b;
		--hit-lit: #1d5a39;
		--miss: #ff5d62;
		--gold: #ffc93c;
		--gold-token: #ffcf45;
		--gold-edge: #c2850a;
		--gold-ink: #2e2100;
		--gold-dim: #4a3a0c;
		--gold-muted: #a8872c;
		--gold-ground: #2a2210;
		--gold-lip: #5f4a12;
		--gold-face: #8a6a12;
		--play: #2fdc6f;
		--play-hover: #55e88b;
		--play-ink: #052412;
		--play-edge: #17964a;
		--play-h: 5.6em;
		--play-lip: 0.4em;

		/* the shell's buttons and labels, on this screen's colours; their sizes are lengths in --u */
		--ui-text: var(--text);
		--ui-text-muted: var(--muted);
		--ui-text-disabled: rgba(149, 163, 188, 0.45);
		--ui-accent: var(--hit);
		--ui-accent-contrast: var(--hit-ink);
		--ui-field: var(--field);
		--ui-button-bg: var(--field);
		--ui-button-hover-bg: var(--field-hover);
		--ui-surface-raised: var(--panel);
		--ui-disabled-bg: var(--field-hover);
		--ui-scrim: rgba(5, 8, 14, 0.74);
		--ui-shadow: none;
		--ui-font-size: calc(var(--u) * 1.5);
		--ui-button-size: calc(var(--u) * 4.6);

		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		box-sizing: border-box;
		padding: calc(var(--u) * 0.6) calc(var(--u) * 1) calc(var(--u) * 1);
		background-color: var(--bg);
		color: var(--text);
		line-height: 1.45;
		pointer-events: auto;
		user-select: none;
		touch-action: manipulation;
		/* nothing shows until the unit is worked out, so the first frame never shows a wrong size */
		visibility: hidden;

		&.measured {
			visibility: visible;
		}
	}

	.head {
		flex: none;
		display: flex;
		align-items: center;
		gap: 0.8em;
		height: 3.8em;
		/* above the menu's backdrop: the close button stands where the menu button was */
		position: relative;
		z-index: 2;
	}

	.logo {
		display: flex;
		align-items: center;
		margin-right: auto;
		font-size: 2.4em;
		font-weight: 700;
		line-height: 1;
		white-space: nowrap;

		span {
			margin-left: 0.3em;
			color: var(--gold);
		}
	}

	.recent {
		display: flex;
		justify-content: flex-end;
		gap: 0.4em;
		min-width: 0;

		/* lengths in the unit: a chip's own text is 1.25 of it */
		span {
			flex: none;
			min-width: 3.68em;
			padding: 0 0.48em;
			background-color: var(--field);
			color: var(--muted);
			font-size: 1.25em;
			font-weight: 600;
			line-height: 1.92;
			text-align: center;
			font-variant-numeric: tabular-nums;
		}

		span:last-child {
			animation: chip-in 0.28s cubic-bezier(0.2, 0.8, 0.2, 1) both;
		}

		span.won {
			background-color: var(--hit-dim);
			color: var(--hit);
		}

		span.big {
			background-color: var(--gold-dim);
			color: var(--gold);
		}
	}

	@keyframes chip-in {
		from {
			transform: translateX(12px);
			opacity: 0;
		}
	}

	.menu-button {
		--ui-button-size: calc(var(--u) * 3.6);
		--ui-icon-scale: 0.55;

		flex: none;
		/* above the menu's backdrop: the close button stands where the menu button was */
		position: relative;
		z-index: 2;
		color: var(--muted);
	}

	.body {
		flex: 1;
		display: flex;
		min-height: 0;
	}

	.stage {
		flex: none;
		display: flex;
		flex-direction: column;
		gap: 0.8em;
		min-width: 0;
	}

	.board {
		position: relative;
	}

	.panel {
		flex: none;
		display: flex;
		flex-direction: column;
		gap: 0.8em;
		min-width: 0;
	}

	/* balance and win stand beside the play bar, where the thumb already is */
	.money {
		--ui-font-size: calc(var(--u) * 2);

		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 1.2em;
		min-width: 0;
		padding: 0 0.2em;
	}

	.balance {
		--ui-label-align: flex-start;
	}

	.win {
		--ui-label-align: flex-end;
		--ui-label-value-color: var(--faint);

		margin-left: auto;

		&.some {
			--ui-label-value-color: var(--text);
		}

		&.won {
			--ui-label-value-color: var(--hit);
		}

		&.big {
			--ui-label-value-color: var(--gold);
		}
	}

	/* the amount in one field: − amount +, each a full-size target; press the amount for the menu */
	.bet {
		--ui-button-bg: transparent;
		--ui-button-width: calc(var(--u) * 4.8);
		--ui-icon-scale: 0.5;
		--ui-font-size: calc(var(--u) * 1.9);

		flex: none;
		display: flex;
		align-items: center;
		min-width: 0;
		background-color: var(--field);
		transition: opacity 0.15s;

		&.locked {
			opacity: 0.45;
		}
	}

	.bet-value {
		flex: 1;
		display: flex;
		justify-content: center;
		min-width: 0;
	}

	/* the shell's stacked label, with the mode's times in gold beside the word */
	.bet-amount {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.1em;
		padding: 0;
		border: none;
		background: none;
		color: var(--text);
		font: inherit;
		font-size: calc(var(--ui-font-size) * var(--ui-fit, 1));
		line-height: 1.15;
		white-space: nowrap;
		cursor: pointer;
		touch-action: manipulation;

		&:disabled {
			cursor: not-allowed;
		}

		.name {
			color: var(--muted);
			font-size: 0.55em;
			font-weight: 500;
			letter-spacing: 0.08em;
			text-transform: uppercase;

			b {
				margin-left: 0.4em;
				color: var(--gold);
				font-weight: 700;
			}
		}

		.value {
			font-weight: 600;
			font-variant-numeric: tabular-nums;
		}
	}

	.actions {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.8em;
	}

	/* autoplay and turbo: lit green while they are on */
	.toggles {
		:global(.ui-button.active::before) {
			background-color: var(--hit-dim);
		}
	}

	.replay-labels {
		display: flex;
		justify-content: space-around;
		align-items: center;
		min-width: 0;
	}

	/* tall: one column, the name at the top, the controls at the foot, the game between them */
	.tall {
		.head,
		.body {
			width: 39em;
		}

		.body {
			flex-direction: column;
			gap: 1.1em;
			padding-top: 1.1em;
		}

		/* room left over on a long screen is shared above and under the game */
		.stage {
			margin: auto 0;
		}

		/* the picking tools and the two switches share one row; the switches are icons */
		.actions {
			grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 4.6em 4.6em;
		}
	}

	/* wide: the controls in a panel on the left, the game beside it, both centred as one */
	.hud:not(.tall) {
		--play-h: 5.8em;
		--play-lip: 0.6em;
		--result-font: 4em;

		/* no head and no frames: the controls stand on the screen itself, beside the game's one
		   surface, as tall as it; the name at their top, the switches and the menu at their foot */
		.body {
			/* as tall as the game, not the screen: the panel's foot lines up with the game's */
			flex: none;
			/* room left over on a tall window is shared above and under */
			margin: auto 0;
			justify-content: center;
			align-items: stretch;
			gap: 3.2em;
		}

		.panel {
			order: -1;
			box-sizing: border-box;
			/* the controls are drawn at 0.72 of the game's unit (WIDE.panel): beside the board they
			   read as too large at its size (user, 2026-11-27) */
			--u: calc(var(--hud-u) * 0.72);
			--ui-font-size: calc(var(--u) * 1.5);
			--ui-button-size: calc(var(--u) * 4.6);

			width: 27em;
			gap: 1.4em;
			padding: 0.6em 0 0;
			font-size: 0.72em;
		}

		.logo {
			margin: 0 0 0.6em;
			font-size: 3.4em;
		}

		.stage {
			align-self: flex-start;
			box-sizing: border-box;
			width: 66em;
			gap: 1.5em;
			padding: 2.2em 3em 2.8em;
			background-color: var(--panel);
		}

		/* the 40 numbers stand apart from the meter and the draw over them and the win table under
		   them (user, 2026-11-27) */
		.board {
			margin: 1.5em 0;
		}

		/* the last results keep their row over the game, also while there are none */
		.recent {
			height: 2.4em;
		}

		.menu-button {
			--ui-button-size: calc(var(--u) * 4.6);

			display: grid;
			color: var(--text);
		}

		/* the panel is narrower than a phone's column: its words are a size smaller */
		.panel {
			--ctl: 0.9;
			--play-h: 5.2em;
		}

		.money {
			--ui-font-size: calc(var(--u) * 1.7);

			margin-top: 0.6em;
		}

		.bet {
			--ui-font-size: calc(var(--u) * 1.6);
		}

		.toggles.foot {
			margin-top: auto;
			padding-top: 2em;
		}

		.toggles.three {
			--ui-button-width: calc(var(--u) * 8.46);

			display: grid;
			grid-template-columns: repeat(3, minmax(0, 1fr));
			gap: 0.8em;
			justify-items: stretch;
		}
	}

	.toggles.one {
		display: flex;
		justify-content: flex-end;
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
		--ui-button-bg: transparent;

		position: absolute;
		z-index: 2;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: calc(var(--ui-font-size) * 9.5);
		padding: calc(var(--u) * 0.8);
		border: 1px solid var(--line);
		background-color: var(--panel);
	}

	@media (prefers-reduced-motion: reduce) {
		.recent span:last-child {
			animation: none;
		}
	}
</style>
