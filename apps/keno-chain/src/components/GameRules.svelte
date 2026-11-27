<script lang="ts">
	import { stateConfig, stateI18nDerived, stateUrlDerived } from 'state-shared';
	import { UiInfoSection, i18nDerived } from 'components-ui-html';

	import config from '../game/config';
	import { LEVEL_LABELS, LEVEL_NAMES, stakeWord } from '../game/betModeMeta';
	import { isPremium, modeName, type Level, type Picks } from '../game/keno';
	import LadderStairs from './LadderStairs.svelte';

	// The rules, as the math implements them (math-sdk/games/keno_chain/readme.txt), kept short
	// after Keno Xtreme's info page (user, 2026-11-27): what the game is in one paragraph, a line
	// per risk and per bonus mode, the board's tiles, the buttons, and the return and top prize of
	// every mode as two small grids. Costs, prizes, the return and the ladder come from the config.
	const t = stateI18nDerived.translate;
	const social = stateUrlDerived.social();
	const amount = stakeWord(social);
	const { times, percent } = stateI18nDerived;

	const levelName = (level: string) => LEVEL_NAMES[level as Level];
	// a name inside a sentence: Calm, not CALM
	const levelLabel = (level: string) => LEVEL_LABELS[level as Level];
	const list = (items: string[]) => items.join(', ');
	// a list in a sentence: "Calm, Bold and Wild", "Calm, Bold or Wild"
	const joined = (items: string[], word: 'and' | 'or') =>
		items.length < 2
			? list(items)
			: word === 'and'
				? t('{list} and {last}', { list: list(items.slice(0, -1)), last: items[items.length - 1] })
				: t('{list} or {last}', { list: list(items.slice(0, -1)), last: items[items.length - 1] });
	const basic = config.levels.filter((level) => !isPremium(level as Level)) as Level[];
	const premium = config.levels.filter((level) => isPremium(level as Level)) as Level[];
	// the sizes a level plays, written out: they have gaps (3, 4, 5, 6, 8, 10)
	const picks = config.levelPicks[basic[0]] as readonly Picks[];
	const sizes = t('{list} or {last}', {
		list: list(picks.slice(0, -1).map(String)),
		last: picks[picks.length - 1],
	});
	const mode = (level: Level, size: Picks) => config.betModes[modeName(level, size)];
	const topWin = (level: Level) =>
		Math.max(...config.levelPicks[level].map((size) => mode(level, size as Picks).maxWin));
	const [one, every] = config.kilauRound.share;
	const roundLevels = list(config.kilauRound.levels.map(levelLabel));
	// the mode that reaches the game's highest win
	const topLevel =
		premium.find((level) => topWin(level) === config.wincap) ?? premium[premium.length - 1];

	const about = t(
		'Pick {sizes} of the {board} numbers on the board. {draws} numbers are drawn, one at a time, without repeats: every drawn number you chose is a hit. The round wins the value for its number of hits ({table}) × the streak multiplier. Values are times the base {amount}; a round with no hit wins nothing. The highest win is {max} ({top}).',
		{
			sizes,
			board: config.boardNumbers,
			draws: config.levelDraws[basic[0]],
			table: i18nDerived.payTable(),
			amount,
			max: times(config.wincap),
			top: levelLabel(topLevel),
		},
	);
	// social play has no "cost": the base is then simply the play amount
	const base = social ? '' : t("The base bet is the bet before a bonus mode's cost.");

	// the board's tiles, drawn as the board draws them
	const TOKEN = 'M11.72 0h16.56L40 11.72v16.56L28.28 40H11.72L0 28.28V11.72z';
	const tiles = [
		{ state: 'picked', name: t('Your number') },
		{ state: 'hit', name: t('Hit') },
		{ state: 'miss', name: t('Miss') },
		{ state: 'kilau', name: t('Lucky number') },
		{ state: 'glow', name: t('Lucky ball') },
	];

	const streak = [
		t('Streak level = your best run of hits in a row + the lucky balls drawn.'),
		t(
			'In {levels} a miss ends the run, never the streak level already reached. The order of the draw decides the multiplier.',
			{ levels: joined(basic.map(levelLabel), 'and') },
		),
		t(
			'The highest streak level is the numbers played plus the lucky numbers marked, so with few numbers the top streak levels need a lucky round.',
		),
	];

	const lucky = [
		t(
			'Before the draw the game marks {usual} lucky number among the numbers you did not choose. If it is drawn it is a lucky ball: the streak level goes up by one and the run goes on.',
			{ usual: config.levelKilau[basic[0]] },
		),
		t(
			'Lucky round: {one} round in {every} marks {numbers} lucky numbers ({levels}). The game server decides which rounds.',
			{ one, every, numbers: config.kilauRound.numbers, levels: roundLevels },
		),
	];

	const price = (level: Level) =>
		social
			? t('Can be played for {cost} the play amount.', { cost: times(config.levelCost[level]) })
			: t('Costs {cost} the {amount}.', { cost: times(config.levelCost[level]), amount });
	const bonus = premium.map((level) => {
		const size = config.levelPicks[level][0];
		const marks =
			config.levelKilau[level] > config.levelKilau[basic[0]]
				? t('{count} lucky numbers in every round.', { count: config.levelKilau[level] })
				: '';
		return {
			level,
			name: levelName(level),
			text: [
				t(
					'{size} numbers, {draws} drawn. A miss lowers the run by one, never below zero, and does not end it.',
					{ size, draws: config.levelDraws[level] },
				),
				marks,
				price(level),
				t('Own win table. Stays on until you choose a risk.'),
			]
				.filter(Boolean)
				.join(' '),
		};
	});

	// the screen's buttons, by the words they carry
	const buttons = [
		{ label: '− +', text: t('Lower or raise the {amount}.', { amount }) },
		{ label: t('Risk'), text: t('Choose {levels}.', { levels: joined(basic.map(levelLabel), 'or') }) },
		{
			label: t('Bonus'),
			text: t('Open the bonus modes: {modes}.', { modes: joined(premium.map(levelLabel), 'and') }),
		},
		{
			label: t('Random Pick'),
			text: t('Pick a fresh set of numbers at random.'),
		},
		{ label: t('Clear'), text: t('Clear all your numbers.') },
		{
			label: t('Play'),
			text: stateConfig.jurisdiction.disabledSpacebar
				? t('Play a round.')
				: t('Play a round. The space bar does the same.'),
		},
		{ label: t('Autoplay'), text: t('Play a chosen number of rounds one after another.') },
		{ label: t('Turbo'), text: t('Show the draw faster.') },
	];

	// what is this game's own: the player's numbers stand in for the server's
	const server = t(
		"The game server decides the draw, the lucky numbers and the lucky rounds. Your numbers take the place of the numbers the server played; the hits, the lucky balls, their order and the win are the server's. A replay, or a round resumed after a reload, shows the server's own numbers, which can differ from yours; the result is the same.",
	);
	// Engine's template disclaimer, word for word: reviewers check that every point of it is there
	const disclaimer = t(
		'Malfunction voids all wins and plays. A consistent internet connection is required. In the event of a disconnection, reload the game to finish any uncompleted rounds. The expected return is calculated over many plays. The game display is not representative of any physical device and is for illustrative purposes only. Winnings are settled according to the amount received from the Remote Game Server and not from events within the web browser. TM and © 2026 Engine.',
	);
</script>

<UiInfoSection title={t('ABOUT')}>
	<p>{about}</p>
	{#if base}<p class="quiet">{base}</p>{/if}
</UiInfoSection>

<UiInfoSection title={t('THE BOARD')}>
	<div class="tiles" role="list">
		{#each tiles as tile}
			<div class="item" role="listitem">
				<span class="tile {tile.state}" aria-hidden="true">
					<span class="face">
						{#if tile.state === 'hit' || tile.state === 'glow'}
							<svg class="token" viewBox="0 0 40 40"><path d={TOKEN} /></svg>
						{/if}
						<span class="num">7</span>
						{#if tile.state === 'kilau'}
							<svg class="up" viewBox="0 0 12 12"><path d="M6 1.5 11 8H8v2.5H4V8H1z" /></svg>
						{/if}
					</span>
				</span>
				<strong>{tile.name}</strong>
			</div>
		{/each}
	</div>
</UiInfoSection>

<UiInfoSection title={t('RISK')}>
	<dl class="lines">
		{#each basic as level}
			<div>
				<dt>{levelName(level)}</dt>
				<dd>{t('{max} max win', { max: times(topWin(level)) })}</dd>
			</div>
		{/each}
	</dl>
	<p class="quiet">
		{t(
			'The chance of every number of hits is the same in all three; only the win table differs. {first} wins more often and smaller, {last} less often and larger.',
			{ first: levelLabel(basic[0]), last: levelLabel(basic[basic.length - 1]) },
		)}
	</p>
</UiInfoSection>

<UiInfoSection title={t('STREAK MULTIPLIER')}>
	<LadderStairs />
	{#each streak as line}
		<p>{line}</p>
	{/each}
</UiInfoSection>

<UiInfoSection title={t('LUCKY NUMBERS')}>
	{#each lucky as line}
		<p>{line}</p>
	{/each}
</UiInfoSection>

<UiInfoSection title={t('BONUS MODES')}>
	<dl class="lines stacked">
		{#each bonus as item}
			<div data-level={item.level}>
				<dt>{item.name} <b>{times(config.levelCost[item.level])}</b></dt>
				<dd>{item.text}</dd>
			</div>
		{/each}
	</dl>
</UiInfoSection>

<UiInfoSection title={t('HOW TO PLAY')}>
	<dl class="buttons">
		{#each buttons as button}
			<div>
				<dt>{button.label}</dt>
				<dd>{button.text}</dd>
			</div>
		{/each}
	</dl>
</UiInfoSection>

{#snippet grid(title: string, value: (level: Level, size: Picks) => string)}
	<table class="grid">
		<caption>{title}</caption>
		<thead>
			<tr>
				<th scope="col">{t('NUMBERS')}</th>
				{#each basic as level}
					<th scope="col">{levelName(level)}</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each picks as size}
				<tr>
					<th scope="row">{size}</th>
					{#each basic as level}
						<td data-mode={modeName(level, size)}>{value(level, size)}</td>
					{/each}
				</tr>
			{/each}
		</tbody>
		<tfoot>
			{#each premium as level}
				{@const size = config.levelPicks[level][0] as Picks}
				<tr data-mode={modeName(level, size)}>
					<th scope="row" colspan={basic.length}>{levelName(level)}</th>
					<td>{value(level, size)}</td>
				</tr>
			{/each}
		</tfoot>
	</table>
{/snippet}

<UiInfoSection title={t('RTP AND MAX WIN')}>
	<div class="grids">
		{@render grid(t('RTP'), (level, size) => percent(mode(level, size).rtp))}
		{@render grid(t('MAX WIN'), (level, size) => times(mode(level, size).maxWin))}
	</div>
	<p class="quiet">
		{t(
			'A mode is its risk and its numbers: {example}. {chain} is {chainMode}, {chainmax} is {chainmaxMode}.',
			{
				example: `${modeName(basic[0], picks[0]).toUpperCase()}, ${modeName(basic[basic.length - 1], picks[picks.length - 1]).toUpperCase()}`,
				chain: levelLabel(premium[0]),
				chainMode: modeName(premium[0], config.levelPicks[premium[0]][0] as Picks).toUpperCase(),
				chainmax: levelLabel(premium[1]),
				chainmaxMode: modeName(
					premium[1],
					config.levelPicks[premium[1]][0] as Picks,
				).toUpperCase(),
			},
		)}
	</p>
</UiInfoSection>

<UiInfoSection title={t('GENERAL')}>
	<p class="quiet">{server}</p>
</UiInfoSection>

<UiInfoSection title={t('GENERAL DISCLAIMER')}>
	<p class="quiet" data-test="disclaimer">{disclaimer}</p>
</UiInfoSection>

<style lang="scss">
	/* the game's own colours, as on the board (KenoTable) */
	$pick: #9b87ff;
	$gold: #ffc93c;
	$hit: #3fe082;
	$line: rgba(255, 255, 255, 0.07);

	dl {
		margin: 0;
	}

	dd {
		margin: 0;
	}

	.quiet {
		color: var(--ui-text-muted);
		font-size: 0.93em;
	}

	/* the five tiles in a row, each over its name; they wrap on a narrow sheet */
	.tiles {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		gap: 0.8em 0.4em;

		.item {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 0.45em;
			text-align: center;
		}

		strong {
			font-size: 0.87em;
			font-weight: 600;
			line-height: 1.2;
		}
	}

	.tile {
		position: relative;
		flex: none;
		width: 2.9em;
		height: 2.9em;
		background-color: #171f2f;
		font-size: 1em;
		font-weight: 600;
		font-variant-numeric: tabular-nums;

		.face {
			position: absolute;
			inset: 0 0 0.24em 0;
			display: grid;
			place-items: center;
			background-color: #28344c;
			color: #f3f5fb;
		}

		.num {
			position: relative;
			z-index: 2;
		}

		.token {
			position: absolute;
			z-index: 1;
			left: 50%;
			top: 50%;
			width: 88%;
			height: 88%;
			translate: -50% -50%;
		}

		.up {
			position: absolute;
			right: 7%;
			top: 7%;
			width: 26%;
			height: 26%;
			fill: $gold;
		}

		&.picked,
		&.hit {
			background-color: #6450d6;
		}

		&.picked .face {
			background-color: $pick;
			color: #150c40;
		}

		&.hit {
			.face {
				background-color: #6f5be0;
			}

			.token {
				fill: $hit;
			}

			.num {
				color: #06381a;
				font-weight: 700;
			}
		}

		&.miss {
			background-color: #080c16;

			.face {
				inset: 0.24em 0 0 0;
				background: #080c16 repeating-conic-gradient(#111829 0 25%, transparent 0 50%) 0 0 / 4px
					4px;
				color: #ff5d62;
			}
		}

		&.kilau {
			background-color: #4a3a0c;

			.face {
				background-color: #2a2210;
				box-shadow: inset 0 0 0 2px $gold;
				color: $gold;
			}
		}

		&.glow {
			background-color: #5f4a12;

			.face {
				background-color: #8a6a12;
			}

			.token {
				fill: #ffcf45;
			}

			.num {
				color: #2e2100;
				font-weight: 700;
			}
		}
	}

	/* a name and what goes with it, a line each */
	.lines {
		display: flex;
		flex-direction: column;
		max-width: 520px;

		div {
			display: flex;
			align-items: baseline;
			justify-content: space-between;
			gap: 0.2em 1em;
			padding: 0.45em 0;
			border-top: 1px solid $line;
		}

		div:first-child {
			border-top: none;
			padding-top: 0;
		}

		dt {
			color: var(--ui-text);
			font-weight: 700;
			letter-spacing: 0.04em;
		}

		dd {
			font-variant-numeric: tabular-nums;
		}

		dt b {
			margin-left: 0.4em;
			color: $gold;
			letter-spacing: 0;
		}

		/* a name over its text */
		&.stacked {
			max-width: none;

			div {
				flex-direction: column;
				align-items: stretch;
				padding: 0.6em 0;
			}

			div:first-child {
				padding-top: 0;
			}
		}
	}

	/* a button as the screen writes it, then what it does */
	.buttons {
		display: flex;
		flex-direction: column;
		gap: 0.4em;

		div {
			display: flex;
			align-items: center;
			gap: 0.8em;
		}

		dt {
			flex: none;
			min-width: 6.6em;
			padding: 0.3em 0.6em;
			background-color: var(--ui-field);
			color: var(--ui-text);
			font-size: 0.87em;
			font-weight: 700;
			text-align: center;
			white-space: nowrap;
		}

		dd {
			line-height: 1.3;
		}
	}

	/* the return and the top prize of every mode: two grids, side by side where there is room */
	.grids {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 1.2em 2.4em;
	}

	.grid {
		width: 100%;
		border-collapse: collapse;
		font-variant-numeric: tabular-nums;

		caption {
			padding-bottom: 0.2em;
			color: var(--ui-text);
			font-weight: 800;
			letter-spacing: 0.08em;
			text-align: left;
		}

		th,
		td {
			padding: 0.4em 0 0.4em 0.5em;
			text-align: right;
			white-space: nowrap;
		}

		tr > :first-child {
			padding-left: 0;
			text-align: left;
		}

		thead th {
			color: var(--ui-text-muted);
			font-size: 0.73em;
			font-weight: 600;
			letter-spacing: 0.1em;
		}

		tbody th,
		tfoot th {
			color: var(--ui-text);
			font-weight: 700;
			letter-spacing: 0.04em;
		}

		tbody tr,
		tfoot tr {
			border-top: 1px solid $line;
		}
	}
</style>
