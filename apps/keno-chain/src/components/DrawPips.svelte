<script lang="ts">
	import _ from 'lodash';

	import config from '../game/config';
	import { HIT, KILAU, MISS, linked } from '../game/keno';
	import { getContext } from '../game/context';

	// The draw in order: one square per ball the round draws (10, or 12 in Chain and Chain Max).
	// A hit is green, a lucky ball gold, a miss small and grey; hits that follow each other are
	// joined, and that is the chain.
	const context = getContext();
	const round = $derived(context.stateGame.round);
	const draws = $derived(round?.draws ?? config.levelDraws[context.stateGameDerived.level()]);
	const links = $derived(linked(round?.pattern ?? []));
</script>

<div class="pips" data-test="draw-pips" data-drawn={round?.drawn.length ?? 0} aria-hidden="true">
	{#each _.range(draws) as index}
		{@const ball = round?.pattern[index]}
		<i
			class:hit={ball === HIT}
			class:kilau={ball === KILAU}
			class:miss={ball === MISS}
			class:link={links[index]}
		></i>
	{/each}
</div>

<style lang="scss">
	.pips {
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: minmax(0, 1fr);
		height: 1.2em;
		padding: 0 2px;
	}

	i {
		position: relative;
		display: block;

		&::after {
			content: '';
			position: absolute;
			left: 50%;
			top: 50%;
			width: 0.8em;
			height: 0.8em;
			margin: -0.4em;
			background-color: var(--field);
			transition:
				background-color 0.14s,
				transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
		}

		&.miss::after {
			background-color: var(--faint);
			transform: scale(0.5);
		}

		&.hit::after {
			background-color: var(--hit);
			transform: scale(1.2);
		}

		&.kilau::after {
			background-color: var(--gold);
			transform: scale(1.2);
		}

		&.link::before {
			content: '';
			position: absolute;
			right: 50%;
			top: 50%;
			width: 100%;
			height: 2px;
			margin-top: -1px;
			background-color: var(--hit);
			transform-origin: right;
			animation: link-in 0.18s ease-out both;
		}
	}

	@keyframes link-in {
		from {
			transform: scaleX(0);
		}
	}
</style>
