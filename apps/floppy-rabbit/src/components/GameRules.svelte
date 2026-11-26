<script lang="ts">
	import { stateI18nDerived, stateUrlDerived } from 'state-shared';
	import { UiInfoSection } from 'components-ui-html';

	import config from '../game/config';
	import { MODES, modeWords } from '../game/betModeMeta';

	// The rules, as the math implements them (math-sdk/games/floppy_rabbit/readme.txt). Costs, the
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
			],
		},
		{
			title: t('FOOTPRINTS'),
			lines: [
				t(
					'Every position on the board can hold a footprint. A footprint starts at ×2 and doubles up to ×4,096. It belongs to the position and does not fall with the symbols.',
				),
				t(
					'A cluster win is multiplied by the sum of the footprints under its symbols. With no footprint under it, it pays ×1.',
				),
				t(
					'Footprints are cleared at the start of every base game round, and stay for the whole of FLOP TIME.',
				),
			],
		},
		{
			title: t('HOP AND FLOP'),
			lines: [
				t(
					'HOP: the rabbit jumps to another position, at most two positions away in any direction, and leaves a footprint there: ×2 on a bare position, or the footprint already there doubles.',
				),
				t('FLOP: the rabbit stays where it is and every footprint on the board doubles.'),
				t(
					'Base game: when the board is revealed the rabbit hops once, to any position. After every winning cascade it takes one action before the board is evaluated again: a hop after the first cascade, a hop or a flop from the second cascade on.',
				),
			],
		},
		{
			title: t('FLOP TIME'),
			lines: [
				t(
					'3 or more scatters start FLOP TIME with 12 free spins. Scatters are counted when the board has stopped cascading.',
				),
				t(
					'3 scatters bring one rabbit, 4 bring two, 5 or more bring three. FLOP TIME starts on a clear board; each rabbit takes a random position and leaves a ×2 footprint on it.',
				),
				t(
					'Before every free spin is evaluated, and after every winning cascade, each rabbit takes one action, a hop or a flop.',
				),
				t('Before the 9th free spin the first rabbit always flops.'),
				t(
					'3 or more scatters on a free spin add 5 free spins. The number of rabbits does not change.',
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
