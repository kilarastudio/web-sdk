<script lang="ts">
	import type { Snippet } from 'svelte';

	import { stateUi } from 'state-shared';

	import { getContext } from '../context';

	type Props = {
		// the height the layout's controls take up from the bottom edge, as a CSS length in stage
		// px; when given it is published to the game as stateUi.hudInset.bottom
		insetBottom?: string;
		// likewise the width the layout's controls take up from each side edge, published as
		// stateUi.hudInset.side (0 when not given)
		insetSide?: string;
		// cover the whole canvas instead of the standard design size, so the layout can place its
		// controls against the screen edges; the stage is scaled the same either way
		fill?: boolean;
		children: Snippet;
	};

	const props: Props = $props();
	const context = getContext();
	const mainLayout = $derived(context.stateLayoutDerived.mainLayoutStandard());
	const canvasSizes = $derived(context.stateLayoutDerived.canvasSizes());
	const stageSizes = $derived(
		props.fill
			? {
					width: canvasSizes.width / mainLayout.scale,
					height: canvasSizes.height / mainLayout.scale,
				}
			: { width: mainLayout.width, height: mainLayout.height },
	);

	// stage px, before the stage is scaled
	let insetBottom = $state(0);
	let insetSide = $state(0);

	$effect(() => {
		if (!props.insetBottom) return;
		stateUi.hudInset.bottom = insetBottom * mainLayout.scale;
		stateUi.hudInset.side = props.insetSide ? insetSide * mainLayout.scale : 0;
	});
</script>

<!--
	HTML counterpart of <MainContainer standard alignVertical="bottom">: children are laid out in
	the standard design size (e.g. 1920×1080) and the stage is scaled to fit the canvas, centred
	horizontally and aligned to the bottom, so the HUD lines up with the game rendered in Pixi. With
	fill the stage grows past the design size to the canvas edges, at the same scale.
-->
<div
	class="ui-stage"
	style:width="{stageSizes.width}px"
	style:height="{stageSizes.height}px"
	style:left="{(canvasSizes.width - stageSizes.width * mainLayout.scale) * 0.5}px"
	style:top="{canvasSizes.height - stageSizes.height * mainLayout.scale}px"
	style:transform="scale({mainLayout.scale})"
>
	{@render props.children()}

	{#if props.insetBottom}
		<!-- measure the insets, which the layout writes with its own size variables -->
		<div class="inset" style:height={props.insetBottom} bind:clientHeight={insetBottom}></div>
	{/if}
	{#if props.insetSide}
		<div class="inset" style:width={props.insetSide} bind:clientWidth={insetSide}></div>
	{/if}
</div>

<style lang="scss">
	.ui-stage {
		position: absolute;
		transform-origin: 0 0;
		pointer-events: none;
	}

	.inset {
		position: absolute;
		bottom: 0;
		visibility: hidden;
	}
</style>
