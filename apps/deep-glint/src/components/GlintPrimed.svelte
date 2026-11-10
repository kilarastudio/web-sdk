<script lang="ts">
	import { onDestroy, onMount, untrack } from 'svelte';
	import { Tween, prefersReducedMotion } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { Sprite } from 'pixi-svelte';
	import { Skeleton } from 'components-pixi';
	import { stateBetDerived } from 'state-shared';
	import { SYMBOL_SIZE } from '../game/constants';
	import { GLINT_ANIMATION_MS, glintSkeleton } from '../game/glint';

	type Props = { layer: 'under' | 'over'; animate?: boolean; oncomplete?: () => void };
	const props: Props = $props();
	const animate = untrack(() => Boolean(props.animate));
	const timeScale = stateBetDerived.timeScale();
	const progress = new Tween(animate ? 0 : 1);
	let playing = $state(animate);
	let completed = false;
	const finish = () => {
		if (completed) return;
		completed = true;
		playing = false;
		props.oncomplete?.();
	};
	onMount(() => {
		if (animate)
			void progress
				.set(1, { duration: GLINT_ANIMATION_MS.prime / timeScale, easing: cubicOut })
				.then(finish);
	});
	onDestroy(finish);
</script>

{#if props.layer === 'over'}
	{#if playing && !prefersReducedMotion.current}
		<Skeleton
			data={glintSkeleton}
			animation="prime"
			{timeScale}
			width={SYMBOL_SIZE * 0.94}
			oncomplete={finish}
		/>
	{:else}
		<Sprite
			key="glintPrimed"
			x={SYMBOL_SIZE * 0.94 * 0.38}
			y={-SYMBOL_SIZE * 0.94 * 0.38}
			anchor={0.5}
			width={SYMBOL_SIZE * 0.94 * 0.22}
			height={SYMBOL_SIZE * 0.94 * 0.22}
			alpha={playing ? progress.current : 1}
		/>
	{/if}
{/if}
