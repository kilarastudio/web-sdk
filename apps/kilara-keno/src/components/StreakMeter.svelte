<script lang="ts">
	import { stateI18nDerived } from 'state-shared';

	import config from '../game/config';
	import { ladderMultiplier, topLevel } from '../game/keno';
	import { getContext } from '../game/context';

	// The multiplier's ladder: one step per meter level (run of hits plus lucky balls). The best level
	// reached is the round's multiplier and is kept: its step is filled in the win colour and never
	// moves down. The run in play is a separate marker under its step, so a miss (which ends the run
	// in Low and High and lowers it by one in Chain and Chain Max) moves the marker, not the
	// multiplier. Level 1 is ×1, nothing to keep, so it stays plain. Only the steps the mode in play
	// can reach are shown: numbers played plus the most lucky numbers a round of it marks. The steps
	// only a lucky round reaches (3 numbers: levels 5 and 6) stand apart, outlined in the win colour,
	// until a lucky round makes them reachable; that round's label takes the meter's own.
	const context = getContext();
	const round = $derived(context.stateGame.round);
	const current = $derived(Math.min(round?.current ?? 0, config.ladder.length));
	const best = $derived(Math.min(round?.best ?? 0, config.ladder.length));
	const multiplier = $derived(ladderMultiplier(round?.best ?? 0));
	const mode = $derived(config.betModes[round?.mode ?? context.stateGameDerived.mode()]);
	const kilauRound = $derived(!!round?.kilauRound);
	const usual = $derived(topLevel(mode.picks, mode.kilau));
	const top = $derived(topLevel(mode.picks, mode.kilauMost));
	const t = stateI18nDerived.translate;
</script>

<div
	class="meter"
	data-test="streak-meter"
	data-current={round?.current ?? 0}
	data-best={round?.best ?? 0}
	data-top={top}
	data-usual={usual}
	data-kilau-round={kilauRound}
>
	<!-- both labels hold the same cell, so the label's width never changes with the round -->
	<span class="label" class:kilau-round={kilauRound}>
		<span class="streak" aria-hidden={kilauRound}>{t('STREAK')}</span>
		<span class="round" data-test="kilau-round" aria-hidden={!kilauRound}>{t('LUCKY ROUND')}</span>
	</span>
	<ol class="steps">
		{#each config.ladder as step, index}
			{@const level = index + 1}
			<li
				class:out={level > top}
				class:kilau-only={level > usual && level <= top && !kilauRound}
				class:reached={level <= best}
				class:current={level === current}
				class:best={level === best && multiplier > 1}
			>
				×{step}
			</li>
		{/each}
	</ol>
	<span class="total" class:up={multiplier > 1}>×{multiplier}</span>
</div>

<style lang="scss">
	.meter {
		display: flex;
		align-items: center;
		gap: 0.6em;
		height: 100%;
	}

	.label {
		flex: none;
		display: grid;
		align-items: center;
		height: 100%;
		color: var(--keno-muted);
		font-size: 0.9em;
		font-weight: 700;
		letter-spacing: 0.1em;

		> * {
			grid-area: 1 / 1;
		}

		/* two short lines, about as wide as STREAK */
		.round {
			width: min-content;
			color: var(--keno-win);
			line-height: 1.05;
			visibility: hidden;
		}

		&.kilau-round {
			.streak {
				visibility: hidden;
			}

			.round {
				visibility: visible;
			}
		}
	}

	.steps {
		flex: 1;
		display: grid;
		grid-template-columns: repeat(7, minmax(0, 1fr));
		gap: 0.25em;
		height: 100%;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		position: relative;
		display: grid;
		place-items: center;
		background-color: var(--keno-tile);
		color: var(--keno-muted);
		font-size: 1.05em;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		transition:
			background-color 0.15s,
			color 0.15s;

		/* a step this mode cannot reach keeps its place, empty */
		&.out {
			visibility: hidden;
		}

		/* a step only a lucky round reaches: outlined in the win colour, not yet a step to fill */
		&.kilau-only {
			background-color: transparent;
			box-shadow: inset 0 0 0 0.1em var(--keno-win);
			color: var(--keno-win);
			opacity: 0.55;
		}

		&.reached {
			background-color: var(--keno-tile-hover);
			color: var(--keno-text);
		}

		/* the best level reached: the multiplier the round keeps */
		&.best {
			background-color: var(--keno-win);
			color: var(--keno-dark);
		}

		/* the run in play: a bar under its step */
		&.current::after {
			content: '';
			position: absolute;
			left: 0;
			right: 0;
			bottom: 0;
			height: 0.28em;
			background-color: var(--keno-text);
		}

		&.current.best::after {
			background-color: var(--keno-dark);
		}
	}

	.total {
		flex: none;
		min-width: 2.6em;
		color: var(--keno-muted);
		font-size: 1.35em;
		font-weight: 800;
		font-variant-numeric: tabular-nums;
		text-align: right;

		&.up {
			color: var(--keno-win);
		}
	}
</style>
