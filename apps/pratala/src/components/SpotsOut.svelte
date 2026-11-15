<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	import * as PIXI from 'pixi.js';

	import { MainContainer } from 'components-layout';
	import { BaseSprite } from 'pixi-svelte';

	import BoardContainer from './BoardContainer.svelte';
	import { getContext } from '../game/context';
	import { SYMBOL_SIZE } from '../game/constants';
	import { glintTier } from '../game/glint';

	// The free spins total is paid in by the board: the board goes dark and only its lit Glint
	// Spots still shine through; while the total counts they go out one by one, the lowest first,
	// each one's fire closing to its middle and gone. Nothing flies. When the count is done, or the
	// player skips it, whatever is still lit goes out together.
	// The spots are taken off the board as this starts and drawn here, over the dark.
	type Props = {
		// how long the count runs, in ms
		duration: number;
		completed: boolean;
	};

	const props: Props = $props();
	const context = getContext();
	const frames = (tier: number) =>
		(context.stateApp.loadedAssets[`glintIgnite${tier}`] ?? []) as PIXI.Texture[];

	const OUT = 320; // one spot's fire closing
	const GAP = { least: 90, most: 280 };

	type Spot = { reel: number; row: number; tier: number; out?: number };
	let spots = $state<Spot[]>([]);
	let now = $state(0);
	let timers: ReturnType<typeof setTimeout>[] = [];
	let request = 0;

	const tick = (time: number) => {
		now = time;
		spots = spots.filter((spot) => spot.out === undefined || time < spot.out + OUT);
		request = spots.some((spot) => spot.out !== undefined) ? requestAnimationFrame(tick) : 0;
	};
	const putOut = (spot: Spot) => {
		if (spot.out !== undefined) return;
		spot.out = performance.now();
		if (!request) request = requestAnimationFrame(tick);
	};

	onMount(() => {
		if (prefersReducedMotion.current) return;
		const lit = context.stateGame.glint
			.flatMap((column, reel) => column.map((value, row) => ({ reel, row, value })))
			.filter(({ value }) => value >= 2)
			.sort((a, b) => a.value - b.value || a.reel - b.reel || a.row - b.row);
		if (!lit.length) return;
		for (const { reel, row } of lit) context.stateGame.glint[reel][row] = 0;
		spots = lit.map(({ reel, row, value }) => ({ reel, row, tier: glintTier(value) }));
		const gap = Math.max(GAP.least, Math.min(GAP.most, (props.duration * 0.8) / lit.length));
		timers = spots.map((spot, index) =>
			setTimeout(
				() => {
					putOut(spot);
					context.eventEmitter.broadcast({
						type: 'soundOnce',
						name: 'sfx_spot_out',
						forcePlay: true,
					});
				},
				350 + index * gap,
			),
		);

		return () => {
			timers.forEach(clearTimeout);
			cancelAnimationFrame(request);
		};
	});

	$effect(() => {
		if (!props.completed) return;
		untrack(() => {
			timers.forEach(clearTimeout);
			spots.forEach(putOut);
		});
	});
</script>

<MainContainer>
	<BoardContainer>
		{#each spots as spot (`${spot.reel}:${spot.row}`)}
			{@const run = frames(spot.tier)}
			{@const at =
				spot.out === undefined ? 0 : Math.min(0.999, Math.max(0, (now - spot.out) / OUT))}
			<!-- the lighting's frames run backwards: the lit tile shrinks behind a closing fire -->
			<BaseSprite
				texture={run[run.length - 1 - Math.floor(at * run.length)] ?? PIXI.Texture.EMPTY}
				anchor={0.5}
				alpha={0.85}
				x={(spot.reel + 0.5) * SYMBOL_SIZE}
				y={(spot.row + 0.5) * SYMBOL_SIZE}
				width={SYMBOL_SIZE}
				height={SYMBOL_SIZE}
			/>
		{/each}
	</BoardContainer>
</MainContainer>
