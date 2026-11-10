<script lang="ts" module>
	import * as PIXI from 'pixi.js';

	import { type Props as BaseProps } from './Graphics.svelte';
	import type { PixiPoint } from '../types';

	export type Props = Omit<BaseProps, 'pivot' | 'draw'> & {
		anchor?: PixiPoint;
		// draw: always square corners, Kilara UI uses no border radius except on circles
		width: Parameters<PIXI.Graphics['rect']>[2];
		height: Parameters<PIXI.Graphics['rect']>[3];
		backgroundColor?: PIXI.FillStyle['color'];
		backgroundAlpha?: PIXI.FillStyle['alpha'];
		borderColor?: PIXI.StrokeStyle['color'];
		borderWidth?: PIXI.StrokeStyle['width'];
		borderAlpha?: PIXI.StrokeStyle['alpha'];
	};
</script>

<script lang="ts">
	import Graphics from './Graphics.svelte';
	import { anchorToPivot } from '../utils.svelte';

	const {
		anchor,
		width,
		height,
		backgroundColor,
		backgroundAlpha,
		borderColor,
		borderWidth,
		borderAlpha,
		...graphicsProps
	}: Props = $props();
</script>

<Graphics
	{...graphicsProps}
	pivot={anchorToPivot({ anchor, sizes: { width: width, height: height } })}
	draw={(graphics) => {
		graphics.rect(0, 0, width, height);
		graphics.fill({
			color: backgroundColor ?? 0x000000,
			alpha: backgroundAlpha ?? 1,
		} as PIXI.FillStyle);
		graphics.stroke({
			color: borderColor ?? 0x000000,
			width: borderWidth ?? 0,
			alpha: borderAlpha ?? 1,
		} as PIXI.StrokeStyle);
	}}
/>
