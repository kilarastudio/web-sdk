<script lang="ts">
	import { Rectangle, Sprite } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';
	import { SECOND } from 'constants-shared/time';

	import { getContext } from '../game/context';
	import { BACKGROUND_ART } from '../game/art.generated';

	// The base and gold-chamber scenes cover the canvas, including portrait crops.
	const BACKGROUND_SIZES = BACKGROUND_ART;

	const context = getContext();
	const backgroundProps = $derived.by(() => {
		const canvas = context.stateLayoutDerived.canvasSizes();
		const scale = Math.max(
			canvas.width / BACKGROUND_SIZES.width,
			canvas.height / BACKGROUND_SIZES.height,
		);

		return {
			anchor: 0.5,
			x: canvas.width * 0.5,
			y: canvas.height * 0.5,
			width: BACKGROUND_SIZES.width * scale,
			height: BACKGROUND_SIZES.height * scale,
		};
	});
	const showBaseBackground = $derived(context.stateGame.gameType === 'basegame');
	const showFeatureBackground = $derived(context.stateGame.gameType === 'freegame');
</script>

<Rectangle {...context.stateLayoutDerived.canvasSizes()} backgroundColor={0x000000} zIndex={-3} />

{#if context.stateApp.loadedAssets.backgroundBase}
	<FadeContainer show={showBaseBackground} duration={SECOND} zIndex={-2}>
		<Sprite key="backgroundBase" {...backgroundProps} />
	</FadeContainer>
{/if}

{#if context.stateApp.loadedAssets.backgroundBonus}
	<FadeContainer show={showFeatureBackground} duration={SECOND} zIndex={-1}>
		<Sprite key="backgroundBonus" {...backgroundProps} />
	</FadeContainer>
{/if}
