<script lang="ts">
	import { untrack } from 'svelte';
	import { prefersReducedMotion } from 'svelte/motion';

	import { BaseSprite, Container, Rectangle } from 'pixi-svelte';

	import BoardContainer from './BoardContainer.svelte';
	import { getContext } from '../game/context';
	import type { Reel } from '../game/stateGame.svelte';
	import { BOARD_DIMENSIONS, FRAME_ART_PIXEL, SYMBOL_SIZE } from '../game/constants';
	import { animate } from '../game/motion';
	import { pixelClock } from '../game/pixelClock.svelte';
	import { WALL_FRAMES, WALL_LEVELS } from '../pixel/anticipationArt';
	import { anticipationBed, anticipationWalls } from '../pixel/textures';

	type Props = {
		reel: Reel;
		oncomplete: () => void;
	};

	const props: Props = $props();
	const context = getContext();

	// A column waiting on a scatter is walled in by fire on both sides (pixel/anticipationArt.ts),
	// lit orange inside in flat bands, and every other column sinks into the dark but for the
	// scatters already down. Waiting on the 4th or 5th scatter it burns stronger: wider, taller,
	// white-hot walls, a bed of fire at the column's foot, more light, deeper dark. Once the column
	// has landed it all goes in a few steps. Sizes in art pixels, 64 to a cell.
	const U = FRAME_ART_PIXEL;
	const ROWS = BOARD_DIMENSIONS.y;
	const HEIGHT = ROWS * 64;
	const BED = 18;
	const reelIndex = untrack(() => props.reel.reelIndex);

	// the scatters already down, by reel and row
	const isScatter = (name: string) => name === 'S';
	const landed = untrack(() =>
		context.stateGame.board.flatMap((reel, index) =>
			index === reelIndex || reel.reelState.motion !== 'stopped'
				? []
				: reel.reelState.symbols
						.filter((symbol) => isScatter(symbol.rawSymbol.name))
						.map((symbol) => ({
							reel: index,
							row: Math.floor(symbol.symbolY.target / SYMBOL_SIZE),
						}))
						.filter(({ row }) => row >= 0 && row < ROWS),
		),
	);
	const level = landed.length >= 3 ? 2 : 1;
	const look = WALL_LEVELS[level];
	const walls = anticipationWalls(level, HEIGHT);
	const bed = level === 2 ? anticipationBed(64, BED) : [];

	let fade = $state(1);
	let leaving = false;
	$effect(() => {
		if (props.reel.reelState.motion !== 'stopped' || leaving) return;
		leaving = true;
		animate(
			200,
			(progress) => (fade = [1, 0.6, 0.3, 0][Math.min(3, Math.floor(progress * 4))]),
		).then(props.oncomplete);
	});

	const reduced = $derived(prefersReducedMotion.current);
	const frame = $derived(reduced ? 0 : pixelClock.frame % WALL_FRAMES);
	const left = reelIndex * SYMBOL_SIZE;
	const right = (reelIndex + 1) * SYMBOL_SIZE;
	const dark = Array.from({ length: BOARD_DIMENSIONS.x }, (_, reel) => reel)
		.filter((reel) => reel !== reelIndex)
		.flatMap((reel) =>
			Array.from({ length: ROWS }, (_, row) => ({ reel, row })).filter(
				(cell) => !landed.some((at) => at.reel === cell.reel && at.row === cell.row),
			),
		);
	// the column's light: strongest next to the walls
	const bands = [
		[
			[0, 12],
			[52, 12],
		],
		[
			[12, 10],
			[42, 10],
		],
		[[22, 20]],
	] as const;
	const wallTexture = (offset: number) => walls[(frame + offset) % walls.length];
</script>

<BoardContainer>
	{#each dark as cell}
		<Rectangle
			x={cell.reel * SYMBOL_SIZE}
			y={cell.row * SYMBOL_SIZE}
			width={SYMBOL_SIZE}
			height={SYMBOL_SIZE}
			backgroundColor={0x0e071b}
			backgroundAlpha={look.dim * fade}
		/>
	{/each}
	{#each bands as band, index}
		{#each band as [x, width]}
			<Rectangle
				x={left + x * U}
				y={0}
				width={width * U}
				height={HEIGHT * U}
				backgroundColor={look.light[index][1]}
				backgroundAlpha={look.light[index][0] * fade}
			/>
		{/each}
	{/each}
	{#if bed.length}
		<BaseSprite
			texture={bed[frame % bed.length]}
			x={left}
			y={(HEIGHT - BED) * U}
			width={64 * U}
			height={BED * U}
			alpha={fade}
		/>
	{/if}
	<!-- the right wall is the left one turned round, a few frames on -->
	{#each [left, right] as edge, side}
		{@const texture = wallTexture(side * 7)}
		<Container x={edge} y={-look.tip * U} scale={{ x: side ? -1 : 1, y: 1 }}>
			<BaseSprite
				{texture}
				anchor={{ x: 0.5, y: 0 }}
				width={texture.width * U}
				height={texture.height * U}
				alpha={fade}
			/>
		</Container>
	{/each}
</BoardContainer>
