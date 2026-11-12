<script lang="ts">
	import { BitmapText, Text, type BitmapTextProps } from 'pixi-svelte';
	import { ResponsiveBitmapText, ResponsiveText } from 'components-pixi';
	import { fallbackGameTextStyle, supportsGameFont } from '../game/typography';

	type Props = Omit<BitmapTextProps, 'scale' | 'onresize'> & { maxWidth?: number };
	const { maxWidth, ...textProps }: Props = $props();
	// the pixel font needs room for its outline: below about 22 units its counters fill in, so
	// small print uses the fallback font
	const supported = $derived(
		supportsGameFont(textProps.text) && Number(textProps.style?.fontSize ?? 0) >= 22,
	);
	// Decoration is baked into the atlas. Retain canvas-only paint for fallback.
	const bitmapStyle = $derived({ ...textProps.style, stroke: undefined, dropShadow: false });
</script>

{#if supported}
	{#if maxWidth !== undefined}
		<ResponsiveBitmapText {...textProps} style={bitmapStyle} {maxWidth} />
	{:else}
		<BitmapText {...textProps} style={bitmapStyle} />
	{/if}
{:else if maxWidth !== undefined}
	<ResponsiveText {...textProps} style={fallbackGameTextStyle(textProps.style)} {maxWidth} />
{:else}
	<Text {...textProps} style={fallbackGameTextStyle(textProps.style)} />
{/if}
