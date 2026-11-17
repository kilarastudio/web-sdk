<script lang="ts">
	import { onMount, onDestroy, untrack } from 'svelte';
	import { Tween, prefersReducedMotion } from 'svelte/motion';
	import { linear } from 'svelte/easing';

	import * as PIXI from 'pixi.js';

	import { BaseSprite, Container, Sprite } from 'pixi-svelte';
	import { stateBetDerived } from 'state-shared';

	import { FRAME_ART_PIXEL, SYMBOL_SIZE } from '../game/constants';
	import {
		GLINT_ANIMATION_MS,
		GLINT_CAP,
		GLINT_TIERS,
		GLINT_VALUE_FOOT,
		glintTier,
		type GlintAnimation,
	} from '../game/glint';
	import { getContext } from '../game/context';
	import { frameAt } from '../game/motion';
	import { pixelClock } from '../game/pixelClock.svelte';
	import GlintStrike from './GlintStrike.svelte';

	type Props = {
		layer: 'under' | 'over';
		value: number;
		animation?: GlintAnimation;
		previousValue?: number;
		oncomplete?: () => void;
	};

	const props: Props = $props();
	const context = getContext();

	// Each event has a keyed component instance. Completion of its one-shot must
	// never be tied to the perpetual loop of a spot at the cap (×4,096) that may follow it.
	const animation = untrack(() => props.animation);
	const previousValue = untrack(() => props.previousValue ?? 0);
	const timeScale = stateBetDerived.timeScale();
	const progress = new Tween(animation ? 0 : 1);
	let playing = $state(Boolean(animation));
	let completed = false;

	const tier = $derived(glintTier(props.value));
	// the value, drawn by code in its tier's colours (pixel/glintArt.ts)
	const valueTexture = $derived(
		context.stateApp.loadedAssets[`glintValue${props.value}`] as PIXI.Texture | undefined,
	);
	const front = $derived((context.stateApp.loadedAssets.glintIgniteFront ?? []) as PIXI.Texture[]);
	const ignite = $derived(
		(context.stateApp.loadedAssets[`glintIgnite${tier}`] ?? []) as PIXI.Texture[],
	);
	const reduced = $derived(prefersReducedMotion.current);

	// The tile's motion is five held poses: how big the tile is, how solid, and how strong the
	// flash over it. Lighting a spot burns it in from its middle; a doubling beats; a new tier
	// lands from larger with the brightest flash.
	const POSES = {
		prime: { size: [1, 1, 1, 1, 1], alpha: [1, 1, 1, 1, 1], flash: [0, 0, 0, 0, 0] },
		// lighting has its own frames: the spot catches fire from inside (glintIgnite)
		light: { size: [1, 1, 1, 1, 1], alpha: [1, 1, 1, 1, 1], flash: [0, 0, 0, 0, 0] },
		double: {
			size: [1.12, 1.16, 1.1, 1.04, 1],
			alpha: [1, 1, 1, 1, 1],
			flash: [0.7, 0.45, 0.2, 0, 0],
		},
		tier_up: {
			size: [1.4, 1.3, 1.18, 1.06, 1],
			alpha: [0.6, 0.8, 1, 1, 1],
			flash: [1, 0.8, 0.5, 0.2, 0],
		},
		apply: {
			size: [1.08, 1.12, 1.06, 1.02, 1],
			alpha: [1, 1, 1, 1, 1],
			flash: [0.5, 0.3, 0.1, 0, 0],
		},
	} as const;
	// a spot at the cap never rests: its flash breathes on the pixel clock
	const MAX_BREATH = [0, 0.12, 0.24, 0.36, 0.24, 0.12];
	// every lit panel pulses gently: its border's face steps one shade lighter and back, together
	// across the board, in held steps
	const PULSE = [0, 0, 0.3, 0.6, 0.8, 0.6, 0.3, 0];
	const pulse = $derived(reduced ? 0 : PULSE[Math.floor(pixelClock.frame / 2) % PULSE.length]);

	const pose = $derived(frameAt(progress.current, 5));
	const moving = $derived(playing && animation && !reduced ? POSES[animation] : undefined);
	const tileSize = $derived(SYMBOL_SIZE * (moving ? moving.size[pose] : 1));
	const tileAlpha = $derived(moving ? moving.alpha[pose] : 1);
	const flashAlpha = $derived(
		moving
			? moving.flash[pose]
			: props.value === GLINT_CAP && !reduced
				? MAX_BREATH[pixelClock.frame % MAX_BREATH.length]
				: 0,
	);

	const finish = () => {
		if (completed) return;
		completed = true;
		playing = false;
		props.oncomplete?.();
	};

	// the value lands big and settles, in held poses: twice its size for a doubling, three times
	// for a new tier, about its foot
	const VALUE_POP = {
		light: [1.4, 1.25, 1.1, 1.04, 1],
		double: [2, 2, 1.75, 1.35, 1],
		tier_up: [3, 3, 2.5, 1.75, 1],
		apply: [1.2, 1.3, 1.16, 1.06, 1],
		prime: [1, 1, 1, 1, 1],
	} as const;
	const multiplierScale = $derived(
		!playing || reduced || !animation ? 1 : VALUE_POP[animation][pose],
	);
	const striking = $derived(
		playing &&
			!reduced &&
			(animation === 'double' || animation === 'tier_up') &&
			previousValue >= 2,
	);

	onMount(() => {
		if (!animation) return;
		void progress
			.set(1, { duration: GLINT_ANIMATION_MS[animation] / timeScale, easing: linear })
			.then(finish);
	});
	onDestroy(finish);
</script>

{#if props.layer === 'under'}
	{#if moving && animation === 'tier_up' && previousValue >= 2}
		<Sprite
			key={GLINT_TIERS[glintTier(previousValue)].tile}
			anchor={0.5}
			width={SYMBOL_SIZE}
			height={SYMBOL_SIZE}
			alpha={1 - progress.current}
		/>
	{/if}
	{#if moving && animation === 'light' && ignite.length}
		<BaseSprite
			texture={ignite[frameAt(progress.current, ignite.length)]}
			anchor={0.5}
			width={SYMBOL_SIZE}
			height={SYMBOL_SIZE}
		/>
	{:else}
		<Sprite
			key={GLINT_TIERS[tier].tile}
			anchor={0.5}
			width={tileSize}
			height={tileSize}
			alpha={tileAlpha}
		/>
		{#if pulse > 0 && !moving}
			<Sprite
				key={`glintPulse${tier}`}
				anchor={0.5}
				width={SYMBOL_SIZE}
				height={SYMBOL_SIZE}
				alpha={pulse}
			/>
		{/if}
	{/if}
	{#if flashAlpha > 0}
		<Sprite
			key="glintFlash"
			anchor={0.5}
			width={tileSize}
			height={tileSize}
			alpha={flashAlpha}
			tint={GLINT_TIERS[tier].flash}
		/>
	{/if}
{:else}
	<!-- the fire's front passes over the symbol too -->
	{#if moving && animation === 'light' && front.length}
		<BaseSprite
			texture={front[frameAt(progress.current, front.length)]}
			anchor={0.5}
			width={SYMBOL_SIZE}
			height={SYMBOL_SIZE}
		/>
	{/if}
	{#if striking}
		<GlintStrike from={previousValue} to={props.value} progress={progress.current} />
	{/if}
	{#if valueTexture}
		<Container
			x={GLINT_VALUE_FOOT.x}
			y={GLINT_VALUE_FOOT.y}
			scale={multiplierScale}
			alpha={playing && animation === 'light' && !reduced && progress.current < 0.55 ? 0 : 1}
		>
			<BaseSprite
				texture={valueTexture}
				anchor={{ x: 0.5, y: 1 }}
				width={valueTexture.width * FRAME_ART_PIXEL}
				height={valueTexture.height * FRAME_ART_PIXEL}
			/>
		</Container>
	{/if}
{/if}
