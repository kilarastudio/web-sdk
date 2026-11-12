<script lang="ts">
	import { onMount } from 'svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	import { quadIn, quadOut } from 'svelte/easing';
	import * as PIXI from 'pixi.js';

	import { BaseSprite, Container, Rectangle } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { ART_PIXEL } from '../game/constants';
	import { animate } from '../game/motion';
	import { FIRE_WALL } from '../pixel/ui';

	type Props = {
		// full covers the screen, holds and uncovers; cover and uncover are its two halves, for a
		// wipe that spans a change of screen
		mode?: 'full' | 'cover' | 'uncover';
		// the screen is fully dark: the moment to change what is behind it
		oncovered?: () => void;
		oncomplete: () => void;
	};

	const props: Props = $props();
	const context = getContext();

	// The dragon's fire sweeps the screen: a wall of flames rushes up from below, its embers cooling
	// into the dark banks of its smoke, the scene changes while the smoke covers the screen, and
	// the smoke rolls on upward and away, its charred edge last. The wall is one tall curtain
	// moving up: flames, embers, a screen's height of smoke, the charred edge. It slows as it
	// covers and never stops, so the dark is a moment of rolling smoke. Drawn at the game's own
	// pixel size.
	const DURATION = 1100;
	const SMOKE = 0x0e071b;
	const FRAME_MS = 60;

	const mode = props.mode ?? 'full';
	const from = mode === 'uncover' ? 0.5 : 0;
	const to = mode === 'cover' ? 0.5 : 1;
	let progress = $state(from);
	let covered = mode === 'uncover';
	let frame = $state(0);

	const canvas = $derived(context.stateLayoutDerived.canvasSizes());
	const pixel = $derived(ART_PIXEL * context.stateLayoutDerived.mainLayout().scale);
	const tile = $derived(FIRE_WALL.length * pixel);
	const front = $derived((FIRE_WALL.flames + FIRE_WALL.embers) * pixel);
	const tail = $derived(FIRE_WALL.tail * pixel);
	const tiles = $derived(Math.ceil(canvas.width / tile) + 1);
	const flames = $derived((context.stateApp.loadedAssets.fireWall ?? []) as PIXI.Texture[]);
	const edge = $derived(
		(context.stateApp.loadedAssets.fireWallTail ?? PIXI.Texture.EMPTY) as PIXI.Texture,
	);
	const smoke = $derived(
		(context.stateApp.loadedAssets.fireWallSmoke ?? PIXI.Texture.EMPTY) as PIXI.Texture,
	);
	// the smoke is laid in square tiles from its top down; the last row is cut to the screen's
	// height, so the smoke ends exactly at the charred edge
	const smokeTile = $derived(FIRE_WALL.smoke * pixel);
	const smokeRows = $derived.by(() => {
		const height = canvas.height + 2;
		const whole = Math.floor(height / smokeTile);
		const rest = height - whole * smokeTile;
		const rows = Array.from({ length: whole }, (_, index) => ({
			y: index * smokeTile,
			height: smokeTile,
			texture: smoke,
		}));
		if (rest > 0 && smoke.source)
			rows.push({
				y: whole * smokeTile,
				height: rest,
				texture: new PIXI.Texture({
					source: smoke.source,
					frame: new PIXI.Rectangle(
						0,
						0,
						smoke.source.width,
						(smoke.source.height * rest) / smokeTile,
					),
				}),
			});

		return rows;
	});

	// where the wall is: 0 all below the screen, 0.5 its smoke over all of it, 1 all above. It
	// rushes in and slows as it covers, to a third of its speed and no less, then lifts away
	// gathering speed again.
	const KEEP = 0.35;
	const sweep = (at: number) =>
		at < 0.5
			? 0.5 * (KEEP * (at / 0.5) + (1 - KEEP) * quadOut(at / 0.5))
			: 0.5 + 0.5 * (KEEP * ((at - 0.5) / 0.5) + (1 - KEEP) * quadIn((at - 0.5) / 0.5));
	// the top of the flames, from just under the screen to a whole curtain above it
	const top = $derived.by(() => {
		const at = sweep(progress);
		return at <= 0.5
			? canvas.height + (-front - canvas.height) * (at / 0.5)
			: -front - (canvas.height + tail) * ((at - 0.5) / 0.5);
	});

	onMount(() => {
		animate(
			DURATION * (to - from),
			(value) => {
				progress = from + (to - from) * value;
				frame = Math.floor(performance.now() / FRAME_MS);
				if (!covered && progress >= 0.5) {
					covered = true;
					props.oncovered?.();
				}
			},
			{ timeScaled: false },
		).then(props.oncomplete);
	});
</script>

<Container zIndex={10}>
	{#if prefersReducedMotion.current}
		<Rectangle
			width={canvas.width}
			height={canvas.height}
			backgroundColor={SMOKE}
			backgroundAlpha={Math.sin(Math.PI * progress)}
		/>
	{:else}
		{#each { length: tiles }, index}
			<BaseSprite
				texture={flames[frame % Math.max(1, flames.length)] ?? PIXI.Texture.EMPTY}
				x={index * tile}
				y={top}
				width={tile + 1}
				height={front}
			/>
			<BaseSprite
				texture={edge}
				x={index * tile}
				y={top + front + canvas.height - 1}
				width={tile + 1}
				height={tail}
			/>
		{/each}
		<Rectangle
			y={top + front - 1}
			width={canvas.width}
			height={canvas.height + 2}
			backgroundColor={SMOKE}
		/>
		{#each smokeRows as row}
			{#each { length: tiles }, index}
				<BaseSprite
					texture={row.texture}
					x={index * tile}
					y={top + front - 1 + row.y}
					width={tile + 1}
					height={row.height}
				/>
			{/each}
		{/each}
	{/if}
</Container>
