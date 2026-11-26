<script lang="ts">
	import { stateI18nDerived, stateUrlDerived } from 'state-shared';
	import { UiInfoSection } from 'components-ui-html';

	import config from '../game/config';
	import { MODES, modeWords } from '../game/betModeMeta';

	// The rules, as the math implements them (math-sdk/games/going_once/readme.txt). Costs, the
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
					'5 reels, 3 rows, 20 fixed lines. A line pays for 3, 4 or 5 like symbols from the leftmost reel. Only the highest win per line is paid; wins on different lines are added.',
				),
				t(
					'W (wild, reels 2 to 4) substitutes for every paying symbol. A line of wilds alone pays as H1. Lots and gavels do not pay on lines and break a line.',
				),
				t('Lines (row per reel, 1 = top): {lines}.', { lines: lineList }),
			],
		},
		{
			title: t('BASE GAME GAVEL'),
			lines: [t("A gavel on reel 3 multiplies all of that spin's line wins by 2.")],
		},
		{
			title: t('THE AUCTION'),
			lines: [
				t(
					'Lots land on every reel and carry a value of 1, 2, 3, 5, 10, 25 or 50× the base {amount}. 6 or more lots on a base game board start THE AUCTION.',
					{ amount },
				),
				t(
					'The lots on the triggering board stay; every other position is empty. THE AUCTION has 3 respins.',
				),
				t(
					'On every respin each empty position shows nothing, a lot, a gavel or a buyer. Anything landing resets the respins to 3: going once, going twice, sold.',
				),
				t(
					"After the respin's symbols land, each BUYER becomes a lot worth the sum of every other lot in its reel (at least 1×); then each GAVEL doubles every lot on the board and leaves, and its position stays empty.",
				),
				t('THE AUCTION ends when the respins run out or all 15 positions hold lots.'),
				t(
					'LAST BID: when the hammer falls the final bid multiplies the total of all lots by ×1 (no raise), ×2, ×3, ×5, ×10, ×25, ×50 or ×100.',
				),
				t(
					'FULL HOUSE: an auction that ends with all 15 positions holding lots pays twice its total.',
				),
				t('THE AUCTION pays its total once, at the end. There is no player choice in a round.'),
			],
		},
		{
			title: social ? t('FEATURE ROUNDS') : t('BOUGHT ROUNDS'),
			lines: [
				social
					? t(
							"A feature round's opening board shows exactly the lots its mode names; its own line wins are paid. Gavel strikes a mode starts with happen right after the auction opens.",
						)
					: t(
							"A bought round's opening board shows exactly the lots its mode names; its own line wins are paid. Gavel strikes a mode starts with happen right after the auction opens.",
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
