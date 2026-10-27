<script lang="ts" module>
	import * as PIXI from 'pixi.js';

	import type { OverwriteCursor } from '../types';

	// a loaded sprite whose corners keep their size while its edges and middle stretch
	export type Props = Omit<OverwriteCursor<PIXI.NineSliceSpriteOptions>, 'texture'> & {
		key: string;
	};
</script>

<script lang="ts">
	import { propsSyncEffect } from '../utils.svelte';
	import { getContextApp, getContextParent } from '../context.svelte';
	import type { LoadedSprite } from '../types';

	const { key, ...nineSliceProps }: Props = $props();
	const context = getContextApp();
	const parentContext = getContextParent();
	const texture = $derived(
		(context.stateApp.loadedAssets?.[key] || PIXI.Texture.EMPTY) as LoadedSprite,
	);

	const nineSliceSprite = new PIXI.NineSliceSprite({ texture: PIXI.Texture.EMPTY });

	$effect(() => {
		nineSliceSprite.texture = texture;
	});

	propsSyncEffect({ props: nineSliceProps, target: nineSliceSprite });

	parentContext.addToParent(nineSliceSprite);
</script>

{#if texture === PIXI.Texture.EMPTY}
	{console.error(`NineSliceSprite: key "${key}" is not found in the loadedAssets`)}
{/if}
