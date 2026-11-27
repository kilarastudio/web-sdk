<script lang="ts">
	import { stateBet, stateConfig, stateI18nDerived, stateModal } from 'state-shared';
	import { numberToCurrencyString } from 'utils-shared/amount';

	import config from '../game/config';
	import { LEVEL_LABELS } from '../game/betModeMeta';
	import { isPremium, type Level } from '../game/keno';
	import { getContext } from '../game/context';

	// Two choices side by side, as players of Stake's Keno know them. Risk: a select with the
	// volatility levels of the 1× game (Calm, Bold, Wild). The bonus button: Chain and Chain Max are
	// modes that cost more than the bet, so they live in the shell's bonus scene, which lists each
	// with its cost, return and top prize and arms it through a confirmation. While one is armed the
	// button is filled, names it with its cost, and a press switches it off.
	type Props = { disabled: boolean };

	const props: Props = $props();
	const context = getContext();
	const t = stateI18nDerived.translate;
	const level = $derived(context.stateGameDerived.level());
	const armed = $derived(isPremium(level));
	// the risk in play, or the one the game goes back to when the bonus mode is switched off
	const risk = $derived(armed ? context.stateGame.lastLevel : level);
	const risks = config.levels.filter((option) => !isPremium(option as Level));
	const bonusDisabled = $derived(props.disabled || stateConfig.jurisdiction.disabledBuyFeature);
	const press = () => context.eventEmitter.broadcast({ type: 'soundPressGeneral' });

	const pressBonus = () => {
		press();
		// "BASE" is the shell's own off: the game turns it into the last risk level
		if (armed) stateBet.activeBetModeKey = 'BASE';
		else stateModal.modal = { name: 'buyBonus' };
	};
</script>

<div class="choices">
	<label class="risk" class:disabled={props.disabled} class:aside={armed}>
		<span class="name">{t('Risk')}</span>
		<span class="value">{LEVEL_LABELS[risk]}</span>
		<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9.5l6 6 6-6" /></svg>
		<select
			data-test="risk"
			disabled={props.disabled}
			value={risk}
			onchange={(event) => {
				press();
				context.stateGameDerived.setLevel(event.currentTarget.value as Level);
			}}
		>
			{#each risks as option}
				<option value={option}>{LEVEL_LABELS[option as Level]}</option>
			{/each}
		</select>
	</label>

	<button
		type="button"
		class="bonus"
		class:armed
		aria-pressed={armed}
		data-test="bonus"
		disabled={bonusDisabled}
		onclick={pressBonus}
	>
		{#if armed}
			<span class="lines">
				<span class="name">{LEVEL_LABELS[level]}</span>
				<span class="value">
					{numberToCurrencyString(stateBet.betAmount * config.levelCost[level])}
				</span>
			</span>
			<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
		{:else}
			<span class="mode">{t('Bonus')}</span>
		{/if}
	</button>
</div>

<style lang="scss">
	.choices {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.8em;
	}

	/* the field shows the choice; the select itself lies over it, unseen, and takes the press */
	.risk {
		position: relative;
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		grid-template-rows: auto auto;
		align-content: center;
		align-items: center;
		column-gap: 0.6em;
		height: 4.4em;
		padding: 0 1.2em;
		background-color: var(--field);
		transition:
			background-color 0.12s,
			opacity 0.15s;

		@media (hover: hover) {
			&:not(.disabled):hover {
				background-color: var(--field-hover);
			}
		}

		&:focus-within {
			outline: 2px solid var(--text);
			outline-offset: 2px;
		}

		&.disabled {
			opacity: 0.45;
		}

		/* a bonus mode is armed: the risk waits until it is switched off */
		&.aside .value {
			color: var(--muted);
		}

		.name {
			color: var(--muted);
			font-size: calc(1.05em * var(--ctl, 1));
			font-weight: 600;
			letter-spacing: 0.08em;
			line-height: 1.2;
			text-transform: uppercase;
		}

		.value {
			grid-row: 2;
			font-size: calc(1.6em * var(--ctl, 1));
			font-weight: 600;
			line-height: 1.2;
		}

		svg {
			grid-column: 2;
			grid-row: 1 / 3;
			width: 1.8em;
			height: 1.8em;
			fill: none;
			stroke: var(--muted);
			stroke-width: 2.2;
			stroke-linecap: round;
			stroke-linejoin: round;
		}

		select {
			position: absolute;
			inset: 0;
			width: 100%;
			height: 100%;
			margin: 0;
			border: none;
			opacity: 0;
			font-family: inherit;
			/* 16px keeps iOS from zooming the page when the list opens */
			font-size: 16px;
			cursor: pointer;

			&:disabled {
				cursor: default;
			}
		}
	}

	.bonus {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5em;
		min-width: 0;
		height: 4.4em;
		padding: 0 1em;
		border: none;
		background-color: var(--field);
		box-shadow: inset 0 0 0 2px var(--gold-dim);
		color: var(--gold);
		font-family: inherit;
		font-size: 1em;
		line-height: 1.15;
		white-space: nowrap;
		cursor: pointer;
		transition:
			background-color 0.12s,
			color 0.12s,
			opacity 0.15s;

		.mode {
			font-size: calc(1.5em * var(--ctl, 1));
			font-weight: 600;
		}

		/* armed: laid out like the risk field beside it, name over value on the left, the cross
		   where the risk's arrow stands */
		.lines {
			display: grid;
			min-width: 0;
			text-align: left;

			/* a long name (UNBROKEN CHAIN) keeps clear of the cross */
			.name {
				letter-spacing: 0.04em;
			}
		}

		.name {
			font-size: calc(1.05em * var(--ctl, 1));
			font-weight: 600;
			letter-spacing: 0.08em;
			line-height: 1.2;
			text-transform: uppercase;
		}

		.value {
			font-size: calc(1.6em * var(--ctl, 1));
			font-weight: 600;
			line-height: 1.2;
			font-variant-numeric: tabular-nums;
		}

		svg {
			flex: none;
			width: 1.5em;
			height: 1.5em;
			fill: none;
			stroke: currentColor;
			stroke-width: 2.2;
			stroke-linecap: round;
			stroke-linejoin: round;
		}

		@media (hover: hover) {
			&:not(:disabled):not(.armed):hover {
				background-color: var(--field-hover);
			}
		}

		&:active:not(:disabled) > * {
			transform: translateY(1px);
		}

		&:focus-visible {
			outline: 2px solid var(--text);
			outline-offset: 2px;
		}

		&:disabled {
			opacity: 0.45;
			cursor: default;
		}

		&.armed {
			justify-content: space-between;
			padding: 0 1.2em;
			background-color: var(--gold);
			box-shadow: none;
			color: var(--gold-ink);
		}
	}
</style>
