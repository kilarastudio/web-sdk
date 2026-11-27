<script lang="ts">
	import { stateI18nDerived, stateUrlDerived } from 'state-shared';

	import { getContext } from '../game/context';

	// Beside the amount in the burst HUD: quick pick fills the slots left at random, clear frees
	// them all, LUCKY names the player's own lucky number (AUTO: the game places it). LUCKY stays
	// off in a replay and a resumed round: they show the book's own board.
	type Props = { disabled: boolean; tall: boolean };

	const props: Props = $props();
	const context = getContext();
	const t = stateI18nDerived.translate;
	const press = () => context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
	const kilauPick = $derived(context.stateGame.kilauPick);
	const choosing = $derived(context.stateGame.choosingKilau);
	const kilauOff = $derived(
		props.disabled || stateUrlDerived.replay() || context.stateGame.resuming,
	);
</script>

<div class="actions" class:tall={props.tall}>
	<button
		type="button"
		data-test="quick-pick"
		disabled={props.disabled}
		onclick={() => {
			press();
			context.stateGameDerived.quick();
		}}
	>
		{t('QUICK PICK')}
	</button>
	<button
		type="button"
		data-test="clear"
		disabled={props.disabled || context.stateGame.picked.length === 0}
		onclick={() => {
			press();
			context.stateGameDerived.clear();
		}}
	>
		{t('CLEAR')}
	</button>
	<button
		type="button"
		class="kilau"
		class:choosing={choosing && !kilauOff}
		class:set={kilauPick !== null}
		data-test="kilau"
		data-kilau={kilauPick ?? 'auto'}
		aria-pressed={choosing && !kilauOff}
		disabled={kilauOff}
		onclick={() => {
			press();
			context.stateGameDerived.kilau();
		}}
	>
		<span>{t('LUCKY')}</span>
		<span class="state">{kilauPick ?? t('AUTO')}</span>
	</button>
</div>

<style lang="scss">
	.actions {
		display: grid;
		/* in the panel: QUICK PICK keeps its whole word and padding, the other two share the rest */
		grid-template-columns: max-content minmax(0, 1fr) minmax(0, 1fr);
		gap: 0.5em;
		height: 4.4em;

		/* beside the amount: each as wide as its word, the amount takes the rest */
		&.tall {
			grid-template-columns: repeat(3, auto);
		}
	}

	button {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-width: 0;
		height: 100%;
		padding: 0 0.9em;
		border: none;
		background-color: var(--keno-tile);
		color: var(--keno-text);
		font-family: inherit;
		font-size: 0.95em;
		font-weight: 700;
		letter-spacing: 0.04em;
		line-height: 1.1;
		white-space: nowrap;
		cursor: pointer;
		transition:
			background-color 0.12s,
			color 0.12s;

		@media (hover: hover) {
			&:hover:not(:disabled):not(.chosen) {
				background-color: var(--keno-tile-hover);
			}
		}

		&:active:not(:disabled) > * {
			transform: translateY(1px);
		}

		&:focus-visible {
			outline: 2px solid var(--keno-text);
			outline-offset: 2px;
		}

		&:disabled {
			color: var(--keno-disabled);
			cursor: default;
		}

		&.chosen {
			background-color: var(--keno-text);
			color: var(--keno-dark);
		}

		/* Chain is armed, not just chosen: the HUD's colour for something switched on */
		&.chosen.chain {
			background-color: var(--keno-armed);
		}
	}

	/* LUCKY and its state under it; the win colour, the only colour a lucky number has, once a number is
	   named, and as a frame (like a lucky number tile's) while one is being chosen */
	.kilau .state {
		color: var(--keno-muted);
		font-size: 0.8em;
		font-variant-numeric: tabular-nums;
	}

	.kilau.set .state {
		color: var(--keno-win);
	}

	.kilau.choosing {
		box-shadow: inset 0 0 0 0.14em var(--keno-win);
	}

	.kilau:disabled .state {
		color: inherit;
	}
</style>
