<script lang="ts">
	import _ from 'lodash';

	import { stateI18nDerived, stateUrlDerived } from 'state-shared';
	import { UiInfoSection } from 'components-ui-html';
	import { fitText } from 'components-ui-html/src/components/fitText';

	import config from '../game/config';
	import { LEVEL_LABELS, LEVEL_NAMES, stakeWord } from '../game/betModeMeta';
	import { isPremium, ladderMultiplier, modeName, type Level, type Picks } from '../game/keno';
	import { getContext } from '../game/context';
	import LadderStairs from './LadderStairs.svelte';

	// The win tables, read from the math's own (config.ts, written by scripts/sync_math_config.py).
	// One level is shown at a time, starting with the one in play: a row per number of hits, a
	// column per count of numbers the level plays, the column of the numbers picked now lit in the
	// pick colour. A level that plays one count only (the bonus modes) shows its values as the
	// game's own pay row does.
	const context = getContext();
	const t = stateI18nDerived.translate;
	const { times } = stateI18nDerived;
	const social = stateUrlDerived.social();
	const amount = stakeWord(social);

	const levels = config.levels as readonly Level[];
	let shown = $state<Level>(context.stateGameDerived.level());
	const picks = $derived(config.levelPicks[shown] as readonly Picks[]);
	const playing = $derived(shown === context.stateGameDerived.level());
	// the column of the numbers picked now, when the level in play is the one shown and plays them
	const mine = $derived(
		playing && context.stateGameDerived.ready() ? context.stateGameDerived.count() : 0,
	);
	const table = (size: Picks) =>
		config.betModes[modeName(shown, size)].payTable as readonly number[];
	const rows = $derived(_.range(Math.max(...picks), 0, -1));
	// what a cell is: no such number of hits, nothing won, less than the round's base, the
	// column's top prize, or any other win
	const kind = (size: Picks, hits: number) => {
		if (hits > size) return 'none';
		const win = table(size)[hits];
		if (win === 0) return 'zero';
		if (win === Math.max(...table(size))) return 'top';
		return win < 1 ? 'low' : 'win';
	};

	const [one, every] = config.kilauRound.share;
	const roundLevels = config.kilauRound.levels
		.map((level) => LEVEL_LABELS[level as Level])
		.join(', ');

	// a worked round, from the first level's own table: every number hit, a run of three
	const sample = config.betModes[modeName(levels[0], 5)];
	const sampleValue = sample.payTable[sample.picks];
	const sampleLevel = 3;

	// The word over the hits column can be longer than the column (ПОПАДАНИЯ, BONS NUMÉROS): the
	// column is then as wide as the word, up to a quarter of the table, and the value columns
	// share what is left; past that quarter the word shrinks to it (fitText on its cell).
	const hitsColumn = (table: HTMLTableElement) => {
		const measure = () => {
			const word = table.querySelector<HTMLElement>('th.hits span');
			if (!word) return;
			// the word's width at full size, whatever it is shrunk to now
			const fit = parseFloat(word.parentElement?.style.getPropertyValue('--ui-fit') ?? '') || 1;
			const column = Math.min(word.offsetWidth / fit + 6, table.clientWidth * 0.24);
			table.style.setProperty('--hits-col', `${column}px`);
		};
		const observer = new ResizeObserver(measure);
		observer.observe(table);
		measure();
		return { destroy: () => observer.disconnect() };
	};
</script>

<!-- a word too long for its box on a narrow sheet (MULTIPLICADOR) shrinks, all three boxes alike -->
<div
	class="formula"
	aria-label={t('Win = value for the hits × multiplier')}
	use:fitText={{ items: 'b, span' }}
>
	<div>
		<b>{t('HITS')}</b>
		<span>{t('value in the win table')}</span>
	</div>
	<i>×</i>
	<div class="gold">
		<b>{t('MULTIPLIER')}</b>
		<span>{t('from the streak')}</span>
	</div>
	<i>=</i>
	<div class="win">
		<b>{t('WIN')}</b>
		<span>{t('× the base {amount}', { amount })}</span>
	</div>
</div>

<section class="levels">
	<!-- on the narrowest phones a bonus mode's name and cost shrink to their tab, every tab alike -->
	<div class="tabs" role="tablist" use:fitText={{ items: '.label' }}>
		{#each levels as level}
			<button
				type="button"
				role="tab"
				class:premium={isPremium(level)}
				aria-selected={shown === level}
				data-level={level}
				onclick={() => (shown = level)}
			>
				<span class="label">
					{LEVEL_NAMES[level]}
					{#if isPremium(level)}<small>{times(config.levelCost[level])}</small>{/if}
				</span>
			</button>
		{/each}
	</div>

	<p class="meta">
		<span>{t('{draws} numbers drawn', { draws: config.levelDraws[shown] })}</span>
		<span>
			{social
				? t('{cost} the play amount', { cost: times(config.levelCost[shown]) })
				: t('costs {cost} the {amount}', { cost: times(config.levelCost[shown]), amount })}
		</span>
		{#if playing}<span class="now">{t('IN PLAY')}</span>{/if}
	</p>

	{#if picks.length > 1}
		<!-- six columns on the narrowest phones: the values shrink to their cells, all alike -->
		<table data-test="pay-table" use:hitsColumn use:fitText={{ items: 'td' }}>
			<thead>
				<tr class="over">
					<td></td>
					<th colspan={picks.length} scope="colgroup">{t('NUMBERS PLAYED')}</th>
				</tr>
				<tr>
					<th scope="col" class="hits" use:fitText><span>{t('HITS')}</span></th>
					{#each picks as size}
						<th scope="col" class="size" class:mine={size === mine}>{size}</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each rows as hits}
					<tr>
						<th scope="row">{hits}</th>
						{#each picks as size}
							{@const cell = kind(size, hits)}
							<td class={cell} class:mine={size === mine}>
								{#if cell === 'zero'}–{:else if cell !== 'none'}{times(table(size)[hits])}{/if}
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
		{#if mine}
			<p class="note">
				<i></i>{t('Your {count} numbers', { count: mine })}
			</p>
		{/if}
	{:else}
		<div class="strip" data-test="pay-table">
			{#each table(picks[0]) as value, hits}
				{#if value > 0}
					<div class:top={hits === picks[0]}>
						<b>{times(value)}</b>
						<span>{t('{hits} hits', { hits })}</span>
					</div>
				{/if}
			{/each}
		</div>
		<p class="note">{t('Plays {count} numbers.', { count: picks[0] })}</p>
	{/if}
</section>

<UiInfoSection title={t('MULTIPLIER')}>
	<LadderStairs />
	<ul>
		<li>
			<strong>{t('Streak level')}</strong>
			{t('= your best run of hits in a row + the lucky balls drawn.')}
		</li>
		<li>
			<strong>{t('Example:')}</strong>
			{t(
				'{level}, {picks} numbers, {picks} hits: the win table gives {value}. With a best run of {run} hits the multiplier is {multiplier}, so the round wins {win}.',
				{
					level: LEVEL_LABELS[levels[0]],
					picks: sample.picks,
					value: times(sampleValue),
					run: sampleLevel,
					multiplier: `×${ladderMultiplier(sampleLevel)}`,
					win: times(sampleValue * ladderMultiplier(sampleLevel)),
				},
			)}
		</li>
		<li>{t('A round with no hit wins nothing.')}</li>
		<li>
			{t(
				'The highest streak level is the numbers played plus the lucky numbers marked, so with few numbers the top streak levels need a lucky round ({one} round in {every} in {levels}).',
				{ one, every, levels: roundLevels },
			)}
		</li>
	</ul>
</UiInfoSection>

<style lang="scss">
	/* the game's own colours: violet is picked, green a hit, gold the multiplier and the wins */
	$pick: #9b87ff;
	$gold: #ffc93c;
	$hit: #3fe082;

	.formula {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr) auto minmax(0, 1fr);
		align-items: stretch;
		gap: 0.5em;
		max-width: 620px;

		div {
			display: flex;
			flex-direction: column;
			justify-content: center;
			gap: 0.1em;
			min-width: 0;
			padding: 0.6em 0.5em;
			background-color: var(--ui-field);
			text-align: center;
		}

		b {
			font-size: calc(0.93em * var(--ui-fit, 1));
			font-weight: 800;
			letter-spacing: 0.08em;
		}

		span {
			color: var(--ui-text-muted);
			font-size: calc(0.8em * var(--ui-fit, 1));
			line-height: 1.25;
		}

		i {
			align-self: center;
			color: var(--ui-text-muted);
			font-size: 1.2em;
			font-style: normal;
			font-weight: 700;
		}

		.gold b {
			color: $gold;
		}

		.win b {
			color: $hit;
		}
	}

	.levels {
		display: flex;
		flex-direction: column;
		gap: 10px;
		min-width: 0;
		container-type: inline-size;
	}

	/* three risks in a row and the two bonus modes under them; one row where there is room */
	.tabs {
		display: grid;
		grid-template-columns: repeat(6, minmax(0, 1fr));
		gap: 2px;

		@container (min-width: 640px) {
			grid-template-columns: repeat(3, minmax(0, 1fr)) repeat(2, minmax(0, 1.7fr));
		}
	}

	button {
		grid-column: span 2;
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 0;
		height: 44px;
		padding: 0 0.4em;
		border: none;
		background-color: var(--ui-field);
		color: var(--ui-text-muted);
		font: inherit;
		font-size: 0.87em;
		font-weight: 700;
		letter-spacing: 0.06em;
		white-space: nowrap;
		cursor: pointer;
		transition:
			background-color 0.12s,
			color 0.12s;

		&.premium {
			grid-column: span 3;
		}

		@container (min-width: 640px) {
			&,
			&.premium {
				grid-column: auto;
			}
		}

		/* the name and its cost: the tab's width at most, shrunk to it (fitText) */
		.label {
			display: flex;
			align-items: baseline;
			gap: 0.5em;
			min-width: 0;
			font-size: calc(1em * var(--ui-fit, 1));
		}

		small {
			color: $gold;
			font-size: 1em;
			font-weight: 700;
			letter-spacing: 0;
		}

		@media (hover: hover) {
			&:hover {
				background-color: var(--ui-field-hover);
				color: var(--ui-text);
			}
		}

		&[aria-selected='true'] {
			background-color: var(--ui-text);
			color: var(--ui-accent-contrast);

			small {
				color: inherit;
			}
		}

		&.premium[aria-selected='true'] {
			background-color: $gold;
			color: #2e2100;
		}

		&:focus-visible {
			outline: 2px solid var(--ui-text);
			outline-offset: 2px;
		}
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.3em 0.9em;
		margin: 0;
		color: var(--ui-text-muted);
		font-size: 0.87em;

		span + span::before {
			content: '·';
			margin-right: 0.9em;
			color: var(--ui-text-disabled);
		}

		.now {
			color: $hit;
			font-size: 0.85em;
			font-weight: 700;
			letter-spacing: 0.1em;
		}
	}

	table {
		width: 100%;
		border-collapse: collapse;
		table-layout: fixed;
		font-variant-numeric: tabular-nums;
	}

	th,
	td {
		height: 2.3em;
		padding: 0 0.7em 0 0;
		text-align: right;
		white-space: nowrap;
	}

	/* the hits: a narrow column of its own, flush left */
	tr > :first-child {
		width: max(3.4em, var(--hits-col, 0px));
		padding: 0;
		text-align: left;
	}

	thead th {
		color: var(--ui-text-muted);
		font-size: 0.73em;
		font-weight: 600;
		letter-spacing: 0.1em;
	}

	.over th {
		height: 1.8em;
		padding-right: 0;
		text-align: center;
	}

	thead th.hits {
		font-size: calc(0.73em * var(--ui-fit, 1));

		span {
			display: inline-block;
		}
	}

	thead th.size {
		color: var(--ui-text);
		font-size: 1em;
		font-weight: 700;
		letter-spacing: 0;
	}

	tbody th {
		color: var(--ui-text);
		font-weight: 700;
	}

	tbody tr {
		border-top: 1px solid rgba(255, 255, 255, 0.07);
	}

	td {
		color: var(--ui-text);
		font-size: calc(var(--cell-font, 1em) * var(--ui-fit, 1));
		font-weight: 600;

		&.low {
			color: var(--ui-text-muted);
			font-weight: 500;
		}

		&.zero {
			color: var(--ui-text-disabled);
			font-weight: 400;
		}

		&.top {
			color: $gold;
			font-weight: 700;
		}
	}

	/* the numbers picked now: the whole column stands on the pick colour */
	.mine {
		background-color: rgba($pick, 0.16);
	}

	thead th.size.mine {
		background-color: $pick;
		color: #150c40;
	}

	.note {
		display: flex;
		align-items: center;
		gap: 0.5em;
		margin: 0;
		color: var(--ui-text-muted);
		font-size: 0.87em;

		i {
			width: 0.8em;
			height: 0.8em;
			background-color: $pick;
		}
	}

	/* a level with one count of numbers: value over hits, as in the pay row under the board */
	.strip {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(5.2em, 1fr));
		gap: 2px;
		font-variant-numeric: tabular-nums;

		div {
			display: grid;
			grid-template-rows: 2.6em 1.9em;
			background-color: var(--ui-field);
			text-align: center;
		}

		b {
			align-self: center;
			font-size: 1.07em;
			font-weight: 700;
		}

		span {
			display: grid;
			place-items: center;
			background-color: rgba(0, 0, 0, 0.2);
			color: var(--ui-text-muted);
			font-size: 0.87em;
			font-weight: 600;
		}

		.top b {
			color: $gold;
		}
	}

	@media (max-width: 399px) {
		th,
		td {
			padding-right: 0.35em;
		}

		tr > :first-child {
			width: max(2.6em, var(--hits-col, 0px));
		}

		table {
			--cell-font: 0.93em;
		}
	}
</style>
