<script lang="ts">
	import type { Snippet } from 'svelte';

	import { stateUi } from 'state-shared';

	import { getContext } from '../context';

	type Props = {
		// the height the layout's controls take up from the bottom edge, as a CSS length in stage
		// px; when given it is published to the game as stateUi.hudInset.bottom
		insetBottom?: string;
		children: Snippet;
	};

	const props: Props = $props();
	const context = getContext();
	const mainLayout = $derived(context.stateLayoutDerived.mainLayoutStandard());
	const canvasSizes = $derived(context.stateLayoutDerived.canvasSizes());

	// stage px, before the stage is scaled
	let insetBottom = $state(0);

	$effect(() => {
		if (props.insetBottom) stateUi.hudInset.bottom = insetBottom * mainLayout.scale;
	});
</script>

<!--
	HTML counterpart of <MainContainer standard alignVertical="bottom">: children are laid out in
	the standard design size (e.g. 1920×1080) and the stage is scaled to fit the canvas, centred
	horizontally and aligned to the bottom, so the HUD lines up with the game rendered in Pixi.
-->
<div
	class="ui-stage"
	style:width="{mainLayout.width}px"
	style:height="{mainLayout.height}px"
	style:left="{(canvasSizes.width - mainLayout.width * mainLayout.scale) * 0.5}px"
	style:top="{canvasSizes.height - mainLayout.height * mainLayout.scale}px"
	style:transform="scale({mainLayout.scale})"
>
	{@render props.children()}

	{#if props.insetBottom}
		<!-- measures insetBottom, which the layout writes with its own size variables -->
		<div class="inset" style:height={props.insetBottom} bind:clientHeight={insetBottom}></div>
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
