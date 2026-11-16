<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	import { backOut, cubicInOut, cubicOut, sineInOut } from 'svelte/easing';
	import * as PIXI from 'pixi.js';

	import { BaseSprite, Container } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { anticipation, anticipationDim } from '../game/anticipation.svelte';
	import { ART_PIXEL, BOARD_SIZES, SYMBOL_SIZE } from '../game/constants';
	import { EYE_PUPILS, HALL_SIZES } from '../game/dragonEye';
	import { hallMood } from '../game/hallMood.svelte';
	import { impact, shake } from '../game/impact.svelte';
	import { lerp } from '../game/motion';
	import { panelLayout, type PanelFace } from '../game/panels';
	import { pixelClock } from '../game/pixelClock.svelte';
	import type { Position } from '../game/types';
	import { createGazeLight } from '../pixel/gazeLight';

	// The free spins intro: the dragon wakes. The board goes dark but for its scatters, which stay
	// awake and throb; the eye in the vault snaps alert and the torches gutter for a beat. Then its
	// gaze comes down out of the vault, a slit of its orange light joined to the pupil by a faint
	// sheet, and crosses the board once from left to right; each scatter flares as the light
	// passes it. The gaze comes back to the middle and opens there, and the words land in its light
	// white-hot, cooling to gold, with a one-pixel jolt. The light stays and breathes while the
	// intro waits. No panel, no claws. With reduced motion the times are kept; there is no light
	// and no jolt. (0, 0) is the board's middle; `face` is the room the words are laid out in.
	type Props = {
		// 1 keeps the game's pixel density
		scale: number;
		// the scatters that won the free spins; rows count the padding row
		scatters?: Position[];
		children: Snippet<[{ face: PanelFace }]>;
	};

	const props: Props = $props();
	const context = getContext();
	const layout = $derived(panelLayout({ key: 'panelFreeSpinsIntro', scale: props.scale }));

	// when each thing happens, in ms from the intro's start (not sped up by turbo: it is an event)
	const AT = {
		wake: 0,
		dip: 60,
		gaze: 360,
		words: 1880,
	};
	const DIP = { fall: 140, hold: 200, rise: 640 };
	const DESCEND = 280; // the light comes down from the pupil to the board's floor
	const SWEEP = 920; // and crosses the board
	const SETTLE = 420; // and comes back to the middle, opening
	const WORDS = 260; // the words landing
	const COOL = 1500; // white-hot to gold
	const FLARE = { rise: 60, fall: 520, bloom: 0.14, peak: 0.7 };
	const BREATH = { low: 0.5, swing: 0.06, period: 2400 };

	// the lit band, in art pixels: half a reel's slit while it searches, wide as the words at rest
	const COLUMNS = BOARD_SIZES.width / ART_PIXEL;
	const ROWS = BOARD_SIZES.height / ART_PIXEL;
	const CELL = SYMBOL_SIZE / ART_PIXEL;
	const SEARCH_HALF = CELL * 0.34;
	const REST_HALF = CELL * 1.25;
	const FROM_X = CELL * 0.2;
	const TO_X = COLUMNS - CELL * 0.2;

	const still = prefersReducedMotion.current;

	// the pupil's foot, from the hall's art pixels to the board's, measured from the board's top left
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());
	const main = $derived(context.stateLayoutDerived.mainLayout());
	const board = $derived(context.stateGameDerived.boardLayout());
	const pupil = $derived.by(() => {
		const shape = canvas.width >= canvas.height ? 'Landscape' : 'Portrait';
		const hall = HALL_SIZES[shape];
		const eye = EYE_PUPILS[shape];
		const hallScale = Math.max(canvas.width / hall.width, canvas.height / hall.height);
		const onCanvas = {
			x: canvas.width / 2 + (eye.x - hall.width / 2) * hallScale,
			y: canvas.height / 2 + (eye.y - hall.height / 2) * hallScale,
		};
		const local = {
			x: (onCanvas.x - main.x) / main.scale + main.width / 2,
			y: (onCanvas.y - main.y) / main.scale + main.height / 2,
		};

		return {
			x: (local.x - (board.x - BOARD_SIZES.width / 2)) / ART_PIXEL,
			y: Math.min(0, (local.y - (board.y - BOARD_SIZES.height / 2)) / ART_PIXEL),
			half: (eye.half * hallScale) / main.scale / ART_PIXEL,
		};
	});
	// the grid the light is painted in: as wide as the board, from the pupil down to the board's floor
	const above = $derived(Math.ceil(-pupil.y));
	const light = $derived(still ? undefined : createGazeLight(COLUMNS, ROWS + above));
	$effect(() => {
		const made = light;

		return () => made?.destroy();
	});

	// the scatters, left to right, on the board's visible rows
	const flaring = $derived(
		(props.scatters ?? [])
			.map(({ reel, row }) => ({ reel, row: row - 1 }))
			.filter(({ row }) => row >= 0 && row < ROWS / CELL)
			.sort((a, b) => a.reel - b.reel || a.row - b.row),
	);
	const flares = $state<number[]>([]);

	// ms since the intro started, for the flares
	let clock = $state(0);
	let words = $state(0);
	let size = $state(1);
	let hot = $state(0);

	const sweepX = (time: number) => {
		const into = time - AT.gaze - DESCEND;
		if (into <= 0) return FROM_X;
		if (into < SWEEP) return lerp(FROM_X, TO_X, sineInOut(into / SWEEP));

		return lerp(TO_X, COLUMNS / 2, cubicInOut(Math.min(1, (into - SWEEP) / SETTLE)));
	};

	// what the light is doing at a time
	const lightAt = (time: number) => {
		const into = time - AT.gaze;
		if (into < 0) return undefined;
		const top = above;
		const bottom = above + ROWS;
		const settled = Math.min(1, Math.max(0, (into - DESCEND - SWEEP) / SETTLE));
		const opening = cubicInOut(settled);
		const breathing =
			into > DESCEND + SWEEP + SETTLE
				? BREATH.swing *
					0.5 *
					(1 - Math.cos(((into - DESCEND - SWEEP - SETTLE) / BREATH.period) * Math.PI * 2))
				: 0;

		return {
			pupil: { x: pupil.x, y: above + pupil.y, half: pupil.half },
			top,
			bottom,
			x: sweepX(time),
			half: lerp(SEARCH_HALF, REST_HALF, opening),
			front: lerp(above + pupil.y, bottom + 1, Math.min(1, into / DESCEND)),
			// it cools a step down the ramp as it opens
			cool: settled >= 0.5 ? 1 : 0,
			strength: lerp(1, BREATH.low, opening) - breathing,
			shimmer: (pixelClock.frame % 2) * 2,
		};
	};

	const play = (name: 'sfx_brand_land' | `sfx_scatter_stop_${1 | 2 | 3 | 4 | 5}`) =>
		context.eventEmitter.broadcast({ type: 'soundOnce', name, forcePlay: true });

	onMount(() => {
		let alive = true;
		let request = 0;
		const start = performance.now();
		const done = { gaze: false, words: false };
		const lit = new Set<number>();
		// once the light has settled it changes only on the pixel clock, so it is painted then
		let painted = -1;
		clock = 0;
		context.eventEmitter.broadcast({ type: 'dragonReact', reaction: 'wake' });

		const tick = (now: number) => {
			if (!alive) return;
			request = requestAnimationFrame(tick);
			const time = now - start;
			clock = time;

			// the torches gutter for a beat
			const dipping = time - AT.dip;
			hallMood.dip =
				dipping < 0
					? 0
					: dipping < DIP.fall
						? cubicOut(dipping / DIP.fall)
						: dipping < DIP.fall + DIP.hold
							? 1
							: 1 - cubicInOut(Math.min(1, (dipping - DIP.fall - DIP.hold) / DIP.rise));

			if (!done.gaze && time >= AT.gaze) {
				done.gaze = true;
				context.eventEmitter.broadcast({ type: 'dragonReact', reaction: 'stare' });
			}

			// each scatter flares as the middle of the light passes it
			const x = sweepX(time);
			flaring.forEach(({ reel }, index) => {
				if (lit.has(index) || time < AT.gaze + DESCEND || x < (reel + 0.5) * CELL) return;
				lit.add(index);
				flares[index] = time;
				play(`sfx_scatter_stop_${Math.min(5, lit.size) as 1 | 2 | 3 | 4 | 5}`);
			});

			if (!done.words && time >= AT.words) {
				done.words = true;
				play('sfx_brand_land');
				shake(1, 200);
			}
			const landing = Math.min(1, Math.max(0, (time - AT.words) / WORDS));
			words = still ? landing : Math.min(1, landing * 3);
			// the scatters step back as the words land over them
			anticipation.hush = landing;
			size = still ? 1 : 1.16 - 0.16 * backOut(landing);
			hot = time < AT.words ? 0 : 1 - cubicOut(Math.min(1, (time - AT.words - WORDS) / COOL));

			const resting = time > AT.gaze + DESCEND + SWEEP + SETTLE;
			if (light && (!resting || painted !== pixelClock.frame)) {
				painted = resting ? pixelClock.frame : -1;
				light.paint(lightAt(time));
			}
		};
		request = requestAnimationFrame(tick);

		return () => {
			alive = false;
			cancelAnimationFrame(request);
			anticipation.hush = 0;
			hallMood.dip = 0;
		};
	});

	// how bright a scatter's flare is now: a quick rise, a long fall
	const flareAt = (index: number) => {
		const from = flares[index];
		if (from === undefined) return 0;
		const into = clock - from;
		if (into < FLARE.rise) return into / FLARE.rise;

		return Math.max(0, 1 - cubicOut((into - FLARE.rise) / FLARE.fall));
	};
	const flash = $derived(
		(context.stateApp.loadedAssets.symbolScatterFlash as PIXI.Texture | undefined) ??
			PIXI.Texture.EMPTY,
	);
	// the scatters throb with the board's held breath (SymbolSprite)
	const throb = $derived(still ? 1 : 1 + 0.09 * anticipation.pulse * anticipationDim.current);
</script>

<!-- the light comes from the eye, so it keeps still when the board jolts -->
{#if light}
	<BaseSprite
		texture={light.texture}
		x={-BOARD_SIZES.width / 2}
		y={-BOARD_SIZES.height / 2 - above * ART_PIXEL}
		width={COLUMNS * ART_PIXEL}
		height={(ROWS + above) * ART_PIXEL}
		blendMode="add"
	/>
{/if}

<Container x={impact.x} y={impact.y}>

	{#each flaring as { reel, row }, index}
		{@const glow = flareAt(index)}
		{@const grown = SYMBOL_SIZE * throb * (still ? 1 : 1 + FLARE.bloom * (1 - glow))}
		{#if glow > 0}
			<BaseSprite
				texture={flash}
				anchor={0.5}
				x={(reel + 0.5) * SYMBOL_SIZE - BOARD_SIZES.width / 2}
				y={(row + 0.5) * SYMBOL_SIZE - BOARD_SIZES.height / 2}
				width={grown}
				height={grown}
				tint={glow > 0.6 ? 0xffeb57 : 0xffa214}
				alpha={glow * FLARE.peak}
				blendMode="add"
			/>
		{/if}
	{/each}

	<Container scale={size} alpha={words}>
		{@render props.children({ face: layout.face })}
		{#if hot > 0}
			<Container blendMode="add" alpha={hot}>
				{@render props.children({ face: layout.face })}
			</Container>
		{/if}
	</Container>
</Container>
