<script lang="ts">
	import { BitmapText, Text, type BitmapTextProps } from 'pixi-svelte';
	import { ResponsiveBitmapText, ResponsiveText } from 'components-pixi';
	import { fallbackGameTextStyle, supportsGameFont } from '../game/typography';

	type Props = Omit<BitmapTextProps, 'scale' | 'onresize'> & {
		maxWidth?: number;
		// wrapped text taller than this shrinks its font (and line height) until it fits, so a long
		// translation stays inside its panel and still fills the wrap width
		maxHeight?: number;
		// the fallback font even where the pixel font has every glyph, so texts that sit side by side
		// keep to one font when one of them cannot use the pixel font
		fallback?: boolean;
	};
	const { maxWidth, maxHeight, fallback = false, ...textProps }: Props = $props();

	// the smallest share of its size a text may shrink to under maxHeight
	const SMALLEST = 0.5;
	let shrink = $state(1);
	// a new text, size or wrap width starts from its full size again
	$effect.pre(() => {
		void [textProps.text, textProps.style?.fontSize, textProps.style?.wordWrapWidth, maxHeight];
		shrink = 1;
	});

	const style = $derived.by(() => {
		const base = textProps.style;
		if (shrink === 1 || !base) return base;
		const fontSize = Number(base.fontSize ?? 0) * shrink;
		const lineHeight = base.lineHeight === undefined ? undefined : Number(base.lineHeight) * shrink;
		return { ...base, fontSize, lineHeight };
	});

	const onresize =
		maxHeight === undefined
			? undefined
			: ({ height }: { width: number; height: number }) => {
					if (height <= maxHeight || shrink <= SMALLEST) return;
					// a wrapped text's height grows about with the square of its size
					shrink = Math.max(SMALLEST, shrink * Math.min(0.95, Math.sqrt(maxHeight / height)));
				};

	// the pixel font needs room for its outline: below about 22 units its counters fill in, so
	// small print uses the fallback font
	const supported = $derived(
		!fallback && supportsGameFont(textProps.text) && Number(style?.fontSize ?? 0) >= 22,
	);
	// Decoration is baked into the atlas. Retain canvas-only paint for fallback.
	const bitmapStyle = $derived({ ...style, stroke: undefined, dropShadow: false });
</script>

{#if supported}
	{#if maxWidth !== undefined}
		<ResponsiveBitmapText {...textProps} style={bitmapStyle} {maxWidth} />
	{:else}
		<BitmapText {...textProps} style={bitmapStyle} {onresize} />
	{/if}
{:else if maxWidth !== undefined}
	<ResponsiveText {...textProps} style={fallbackGameTextStyle(style)} {maxWidth} />
{:else}
	<Text {...textProps} style={fallbackGameTextStyle(style)} {onresize} />
{/if}
