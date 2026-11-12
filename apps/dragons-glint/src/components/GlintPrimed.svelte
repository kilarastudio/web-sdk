<script lang="ts">
	import { onDestroy, onMount, untrack } from 'svelte';
	import { Tween, prefersReducedMotion } from 'svelte/motion';
	import { linear } from 'svelte/easing';

	import { Sprite } from 'pixi-svelte';
	import { stateBetDerived } from 'state-shared';

	import { ART_PIXEL, SYMBOL_SIZE } from '../game/constants';
	import { GLINT_ANIMATION_MS } from '../game/glint';
	import { frameAt } from '../game/motion';
	import { pixelClock } from '../game/pixelClock.svelte';

	type Props = { layer: 'under' | 'over'; animate?: boolean; oncomplete?: () => void };

	const props: Props = $props();
	const animate = untrack(() => Boolean(props.animate));
	const timeScale = stateBetDerived.timeScale();
	const progress = new Tween(animate ? 0 : 1);
	let playing = $state(animate);
	let completed = false;

	// the ember is 9 art pixels across; it drops in large and settles, then glows on the clock
	const SIZE = 9 * ART_PIXEL;
	const POP = [2.2, 1.6, 1.2, 1];
	const GLOW = [1, 1, 0.85, 0.7, 0.85, 1];

	const moving = $derived(playing && !prefersReducedMotion.current);
	const size = $derived(SIZE * (moving ? POP[frameAt(progress.current, POP.length)] : 1));
	const alpha = $derived(
		moving || prefersReducedMotion.current ? 1 : GLOW[pixelClock.frame % GLOW.length],
	);

	const finish = () => {
		if (completed) return;
		completed = true;
		playing = false;
		props.oncomplete?.();
	};

	onMount(() => {
		if (animate)
			void progress
				.set(1, { duration: GLINT_ANIMATION_MS.prime / timeScale, easing: linear })
				.then(finish);
	});
	onDestroy(finish);
</script>

{#if props.layer === 'over'}
	<Sprite
		key="glintPrimed"
		x={SYMBOL_SIZE * 0.36}
		y={-SYMBOL_SIZE * 0.36}
		anchor={0.5}
		width={size}
		height={size}
		{alpha}
	/>
{/if}
