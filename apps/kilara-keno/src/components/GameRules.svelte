<script lang="ts">
	import { stateI18nDerived, stateUrlDerived } from 'state-shared';
	import { UiInfoSection, i18nDerived } from 'components-ui-html';

	import config from '../game/config';
	import { LEVEL_NAMES, modeTitle, stakeWord } from '../game/betModeMeta';
	import { isPremium, type Level, type ModeName } from '../game/keno';

	// The rules, as the math implements them (math-sdk/games/kilara_keno/readme.txt). Costs, the
	// top prizes, the return and the ladder come from the game's config, not from this text.
	const t = stateI18nDerived.translate;
	const social = stateUrlDerived.social();
	const amount = stakeWord(social);
	const { times, percent } = stateI18nDerived;
	const ladder = config.ladder
		.map((step, index) =>
			index === config.ladder.length - 1
				? `${index + 1}+: ${times(step)}`
				: `${index + 1}: ${times(step)}`,
		)
		.join(', ');
	// a mode is named as the math and the replay name it (Engine wants one name everywhere)
	const modes = Object.entries(config.betModes).map(([name, mode]) => ({
		name: name as ModeName,
		title: modeTitle(name),
		...mode,
	}));

	const names = config.levels.map((level) => LEVEL_NAMES[level as Level]);
	const basic = config.levels.filter((level) => !isPremium(level as Level));
	const premium = config.levels.filter((level) => isPremium(level as Level));
	const list = (items: string[]) => items.join(', ');
	const sizes = (level: Level) => {
		const picks = config.levelPicks[level];
		return picks.length > 1 ? `${picks[0]}–${picks[picks.length - 1]}` : `${picks[0]}`;
	};

	const sections = [
		{
			title: t('HOW TO PLAY'),
			lines: [
				t(
					'The board has 40 numbers. Before a round choose a level ({levels}), how many numbers to play and your numbers; QUICK PICK fills the numbers still open at random.',
					{ levels: list(names) },
				),
				...basic.map((level) =>
					t('{level}: {sizes} numbers, {draws} drawn, one at a time, without repeats.', {
						level: LEVEL_NAMES[level as Level],
						sizes: sizes(level as Level),
						draws: config.levelDraws[level],
					}),
				),
				t('A drawn number you chose is a hit.'),
				t(
					'Win = the value for your number of hits ({table}) × the multiplier. Values are multiples of the base {amount}. A round with no hit wins nothing.',
					{ amount, table: i18nDerived.payTable() },
				),
			],
		},
		{
			title: t('KILAU NUMBERS'),
			lines: [
				t(
					'When a round starts, the game marks Kilau numbers among the numbers you did not choose: {basic} and CHAIN mark 1, CHAIN MAX marks {max}.',
					{
						basic: list(basic.map((level) => LEVEL_NAMES[level as Level])),
						max: config.levelKilau.chainmax,
					},
				),
				t(
					'A Kilau number that is drawn is a Kilau ball. Each Kilau ball raises the meter by one level for the round and does not end a run of hits.',
				),
			],
		},
		{
			title: t('MULTIPLIER'),
			lines: [
				t(
					'Meter level = the best run of hits + the Kilau balls drawn. {basic}: a run is hits drawn one after another; a miss ends the run.',
					{ basic: list(basic.map((level) => LEVEL_NAMES[level as Level])) },
				),
				t(
					'Multiplier per level: {ladder}. The order the numbers are drawn in decides the multiplier.',
					{ ladder },
				),
				t(
					'The meter shows only the levels the numbers in play can reach: the highest level is the numbers played plus the Kilau numbers.',
				),
			],
		},
		...premium.map((level) => {
			const name = LEVEL_NAMES[level as Level];
			const cost = times(config.levelCost[level]);
			return {
				title: name,
				lines: [
					t(
						'{name} plays {sizes} numbers and draws {draws}. A hit raises the run by one; a miss lowers it by one, never below zero; a Kilau ball leaves it. The highest run reached counts, on the same ladder: a miss moves the run, never the multiplier already reached.',
						{ name, sizes: sizes(level as Level), draws: config.levelDraws[level] },
					),
					social
						? t('{name} can be played for {cost} the play amount and has its own win table.', {
								name,
								cost,
							})
						: t('{name} costs {cost} the {amount} and has its own win table.', {
								name,
								cost,
								amount,
							}),
					t(
						'{name} is switched on with a confirmation and stays on until you choose another level.',
						{ name },
					),
				],
			};
		}),
	];

	const general = [
		t('The highest win is {max} the base {amount}.', { max: times(config.wincap), amount }),
		t(
			"The draw and the Kilau numbers are decided by the game server. Your numbers stand in for the ones the server played: hits, Kilau balls, their order and the win are the server's.",
		),
		t(
			'A replay, or a round resumed after a reload, shows the round with the numbers the server played, which can differ from the numbers chosen. Hits, their order, the multiplier and the win are the same.',
		),
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
				<th>{t('NUMBERS')}</th>
				<th>{t('DRAWN')}</th>
				<th>{t('RTP')}</th>
				<th>{t('MAX WIN')}</th>
			</tr>
		</thead>
		<tbody>
			{#each modes as mode}
				<tr data-mode={mode.name}>
					<td>{mode.title}</td>
					<td>{times(mode.cost)}</td>
					<td>{mode.picks}</td>
					<td>{mode.draws}</td>
					<td>{percent(mode.rtp)}</td>
					<td>{times(mode.maxWin)}</td>
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

	tbody tr + tr td {
		border-top: 1px solid rgba(255, 255, 255, 0.08);
	}
</style>
