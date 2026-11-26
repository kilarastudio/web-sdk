<script lang="ts">
	import { stateI18nDerived } from 'state-shared';

	import config from '../game/config';
	import { getContext } from '../game/context';

	// What each number of hits wins in the current mode, in multiples of the base bet before the
	// streak multiplier; the cell of the hits so far is lit as the draw goes, in the win colour
	// once it wins something.
	type Props = { vertical?: boolean };

	const props: Props = $props();
	const context = getContext();
	const round = $derived(context.stateGame.round);
	const table = $derived(
		config.betModes[round?.mode ?? context.stateGameDerived.mode()].payTable as readonly number[],
	);
	const hits = $derived(round ? round.hits : -1);
	const t = stateI18nDerived.translate;
</script>

<div
	class="strip"
	class:vertical={props.vertical}
	style:--cells={table.length}
	data-test="pay-strip"
>
	<span class="head">
		<span>{t('HITS')}</span>
		<span>{t('WINS')}</span>
	</span>
	<ol class="cells">
		{#each table as value, count}
			<li class:current={count === hits} class:wins={value > 0} data-hits={count}>
				<span class="count">{count}</span>
				<span class="value">{value > 0 ? stateI18nDerived.times(value) : '–'}</span>
			</li>
		{/each}
	</ol>
</div>

<style lang="scss">
	.strip {
		display: flex;
		gap: 0.4em;
		height: 100%;
	}

	.head {
		flex: none;
		display: grid;
		grid-template-rows: 1fr 1fr;
		align-items: center;
		color: var(--keno-muted);
		font-size: 0.8em;
		font-weight: 700;
		letter-spacing: 0.1em;
	}

	.cells {
		flex: 1;
		display: grid;
		grid-template-columns: repeat(var(--cells), minmax(0, 1fr));
		gap: 0.2em;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		display: grid;
		grid-template-rows: 1fr 1fr;
		align-items: center;
		justify-items: center;
		min-width: 0;
		background-color: var(--keno-tile);
		font-variant-numeric: tabular-nums;
		transition: background-color 0.15s;

		&.current {
			background-color: var(--keno-text);

			.count,
			.value {
				color: var(--keno-dark);
			}
		}

		&.current.wins {
			background-color: var(--keno-win);
		}
	}

	.count {
		color: var(--keno-muted);
		font-size: 0.85em;
		font-weight: 700;
	}

	.value {
		max-width: 100%;
		overflow: hidden;
		color: var(--keno-text);
		font-size: 0.9em;
		font-weight: 700;
		white-space: nowrap;
	}

	/* beside the board on wide screens: one row per number of hits, most hits on top */
	.vertical {
		flex-direction: column;

		.head {
			grid-template-rows: none;
			grid-template-columns: 1fr 1fr;
			justify-items: center;
		}

		.cells {
			grid-template-columns: none;
			grid-template-rows: repeat(var(--cells), minmax(0, 1fr));
			display: flex;
			flex-direction: column-reverse;
		}

		li {
			flex: 1;
			grid-template-rows: none;
			grid-template-columns: 1fr 1fr;
		}

		.count,
		.value {
			font-size: 1em;
		}
	}
</style>
