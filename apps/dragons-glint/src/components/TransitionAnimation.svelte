<script lang="ts">
	import { onMount } from 'svelte';
	import { prefersReducedMotion } from 'svelte/motion';

	import { Graphics } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { animate } from '../game/motion';

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

	// A 16-bit screen wipe: square blocks grow in a diagonal wave until the screen is dark, hold,
	// then shrink away in the same order. Block sizes are held on four steps.
	const DURATION = 1000;
	const COLUMNS = 16;
	const STEPS = 4;
	const COLORS = [0x0e071b, 0x1a1932];

	const mode = props.mode ?? 'full';
	const from = mode === 'uncover' ? 0.5 : 0;
	const to = mode === 'cover' ? 0.5 : 1;
	let progress = $state(from);
	let covered = mode === 'uncover';
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());
	const block = $derived(Math.ceil(Math.max(canvas.width, canvas.height) / COLUMNS));
	const columns = $derived(Math.ceil(canvas.width / block));
	const rows = $derived(Math.ceil(canvas.height / block));

	// how much of a block is filled: the wave covers by 0.42, holds, and uncovers from 0.58
	const cover = (diagonal: number) => {
		const wave = (at: number) => Math.max(0, Math.min(1, (at * 1.7 - diagonal) * 3));
		const amount = progress < 0.5 ? wave(progress / 0.42) : 1 - wave((progress - 0.58) / 0.42);

		return Math.round(Math.max(0, Math.min(1, amount)) * STEPS) / STEPS;
	};

	onMount(() => {
		animate(
			DURATION * (to - from),
			(value) => {
				progress = from + (to - from) * value;
				if (!covered && progress >= 0.5) {
					covered = true;
					props.oncovered?.();
				}
			},
			{ timeScaled: false },
		).then(props.oncomplete);
	});
</script>

<Graphics
	zIndex={10}
	draw={(graphics) => {
		if (prefersReducedMotion.current) {
			graphics
				.rect(0, 0, canvas.width, canvas.height)
				.fill({ color: COLORS[0], alpha: Math.sin(Math.PI * progress) });

			return;
		}
		for (let row = 0; row < rows; row++)
			for (let column = 0; column < columns; column++) {
				const size = block * cover((column + row) / (columns + rows - 2));
				if (size <= 0) continue;
				graphics
					.rect(
						column * block + (block - size) / 2,
						row * block + (block - size) / 2,
						size + 1,
						size + 1,
					)
					.fill({ color: COLORS[(column + row) % 2] });
			}
	}}
/>
