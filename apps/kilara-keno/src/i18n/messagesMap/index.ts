import { mergeMessagesMaps } from 'utils-shared/i18n';
import { messagesMap as messagesMapUiHtml } from 'components-ui-html';

import en from './en';

// Grey box: English only. The game's own strings are their own keys until the art pass adds the
// other languages.
const messagesMapGame = {
	en,
};

const messagesMap = mergeMessagesMaps([messagesMapGame, messagesMapUiHtml]);

export default messagesMap;
