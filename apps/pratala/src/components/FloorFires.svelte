<script lang="ts">
	import { prefersReducedMotion } from 'svelte/motion';

	import { BaseSprite, Container } from 'pixi-svelte';

	import { FLOOR_FIRE_KINDS, type FloorFire } from '../game/floorFires';
	import { fireBed } from '../pixel/textures';

	// The fires on the hall's floor, drawn over the background in its own art pixels: `origin` is
	// the picture's top left on the canvas and `scale` the size of one of its art pixels.
	type Props = {
		fires: FloorFire[];
		burning: boolean;
		// while the hall heats or cools: where the heat is, and when it reaches each fire
		heat?: number;
		starts?: number[];
		// 0 to 1: the fires burn higher, for a big win in the boss hall
		surge?: number;
		origin: { x: number; y: number };
		scale: number;
	};

	const props: Props = $props();
	const FRAME_MS = 70;
	// how long a fire takes to grow from an ember to its height, in the heat's own measure
	const CATCH = 0.3;

	// drawn the first time the hall burns
	const fires = $derived(
		props.burning
			? props.fires.map((place, index) => {
					const kind = FLOOR_FIRE_KINDS[place.kind];

					return {
						...place,
						...kind,
						frames: fireBed(kind.length, kind.depth, kind.under, 20 + index, kind.taper),
					};
				})
			: [],
	);

	let step = $state(0);

	$effect(() => {
		if (!props.burning || prefersReducedMotion.current) return;
		let request = 0;
		const update = (now: number) => {
			request = requestAnimationFrame(update);
			const next = Math.floor(now / FRAME_MS);
			if (next !== step) step = next;
		};
		request = requestAnimationFrame(update);

		return () => cancelAnimationFrame(request);
	});
</script>

{#each fires as place, index (index)}
	{@const grown =
		props.heat === undefined
			? 1
			: Math.max(0, Math.min(1, (props.heat - (props.starts?.[index] ?? 0)) / CATCH))}
	<Container
		x={props.origin.x + place.x * props.scale}
		y={props.origin.y + place.y * props.scale}
		scale={{ x: place.flip ? -1 : 1, y: 1 }}
	>
		<BaseSprite
			texture={place.frames[(step + index * 5) % place.frames.length]}
			anchor={{ x: 0.5, y: place.depth / (place.depth + place.under) }}
			alpha={Math.min(1, grown * 3)}
			width={place.length * props.scale * (0.45 + 0.55 * grown)}
			height={(place.depth + place.under) * props.scale * grown * (1 + 0.5 * (props.surge ?? 0))}
		/>
	</Container>
{/each}
