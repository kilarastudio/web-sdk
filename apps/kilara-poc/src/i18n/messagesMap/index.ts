import { mergeMessagesMaps } from 'utils-shared/i18n';
import { messagesMap as messagesMapUiHtml } from 'components-ui-html';

import en from './en';
import zh from './zh';

const messagesMapGame = {
	en,
	zh,
};

const messagesMap = mergeMessagesMaps([messagesMapGame, messagesMapUiHtml]);

export default messagesMap;
