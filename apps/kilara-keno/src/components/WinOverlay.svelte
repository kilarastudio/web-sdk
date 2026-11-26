<script lang="ts" module>
	import type { WinLevel } from '../game/winLevel';

	export type EmitterEventWin = { type: 'winPresent'; amount: number; level: WinLevel };
</script>

<script lang="ts">
	import { Tween } from 'svelte/motion';

	import { stateI18nDerived } from 'state-shared';
	import { bookEventAmountToCountUpCurrencyString, countUpEasing } from 'utils-shared/amount';
	import { waitForTimeout } from 'utils-shared/wait';

	import { getContext } from '../game/context';

	// Grey box: the round's win counts up over the board in Kilau (the win colour). A win below the
	// round's cost is only acknowledged: small, quick, no darkening. A big win darkens the screen
	// and names its level. A press finishes the count, a second press goes on.
	const context = getContext();

	let shown = $state<{ amount: number; level: WinLevel } | null>(null);
	// a press finishes the count, or ends the hold after it (a cancelled tween never settles, so
	// the count's end is resolved here, not by the tween's promise)
	let press = () => {};
	const count = new Tween(0, { easing: countUpEasing });

	const text = $derived(
		shown ? bookEventAmountToCountUpCurrencyString(count.current, shown.amount) : '',
	);

	context.eventEmitter.subscribeOnMount({
		winPresent: async ({ amount, level }) => {
			count.set(0, { duration: 0 });
			shown = { amount, level };
			await new Promise<void>((resolve) => {
				press = () => {
					count.set(amount, { duration: 0 });
					resolve();
				};
				count.set(amount, { duration: level.duration }).then(() => resolve());
			});
			await new Promise<void>((resolve) => {
				press = resolve;
				waitForTimeout(level.big ? 1500 : level.celebrated ? 700 : 300).then(resolve);
			});
			press = () => {};
			shown = null;
		},
	});
</script>

{#if shown}
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<div
		class="win"
		class:big={shown.level.big}
		class:quiet={!shown.level.celebrated}
		data-test="win-overlay"
		onclick={() => press()}
	>
		{#if shown.level.text}
			<span class="name">{stateI18nDerived.translate(shown.level.text)}</span>
		{/if}
		<span class="amount" data-test="win-amount">{text}</span>
	</div>
{/if}

<style lang="scss">
	.win {
		position: absolute;
		inset: 0;
		z-index: 2;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.3em;
		background-color: rgba(14, 16, 20, 0.55);
		cursor: pointer;

		&.quiet {
			background-color: transparent;
			pointer-events: none;
		}

		&.big {
			position: fixed;
			background-color: rgba(14, 16, 20, 0.8);
		}
	}

	.name {
		color: var(--keno-muted);
		font-size: 3.2em;
		font-weight: 800;
		letter-spacing: 0.08em;
	}

	.amount {
		padding: 0.15em 0.5em;
		background-color: rgba(14, 16, 20, 0.85);
		color: var(--keno-win);
		font-size: 4.4em;
		font-weight: 800;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;

		.quiet & {
			font-size: 2.6em;
		}

		.big & {
			font-size: 6em;
		}
	}
</style>
