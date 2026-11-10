import { stateI18nDerived } from 'state-shared';
import { i18nDerived as i18nDerivedUiHtml } from 'components-ui-html';

export const i18nDerived = {
	...i18nDerivedUiHtml,
	pressToContinue: () => stateI18nDerived.translate('Press anywhere to continue'),
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
