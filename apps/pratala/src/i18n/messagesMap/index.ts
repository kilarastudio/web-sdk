import type { Language } from 'state-shared';
import { mergeMessagesMaps, type Catalog } from 'utils-shared/i18n';
import { messagesMap as messagesMapUiHtml } from 'components-ui-html';

import ar from '../locales/ar';
import da from '../locales/da';
import de from '../locales/de';
import en from '../locales/en';
import es from '../locales/es';
import fi from '../locales/fi';
import fr from '../locales/fr';
import hi from '../locales/hi';
import id from '../locales/id';
import ja from '../locales/ja';
import ko from '../locales/ko';
import pl from '../locales/pl';
import pt from '../locales/pt';
import ru from '../locales/ru';
import tr from '../locales/tr';
import vi from '../locales/vi';
import zh from '../locales/zh';

// Pratala's own text, one file per language in ../locales (the English text as the key). The
// shared UI's catalog goes first, so a key Pratala also translates takes Pratala's text.
// tools/i18n/check.mjs lists what each language still lacks.
const messagesMapGame = {
	ar,
	da,
	de,
	en,
	es,
	fi,
	fr,
	hi,
	id,
	ja,
	ko,
	pl,
	pt,
	ru,
	tr,
	vi,
	zh,
} satisfies Record<Language, Catalog>;

const messagesMap = mergeMessagesMaps([messagesMapUiHtml, messagesMapGame]);

export default messagesMap;
