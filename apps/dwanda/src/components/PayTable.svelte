<script lang="ts">
	import { stateI18nDerived, stateUrlDerived } from 'state-shared';
	import { UiInfoSection, UiPayCard, UiPayGrid } from 'components-ui-html';

	import config from '../game/config';
	import { greyPicture } from '../game/greyPicture';

	// The paytable, in the shared menu parts: every paying symbol with what a cluster of each size
	// wins, read from the math's own table so it can never drift from it. Phoenix and dragon
	// symbols of one rank pay the same, so they stand side by side.
	const SYMBOLS = ['P1', 'D1', 'P2', 'D2', 'P3', 'D3', 'P4', 'D4'] as const;
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
	<p>
		{translate(
			'Phoenix symbols (▲ P1 to P4) and dragon symbols (▼ D1 to D4) of the same rank pay the same. A win is multiplied by the sum of the Clash cells under it.',
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
				'3 anywhere start the Duel with 10 free spins, 4 with 12, 5 or more with 15.',
			)}
		</p>
		<p>{translate('3 or more during the Duel add 5 free spins.')}</p>
	</UiPayCard>
</UiPayGrid>
