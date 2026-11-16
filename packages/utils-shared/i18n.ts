import _ from 'lodash';
import type { Messages } from '@lingui/core';

import type { Language } from 'state-shared';

export type MessagesMap = Record<Language, Messages>;
// one language's catalog: the English text as the key, the translation as the value
export type Catalog = Record<string, string>;

// Merge catalogs from the most general to the most specific: a later map wins on a shared key,
// so pass the shared UI first and the game after it.
export const mergeMessagesMaps = (messagesMapList: Partial<Record<Language, Catalog>>[]) => {
	const merged = messagesMapList
		.filter(Boolean)
		.reduce((acc, current) => _.merge(acc, current), {} as MessagesMap);

	return merged;
};

// Marks English text that is translated later, away from where it is written (a table of modes,
// a win level's title), so tools/i18n/check.mjs finds it as a key. Returns the text unchanged.
export const i18nKey = <T extends string>(text: T) => text;
