<script lang="ts">
	import { stateI18nDerived } from 'state-shared';

	import config from '../game/config';
	import { ladderMultiplier, topLevel } from '../game/keno';
	import { getContext } from '../game/context';

	// The multiplier the round has earned: a staircase of blocks, one hue, lighter with every step.
	// The level is the best run of hits plus the lucky balls drawn; it is kept, a miss never lowers
	// it. Steps the numbers in play cannot reach step back. The steps only a lucky round reaches
	// (3 numbers: levels 5 and 6) are outlined until a lucky round makes them reachable; that
	// round's label takes the meter's own.
	const context = getContext();
	const round = $derived(context.stateGame.round);
	const best = $derived(Math.min(round?.best ?? 0, config.ladder.length));
	const multiplier = $derived(ladderMultiplier(round?.best ?? 0));
	const mode = $derived(config.betModes[round?.mode ?? context.stateGameDerived.mode()]);
	const kilauRound = $derived(!!round?.kilauRound);
	const usual = $derived(topLevel(mode.picks, mode.kilau));
	const top = $derived(topLevel(mode.picks, mode.kilauMost));
	const t = stateI18nDerived.translate;

	const GOLD = ['#5f4a12', '#7d6014', '#9c7917', '#bb921c', '#d9aa24', '#f0bc30', '#ffc93c'];
</script>

<div
	class="meter"
	data-test="streak-meter"
	data-best={round?.best ?? 0}
	data-top={top}
	data-usual={usual}
	data-kilau-round={kilauRound}
>
	<!-- both labels hold the same cell, so the label's width never changes with the round -->
	<span class="cap" class:kilau-round={kilauRound}>
		<span class="streak" aria-hidden={kilauRound}>{t('STREAK')}</span>
		<span class="round" data-test="kilau-round" aria-hidden={!kilauRound}>{t('LUCKY ROUND')}</span>
	</span>
	<ol class="ladder">
		{#each config.ladder as step, index}
			{@const level = index + 1}
			<li
				class:out={level > top}
				class:kilau-only={level > usual && level <= top && !kilauRound}
				class:on={level <= best}
				class:bump={level === best && multiplier > 1}
				style:--i={index}
				style:--g={GOLD[index]}
				style:--gi={index < 3 ? '#ffe9a8' : '#2e2100'}
			>
				×{step}
			</li>
		{/each}
	</ol>
	{#key multiplier}
		<span class="total" class:up={multiplier > 1} data-test="multiplier">×{multiplier}</span>
	{/key}
</div>

<style lang="scss">
	.meter {
		display: flex;
		align-items: flex-end;
		gap: 0.8em;
	}

	.cap {
		flex: none;
		display: grid;
		align-items: end;
		color: var(--muted);
		font-size: 1.15em;
		font-weight: 600;
		letter-spacing: 0.08em;
		line-height: 1.65;
		text-transform: uppercase;

		> * {
			grid-area: 1 / 1;
		}

		/* two short lines, about as wide as the label it replaces */
		.round {
			width: min-content;
			color: var(--gold);
			line-height: 1.1;
			padding-bottom: 0.25em;
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

	.ladder {
		flex: 1;
		display: grid;
		grid-template-columns: repeat(7, minmax(0, 1fr));
		gap: 2px;
		align-items: end;
		min-width: 0;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	/* lengths in the HUD's unit: a step's own text is 1.3 of it */
	li {
		display: flex;
		align-items: flex-end;
		justify-content: center;
		height: calc((1.9em + 0.4em * var(--i)) / 1.3);
		background-color: var(--field);
		color: var(--muted);
		font-size: 1.3em;
		font-weight: 600;
		line-height: calc(1.9em / 1.3);
		font-variant-numeric: tabular-nums;
		transition: opacity 0.2s;

		/* a step this mode cannot reach */
		&.out {
			opacity: 0.28;
		}

		/* a step only a lucky round reaches: outlined in the win colour, not yet a step to fill */
		&.kilau-only {
			background-color: transparent;
			box-shadow: inset 0 0 0 1px var(--gold-dim);
			color: var(--gold-muted);
		}

		&.on {
			background-color: var(--g);
			color: var(--gi);
		}

		&.bump {
			animation: step-up 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) both;
		}
	}

	@keyframes step-up {
		from {
			transform: translateY(-4px);
		}
	}

	.total {
		flex: none;
		min-width: 1.84em;
		color: var(--faint);
		font-size: 2.5em;
		font-weight: 700;
		line-height: 1;
		text-align: right;
		font-variant-numeric: tabular-nums;

		&.up {
			color: var(--gold);
			animation: step-up 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) both;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		li.bump,
		.total.up {
			animation-duration: 0.01s;
		}
	}
</style>
