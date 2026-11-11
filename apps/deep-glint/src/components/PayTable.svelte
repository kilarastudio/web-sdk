<script lang="ts">
	import { stateI18nDerived, stateUrlDerived } from 'state-shared';
	import { UiInfoSection, UiPayCard, UiPayGrid } from 'components-ui-html';

	import config from '../game/config';
	import { SYMBOL_DRAWINGS, type SymbolKey } from '../pixel/symbols';
	import { toDataUrl } from '../pixel/dom';

	// The paytable, in the shared menu parts: every paying symbol with what it wins for each count on the board, read from
	// the math's own table so it can never drift from it.
	const SYMBOLS = ['H1', 'H2', 'H3', 'H4', 'L1', 'L2', 'L3', 'L4'] as const;
	const translate = stateI18nDerived.translate;
	const social = stateUrlDerived.social();

	// the counts where the win changes, as "8", "9–10", "11–13", "14+"
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

			return { count, value: `${step.value}×` };
		});
	};

	const picture = (key: SymbolKey) => toDataUrl(SYMBOL_DRAWINGS[key](), 3);
</script>

<UiInfoSection>
	<p>
		{translate('8 or more of the same symbol anywhere on the board win.')}
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
			pixelated
			image={picture(`symbol${symbol}`)}
			rows={rows(symbol)
				.toReversed()
				.map((row) => ({ label: row.count, value: row.value }))}
		/>
	{/each}
	<UiPayCard pixelated image={picture('symbolScatter')}>
		<p>
			<strong>{translate('SCATTER')}</strong>: {translate(
				'4, 5 or 6+ anywhere start 12, 14 or 17 FREE SPINS.',
			)}
		</p>
		<p>{translate('3 or more during FREE SPINS add 5.')}</p>
	</UiPayCard>
</UiPayGrid>
