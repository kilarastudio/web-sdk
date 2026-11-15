import type { TextProps } from 'pixi-svelte';
import { GAME_FONT_CHARACTERS, GAME_FONT_FAMILIES } from './gameFont';

const characters = new Set([...GAME_FONT_CHARACTERS, '\n']);
export const supportsGameFont = (text: unknown) =>
	[...String(text ?? '')].every((character) => characters.has(character));

// Gold contains its bevel, outline and shadow in the atlas; white fill keeps
// those colors. Ink shares the original outlines for small, tintable text.

export const gameTextStyle = ({
	fontSize,
	tone,
	onArt = false,
}: {
	fontSize: number;
	tone: 'label' | 'value' | 'hint' | 'badge';
	onArt?: boolean;
}) => ({
	fontFamily:
		tone === 'hint' || tone === 'badge' || fontSize < 20
			? GAME_FONT_FAMILIES.ink
			: GAME_FONT_FAMILIES.gold,
	fontSize,
	letterSpacing: tone === 'label' ? fontSize * 0.015 : 0,
	fill: tone === 'badge' ? 0x062f36 : tone === 'hint' || fontSize < 20 ? 0xfff2cc : 0xffffff,
	align: 'center' as const,
	// Used only by the canvas fallback for languages outside the atlas.
	...(onArt ? { stroke: { color: 0x07131e, width: fontSize * 0.1, join: 'round' as const } } : {}),
});

export const fallbackGameTextStyle = (style: TextProps['style']): TextProps['style'] => ({
	...style,
	fontFamily: ['Geist Variable', 'system-ui', 'sans-serif'],
	fontWeight: '800',
	fill: style?.fill === 0xffffff ? 0xffd56a : style?.fill,
});
