import { mergeMessagesMaps } from 'utils-shared/i18n';
import { messagesMap as messagesMapUiHtml } from 'components-ui-html';

import en from './en';
import zh from './zh';
import continueMessages from './continue';

const messagesMapGame = {
	en,
	zh,
};

const messagesMap = mergeMessagesMaps([continueMessages, messagesMapGame, messagesMapUiHtml]);

export default messagesMap;
