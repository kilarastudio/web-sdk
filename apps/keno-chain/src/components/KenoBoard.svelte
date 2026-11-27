<script lang="ts">
	import { stateI18nDerived } from 'state-shared';

	import { NUMBERS, chains, parseMode } from '../game/keno';
	import { getContext } from '../game/context';

	type Props = {
		// the player may pick and free numbers (idle, not a replay)
		editable: boolean;
		// the board's measures in the HUD's unit (em): its width, the gap between tiles, a tile's
		// height with the edge under it, and that edge
		width: number;
		gap: number;
		tileHeight: number;
		lip: number;
		// a tile's number, in the unit
		tileFont: number;
		// the unit in screen pixels
		unit: number;
	};

	const props: Props = $props();
	const context = getContext();
	const t = stateI18nDerived.translate;

	const COLUMNS = 8;
	const ROWS = NUMBERS.length / COLUMNS;

	// What a tile shows, with the meanings players know from Stake's Keno: picked by the player (or
	// the book, in a replay) is violet; drawn and picked (a hit) carries a green token; drawn and not
	// picked (a miss) sinks dark with a red number; or nothing yet. A lucky number (marked for the
	// round, never one of the picks) has a frame in the win colour and, once drawn, a token in it.
	const round = $derived(context.stateGame.round);
	const selected = $derived(round?.selected ?? context.stateGame.picked);
	const drawn = $derived(round?.drawn ?? []);
	const kilau = $derived(round?.kilau ?? []);
	const hidden = $derived(context.stateGame.hidden);
	// while the draw runs the numbers not in play step back
	const live = $derived(!!round && !round.done);

	const tileState = (n: number) => {
		const isDrawn = drawn.includes(n);
		const isSelected = selected.includes(n);
		if (kilau.includes(n)) return isDrawn ? 'glow' : 'kilau';
		if (isDrawn) return isSelected ? 'hit' : 'miss';
		return isSelected && !hidden.includes(n) ? 'picked' : 'untouched';
	};

	const LABELS = {
		hit: 'hit',
		miss: 'drawn',
		picked: 'picked',
		kilau: 'Lucky number',
		glow: 'Lucky number, drawn',
		untouched: '',
	} as const;

	// The links of the chain run in the gaps between the tiles, in straight runs, and never cross
	// a number. Worked out from the board's measures, in the HUD's unit.
	const tileWidth = $derived((props.width - props.gap * (COLUMNS - 1)) / COLUMNS);
	const height = $derived(props.tileHeight * ROWS + props.gap * (ROWS - 1));

	const route = (a: number, b: number) => {
		const w = tileWidth;
		const h = props.tileHeight;
		const g = props.gap;
		const box = (n: number) => {
			const c = (n - 1) % COLUMNS;
			const r = Math.floor((n - 1) / COLUMNS);
			const left = c * (w + g);
			const top = r * (h + g);
			return {
				c,
				r,
				x: left + w / 2,
				y: top + (h - props.lip) / 2,
				left,
				right: left + w,
				top,
				bottom: top + h,
			};
		};
		// the gap under row r, and the gap right of column c
		const gapY = (r: number) => r * (h + g) + h + g / 2;
		const gapX = (c: number) => c * (w + g) + w + g / 2;
		const A = box(a);
		const B = box(b);
		let points: number[][];

		if (A.r === B.r) {
			if (Math.abs(A.c - B.c) === 1) {
				points = [
					[A.c < B.c ? A.right : A.left, A.y],
					[A.c < B.c ? B.left : B.right, A.y],
				];
			} else {
				const under = A.r < ROWS - 1;
				const lane = under ? gapY(A.r) : gapY(A.r - 1);
				const edge = under ? A.bottom : A.top;
				points = [
					[A.x, edge],
					[A.x, lane],
					[B.x, lane],
					[B.x, edge],
				];
			}
		} else {
			const down = B.r > A.r;
			const from = down ? A.bottom : A.top;
			const to = down ? B.top : B.bottom;
			const first = down ? gapY(A.r) : gapY(A.r - 1);
			const last = down ? gapY(B.r - 1) : gapY(B.r);
			if (Math.abs(A.r - B.r) === 1) {
				points = [
					[A.x, from],
					[A.x, first],
					[B.x, first],
					[B.x, to],
				];
			} else {
				const side =
					A.c < B.c
						? gapX(B.c - 1)
						: A.c > B.c
							? gapX(B.c)
							: B.c < COLUMNS - 1
								? gapX(B.c)
								: gapX(B.c - 1);
				points = [
					[A.x, from],
					[A.x, first],
					[side, first],
					[side, last],
					[B.x, last],
					[B.x, to],
				];
			}
		}
		// in screen pixels, so a link is 2 px wide at every size
		return (
			'M' +
			points
				.map(([x, y]) => `${Math.round(x * props.unit)} ${Math.round(y * props.unit)}`)
				.join('L')
		);
	};

	// While the draw runs: the hits of the run in play, joined. Once it ends: the chain that set
	// the multiplier, in the multiplier's colour.
	const links = $derived.by(() => {
		if (!round) return [];
		const level = parseMode(round.mode)!.level;
		const { chain, best } = chains(level, round.drawn, round.pattern);
		const shown = round.done ? best : chain;
		return shown.slice(1).map((n, i) => ({
			id: `${shown[i]}-${n}${round.done ? '-best' : ''}`,
			path: route(shown[i], n),
			best: round.done,
		}));
	});

	// the token of a drawn number: a flat regular octagon
	const TOKEN = 'M11.72 0h16.56L40 11.72v16.56L28.28 40H11.72L0 28.28V11.72z';
</script>

<div
	class="board-wrap"
	style:--board-gap="{props.gap}em"
	style:--tile-h="{props.tileHeight}em"
	style:--lip="{props.lip}em"
	style:--tile-font-units={props.tileFont}
>
	<div class="board" class:editable={props.editable} class:live data-test="board">
		{#each NUMBERS as n (n)}
			{@const state = tileState(n)}
			<button
				type="button"
				class="tile {state}"
				class:wait={round?.waiting && selected.includes(n) && !drawn.includes(n)}
				data-n={n}
				data-state={state}
				aria-pressed={state === 'picked' || state === 'hit'}
				aria-label={LABELS[state] ? `${n}, ${t(LABELS[state])}` : String(n)}
				disabled={!props.editable}
				onclick={() => context.stateGameDerived.toggle(n)}
			>
				<span class="face">
					{#if state === 'hit' || state === 'glow'}
						<svg
							class="token {state}"
							viewBox="0 0 40 40"
							aria-hidden="true"
						>
							<clipPath id="token-{n}"><path d={TOKEN} /></clipPath>
							<path d={TOKEN} />
							<!-- the gleam: a wide band of light and a thin one after it cross the face -->
							<g clip-path="url(#token-{n})">
								<g class="sheen">
									<path d="M-18 0h10l-11 40h-10z" />
									<path class="thin" d="M-4 0h3l-11 40h-3z" />
								</g>
							</g>
						</svg>
					{/if}
					<span class="num">{n}</span>
					{#if state === 'kilau'}
						<svg class="up" viewBox="0 0 12 12" aria-hidden="true">
							<path d="M6 1.5 11 8H8v2.5H4V8H1z" />
						</svg>
					{/if}
				</span>
			</button>
		{/each}
	</div>
	<svg
		class="lines"
		viewBox="0 0 {props.width * props.unit} {height * props.unit}"
		aria-hidden="true"
	>
		{#each links as link (link.id)}
			<path class:best={link.best} pathLength="1" d={link.path} />
		{/each}
	</svg>
</div>

<style lang="scss">
	.board-wrap {
		position: relative;
	}

	/* 8 × 5 flat square tiles, each with a hard edge under it */
	.board {
		display: grid;
		grid-template-columns: repeat(8, minmax(0, 1fr));
		gap: var(--board-gap);
	}

	.tile {
		position: relative;
		height: calc(var(--tile-h) / var(--tile-font-units));
		min-width: 0;
		padding: 0;
		border: none;
		background-color: var(--tile-lip);
		color: inherit;
		font-family: inherit;
		font-size: calc(var(--tile-font-units) * 1em);
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		cursor: default;
		-webkit-tap-highlight-color: transparent;

		&:focus-visible {
			outline: 2px solid var(--text);
			outline-offset: 2px;
		}
	}

	/* the lengths inside a tile are the board's, not the tile's own em */
	.face {
		position: absolute;
		inset: 0 0 calc(var(--lip) / var(--tile-font-units)) 0;
		display: grid;
		place-items: center;
		background-color: var(--tile);
		color: var(--text);
		transition:
			background-color 0.1s,
			color 0.1s;
	}

	.num {
		position: relative;
		z-index: 2;
	}

	.editable .tile {
		cursor: pointer;

		@media (hover: hover) {
			&.untouched:hover .face {
				background-color: var(--tile-hover);
			}
		}

		&:active .face {
			inset: calc(var(--lip) / var(--tile-font-units) / 2) 0;
		}
	}

	.live .tile.untouched .face {
		color: var(--faint);
	}

	.tile.picked,
	.tile.hit {
		background-color: var(--pick-lip);
	}

	.tile.picked .face {
		background-color: var(--pick);
		color: var(--pick-ink);
	}

	/* drawn, not picked: the tile sinks, its face turns flat dark and its number red */
	.tile.miss {
		/* the darker strip over the face is the edge it sank under */
		background-color: var(--sunk-edge);

		.face {
			inset: calc(var(--lip) / var(--tile-font-units)) 0 0 0;
			background-color: var(--sunk);
			color: var(--miss);
		}
	}

	/* drawn and picked: a flat octagon, with no edge or shadow, lands on the tile, and light gleams
	   across its face once, as on a cut stone */
	.tile.hit {
		.face {
			background-color: var(--pick-hit);
		}

		.num {
			color: var(--hit-ink);
			font-size: 0.9em;
			font-weight: 700;
		}
	}

	.token {
		position: absolute;
		z-index: 1;
		left: 50%;
		top: 50%;
		/* a regular octagon, as large as fits this box: on a tall tile the tile's width sets its size */
		width: 94%;
		height: 90%;
		translate: -50% -50%;
		animation: token-in 0.26s cubic-bezier(0.2, 0.8, 0.2, 1) both;

		&.hit {
			fill: var(--hit);
		}

		&.glow {
			fill: var(--gold-token);
		}

		/* once it has landed, light crosses its face: nothing leaves the token */
		.sheen {
			fill: #fff;
			animation: sheen 0.6s 0.2s cubic-bezier(0.4, 0, 0.3, 1) both;

			path {
				opacity: 0.45;
			}

			.thin {
				opacity: 0.85;
			}
		}
	}

	@keyframes sheen {
		to {
			transform: translateX(76px);
		}
	}

	/* it grows in and settles: one eased move, no held poses */
	@keyframes token-in {
		from {
			scale: 0.55;
			opacity: 0;
		}
		60% {
			scale: 1.08;
			opacity: 1;
		}
		to {
			scale: 1;
		}
	}

	/* a lucky number: not one of the picks; if it is drawn the multiplier climbs one step */
	.tile.kilau {
		background-color: var(--gold-dim);
		animation: kilau-in 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) both;

		.face {
			background-color: var(--gold-ground);
			box-shadow: inset 0 0 0 2px var(--gold);
			color: var(--gold);
		}
	}

	.up {
		position: absolute;
		z-index: 2;
		right: 7%;
		top: 7%;
		width: 26%;
		height: 26%;
		fill: var(--gold);
	}

	.tile.glow {
		background-color: var(--gold-lip);

		.face {
			background-color: var(--gold-face);
		}

		.num {
			color: var(--gold-ink);
			font-size: 0.9em;
			font-weight: 700;
		}
	}

	@keyframes kilau-in {
		from {
			transform: translateY(-4px);
			opacity: 0.4;
		}
	}

	.tile.wait .face {
		animation: wait 0.45s ease-in-out infinite alternate;
	}

	@keyframes wait {
		to {
			background-color: var(--pick-wait);
		}
	}

	.lines {
		position: absolute;
		inset: 0;
		z-index: 4;
		width: 100%;
		height: 100%;
		overflow: visible;
		pointer-events: none;

		path {
			fill: none;
			stroke: var(--hit);
			stroke-width: 2px;
			stroke-dasharray: 1;
			animation: draw 0.2s ease-out both;
		}

		path.best {
			stroke: var(--gold);
		}
	}

	@keyframes draw {
		from {
			stroke-dashoffset: 1;
		}
		to {
			stroke-dashoffset: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.token,
		.tile.kilau,
		.lines path {
			animation-duration: 0.01s;
		}

		.sheen {
			display: none;
		}

		.tile.wait .face {
			animation: none;
		}
	}
</style>
