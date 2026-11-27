<script lang="ts">
	import { stateI18nDerived } from 'state-shared';

	import { NUMBERS } from '../game/keno';
	import { getContext } from '../game/context';

	type Props = {
		columns: number;
		// the player may pick and free numbers (idle, not a replay)
		editable: boolean;
	};

	const props: Props = $props();
	const context = getContext();
	const t = stateI18nDerived.translate;

	// What a tile shows, with the meanings players know from Stake's Keno: picked by the player (or
	// the book, in a replay) is violet; drawn and picked (a hit) stays violet and shows its number
	// in green on a dark ball; drawn and not picked (a miss) sinks dark; or nothing yet. A lucky
	// number (marked for the round, never one of the picks) carries a frame in the win colour and,
	// once drawn, a ball in that colour.
	const selected = $derived(context.stateGame.round?.selected ?? context.stateGame.picked);
	const drawn = $derived(context.stateGame.round?.drawn ?? []);
	const kilau = $derived(context.stateGame.round?.kilau ?? []);
	const last = $derived(drawn[drawn.length - 1]);

	const tileState = (n: number) => {
		const isDrawn = drawn.includes(n);
		const isSelected = selected.includes(n);
		if (kilau.includes(n)) return isDrawn ? 'glow' : 'kilau';
		if (isDrawn) return isSelected ? 'hit' : 'miss';
		return isSelected ? 'picked' : 'untouched';
	};

	const LABELS = {
		hit: 'hit',
		miss: 'drawn',
		picked: 'picked',
		kilau: 'Lucky number',
		glow: 'Lucky number, drawn',
		untouched: '',
	} as const;
</script>

<div
	class="board"
	style:--columns={props.columns}
	class:editable={props.editable}
	data-test="board"
>
	{#each NUMBERS as n (n)}
		{@const state = tileState(n)}
		<button
			type="button"
			class="tile {state}"
			class:last={n === last}
			data-n={n}
			data-state={state}
			aria-pressed={state === 'picked' || state === 'hit'}
			aria-label={LABELS[state] ? `${n}, ${t(LABELS[state])}` : String(n)}
			disabled={!props.editable}
			onclick={() => context.stateGameDerived.toggle(n)}
		>
			<span class="ball"></span>
			<span class="number">{n}</span>
		</button>
	{/each}
</div>

<style lang="scss">
	.board {
		display: grid;
		grid-template-columns: repeat(var(--columns), minmax(0, 1fr));
		grid-auto-rows: var(--tile-height);
		gap: var(--tile-gap);
	}

	.tile {
		position: relative;
		display: grid;
		place-items: center;
		min-width: 0;
		padding: 0;
		border: none;
		background-color: var(--keno-tile);
		color: var(--keno-muted);
		font-family: inherit;
		font-size: var(--tile-font);
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		cursor: default;
		-webkit-tap-highlight-color: transparent;
		transition:
			background-color 0.12s,
			color 0.12s;

		&:disabled {
			cursor: default;
		}

		&:focus-visible {
			outline: 2px solid var(--keno-text);
			outline-offset: 2px;
		}
	}

	.editable .tile {
		cursor: pointer;

		@media (hover: hover) {
			&.untouched:hover {
				background-color: var(--keno-tile-hover);
				color: var(--keno-text);
			}
		}

		&:active .number {
			transform: translateY(1px);
		}
	}

	.number {
		position: relative;
	}

	/* a drawn number sits on a ball: the round's draw, read at a glance */
	.ball {
		position: absolute;
		height: 80%;
		aspect-ratio: 1;
		border-radius: 50%;
		background-color: transparent;
	}

	.tile.picked {
		background-color: var(--keno-pick);
		color: var(--keno-dark);
	}

	.tile.miss {
		background-color: var(--keno-sunk);
		color: var(--keno-text);

		.ball {
			background-color: var(--keno-ball);
		}
	}

	.tile.hit {
		background-color: var(--keno-pick);
		color: var(--keno-hit);

		.ball {
			background-color: var(--keno-dark);
		}
	}

	/* a lucky number: a square frame in the win colour; drawn, its ball takes that colour */
	.tile.kilau,
	.tile.glow {
		box-shadow: inset 0 0 0 0.12em var(--keno-win);
		color: var(--keno-win);
	}

	.tile.glow {
		background-color: var(--keno-sunk);
		color: var(--keno-dark);

		.ball {
			background-color: var(--keno-win);
		}
	}

	/* the newest ball grows into place; solid, no squash */
	.tile.last .ball {
		animation: ball-in 180ms cubic-bezier(0.2, 0.8, 0.3, 1) both;
	}

	@keyframes ball-in {
		from {
			transform: scale(0.55);
			opacity: 0.4;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.tile.last .ball {
			animation: none;
		}
	}
</style>
