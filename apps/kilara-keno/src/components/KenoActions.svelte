<script lang="ts">
	import { stateI18nDerived } from 'state-shared';

	import { getContext } from '../game/context';

	// Beside the amount in the burst HUD: quick pick fills the slots left at random, clear frees
	// them all.
	type Props = { disabled: boolean };

	const props: Props = $props();
	const context = getContext();
	const t = stateI18nDerived.translate;
	const press = () => context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
</script>

<div class="actions">
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
</div>

<style lang="scss">
	.actions {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5em;
		height: 4.4em;
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
</style>
