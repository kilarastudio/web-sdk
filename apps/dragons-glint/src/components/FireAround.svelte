<script lang="ts">
	import { prefersReducedMotion } from 'svelte/motion';
	import * as PIXI from 'pixi.js';

	import { BaseSprite } from 'pixi-svelte';

	import { ART_PIXEL } from '../game/constants';
	import { FIRE_REACH } from '../pixel/ui';

	// Fire round a rectangle: flames along its top and up its sides, outside it, their feet tucked
	// one art pixel under its edge. x, y, width and height are the rectangle's, in game units; the
	// frames come from fireAround (src/pixel/textures.ts) for the same rectangle in art pixels.
	type Props = {
		x: number;
		y: number;
		width: number;
		height: number;
		frames: { top: PIXI.Texture[]; left: PIXI.Texture[]; right: PIXI.Texture[] };
	};

	const props: Props = $props();
	const FRAME_MS = 60;
	const top = FIRE_REACH.top * ART_PIXEL;
	const side = FIRE_REACH.side * ART_PIXEL;

	let step = $state(0);

	$effect(() => {
		if (prefersReducedMotion.current) return;
		let request = 0;
		const update = (now: number) => {
			request = requestAnimationFrame(update);
			const next = Math.floor(now / FRAME_MS);
			if (next !== step) step = next;
		};
		request = requestAnimationFrame(update);

		return () => cancelAnimationFrame(request);
	});

	const at = (run: PIXI.Texture[]) => run[step % Math.max(1, run.length)] ?? PIXI.Texture.EMPTY;
</script>

<BaseSprite
	texture={at(props.frames.top)}
	x={props.x - side}
	y={props.y - top + ART_PIXEL}
	width={props.width + side * 2}
	height={top}
/>
<BaseSprite
	texture={at(props.frames.left)}
	x={props.x - side + ART_PIXEL}
	y={props.y}
	width={side}
	height={props.height}
/>
<BaseSprite
	texture={at(props.frames.right)}
	x={props.x + props.width - ART_PIXEL}
	y={props.y}
	width={side}
	height={props.height}
/>
