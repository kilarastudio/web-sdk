<script lang="ts">
	import { stateI18nDerived, stateUrlDerived } from 'state-shared';
	import { UiInfoSection } from 'components-ui-html';

	import config from '../game/config';
	import { MODES, modeWords } from '../game/betModeMeta';

	// The rules, as the math implements them (math-sdk/games/dwanda/readme.txt). Costs, the
	// top prize and the return come from the game's config, and what each mode does from the mode
	// table, not from this text.
	const t = stateI18nDerived.translate;
	const social = stateUrlDerived.social();
	const { amount } = modeWords(social);
	const { betModes } = config;
	const { times, percent } = stateI18nDerived;
	const modeRows = [
		{ key: 'BASE', mode: 'base' as const, rule: t('Normal play.') },
		...MODES.map(({ key, mode, rule }) => ({ key, mode, rule: t(rule) })),
	].map(({ key, mode, rule }) => ({ key, rule, ...betModes[mode] }));

	const sections = [
		{
			title: t('HOW TO WIN'),
			lines: [
				t(
					'7 reels, 7 rows. A cluster of 5 or more of the same symbol, touching side to side or top to bottom, wins.',
				),
				t(
					'Winning symbols are removed and new symbols fall in. This repeats until no win is left.',
				),
				t(
					'There are two sides: phoenix symbols P1 to P4 and dragon symbols D1 to D4. Symbols of the same rank pay the same on both sides. There are no wilds.',
				),
			],
		},
		{
			title: t('TERRITORY AND CLASH CELLS'),
			lines: [
				t(
					'Every position on the board can be phoenix territory, dragon territory or a Clash cell. Territory belongs to the position and does not fall with the symbols.',
				),
				t(
					'After the clusters of a cascade are paid, every winning cluster marks its positions for its side.',
				),
				t('A position already marked for the other side becomes a Clash cell worth ×2.'),
				t('A Clash cell under a later winning cluster, of either side, doubles, up to ×1,024.'),
				t(
					'A cluster win is multiplied by the sum of the Clash cells under its symbols. With no Clash cell under it, it pays ×1.',
				),
				t('Base game: the territory is cleared at the start of every round.'),
			],
		},
		{
			title: t('THE DUEL'),
			lines: [
				t('3 scatters start the Duel with 10 free spins, 4 with 12, 5 or more with 15.'),
				t(
					'The Duel starts on an empty territory, and the territory stays for the whole of the Duel.',
				),
				t(
					"In the Duel a winning cluster also marks the positions next to it, side to side and top to bottom. Such a mark on the other side's territory makes a Clash cell at ×2; it does not double a Clash cell that is already there.",
				),
				t('3 or more scatters during the Duel add 5 free spins.'),
			],
		},
	];

	const general = [
		t('The top prize is {max} the base {amount} in every mode. Reaching it ends the round.', {
			max: times(betModes.base.max_win),
			amount,
		}),
		t('Malfunction voids all wins and plays.'),
	];
</script>

{#each sections as section}
	<UiInfoSection title={section.title}>
		{#each section.lines as line}
			<p>{line}</p>
		{/each}
	</UiInfoSection>
{/each}

<UiInfoSection title={t('MODES')}>
	<table>
		<thead>
			<tr>
				<th>{t('MODE')}</th>
				<th>{social ? t('PLAY') : t('COST')}</th>
				<th>{t('RTP')}</th>
				<th>{t('MAX WIN')}</th>
			</tr>
		</thead>
		<tbody>
			{#each modeRows as row}
				<tr>
					<td>{row.key}</td>
					<td>{times(row.cost)}</td>
					<td>{percent(row.rtp)}</td>
					<td>{times(row.max_win)}</td>
				</tr>
				<tr class="about">
					<td colspan="4">{row.rule}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</UiInfoSection>

<UiInfoSection title={t('GENERAL')}>
	{#each general as line}
		<p>{line}</p>
	{/each}
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
		letter-spacing: 0.1em;
		text-align: left;
	}

	th,
	td {
		padding: 0.3em 0.6em 0.3em 0;
	}

	td:first-child {
		color: var(--ui-text);
		font-weight: 700;
	}

	tr.about td {
		padding-top: 0;
		color: var(--ui-text-muted);
		font-weight: 400;
	}

	tbody tr:not(.about) + tr:not(.about) td,
	tbody tr.about + tr td {
		border-top: 1px solid rgba(255, 255, 255, 0.08);
	}
</style>
