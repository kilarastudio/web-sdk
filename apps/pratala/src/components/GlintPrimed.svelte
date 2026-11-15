<script lang="ts">
	import { onDestroy, onMount, untrack } from 'svelte';
	import { Tween, prefersReducedMotion } from 'svelte/motion';
	import { linear } from 'svelte/easing';

	import { Sprite } from 'pixi-svelte';
	import { stateBetDerived } from 'state-shared';

	import { SYMBOL_SIZE } from '../game/constants';
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

	// the cracks open with a glare that dies down, then glow on the clock
	const POP = [1, 1, 0.9, 0.8];
	const GLOW = [0.75, 0.75, 0.62, 0.5, 0.62, 0.75];

	const moving = $derived(playing && !prefersReducedMotion.current);
	const alpha = $derived(
		moving
			? POP[frameAt(progress.current, POP.length)]
			: prefersReducedMotion.current
				? 0.7
				: GLOW[pixelClock.frame % GLOW.length],
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

{#if props.layer === 'under'}
	<Sprite key="glintPrimed" anchor={0.5} width={SYMBOL_SIZE} height={SYMBOL_SIZE} {alpha} />
{/if}
