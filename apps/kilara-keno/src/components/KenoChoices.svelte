<script lang="ts">
	import { stateBet, stateI18nDerived } from 'state-shared';
	import { numberToCurrencyString } from 'utils-shared/amount';

	import config from '../game/config';
	import { LEVEL_NAMES } from '../game/betModeMeta';
	import { isPremium, type Level, type Picks } from '../game/keno';
	import { getContext } from '../game/context';

	// The choices before a round, in the burst HUD's place for them: how many numbers and which
	// level. Chain and Chain Max show what they cost at the current bet and play 10 numbers;
	// choosing one opens the confirmation.
	type Props = { disabled: boolean; stacked: boolean };

	const props: Props = $props();
	const context = getContext();
	const t = stateI18nDerived.translate;
	const level = $derived(context.stateGameDerived.level());
	const picks = $derived(context.stateGameDerived.picks());
	const press = () => context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
</script>

{#snippet picksGroup()}
	<div class="group picks" role="group" aria-label={t('NUMBERS')}>
		<span class="label">{t('NUMBERS')}</span>
		<div class="options">
			{#each config.pickSizes as size}
				<button
					type="button"
					class:chosen={size === picks}
					aria-pressed={size === picks}
					data-test="picks-{size}"
					disabled={props.disabled}
					onclick={() => {
						press();
						context.stateGameDerived.setPicks(size as Picks);
					}}
				>
					{size}
				</button>
			{/each}
		</div>
	</div>
{/snippet}

{#snippet levelsGroup()}
	<div class="group levels" role="group" aria-label={t('LEVEL')}>
		<span class="label">{t('LEVEL')}</span>
		<div class="options">
			{#each config.levels as option}
				{@const cost = config.levelCost[option]}
				<button
					type="button"
					class:chosen={option === level}
					class:chain={isPremium(option as Level)}
					aria-pressed={option === level}
					data-test="level-{option}"
					disabled={props.disabled}
					onclick={() => {
						press();
						context.stateGameDerived.setLevel(option as Level);
					}}
				>
					<span class="name">{LEVEL_NAMES[option as Level]}</span>
					<span class="cost">
						{stateI18nDerived.times(cost)}{#if cost > 1}&nbsp;· {numberToCurrencyString(
								stateBet.betAmount * cost,
							)}{/if}
					</span>
				</button>
			{/each}
		</div>
	</div>
{/snippet}

<!--
	The order follows Stake's Keno, where the level stands after the amount and the picking tools
	stand together. Beside the game (stacked): level, then numbers, with quick pick under it. Under
	the game: numbers straight after quick pick, then level.
-->
<div class="choices" class:stacked={props.stacked}>
	{#if props.stacked}
		{@render levelsGroup()}
		{@render picksGroup()}
	{:else}
		{@render picksGroup()}
		{@render levelsGroup()}
	{/if}
</div>

<style lang="scss">
	.choices {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
	}

	.group {
		display: flex;
		align-items: center;
		gap: 0.5em;
		min-width: 0;
	}

	.label {
		flex: none;
		width: 6em;
		color: var(--keno-muted);
		font-size: 0.8em;
		font-weight: 700;
		letter-spacing: 0.1em;
	}

	.options {
		flex: 1;
		display: grid;
		grid-auto-columns: minmax(0, 1fr);
		grid-auto-flow: column;
		gap: 0.3em;
		min-width: 0;
	}

	button {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-width: 0;
		height: 3.8em;
		padding: 0 0.3em;
		border: none;
		background-color: var(--keno-tile);
		color: var(--keno-text);
		font-family: inherit;
		font-size: 1em;
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

	.name {
		font-size: 1em;
	}

	.cost {
		overflow: hidden;
		max-width: 100%;
		font-size: 0.72em;
		font-weight: 600;
		opacity: 0.75;
		text-overflow: ellipsis;
	}

	/* in the panel beside the game on wide screens: every group's label above its options */
	.stacked {
		gap: 1em;

		.group {
			flex-direction: column;
			align-items: stretch;
		}

		.label {
			width: auto;
		}

		.levels .options {
			grid-auto-flow: row;
			grid-template-columns: 1fr 1fr;
		}
	}
</style>
