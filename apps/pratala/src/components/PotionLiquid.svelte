<script lang="ts">
	import * as PIXI from 'pixi.js';
	import { onMount } from 'svelte';

	import { getContextParent } from 'pixi-svelte';

	import { PALETTE } from '../pixel/palette';
	import { liquidShape, potionBody, type PotionKey, type Surface } from '../pixel/potionLiquid';

	// A potion's liquid as it lies (pixel/potionLiquid.ts): masks its container down to everything
	// but the empty glass above the surface, and draws the surface's lit skin. Put it in the
	// container that holds the potion's art (drawn full), after the art; the container's children
	// at zIndex 2 and over stand above the skin.
	type Props = {
		key: PotionKey;
		surface: Surface;
		// the art's width and height where it is drawn, centred on the container's middle
		width: number;
		height: number;
		tint?: number;
	};

	const props: Props = $props();
	const parent = getContextParent().parent;
	const mask = new PIXI.Graphics();
	const skin = new PIXI.Graphics({ zIndex: 1 });

	$effect(() => {
		const { keep, skin: lit } = liquidShape(props.key, props.surface);
		mask.clear();
		for (const [x, y, w, h] of keep) mask.rect(x, y, w, h);
		mask.fill(0xffffff);
		skin.clear();
		for (const [c, pixels] of lit) {
			for (const [x, y] of pixels) skin.rect(x, y, 1, 1);
			skin.fill(PALETTE[c]);
		}
	});

	$effect(() => {
		const { art } = potionBody(props.key);
		for (const graphics of [mask, skin]) {
			graphics.scale.set(props.width / art.width, props.height / art.height);
			graphics.position.set(-props.width / 2, -props.height / 2);
		}
		skin.tint = props.tint ?? 0xffffff;
	});

	onMount(() => {
		parent.addChild(mask, skin);
		parent.mask = mask;

		return () => {
			if (parent.mask === mask) parent.mask = null;
			mask.destroy();
			skin.destroy();
		};
	});
</script>
