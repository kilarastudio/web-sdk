// The game's bitmap fonts (static/assets/fonts): glyph shapes made with an image model, bevelled
// and outlined by the font build. Gold carries its colours in the atlas; Ink is white so it can
// be tinted. Lowercase letters draw the capital glyphs.
export const GAME_FONT_FAMILIES = {
	gold: 'Dragons Glint Gold',
	ink: 'Dragons Glint Ink',
} as const;

export const GAME_FONT_CHARACTERS =
	'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz×+-=.,:;!?/()\'"%$€£¥ ';
