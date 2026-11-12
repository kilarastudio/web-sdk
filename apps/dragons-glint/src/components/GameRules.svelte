<script lang="ts">
	import { stateI18nDerived, stateUrlDerived } from 'state-shared';
	import { UiInfoSection } from 'components-ui-html';

	import config from '../game/config';
	import { MODES, modeWords } from '../game/betModeMeta';
	import { GLINT_CAP } from '../game/glint';
	import { i18nDerived } from '../i18n/i18nDerived';

	// The rules, as the math implements them (math-sdk/games/dragons_glint/readme.txt). Costs, the top
	// prize and the return come from the game's config, and what each mode does from the mode table,
	// not from this text.
	const translate = stateI18nDerived.translate;
	const social = stateUrlDerived.social();
	const words = modeWords(social);
	const amount = translate(words.amount);
	const { betModes } = config;
	const times = (value: number) => `${value.toLocaleString('en-US')}×`;
	const percent = (rtp: number) => `${(rtp * 100).toFixed(2)}%`;
	const modeRows = [
		{ key: 'BASE', mode: 'base' as const },
		...MODES.map(({ key, mode }) => ({ key, mode })),
	].map(({ key, mode }) => ({ key, ...betModes[mode] }));

	const sections = [
		{
			title: translate('HOW TO WIN'),
			lines: [
				translate('6 reels, 5 rows. 8 or more of the same symbol anywhere on the board win.'),
				translate(
					'Winning symbols explode and new symbols fall in. This repeats until no win is left.',
				),
			],
		},
		{
			title: translate('GLINT SPOTS'),
			lines: [
				translate('Every position on the board has a Glint Spot.'),
				`${translate(
					'An explosion primes an unlit spot. An explosion on a primed spot lights it at ×2. Every explosion after that doubles it, up to',
				)} ×${GLINT_CAP.toLocaleString('en-US')}.`,
				translate('A symbol win is multiplied by the highest lit spot under its symbols.'),
				translate(
					'A win counts the spots as they are when it lands. Only then do the spots under its symbols grow.',
				),
				translate(
					'Spots reset at the start of every base game round, and stay lit for the whole of FREE SPINS.',
				),
			],
		},
		{
			title: translate('GLINT STRIKE'),
			lines: [
				translate(
					'The dragon breathes fire and lights 3 to 6 random spots at ×2, ×4 or ×8. A brighter spot keeps its value.',
				),
				translate(
					'It strikes before the board is evaluated on 1 in 10 base game spins, and on every spin in BOOST. It also opens every FREE SPINS session.',
				),
			],
		},
		{
			title: translate('FREE SPINS'),
			lines: [
				translate('4, 5 or 6+ SCATTERS start 10, 12 or 15 FREE SPINS.'),
				translate('3 or more SCATTERS during FREE SPINS add 5 FREE SPINS.'),
			],
		},
		{
			title: translate('MODES'),
			lines: MODES.map(
				({ key, mode, rule }) =>
					`${key} (${times(betModes[mode].cost)} ${amount}): ${translate(rule)}`,
			),
		},
	];

	const controls = [
		[i18nDerived.bet(), translate('Plays one round. Press SPACE to do the same.')],
		[
			'− / +',
			`${translate('Lower or raise the')} ${amount}. ${translate('Every win scales with it. Press the amount itself to pick it from a list.')}`,
		],
		[
			i18nDerived.autoSpin(),
			translate('Plays a chosen number of rounds in a row, with optional limits. Press it again to stop.'),
		],
		[i18nDerived.turbo(), translate('Plays rounds faster. Results are the same.')],
		[
			i18nDerived.buyBonus(),
			translate('Shows the modes: turn ANTE or BOOST on, or start FREE SPINS straight away.'),
		],
		[
			i18nDerived.menu(),
			`${i18nDerived.payTable()}, ${translate('these rules, settings and the sound switch.')}`,
		],
		[translate('SOUND'), translate('Mutes or unmutes all sound. Volumes are in the settings.')],
	];

	const general = [
		`${translate('The most a round can win is')} ${times(betModes.base.max_win)} ${translate('the base')} ${amount}. ${translate('Reaching it ends the round.')}`,
		translate(
			'The return to player is the theoretical share of all play returned as wins over a very large number of rounds. Any one session can return more or less.',
		),
		translate(
			'Every round is decided and settled by the game server when it starts. Pictures, animations and amounts on screen only show that result.',
		),
		translate(
			'If the connection is lost during a round, the round is still completed on the server. Reload the game to see its result.',
		),
		translate('A malfunction voids all wins and plays.'),
	];
</script>

{#each sections as section}
	<UiInfoSection title={section.title}>
		{#each section.lines as line}
			<p>{line}</p>
		{/each}
	</UiInfoSection>
{/each}

<UiInfoSection title={translate('RETURN AND TOP PRIZE')}>
	<table>
		<thead>
			<tr>
				<th>{translate('MODE')}</th>
				<th>{translate('COST')}</th>
				<th>RTP</th>
				<th>{translate('MAX WIN')}</th>
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
			{/each}
		</tbody>
	</table>
</UiInfoSection>

<UiInfoSection title={translate('HOW TO PLAY')}>
	<dl>
		{#each controls as [control, does]}
			<div>
				<dt>{control}</dt>
				<dd>{does}</dd>
			</div>
		{/each}
	</dl>
</UiInfoSection>

<UiInfoSection title={translate('GENERAL')}>
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

	dl {
		display: flex;
		flex-direction: column;
		gap: 0.45em;
		margin: 0;

		div {
			display: grid;
			grid-template-columns: 8.5em minmax(0, 1fr);
			gap: 0.8em;
		}
	}

	dt {
		color: var(--ui-text);
		font-weight: 700;
	}

	dd {
		margin: 0;
	}
</style>
