<script lang="ts">
	import { stateI18nDerived, stateUrlDerived } from 'state-shared';
	import { UiInfoSection, UiPayCard, UiPayGrid } from 'components-ui-html';

	import config from '../game/config';
	import { greyPicture } from '../game/greyPicture';
	import { CREW_LOOK } from '../game/constants';

	// The paytable, in the shared menu parts: every paying symbol with what 3, 4 and 5 on a line
	// win, read from the math's own table so it can never drift from it.
	const SYMBOLS = ['H1', 'H2', 'H3', 'H4', 'L1', 'L2', 'L3', 'L4'] as const;
	const translate = stateI18nDerived.translate;
	const social = stateUrlDerived.social();

	const rows = (symbol: (typeof SYMBOLS)[number]) =>
		(config.symbols[symbol].paytable ?? [])
			.map((entry) => Object.entries(entry)[0])
			.map(([count, value]) => ({ label: count, value: stateI18nDerived.times(value) }))
			.toReversed();

	const CREW = [
		{ symbol: 'WD', text: 'Carries ×2. In THE JOB it is sticky and drives one reel to the left before every free spin.' }, // prettier-ignore
		{ symbol: 'WC', text: 'Carries ×2. In THE JOB it lands at ×1, is sticky and climbs its ladder every time it is on a winning line.' }, // prettier-ignore
		{ symbol: 'WM', text: 'Carries ×1 and fills its whole reel with Muscle wilds when it lands.' }, // prettier-ignore
		{ symbol: 'WH', text: 'Copies the highest multiplier any other crew member on the board carries, ×2 at least.' }, // prettier-ignore
	] as const;
</script>

<UiInfoSection>
	<p>
		{translate(
			'20 lines. A line pays for 3, 4 or 5 like symbols from the leftmost reel. Only the highest win per line is paid.',
		)}
		{translate(
			social
				? 'Values are multiples of the base play amount.'
				: 'Values are multiples of the base bet.',
		)}
	</p>
</UiInfoSection>

<UiPayGrid>
	{#each SYMBOLS as symbol}
		<UiPayCard image={greyPicture(symbol)} rows={rows(symbol)} />
	{/each}
	{#each CREW as crew}
		<UiPayCard image={greyPicture(crew.symbol)}>
			<p><strong>{CREW_LOOK[crew.symbol].name}</strong>: {translate(crew.text)}</p>
		</UiPayCard>
	{/each}
	<UiPayCard image={greyPicture('S')}>
		<p>
			<strong>{translate('SCATTER')}</strong>: {translate(
				'3, 4 or 5 anywhere start THE JOB with 10, 12 or 15 free spins.',
			)}
		</p>
		<p>{translate('Every scatter during THE JOB adds one free spin.')}</p>
	</UiPayCard>
</UiPayGrid>

<UiInfoSection>
	<p>
		{translate(
			'Every crew member is a wild and substitutes for every paying symbol, not the scatter. Crew land on reels 2 to 5 only. A line made only of crew pays as H1.',
		)}
	</p>
</UiInfoSection>
