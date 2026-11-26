<script lang="ts">
	import { stateI18nDerived, stateUrlDerived } from 'state-shared';
	import { UiInfoSection, UiPayCard, UiPayGrid } from 'components-ui-html';

	import config from '../game/config';
	import { greyPicture } from '../game/greyPicture';

	// The paytable, in the shared menu parts: every paying symbol with what 3, 4 and 5 on a line
	// win, read from the math's own table so it can never drift from it.
	const SYMBOLS = ['H1', 'H2', 'H3', 'H4', 'L1', 'L2', 'L3', 'L4'] as const;
	const translate = stateI18nDerived.translate;
	const social = stateUrlDerived.social();

	const rows = (symbol: (typeof SYMBOLS)[number] | 'W') =>
		(config.symbols[symbol].paytable ?? [])
			.map((entry) => Object.entries(entry)[0])
			.map(([count, value]) => ({ label: count, value: stateI18nDerived.times(value) }))
			.toReversed();
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
	<!-- the wild alone pays as H1 -->
	<UiPayCard image={greyPicture('W')} rows={rows('W')} />
	<UiPayCard image={greyPicture('P')}>
		<p>
			<strong>{translate('LOT')}</strong>: {translate(
				'Carries a value of 1, 2, 3, 5, 10, 25 or 50×. 6 or more on a base game board start THE AUCTION. Lots do not pay on lines and break a line.',
			)}
		</p>
	</UiPayCard>
	<UiPayCard image={greyPicture('G')}>
		<p>
			<strong>{translate('GAVEL')}</strong>: {translate(
				"Base game, reel 3 only: doubles all of that spin's line wins. In THE AUCTION it doubles every lot on the board.",
			)}
		</p>
	</UiPayCard>
	<UiPayCard image={greyPicture('B')}>
		<p>
			<strong>{translate('BUYER')}</strong>: {translate(
				'THE AUCTION only: becomes a lot worth the sum of every other lot in its reel, at least 1×.',
			)}
		</p>
	</UiPayCard>
</UiPayGrid>

<UiInfoSection>
	<p>
		<strong>{translate('WILD')}</strong>: {translate(
			'Reels 2 to 4. Substitutes for every paying symbol. A line of wilds alone pays as H1.',
		)}
	</p>
</UiInfoSection>
