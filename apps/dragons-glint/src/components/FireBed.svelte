<script lang="ts">
	import { untrack } from 'svelte';
	import { prefersReducedMotion, Tween } from 'svelte/motion';
	import { backOut, cubicIn, cubicOut } from 'svelte/easing';

	import { BaseSprite, Container } from 'pixi-svelte';

	import { ART_PIXEL } from '../game/constants';
	import { fireBed } from '../pixel/textures';

	// A bed of fire for an amount to stand in, in place of a panel: it has no edge, it catches
	// when it is lit and sinks when it is not, and it leaps each time `flare` changes. (0, 0) is
	// the middle of its foot. `length` and `depth` are its drawing's, in art pixels; `grow` scales
	// it about its foot, so a bigger win burns wider and higher.
	type Props = {
		length: number;
		depth: number;
		// rows of ragged underside below the foot, for a bed that stands on nothing
		under?: number;
		// how wildly it burns (src/pixel/ui.ts edgeFireFrames)
		wild?: number;
		lit?: boolean;
		flare?: number;
		grow?: number;
	};

	const props: Props = $props();
	const frames = $derived(
		fireBed(props.length, props.depth, props.under ?? 0, undefined, undefined, props.wild),
	);
	const still = prefersReducedMotion.current;
	const FRAME_MS = 70;

	const height = new Tween(still ? 1 : 0);
	const width = new Tween(still ? 1 : 0.4);
	const grow = new Tween(untrack(() => props.grow ?? 1));

	let step = $state(0);

	$effect(() => {
		if (still) return;
		let request = 0;
		const update = (now: number) => {
			request = requestAnimationFrame(update);
			const next = Math.floor(now / FRAME_MS);
			if (next !== step) step = next;
		};
		request = requestAnimationFrame(update);

		return () => cancelAnimationFrame(request);
	});

	$effect(() => {
		const lit = props.lit ?? true;
		if (still) {
			height.set(lit ? 1 : 0, { duration: 0 });

			return;
		}
		if (lit) {
			width.set(1, { duration: 260, easing: cubicOut });
			height.set(1, { duration: 360, easing: backOut });
		} else {
			width.set(0.4, { duration: 320, easing: cubicIn });
			height.set(0, { duration: 320, easing: cubicIn });
		}
	});

	$effect(() => {
		grow.set(props.grow ?? 1, { duration: 400, easing: cubicOut });
	});

	let seen: number | undefined;
	$effect(() => {
		const flare = props.flare;
		if (seen === undefined || flare === seen || still) {
			seen = flare;

			return;
		}
		seen = flare;
		untrack(() => {
			if (!(props.lit ?? true)) return;
			height
				.set(1.45, { duration: 110, easing: cubicOut })
				.then(() => height.set(1, { duration: 420, easing: cubicOut }));
		});
	});
</script>

<Container scale={{ x: width.current * grow.current, y: height.current * grow.current }}>
	<BaseSprite
		texture={frames[step % frames.length]}
		anchor={{ x: 0.5, y: props.depth / (props.depth + (props.under ?? 0)) }}
		width={props.length * ART_PIXEL}
		height={(props.depth + (props.under ?? 0)) * ART_PIXEL}
	/>
</Container>
