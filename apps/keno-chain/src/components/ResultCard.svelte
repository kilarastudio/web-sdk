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

	// The round's result, in the middle of the board: a dark card with what was hit and the amount
	// counting up. Only a round that wins shows it. A win of the round's cost or more is green and
	// counts with a sound, ten times the cost or more is in the win colour; a win below the cost is
	// shown, not celebrated: no count, no sound. The card stays until the next round or the next
	// change of the numbers; a press finishes the count.
	const context = getContext();
	const t = stateI18nDerived.translate;

	const HOLD = 350;
	const BIG = 10;

	const round = $derived(context.stateGame.round);
	const win = $derived(context.stateGame.win);
	// a press finishes the count
	let finish = () => {};

	const countUp = (amount: number, duration: number) =>
		new Promise<void>((resolve) => {
			const start = performance.now();
			let done = false;
			const end = () => {
				if (done) return;
				done = true;
				if (context.stateGame.win) context.stateGame.win.shown = amount;
				resolve();
			};
			finish = end;
			const step = (now: number) => {
				if (done) return;
				const k = Math.min(1, Math.max(0, (now - start) / duration));
				if (!context.stateGame.win || k >= 1) return end();
				context.stateGame.win.shown = amount * (1 - Math.pow(1 - k, 3));
				requestAnimationFrame(step);
			};
			requestAnimationFrame(step);
			// a hidden tab runs no frames: the count still ends
			waitForTimeout(duration + 100).then(end);
		});

	context.eventEmitter.subscribeOnMount({
		winPresent: async ({ amount, ratio, max }) => {
			const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
			const celebrated = ratio >= 1;
			context.stateGame.win = { shown: celebrated && !calm ? 0 : amount, amount, ratio, max };
			if (celebrated) {
				sound.win(ratio >= BIG ? 3 : ratio >= 3 ? 2 : 1);
				if (!calm) await countUp(amount, Math.min(1800, 500 + Math.log10(ratio + 1) * 520));
			}
			finish = () => {};
			await waitForTimeout(context.stateGame.skip ? 0 : HOLD);
		},
	});
</script>

{#if win && round?.done}
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<div
		class="result"
		class:win={win.ratio >= 1 && win.ratio < BIG}
		class:big={win.ratio >= BIG}
		data-test="win-overlay"
		onclick={() => finish()}
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
		cursor: pointer;
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
