<script lang="ts">
	import type { Snippet } from 'svelte';

	import { getContext } from '../context';

	type Props = {
		children: Snippet;
	};

	const props: Props = $props();
	const context = getContext();
	const mainLayout = $derived(context.stateLayoutDerived.mainLayoutStandard());
	const canvasSizes = $derived(context.stateLayoutDerived.canvasSizes());
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
</div>

<style lang="scss">
	.ui-stage {
		position: absolute;
		transform-origin: 0 0;
		pointer-events: none;
	}
</style>
