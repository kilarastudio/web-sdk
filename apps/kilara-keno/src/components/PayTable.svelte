<script lang="ts">
	import _ from 'lodash';

	import { stateI18nDerived, stateUrlDerived } from 'state-shared';
	import { UiInfoSection } from 'components-ui-html';

	import config from '../game/config';
	import { LEVEL_NAMES, stakeWord } from '../game/betModeMeta';
	import { modeName, type Level, type Picks } from '../game/keno';

	// The win tables, read from the math's own (config.ts, written by scripts/sync_math_config.py):
	// one table per level, a column per pick size the level plays, a row per number of hits.
	const t = stateI18nDerived.translate;
	const { times } = stateI18nDerived;
	const amount = stakeWord(stateUrlDerived.social());
	const maxPicks = Math.max(...config.pickSizes);
	const value = (level: Level, picks: Picks, hits: number) => {
		if (hits > picks) return '';
		const win = config.betModes[modeName(level, picks)].payTable[hits];
		return win > 0 ? times(win) : '–';
	};
</script>

<UiInfoSection>
	<p>
		{t(
			'A round wins the value for its number of hits, times the multiplier. Values are multiples of the base {amount}. Columns: how many numbers are played.',
			{ amount },
		)}
	</p>
</UiInfoSection>

{#each config.levels as level}
	<UiInfoSection
		title={`${LEVEL_NAMES[level as Level]} · ${t('{draws} DRAWN', { draws: config.levelDraws[level] })} · ${times(config.levelCost[level])}`}
	>
		<table>
			<thead>
				<tr>
					<th>{t('HITS')}</th>
					{#each config.levelPicks[level] as picks}
						<th>{picks}</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each _.range(maxPicks, -1, -1) as hits}
					<tr>
						<td>{hits}</td>
						{#each config.levelPicks[level] as picks}
							<td>{value(level as Level, picks as Picks, hits)}</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</UiInfoSection>
{/each}

<UiInfoSection title={t('MULTIPLIER')}>
	<p>
		{t('Meter level = best run of hits + Kilau balls drawn. A round with no hit wins nothing.')}
	</p>
	<table>
		<thead>
			<tr>
				<th>{t('LEVEL')}</th>
				{#each config.ladder as _step, index}
					<th>{index + 1}{index === config.ladder.length - 1 ? '+' : ''}</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			<tr>
				<td>×</td>
				{#each config.ladder as step}
					<td>{times(step)}</td>
				{/each}
			</tr>
		</tbody>
	</table>
</UiInfoSection>

<style lang="scss">
	table {
		width: 100%;
		border-collapse: collapse;
		font-variant-numeric: tabular-nums;
	}

	th {
		color: var(--ui-text-muted);
		font-size: 0.75em;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-align: right;
	}

	th,
	td {
		padding: 0.2em 0.4em;
		text-align: right;
	}

	th:first-child,
	td:first-child {
		padding-left: 0;
		color: var(--ui-text);
		font-weight: 700;
		text-align: left;
	}

	tbody tr:nth-child(odd) td {
		background-color: rgba(255, 255, 255, 0.03);
	}
</style>
