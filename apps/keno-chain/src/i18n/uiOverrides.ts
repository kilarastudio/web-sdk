import { i18nKey } from 'utils-shared/i18n';

// The shared UI's words that are a slot's: Keno Chain's catalogs give them a keno round's words
// (a round is played, not spun). The game's catalog wins on a shared key; listing them here is
// what makes tools/i18n/check.mjs count them as this game's.
export const UI_OVERRIDES = [
	i18nKey('PLAY'),
	i18nKey('PLAYING'),
	i18nKey('PLAY AGAIN'),
	i18nKey('AUTO SPINS'),
	i18nKey('AUTO SPIN'),
];
