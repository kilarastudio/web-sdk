<script lang="ts">
	import _ from 'lodash';

	import { stateI18nDerived } from 'state-shared';

	import config from '../game/config';
	import { getContext } from '../game/context';

	// The draw in order: one slot per number the round draws (10, or 12 in Chain), filled as each
	// number comes out, a hit in green, a Kilau ball in the win colour. The two counters keep the room of their widest value (a
	// hidden copy of it), so the strip between them never moves while the numbers change.
	const context = getContext();
	const round = $derived(context.stateGame.round);
	const draws = $derived(round?.draws ?? config.levelDraws[context.stateGameDerived.level()]);
</script>

<div class="tray" data-test="draw-tray">
	<span class="label">
		{stateI18nDerived.translate('DRAW')}
		<b class="count">
			<span class="widest" aria-hidden="true">{draws}/{draws}</span>
			<span>{round?.drawn.length ?? 0}/{draws}</span>
		</b>
	</span>
	<ol class="slots" style:--draws={draws}>
		{#each _.range(draws) as index}
			{@const n = round?.drawn[index]}
			<li
				class:hit={round?.pattern[index] === 1}
				class:kilau={round?.pattern[index] === 2}
				class:miss={round?.pattern[index] === 0}
			>
				{n ?? ''}
			</li>
		{/each}
	</ol>
	<span class="label hits">
		{stateI18nDerived.translate('HITS')}
		<b class="count">
			<span class="widest" aria-hidden="true">{draws}</span>
			<span data-test="hits">{round?.hits ?? 0}</span>
		</b>
	</span>
</div>

<style lang="scss">
	.tray {
		display: flex;
		align-items: center;
		gap: 0.6em;
		height: 100%;
	}

	.label {
		flex: none;
		min-width: 4.4em;
		color: var(--keno-muted);
		font-size: 0.9em;
		font-weight: 700;
		letter-spacing: 0.1em;

		b {
			color: var(--keno-text);
			font-variant-numeric: tabular-nums;
		}

		&.hits {
			min-width: 3.6em;
			text-align: right;

			.count {
				justify-items: end;
			}
		}
	}

	/* the live value over a hidden copy of the widest one: the counter's width never changes */
	.count {
		display: inline-grid;
		justify-items: start;
		vertical-align: bottom;

		> * {
			grid-area: 1 / 1;
		}
	}

	.widest {
		visibility: hidden;
	}

	.slots {
		flex: 1;
		display: grid;
		grid-template-columns: repeat(var(--draws), minmax(0, 1fr));
		justify-items: center;
		gap: 0.2em;
		height: 100%;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		display: grid;
		place-items: center;
		height: 100%;
		max-width: 100%;
		aspect-ratio: 1;
		border-radius: 50%;
		background-color: var(--keno-tile);
		color: var(--keno-text);
		font-size: 0.95em;
		font-weight: 700;
		font-variant-numeric: tabular-nums;

		&.miss {
			background-color: var(--keno-ball);
		}

		&.hit {
			background-color: var(--keno-hit);
			color: var(--keno-dark);
		}

		&.kilau {
			background-color: var(--keno-win);
			color: var(--keno-dark);
		}
	}
</style>
