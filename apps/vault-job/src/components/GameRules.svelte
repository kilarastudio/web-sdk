<script lang="ts">
	import { stateI18nDerived, stateUrlDerived } from 'state-shared';
	import { UiInfoSection } from 'components-ui-html';

	import config from '../game/config';
	import { MODES, modeWords } from '../game/betModeMeta';

	// The rules, as the math implements them (math-sdk/games/vault_job/readme.txt). Costs, the
	// top prize and the return come from the game's config, and what each mode does from the mode
	// table, not from this text.
	const t = stateI18nDerived.translate;
	const social = stateUrlDerived.social();
	const { amount } = modeWords(social);
	const { betModes } = config;
	const { times, percent } = stateI18nDerived;
	const lineList = Object.entries(config.paylines as Record<string, number[]>)
		.map(([index, rows]) => `${index}: ${rows.map((row) => row + 1).join('')}`)
		.join(', ');
	const modeRows = [
		{ key: 'BASE', mode: 'base' as const, rule: t('Normal play.') },
		...MODES.map(({ key, mode, rule }) => ({ key, mode, rule: t(rule) })),
	].map(({ key, mode, rule }) => ({ key, rule, ...betModes[mode] }));

	const sections = [
		{
			title: t('HOW TO WIN'),
			lines: [
				t(
					'5 reels, 4 rows, 20 fixed lines. A line pays for 3, 4 or 5 like symbols from the leftmost reel. Only the highest win per line is paid; wins on different lines are added.',
				),
				t('Lines (row per reel, 1 = top): {lines}.', { lines: lineList }),
			],
		},
		{
			title: t('CREW WILDS'),
			lines: [
				t(
					'Every crew member is a wild and substitutes for every paying symbol, not the scatter. Crew land on reels 2 to 5 only.',
				),
				t(
					'A line win is multiplied by the sum of the multipliers of the crew on its winning positions that carry more than ×1. A line with no such crew is paid ×1.',
				),
				t(
					"A line made only of crew pays as H1. When a line starts with crew followed by a paying symbol, it pays whichever is higher: the paying symbol's line or the crew-only line.",
				),
				t('DRIVER (D) carries ×2.'),
				t('SAFECRACKER (S) carries ×2 in the base game.'),
				t(
					'MUSCLE (M) carries ×1 and fills its whole reel with Muscle wilds when it lands. Cells holding a scatter or another crew member keep them.',
				),
				t(
					'HACKER (H) copies the highest multiplier any other crew member on the board carries, ×2 at least. Several Hackers all take the same value.',
				),
				t(
					'Order on every board: the board is revealed, Muscles fill their reels, Hackers copy, then the lines are paid.',
				),
			],
		},
		{
			title: t('THE JOB'),
			lines: [
				t('3, 4 or 5 scatters in the base game award 10, 12 or 15 free spins.'),
				t('THE JOB always starts with a Safecracker at ×1 on a random cell of reel 2.'),
				t(
					'Drivers and Safecrackers that land in THE JOB are sticky for the rest of the feature. Muscles and Hackers act only on the spin they land, as in the base game.',
				),
				t(
					'In THE JOB a Safecracker carries ×1 when it lands, and every time it is on a winning line it climbs one step of its ladder after the spin is paid: 1, 2, 3, 5, 8, 12, 20, 30, 50, 80, 120, 200, 300, 500, 1,000 (top).',
				),
				t(
					'Before every free spin each sticky Driver drives one reel to the left, keeping its row and its ×2. It passes over cells other sticky crew hold. A Driver on reel 1 drives off the board.',
				),
				t('Sticky crew cover whatever the reels show in their cells.'),
				t('Every scatter that lands during THE JOB adds one free spin.'),
			],
		},
		{
			title: social ? t('FEATURE ROUNDS') : t('BOUGHT ROUNDS'),
			lines: [
				social
					? t(
							"A feature round's opening board shows exactly 3 scatters; its own line wins are paid.",
						)
					: t(
							"A bought round's opening board shows exactly 3 scatters; its own line wins are paid.",
						),
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
