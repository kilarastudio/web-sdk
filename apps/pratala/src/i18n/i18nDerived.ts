import { stateI18nDerived } from 'state-shared';
import { i18nDerived as i18nDerivedUiHtml } from 'components-ui-html';

export const i18nDerived = {
	...i18nDerivedUiHtml,
	pressToContinue: () => stateI18nDerived.translate('Press anywhere to continue'),
	pressToStart: () => stateI18nDerived.translate('Press anywhere to start'),
	// welcome screen
	welcomeMaxWin: (multiplier: string) => `${stateI18nDerived.translate('WIN UP TO')} ${multiplier}`,
	welcomeSpotsTitle: () => stateI18nDerived.translate('GLINT SPOTS'),
	welcomeSpotsText: (cap: string) =>
		`${stateI18nDerived.translate('Wins light the floor. A spot lights at ×2 on its second hit and doubles on every hit after, up to')} ${cap}.`,
	welcomeStrikeTitle: () => stateI18nDerived.translate('GLINT STRIKE'),
	welcomeStrikeText: () =>
		stateI18nDerived.translate('Dragon fire lights 3 to 6 spots.'),
	welcomeFreeSpinsTitle: () => stateI18nDerived.translate('FREE SPINS'),
	welcomeFreeSpinsText: () =>
		stateI18nDerived.translate('4 or more SCATTERS wake the dragon. Spots stay lit all feature.'),
	// panels
	tumbleWin: () => stateI18nDerived.translate('TUMBLE WIN'),
	youWon: () => stateI18nDerived.translate('YOU WON'),
	totalWin: () => stateI18nDerived.translate('TOTAL WIN'),
	freeSpinsComplete: () => stateI18nDerived.translate('FREE SPINS COMPLETE'),
	// a win level's title, BIG WIN to MAX WIN
	winLevel: (text: string) => stateI18nDerived.translate(text),
	// symbols
	scatter: () => stateI18nDerived.translate('SCATTER'),
};
