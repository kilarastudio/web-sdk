<script lang="ts">
	import { onMount, onDestroy, untrack } from 'svelte';
	import { Tween, prefersReducedMotion } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { Container, Sprite } from 'pixi-svelte';
	import { Skeleton } from 'components-pixi';
	import { stateBetDerived } from 'state-shared';
	import { SYMBOL_SIZE } from '../game/constants';
	import {
		GLINT_ANIMATION_MS,
		GLINT_TIERS,
		glintTier,
		glintMultiplierLayout,
		glintSkeleton,
		type GlintAnimation,
	} from '../game/glint';
	import { gameTextStyle } from '../game/typography';
	import GameText from './GameText.svelte';

	type Props = {
		layer: 'under' | 'over';
		value: number;
		animation?: GlintAnimation;
		previousValue?: number;
		oncomplete?: () => void;
	};
	const props: Props = $props();
	// Each event has a keyed component instance. Completion of its one-shot must
	// never be tied to the perpetual ×256 loop that may follow it.
	const animation = untrack(() => props.animation);
	const previousValue = untrack(() => props.previousValue ?? 0);
	const timeScale = stateBetDerived.timeScale();
	const progress = new Tween(animation ? 0 : 1);
	let playing = $state(Boolean(animation));
	let completed = false;
	const tier = $derived(glintTier(props.value));
	const layout = $derived(glintMultiplierLayout(props.value));
	const reduced = $derived(prefersReducedMotion.current);
	const finish = () => {
		if (completed) return;
		completed = true;
		playing = false;
		props.oncomplete?.();
	};
	const multiplierScale = $derived(
		!playing || reduced
			? 1
			: animation === 'light'
				? 0.94 + 0.06 * progress.current
				: 1 + 0.12 * Math.sin(Math.PI * progress.current),
	);
	onMount(() => {
		if (!animation) return;
		void progress
			.set(1, { duration: GLINT_ANIMATION_MS[animation] / timeScale, easing: cubicOut })
			.then(() => {
				// Also finish from the duration clock if a motion-preference change
				// unmounted the skeleton mid-transition. Both paths are idempotent.
				finish();
			});
	});
	onDestroy(finish);
</script>

{#if props.layer === 'under'}
	{#if playing && animation && !reduced}
		{#if animation === 'tier_up' && previousValue >= 2}
			<Sprite
				key={GLINT_TIERS[glintTier(previousValue)].tile}
				anchor={0.5}
				width={SYMBOL_SIZE * 0.94}
				height={SYMBOL_SIZE * 0.94}
				alpha={1 - progress.current}
			/>
		{/if}
		<Skeleton
			data={glintSkeleton}
			skin={GLINT_TIERS[tier].skin}
			{animation}
			{timeScale}
			width={SYMBOL_SIZE * 0.94}
			oncomplete={finish}
		/>
	{:else if props.value === 256 && !reduced}
		<Skeleton
			data={glintSkeleton}
			skin={GLINT_TIERS[tier].skin}
			animation="max_loop"
			loop
			timeScale={stateBetDerived.timeScale()}
			width={SYMBOL_SIZE * 0.94}
		/>
	{:else}
		<Sprite
			key={GLINT_TIERS[tier].tile}
			anchor={0.5}
			width={SYMBOL_SIZE * 0.94}
			height={SYMBOL_SIZE * 0.94}
			alpha={playing && animation === 'light' ? progress.current : 1}
		/>
	{/if}
{:else}
	<Container x={layout.x} y={layout.y} scale={multiplierScale}>
		{#if playing && animation !== 'light' && animation !== 'apply' && previousValue >= 2}
			<GameText
				anchor={0.5}
				alpha={1 - progress.current}
				text={`×${previousValue}`}
				maxWidth={layout.maxWidth}
				style={gameTextStyle({ fontSize: layout.fontSize, tone: 'value' })}
			/>
		{/if}
		<GameText
			anchor={0.5}
			alpha={playing && animation !== 'apply' ? progress.current : 1}
			text={`×${props.value}`}
			maxWidth={layout.maxWidth}
			style={gameTextStyle({ fontSize: layout.fontSize, tone: 'value' })}
		/>
	</Container>
{/if}
