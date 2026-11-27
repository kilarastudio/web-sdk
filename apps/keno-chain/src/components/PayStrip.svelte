<script lang="ts">
	import { stateBet, stateI18nDerived, stateUrlDerived } from 'state-shared';

	import config from '../game/config';
	import { LEVEL_LABELS } from '../game/betModeMeta';
	import { isPremium, levelPicks, parseMode, type ModeName } from '../game/keno';
	import { getContext } from '../game/context';

	// What each number of hits wins in the mode in play, in multiples of the base bet before the
	// multiplier; the cell of the hits so far is lit as the draw goes, and turns to the win colour
	// when the round wins its cost or more. Until the level can play the numbers picked, the row is
	// the line that says what is missing; a press that did nothing shakes it.
	const context = getContext();
	const t = stateI18nDerived.translate;
	const replay = stateUrlDerived.replay();

	const round = $derived(context.stateGame.round);
	const level = $derived(context.stateGameDerived.level());
	const mode = $derived.by((): ModeName | null => {
		if (round) return round.mode;
		// a replay has no numbers of the player's: it shows its own mode's row
		if (replay)
			return (
				(parseMode(stateBet.activeBetModeKey) &&
					(stateBet.activeBetModeKey.toLowerCase() as ModeName)) ||
				null
			);
		return context.stateGameDerived.ready() ? context.stateGameDerived.mode() : null;
	});
	const table = $derived(mode ? (config.betModes[mode].payTable as readonly number[]) : null);
	const hits = $derived(round ? round.hits : -1);
	const paid = $derived(!!round?.done && (context.stateGame.win?.ratio ?? 0) >= 1);

	const hint = $derived.by(() => {
		const sizes = levelPicks(level);
		const min = sizes[0];
		const max = sizes[sizes.length - 1];
		const missing = context.stateGameDerived.missing();
		const name = LEVEL_LABELS[level];
		if (replay) return t('Replay: the round is shown with its own numbers');
		// Calm, Bold and Wild play the same sizes, with gaps: the line lists them, and with some
		// numbers picked it says how many more reach the next size (7 picked: 1 more)
		const plays =
			min === max
				? t('{level} plays {max} numbers', { level: name, max })
				: t('Pick {sizes} or {max} numbers', { sizes: sizes.slice(0, -1).join(', '), max });
		const picked = context.stateGameDerived.count();
		return picked === 0 || (isPremium(level) && missing === min)
			? plays
			: `${plays}: ${t('pick {count} more', { count: missing })}`;
	});

	// a press that did nothing: the row shakes once
	let shaking = $state(false);
	let seen = context.stateGame.nudges;
	$effect(() => {
		if (context.stateGame.nudges === seen) return;
		seen = context.stateGame.nudges;
		shaking = true;
		const timer = setTimeout(() => (shaking = false), 300);
		return () => clearTimeout(timer);
	});

	// thousands as K, so the top prizes fit their cell: 2K×
	const times = (value: number) =>
		value >= 1000
			? `${stateI18nDerived.number(value / 1000, { maximumFractionDigits: 1 })}K×`
			: stateI18nDerived.times(value);
</script>

<div class="row" class:nudge={shaking}>
	{#if table}
		<div class="pays" data-test="pay-strip">
			{#each table as value, count}
				{#if value > 0}
					<div
						class:at={count === hits && !paid}
						class:paid={count === hits && paid}
						data-hits={count}
					>
						<b>{times(value)}</b>
						<span>{count}<i></i></span>
					</div>
				{/if}
			{/each}
		</div>
	{:else}
		<p class="hint" data-test="hint" aria-live="polite">{hint}</p>
	{/if}
</div>

<style lang="scss">
	.pays {
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: minmax(0, 1fr);
		gap: 2px;
		height: 4.5em;

		div {
			display: grid;
			grid-template-rows: 2.5em 2em;
			overflow: hidden;
			background-color: var(--field);
			text-align: center;
			transition: background-color 0.12s;
		}

		/* lengths in the HUD's unit: the value's own text is 1.3 of it, the count's 1.15 */
		b {
			font-size: 1.3em;
			font-weight: 600;
			line-height: calc(2.5em / 1.3);
			white-space: nowrap;
			font-variant-numeric: tabular-nums;
		}

		span {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 0.26em;
			background-color: rgba(0, 0, 0, 0.2);
			color: var(--muted);
			font-size: 1.15em;
			font-weight: 600;
			font-variant-numeric: tabular-nums;
		}

		span i {
			width: 0.52em;
			height: 0.52em;
			background-color: var(--faint);
		}

		div.at {
			background-color: var(--hit-lit);

			span {
				color: var(--text);
			}

			span i {
				background-color: var(--hit);
			}
		}

		div.paid {
			background-color: var(--gold);
			color: var(--gold-ink);

			span {
				color: var(--gold-ink);
			}

			span i {
				background-color: var(--gold-ink);
			}
		}
	}

	.hint {
		display: grid;
		place-items: center;
		height: calc(4.5em / 1.4);
		margin: 0;
		padding: 0 0.7em;
		background-color: var(--field);
		color: var(--muted);
		font-size: 1.4em;
		font-weight: 500;
		line-height: 1.2;
		text-align: center;
	}

	.nudge .hint {
		color: var(--text);
	}

	.nudge {
		animation: nudge 0.28s ease-in-out;
	}

	@keyframes nudge {
		30% {
			transform: translateX(-4px);
		}
		65% {
			transform: translateX(4px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.nudge {
			animation: none;
		}
	}
</style>
