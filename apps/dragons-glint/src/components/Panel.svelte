<script lang="ts">
	import type { Snippet } from 'svelte';

	import { NineSliceSprite } from 'pixi-svelte';

	import { ART_PIXEL } from '../game/constants';
	import { panelLayout, type PanelFace, type PanelKey } from '../game/panels';
	import { PIXEL_SCALE } from '../pixel/textures';
	import { PANEL_SLICE } from '../pixel/ui';

	type Props = {
		key: PanelKey;
		// 1 keeps the game's pixel density
		scale: number;
		children?: Snippet<[{ face: PanelFace }]>;
	};

	const props: Props = $props();
	const layout = $derived(panelLayout({ key: props.key, scale: props.scale }));
	// the nine-slice is laid out in texture pixels and scaled down whole, so its rule and studs
	// keep their proportions
	const unit = $derived((ART_PIXEL / PIXEL_SCALE) * props.scale);
	const slice = PANEL_SLICE * PIXEL_SCALE;
</script>

<!-- centred on its middle -->
<NineSliceSprite
	key="panel"
	x={-layout.sizes.width / 2}
	y={-layout.sizes.height / 2}
	width={layout.sizes.width / unit}
	height={layout.sizes.height / unit}
	scale={unit}
	leftWidth={slice}
	topHeight={slice}
	rightWidth={slice}
	bottomHeight={slice}
/>
{@render props.children?.({ face: layout.face })}
