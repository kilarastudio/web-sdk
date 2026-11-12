<script lang="ts">
	import { Rectangle, Sprite } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';

	import { getContext } from '../game/context';
	import { TORCHES } from '../game/torches';
	import Torches from './Torches.svelte';

	// The dragon's hall, in a wide and a tall composition (576 × 324 and 324 × 576 art pixels).
	// Its torches are painted without their flames, which burn over the picture (Torches).
	// Each covers the canvas; the tall one is used where the screen is taller than it is wide.
	// The halls change at once: only the fire wall changes them, while its smoke covers the screen,
	// and a slower fade would still be running as the smoke lifts.
	const SIZES = {
		Landscape: { width: 576, height: 324 },
		Portrait: { width: 324, height: 576 },
	};

	const context = getContext();
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());
	const shape = $derived(canvas.width >= canvas.height ? 'Landscape' : 'Portrait');
	const backgroundProps = $derived.by(() => {
		const sizes = SIZES[shape];
		const scale = Math.max(canvas.width / sizes.width, canvas.height / sizes.height);

		return {
			anchor: 0.5,
			x: canvas.width * 0.5,
			y: canvas.height * 0.5,
			width: sizes.width * scale,
			height: sizes.height * scale,
		};
	});
	// the torches' flames are drawn over the picture, in its own art pixels
	const flameProps = $derived.by(() => {
		const sizes = SIZES[shape];
		const scale = Math.max(canvas.width / sizes.width, canvas.height / sizes.height);

		return {
			scale,
			origin: {
				x: canvas.width * 0.5 - sizes.width * scale * 0.5,
				y: canvas.height * 0.5 - sizes.height * scale * 0.5,
			},
		};
	});
	const baseKey = $derived(`backgroundBase${shape}`);
	const bonusKey = $derived(`backgroundBonus${shape}`);
	const showBaseBackground = $derived(context.stateGame.gameType === 'basegame');
	const showFeatureBackground = $derived(context.stateGame.gameType === 'freegame');
</script>

<Rectangle {...canvas} backgroundColor={0x0e071b} zIndex={-3} />

{#if context.stateApp.loadedAssets[baseKey]}
	<FadeContainer show={showBaseBackground} duration={0} zIndex={-2}>
		{#key baseKey}
			<Sprite key={baseKey} {...backgroundProps} />
		{/key}
		<Torches torches={TORCHES[shape].base} {...flameProps} />
	</FadeContainer>
{/if}

{#if context.stateApp.loadedAssets[bonusKey]}
	<FadeContainer show={showFeatureBackground} duration={0} zIndex={-1}>
		{#key bonusKey}
			<Sprite key={bonusKey} {...backgroundProps} />
		{/key}
		<Torches torches={TORCHES[shape].bonus} {...flameProps} />
	</FadeContainer>
{/if}
