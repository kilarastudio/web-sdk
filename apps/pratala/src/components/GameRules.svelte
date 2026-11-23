<script lang="ts">
	import { stateI18nDerived, stateUrlDerived } from 'state-shared';
	import { UiInfoSection } from 'components-ui-html';

	import config from '../game/config';
	import { MODES, modeText, modeWords } from '../game/betModeMeta';
	import { GLINT_CAP, GLINT_WIN_CAP, SIX_SCATTER_START_GLINT } from '../game/glint';
	import { i18nDerived } from '../i18n/i18nDerived';

	// The rules, as the math implements them (math-sdk/games/pratala/readme.txt). Costs, the top
	// prize and the return come from the game's config, and what each mode does from the mode table,
	// not from this text. Numbers and button names go in as {placeholders}, so every language keeps
	// one whole sentence to translate.
	const t = stateI18nDerived.translate;
	const social = stateUrlDerived.social();
	const { amount } = modeWords(social);
	const { betModes } = config;
	const { times, percent } = stateI18nDerived;
	const modeRows = [
		{ key: 'BASE', mode: 'base' as const },
		...MODES.map(({ key, mode }) => ({ key, mode })),
	].map(({ key, mode }) => ({ key, ...betModes[mode] }));

	const sections = [
		{
			title: t('HOW TO WIN'),
			lines: [
				t('6 reels, 5 rows. 8 or more of the same symbol anywhere on the board win.'),
				t(
					'Winning symbols are destroyed and new symbols fall in. This repeats until no win is left.',
				),
			],
		},
		{
			title: t('GLINT SPOTS'),
			lines: [
				t('Every position on the board has a Glint Spot.'),
				t(
					"A win primes the unlit spots under its symbols. A win on a primed spot lights it at ×2. Every win after that doubles it, up to {cap}. Past that only the Dragon's Gaze doubles a spot.",
					{ cap: `×${GLINT_WIN_CAP}` },
				),
				t('A symbol win is multiplied by the highest lit spot under its symbols.'),
				t(
					'A win counts the spots as they are when it lands. Only then do the spots under its symbols grow.',
				),
				t(
					'Spots reset at the start of every base game round, and stay lit for the whole of FREE SPINS.',
				),
			],
		},
		{
			title: t('GLINT STRIKE'),
			lines: [
				t(
					'Dragon fire lights 3 to 6 random spots at ×2, ×4 or ×8. A brighter spot keeps its value.',
				),
				t(
					'It strikes before the board is evaluated on 1 in 10 base game spins, and on every spin in BOOST.',
				),
			],
		},
		{
			title: t("DRAGON'S GAZE"),
			lines: [
				t(
					'During FREE SPINS every SCATTER that lands looks down its reel: each spot on that reel doubles, up to {cap}. An unlit or primed spot lights at ×2.',
					{ cap: `×${stateI18nDerived.number(GLINT_CAP)}` },
				),
				t(
					'A SCATTER gazes once, when it lands with the spin or falls in after a win, before the board is evaluated.',
				),
				t('Two SCATTERS on one reel double that reel twice.'),
			],
		},
		{
			title: t('FREE SPINS'),
			lines: [
				t('4, 5 or 6+ SCATTERS start 10, 12 or 15 FREE SPINS.'),
				t('With 6 or more SCATTERS every Glint Spot starts lit at {multiplier}.', {
					multiplier: `×${SIX_SCATTER_START_GLINT}`,
				}),
				t('Every FREE SPINS session opens with a Glint Strike on 8 to 15 spots.'),
				t('3 or more SCATTERS during FREE SPINS add 5 FREE SPINS.'),
			],
		},
		{
			title: t('MODES'),
			lines: MODES.map(({ key, mode, rule }) =>
				t('{mode} ({cost} {amount}): {rule}', {
					mode: key,
					cost: times(betModes[mode].cost),
					amount,
					rule: modeText(rule, mode),
				}),
			),
		},
	];

	const controls = [
		[i18nDerived.bet(), t('Plays one round. Press SPACE to do the same.')],
		[
			i18nDerived.stop(),
			// the buttons are named as the player sees them: SPIN and PLAY BONUS in social mode
			t(
				'Takes the place of the {button} button while a round plays. Press it to stop the reels at once and, during autoplay, to end it. The result does not change.',
				{ button: i18nDerived.bet() },
			),
		],
		[
			'− / +',
			t(
				'Lower or raise the {amount}. Every win scales with it. Press the amount itself to pick it from a list.',
				{ amount },
			),
		],
		[
			i18nDerived.autoSpin(),
			t('Plays a chosen number of rounds in a row, with optional limits. Press it again to stop.'),
		],
		[i18nDerived.turbo(), t('Plays rounds faster. Results are the same.')],
		[
			i18nDerived.buyBonus(),
			t('Shows the modes: turn ANTE or BOOST on, or start FREE SPINS straight away.'),
		],
		[
			i18nDerived.disable(),
			t(
				'Takes the place of the {button} button while ANTE or BOOST is on. Press it to turn the mode off.',
				{ button: i18nDerived.buyBonus() },
			),
		],
		[
			`${i18nDerived.showControls()} / ${i18nDerived.hideControls()}`,
			t('On a phone held upright during free spins, shows or hides the controls.'),
		],
		[
			i18nDerived.menu(),
			t('{paytable}, these rules, settings and the audio switch.', {
				paytable: i18nDerived.payTable(),
			}),
		],
		[i18nDerived.audio(), t('Mutes or unmutes all sound. Volumes are in the settings.')],
	];

	const general = [
		t('The most a round can win is {multiplier} the base {amount}. Reaching it ends the round.', {
			multiplier: times(betModes.base.max_win),
			amount,
		}),
		t(
			'The return to player is the theoretical share of all play returned as wins over a very large number of rounds. Any one session can return more or less.',
		),
		t(
			'Every round is decided and settled by the game server when it starts. Pictures, animations and amounts on screen only show that result.',
		),
		t(
			'If the connection is lost during a round, the round is still completed on the server. Reload the game to see its result.',
		),
		t('A malfunction voids all wins and plays.'),
		t('A consistent internet connection is required.'),
		t(
			'The game display is not representative of any physical device and is for illustrative purposes only.',
		),
		t('TM and © 2026 Engine.'),
	];
</script>

{#each sections as section}
	<UiInfoSection title={section.title}>
		{#each section.lines as line}
			<p>{line}</p>
		{/each}
	</UiInfoSection>
{/each}

<UiInfoSection title={t('RETURN AND TOP PRIZE')}>
	<table>
		<thead>
			<tr>
				<th>{t('MODE')}</th>
				<!-- the price of a mode as a multiple of the bet; social play has no "cost" -->
				<th>{social ? 'PLAY AMOUNT' : t('COST')}</th>
				<th>{i18nDerived.rtp()}</th>
				<th>{i18nDerived.maxWin()}</th>
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

<UiInfoSection title={t('HOW TO PLAY')}>
	<dl>
		{#each controls as [control, does]}
			<div>
				<dt>{control}</dt>
				<dd>{does}</dd>
			</div>
		{/each}
	</dl>
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
