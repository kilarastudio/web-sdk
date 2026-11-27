<script lang="ts" module>
	// amount: hundredths of the base bet; ratio: the win against what the round cost
	export type EmitterEventWin = { type: 'winPresent'; amount: number; ratio: number; max: boolean };
</script>

<script lang="ts">
	import { stateI18nDerived } from 'state-shared';
	import { bookEventAmountToCountUpCurrencyString } from 'utils-shared/amount';
	import { waitForTimeout } from 'utils-shared/wait';

	import { ladderMultiplier } from '../game/keno';
	import { sound } from '../game/sound';
	import { getContext } from '../game/context';

	// The round's result, in the middle of the board: a dark card with what was hit and the amount,
	// shown whole at once. Only a round that wins shows it. A win of the round's cost or more is
	// green and has a sound, ten times the cost or more is in the win colour; a win below the cost
	// is shown without a sound. The card stays until the next round or the next change of the
	// numbers.
	const context = getContext();
	const t = stateI18nDerived.translate;

	const HOLD = 350;
	const BIG = 10;

	const round = $derived(context.stateGame.round);
	const win = $derived(context.stateGame.win);
	context.eventEmitter.subscribeOnMount({
		winPresent: async ({ amount, ratio, max }) => {
			// the whole amount at once: no count (user, 2026-11-27)
			context.stateGame.win = { shown: amount, amount, ratio, max };
			if (ratio >= 1) sound.win(ratio >= BIG ? 3 : ratio >= 3 ? 2 : 1);
			await waitForTimeout(context.stateGame.skip ? 0 : HOLD);
		},
	});
</script>

{#if win && round?.done}
	<div
		class="result"
		class:win={win.ratio >= 1 && win.ratio < BIG}
		class:big={win.ratio >= BIG}
		data-test="win-overlay"
	>
		<small>
			{t('{hits} OF {picks} HIT', {
				hits: round.hits,
				picks: round.selected.length,
			})}{#if ladderMultiplier(round.best) > 1}&nbsp;· {t('STREAK')} ×{ladderMultiplier(
					round.best,
				)}{/if}{#if win.max}&nbsp;· {t('MAX WIN')}{/if}
		</small>
		<b data-test="win-amount">{bookEventAmountToCountUpCurrencyString(win.shown, win.amount)}</b>
	</div>
{/if}

<style lang="scss">
	.result {
		position: absolute;
		z-index: 6;
		left: 50%;
		top: 50%;
		min-width: 46%;
		padding: 1em 1.8em 1.2em;
		border: 2px solid var(--field-hover);
		background-color: rgba(11, 16, 27, 0.96);
		text-align: center;
		transform: translate(-50%, -50%);
		animation: result-in 0.28s cubic-bezier(0.2, 0.8, 0.2, 1) both;

		&.win {
			border-color: var(--hit);

			b {
				color: var(--hit);
			}
		}

		&.big {
			border-color: var(--gold);

			b {
				color: var(--gold);
			}
		}
	}

	small {
		display: block;
		color: var(--muted);
		font-size: 1.15em;
		font-weight: 600;
		letter-spacing: 0.07em;
		text-transform: uppercase;
		white-space: nowrap;
	}

	b {
		display: block;
		font-size: var(--result-font, 3.2em);
		font-weight: 700;
		line-height: 1.15;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	@keyframes result-in {
		from {
			transform: translate(-50%, calc(-50% + 10px)) scale(0.96);
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.result {
			animation-duration: 0.01s;
		}
	}
</style>
