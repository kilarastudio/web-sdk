<script lang="ts">
	import { stateI18nDerived, stateUrlDerived } from 'state-shared';
	import { UiInfoSection } from 'components-ui-html';

	import config from '../game/config';

	// The rules, as the math implements them (math-sdk/games/dragons_glint/readme.txt). Costs, the top
	// prize and the return come from the game's config, not from this text.
	const translate = stateI18nDerived.translate;
	const social = stateUrlDerived.social();
	const amount = social ? translate('play amount') : translate('bet');
	const { betModes } = config;
	const maxWin = betModes.base.max_win.toLocaleString('en-US');
	const rtp = (config.rtp * 100).toFixed(1);

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
				translate(
					'An explosion primes an unlit spot. An explosion on a primed spot lights it at ×2. Every explosion after that doubles it, up to ×256.',
				),
				translate('A symbol win is multiplied by the highest lit spot under its symbols.'),
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
					'It can happen before any base game board is evaluated, and it opens every FREE SPINS session.',
				),
			],
		},
		{
			title: translate('FREE SPINS'),
			lines: [
				translate('4, 5 or 6+ SCATTERS start 12, 14 or 17 FREE SPINS.'),
				translate('3 or more SCATTERS during FREE SPINS add 5 FREE SPINS.'),
			],
		},
		{
			title: translate('MODES'),
			lines: [
				`ANTE (${betModes.ante.cost}× ${amount}): ${translate('twice the chance of FREE SPINS on every spin.')}`,
				`BOOST (${betModes.boost.cost}× ${amount}): ${translate('a Glint Strike on every spin.')}`,
				`BONUS (${betModes.bonus.cost}× ${amount}): ${translate('starts FREE SPINS straight away.')}`,
				`SUPER (${betModes.super.cost}× ${amount}): ${translate('starts FREE SPINS with every Glint Spot lit at ×2.')}`,
			],
		},
		{
			title: translate('GENERAL'),
			lines: [
				`${translate('The most a round can win is')} ${maxWin}× ${translate('the base')} ${amount}. ${translate('Reaching it ends the round.')}`,
				`${translate('Theoretical return to player')}: ${rtp}%.`,
				translate('A malfunction voids all wins and plays.'),
			],
		},
	];
</script>

{#each sections as section}
	<UiInfoSection title={section.title}>
		{#each section.lines as line}
			<p>{line}</p>
		{/each}
	</UiInfoSection>
{/each}
