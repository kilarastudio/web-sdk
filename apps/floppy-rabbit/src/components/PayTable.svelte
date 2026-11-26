<script lang="ts">
	import { stateI18nDerived, stateUrlDerived } from 'state-shared';
	import { UiInfoSection, UiPayCard, UiPayGrid } from 'components-ui-html';

	import config from '../game/config';
	import { greyPicture } from '../game/greyPicture';

	// The paytable, in the shared menu parts: every paying symbol with what a cluster of each size
	// wins, read from the math's own table so it can never drift from it.
	const SYMBOLS = ['H1', 'H2', 'H3', 'H4', 'L1', 'L2', 'L3'] as const;
	const translate = stateI18nDerived.translate;
	const social = stateUrlDerived.social();

	// the cluster sizes where the win changes, as "5", "6–8", "9–12", "13+"
	const rows = (symbol: (typeof SYMBOLS)[number]) => {
		const steps: { from: number; value: number }[] = [];
		for (const entry of config.symbols[symbol].paytable ?? []) {
			const [count, value] = Object.entries(entry)[0];
			if (steps.at(-1)?.value !== value) steps.push({ from: Number(count), value });
		}

		return steps.map((step, index) => {
			const next = steps[index + 1]?.from;
			const count = !next
				? `${step.from}+`
				: next - 1 === step.from
					? `${step.from}`
					: `${step.from}–${next - 1}`;

			return { count, value: stateI18nDerived.times(step.value) };
		});
	};
</script>

<UiInfoSection>
	<p>
		{translate(
			'A cluster of 5 or more of the same symbol, touching side to side or top to bottom, wins.',
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
		<UiPayCard
			image={greyPicture(symbol)}
			rows={rows(symbol)
				.toReversed()
				.map((row) => ({ label: row.count, value: row.value }))}
		/>
	{/each}
	<UiPayCard image={greyPicture('S')}>
		<p>
			<strong>{translate('SCATTER')}</strong>: {translate(
				'3 or more anywhere start FLOP TIME with 12 free spins.',
			)}
		</p>
		<p>{translate('3 bring one rabbit, 4 bring two, 5 or more bring three.')}</p>
		<p>{translate('3 or more during FLOP TIME add 5 free spins.')}</p>
	</UiPayCard>
</UiPayGrid>
