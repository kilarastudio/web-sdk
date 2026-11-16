import { stateI18nDerived } from 'state-shared';
import { i18nDerived as i18nDerivedUiHtml } from 'components-ui-html';

const t = stateI18nDerived.translate;

// Pratala's own text on top of the shared UI's. A number goes in as a {placeholder}, so each
// language can put it where its sentence needs it.
export const i18nDerived = {
	...i18nDerivedUiHtml,
	pressToContinue: () => t('Press anywhere to continue'),
	pressToStart: () => t('Press anywhere to start'),
	// welcome screen
	welcomeMaxWin: (multiplier: string) => t('WIN UP TO {multiplier}', { multiplier }),
	welcomeSpotsTitle: () => t('GLINT SPOTS'),
	welcomeSpotsText: (cap: string) =>
		t('Wins light the floor. In FREE SPINS every SCATTER doubles its reel of spots, up to {cap}.', {
			cap,
		}),
	welcomeStrikeTitle: () => t('GLINT STRIKE'),
	welcomeStrikeText: () => t('Dragon fire lights 3 to 6 spots.'),
	welcomeFreeSpinsTitle: () => t('FREE SPINS'),
	welcomeFreeSpinsText: () => t('4 or more SCATTERS wake the dragon. Spots stay lit all feature.'),
	// panels
	tumbleWin: () => t('TUMBLE WIN'),
	youWon: () => t('YOU WON'),
	totalWin: () => t('TOTAL WIN'),
	freeSpinsComplete: () => t('FREE SPINS COMPLETE'),
	// a win level's title, BIG WIN to MAX WIN (marked with i18nKey in game/winLevelMap.ts)
	winLevel: (text: string) => t(text),
	// symbols
	scatter: () => t('SCATTER'),
};
