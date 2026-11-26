<script lang="ts">
	import { stateBet, stateI18nDerived, stateModal, stateUrlDerived } from 'state-shared';
	import { UiBurst } from 'components-ui-html';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';

	import { LEVEL_NAMES } from '../game/betModeMeta';
	import { getContext } from '../game/context';
	import { ladderMultiplier } from '../game/keno';
	import KenoBoard from './KenoBoard.svelte';
	import KenoChoices from './KenoChoices.svelte';
	import KenoActions from './KenoActions.svelte';
	import StreakMeter from './StreakMeter.svelte';
	import DrawTray from './DrawTray.svelte';
	import PayStrip from './PayStrip.svelte';
	import WinOverlay from './WinOverlay.svelte';

	// Grey box: the game is HTML inside the burst HUD (UiBurst), which sizes everything in one unit
	// so the screen fits without scrolling: streak meter, draw tray, board (8 × 5), status line and
	// win strip here; the choices and the quick actions go to the HUD's own places for them.
	const context = getContext();
	const t = stateI18nDerived.translate;
	const replay = stateUrlDerived.replay();

	const idle = $derived(context.stateXstateDerived.isIdle());
	const editable = $derived(idle && !replay);
	const picks = $derived(context.stateGameDerived.picks());
	const ready = $derived(context.stateGameDerived.ready());
	const round = $derived(context.stateGame.round);

	const status = $derived.by(() => {
		if (context.stateGame.notice) return context.stateGame.notice;
		if (round) {
			if (!round.done) return t('DRAWING');
			const win = stateBet.winBookEventAmount;
			const multiplier = ladderMultiplier(round.best);
			const hits = t('{hits} OF {picks} HIT', { hits: round.hits, picks: round.selected.length });
			if (win > 0) {
				return `${hits} · ×${multiplier} · ${t('WIN')} ${bookEventAmountToCurrencyString(win)}`;
			}
			return `${hits} · ${t('NO WIN')}`;
		}
		if (replay) return t('REPLAY: THE ROUND IS SHOWN WITH ITS OWN NUMBERS');
		const missing = picks - context.stateGame.picked.length;
		if (missing === picks) return t('PICK {count} NUMBERS', { count: picks });
		if (missing > 0) return t('PICK {count} MORE', { count: missing });
		return t('READY: {count} NUMBERS, {level}', {
			count: picks,
			level: LEVEL_NAMES[context.stateGameDerived.level()],
		});
	});

	// the shell's "BASE" (before the first choice, or Chain switched off from the HUD) becomes a
	// mode the RGS plays
	$effect(() => {
		void stateBet.activeBetModeKey;
		context.stateGameDerived.settleMode();
	});

	$effect(() => {
		void stateModal.modal;
		context.stateGameDerived.settleChainConfirm();
	});

	// a notice stays for a moment, then the status line goes back to what it says by itself
	$effect(() => {
		if (!context.stateGame.noticeId) return;
		const id = context.stateGame.noticeId;
		const timer = setTimeout(() => {
			if (context.stateGame.noticeId === id) context.stateGame.notice = '';
		}, 2600);
		return () => clearTimeout(timer);
	});
</script>

<UiBurst ready={ready || !idle}>
	{#snippet gameName()}KILARA KENO{/snippet}

	{#snippet game({ tall })}
		<div class="keno" class:tall>
			<div class="meter"><StreakMeter /></div>
			<div class="tray"><DrawTray /></div>
			<div class="board">
				<KenoBoard columns={8} {editable} />
				<WinOverlay />
			</div>
			<p
				class="status"
				class:notice={!!context.stateGame.notice}
				data-test="status"
				aria-live="polite"
			>
				{status}
			</p>
			<div class="pays"><PayStrip /></div>
		</div>
	{/snippet}

	{#snippet choices({ tall, disabled })}
		<div class="keno-vars"><KenoChoices {disabled} stacked={!tall} /></div>
	{/snippet}

	{#snippet actions({ disabled })}
		<div class="keno-vars"><KenoActions {disabled} /></div>
	{/snippet}
</UiBurst>

<style lang="scss">
	.keno,
	.keno-vars {
		--keno-tile: #23262c;
		--keno-tile-hover: #31353d;
		--keno-ball: #4b515c;
		--keno-text: #f3f4f6;
		--keno-muted: #8a92a0;
		--keno-disabled: rgba(138, 146, 160, 0.5);
		--keno-dark: #0e1014;
		--keno-win: #ffc53d;
		--keno-armed: #7ab8ff;
		/* the tiles keep the meanings players know from Stake's Keno: violet is picked, green is a
		   hit, a drawn tile that was not picked sinks dark; gold stays for wins */
		--keno-pick: #9b87ff;
		--keno-hit: #62e08a;
		--keno-sunk: #0e1014;
	}

	.keno-vars {
		display: contents;
	}

	/* wide: its own width beside the HUD's panel; tall: the HUD's column */
	.keno {
		--tile-height: 5.6em;
		--tile-gap: 0.4em;
		--tile-font: 2.1em;

		display: grid;
		grid-template-columns: 60em;
		grid-template-rows: 2.8em 2.6em auto 1.8em 3.4em;
		row-gap: 0.7em;
		color: var(--keno-text);
	}

	.keno.tall {
		--tile-height: 4.5em;
		--tile-gap: 0.35em;
		--tile-font: 1.7em;

		grid-template-columns: 100%;
		grid-template-rows: 2.6em 2.4em auto 1.8em 3.4em;
	}

	.board {
		position: relative;
	}

	.status {
		margin: 0;
		overflow: hidden;
		color: var(--keno-muted);
		font-size: 0.95em;
		font-weight: 700;
		letter-spacing: 0.06em;
		line-height: 1.9;
		text-align: center;
		text-overflow: ellipsis;
		white-space: nowrap;

		&.notice {
			color: var(--keno-text);
		}
	}
</style>
