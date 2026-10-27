import type { TextProps } from 'pixi-svelte';

// Match the bundled UI font and system fallbacks in components-ui-html/font.css.
const FONT_FAMILY = [
	'Geist Variable',
	'system-ui',
	'-apple-system',
	'Segoe UI',
	'Roboto',
	'Helvetica Neue',
	'Arial',
	'sans-serif',
];

const TEXT_TONES = {
	label: { fill: 0xfff2cc, weight: '700', tracking: 0.06 },
	value: { fill: 0xffc53d, weight: '800', tracking: 0 },
	hint: { fill: 0xfff2cc, weight: '600', tracking: 0 },
} as const;

export const gameTextStyle = ({
	fontSize,
	tone,
	onArt = false,
}: {
	fontSize: number;
	tone: keyof typeof TEXT_TONES;
	onArt?: boolean;
}): TextProps['style'] => ({
	fontFamily: FONT_FAMILY,
	fontSize,
	fontWeight: TEXT_TONES[tone].weight,
	letterSpacing: fontSize * TEXT_TONES[tone].tracking,
	fill: TEXT_TONES[tone].fill,
	align: 'center',
	...(onArt ? { stroke: { color: 0x07131e, width: fontSize * 0.1, join: 'round' } } : {}),
	dropShadow: {
		color: 0x000000,
		alpha: 0.6,
		blur: 0,
		distance: fontSize * 0.04,
		angle: Math.PI / 2,
	},
});
