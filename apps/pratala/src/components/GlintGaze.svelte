<script lang="ts">
	// The Dragon's Gaze (approved 2026-11-17). The fire shoots from the scatter on the board nearest
	// to the reel it looks along: that eye narrows and flares hot, and a thick beam of dragon-fire
	// (pixel/gazeArt.ts) reaches the reel's top from it, then comes down the reel one row at a time,
	// each spot struck as it is reached (GlintTile, GlintStrike); the other reels go dim. With no
	// scatter on the board the beam leaves the pupil of the dragon's eye in the wall. Then the beam
	// thins out and is gone.
	import { onDestroy } from 'svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	import * as PIXI from 'pixi.js';

	import { BaseSprite, Rectangle } from 'pixi-svelte';

	import BoardAnchor from './BoardAnchor.svelte';
	import BoardContainer from './BoardContainer.svelte';
	import { getContext } from '../game/context';
	import { BOARD_DIMENSIONS, FRAME_ART_PIXEL, SYMBOL_SIZE } from '../game/constants';
	import { boardSpace } from '../game/boardSpace';
	import { GAZE_FADE_MS, GAZE_REACH_MS, GAZE_ROW_MS } from '../game/glint';
	import { animate, frameAt } from '../game/motion';
	import { pixelClock } from '../game/pixelClock.svelte';
	import { getSymbolX } from '../game/utils';
	import { GAZE_BEAM, GAZE_FLICKERS, GAZE_LIGHT_ALPHA } from '../pixel/gazeArt';
	import { beamRunTextures, gazeReelBeams, type BeamTextures } from '../pixel/textures';

	const context = getContext();
	const ROWS = BOARD_DIMENSIONS.y;
	const U = FRAME_ART_PIXEL;
	// how solid the gaze is as it leaves, in held poses
	const LEAVE = [1, 0.7, 0.45, 0.2, 0];
	// how far along its way the beam has reached the reel's top, in held poses
	const REACH = [0.4, 0.75];
	const DIM = 0.38;

	type Scatter = { reel: number; row: number };
	type Gazed = {
		reel: number;
		scatter?: Scatter;
		// the run from the source to the reel's top: growing, then whole in its flickers
		growing: BeamTextures[];
		whole: BeamTextures[];
	};
	let gazed: Gazed[] = $state.raw([]);
	// -1 while the beam reaches the reel's top (reach: its pose), then the row its front is on
	let reach = $state(0);
	let front = $state(-1);
	let alpha = $state(1);

	const reels = $derived(gazeReelBeams(ROWS));
	const flicker = $derived(prefersReducedMotion.current ? 0 : pixelClock.frame % GAZE_FLICKERS);

	const scattersOnBoard = (): Scatter[] =>
		context.stateGame.board.flatMap((reel, index) =>
			reel.reelState.symbols
				.filter((symbol) => symbol.rawSymbol.name === 'S')
				.map((symbol) => ({ reel: index, row: Math.floor(symbol.symbolY.target / SYMBOL_SIZE) }))
				.filter(({ row }) => row >= 0 && row < ROWS),
		);

	// where the beam leaves from, in art pixels from the board's top-left
	const sourceFor = (reel: number, scatters: Scatter[]) => {
		const near = [...scatters].sort(
			(a, b) => Math.abs(a.reel - reel) - Math.abs(b.reel - reel) || a.row - b.row,
		)[0];
		if (near)
			return {
				scatter: near,
				x: (getSymbolX(near.reel) / SYMBOL_SIZE) * 64,
				y: (near.row + 0.5) * 64,
			};
		const pupil = boardSpace.pupil?.();
		const local = pupil && boardSpace.container?.toLocal(pupil);
		return { x: local ? local.x / U : reel * 64 + 32, y: local ? local.y / U : -64 };
	};

	const runFor = (
		reel: number,
		source: { x: number; y: number },
		upTo: number,
		head: boolean,
		flick: number,
	) => {
		const x1 = reel * 64 + 32;
		const y1 = GAZE_BEAM.top;
		return beamRunTextures({
			x0: source.x,
			y0: source.y,
			x1: source.x + (x1 - source.x) * upTo,
			y1: source.y + (y1 - source.y) * upTo,
			half0: GAZE_BEAM.from,
			half1: GAZE_BEAM.from + (GAZE_BEAM.reel - GAZE_BEAM.from) * upTo,
			head,
			flicker: flick,
			seed: 9 + reel,
		});
	};

	const release = (list: Gazed[]) =>
		list.forEach(({ growing, whole }) =>
			[...growing, ...whole].forEach(({ edge, light }) => {
				edge.destroy(true);
				light.destroy(true);
			}),
		);
	onDestroy(() => release(gazed));

	context.eventEmitter.subscribeOnMount({
		glintGazeShow: async ({ reels: looked }) => {
			const scatters = scattersOnBoard();
			release(gazed);
			gazed = looked.map((reel) => {
				const source = sourceFor(reel, scatters);
				return {
					reel,
					scatter: 'scatter' in source ? source.scatter : undefined,
					growing: REACH.map((upTo) => runFor(reel, source, upTo, true, 0)),
					whole: Array.from({ length: GAZE_FLICKERS }, (_, flick) =>
						runFor(reel, source, 1, false, flick),
					),
				};
			});
			alpha = 1;
			front = -1;
			reach = 0;
			await animate(GAZE_REACH_MS, (progress) => (reach = frameAt(progress, REACH.length + 1)));
			await animate(GAZE_ROW_MS * ROWS, (progress) => (front = Math.floor(progress * ROWS)));
			front = ROWS;
			await animate(GAZE_FADE_MS, (progress) => (alpha = LEAVE[frameAt(progress, LEAVE.length)]));
			const done = gazed;
			gazed = [];
			release(done);
		},
	});

	const run = (item: Gazed) =>
		front < 0 && reach < REACH.length ? item.growing[reach] : item.whole[flicker];
	const place = (beam: BeamTextures, dx = 0) => ({
		x: (beam.x + dx) * U,
		y: beam.y * U,
		width: beam.edge.width * U,
		height: beam.edge.height * U,
	});

	// the source eye narrows, then flares hot and holds it while the fire leaves it
	const flare = $derived(
		(context.stateApp.loadedAssets.symbolScatterFlare ?? []) as PIXI.Texture[],
	);
	const still = $derived(context.stateApp.loadedAssets.symbolScatter as PIXI.Texture | undefined);
	const flareFrame = $derived(front < 0 ? Math.min(reach, 2) : 2);
	const dark = $derived(
		gazed.length
			? Array.from({ length: BOARD_DIMENSIONS.x }, (_, reel) => reel)
					.filter((reel) => !gazed.some((item) => item.reel === reel))
					.flatMap((reel) =>
						Array.from({ length: ROWS }, (_, row) => ({ reel, row })).filter(
							(cell) =>
								!gazed.some(
									(item) => item.scatter?.reel === cell.reel && item.scatter?.row === cell.row,
								),
						),
					)
			: [],
	);
</script>

<BoardContainer>
	<BoardAnchor />
	{#each dark as cell}
		<Rectangle
			x={cell.reel * SYMBOL_SIZE}
			y={cell.row * SYMBOL_SIZE}
			width={SYMBOL_SIZE}
			height={SYMBOL_SIZE}
			backgroundColor={0x0e071b}
			backgroundAlpha={DIM * alpha}
		/>
	{/each}
	{#each gazed as item (item.reel)}
		{@const slant = run(item)}
		{#if item.scatter && flare[flareFrame] && still}
			{@const texture = flare[flareFrame]}
			<BaseSprite
				{texture}
				anchor={0.5}
				x={getSymbolX(item.scatter.reel)}
				y={(item.scatter.row + 0.5) * SYMBOL_SIZE}
				width={(SYMBOL_SIZE * texture.width) / still.width}
				height={(SYMBOL_SIZE * texture.height) / still.height}
				{alpha}
			/>
		{/if}
		{#if slant}
			<BaseSprite texture={slant.light} {...place(slant)} alpha={GAZE_LIGHT_ALPHA * alpha} />
			<BaseSprite texture={slant.edge} {...place(slant)} {alpha} />
		{/if}
		{#if front >= 0}
			{@const down = reels[Math.min(front, ROWS)][flicker]}
			<BaseSprite
				texture={down.light}
				{...place(down, item.reel * 64)}
				alpha={GAZE_LIGHT_ALPHA * alpha}
			/>
			<BaseSprite texture={down.edge} {...place(down, item.reel * 64)} {alpha} />
		{/if}
	{/each}
</BoardContainer>
