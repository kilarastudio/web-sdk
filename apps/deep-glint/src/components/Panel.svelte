<script lang="ts">
	import type { Snippet } from 'svelte';

	import { Sprite } from 'pixi-svelte';

	import { panelLayout, type PanelFace, type PanelKey } from '../game/panels';

	type Props = {
		key: PanelKey;
		// source pixels to game units
		scale: number;
		children?: Snippet<[{ face: PanelFace }]>;
	};

	const props: Props = $props();
	const layout = $derived(panelLayout({ key: props.key, scale: props.scale }));
</script>

<!-- centred on the visible panel, not on the PNG's padded canvas -->
<Sprite key={props.key} {...layout.sprite} />

{@render props.children?.({ face: layout.face })}
