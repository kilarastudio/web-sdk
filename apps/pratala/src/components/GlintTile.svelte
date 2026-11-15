<script lang="ts">
	import { onMount, onDestroy, untrack } from 'svelte';
	import { Tween, prefersReducedMotion } from 'svelte/motion';
	import { linear } from 'svelte/easing';

	import * as PIXI from 'pixi.js';

	import { BaseSprite, Container, Sprite } from 'pixi-svelte';
	import { stateBetDerived } from 'state-shared';

	import { SYMBOL_SIZE } from '../game/constants';
	import {
		GLINT_ANIMATION_MS,
		GLINT_CAP,
		GLINT_TIERS,
		glintTier,
		glintMultiplierLayout,
		type GlintAnimation,
	} from '../game/glint';
	import { getContext } from '../game/context';
	import { frameAt } from '../game/motion';
	import { pixelClock } from '../game/pixelClock.svelte';
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
	const layout = $derived(glintMultiplierLayout(props.value));
	const front = $derived(
		(context.stateApp.loadedAssets.glintIgniteFront ?? []) as PIXI.Texture[],
	);
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

	const multiplierScale = $derived(
		!playing || reduced
			? 1
			: animation === 'light'
				? [1.4, 1.25, 1.1, 1.04, 1][pose]
				: [1.2, 1.3, 1.16, 1.06, 1][pose],
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
	<Container
		x={layout.x}
		y={layout.y}
		scale={multiplierScale}
		alpha={playing && animation === 'light' && !reduced && progress.current < 0.55 ? 0 : 1}
	>
		<GameText
			anchor={0.5}
			text={`×${props.value}`}
			maxWidth={layout.maxWidth}
			style={gameTextStyle({ fontSize: layout.fontSize, tone: 'value' })}
		/>
	</Container>
{/if}
