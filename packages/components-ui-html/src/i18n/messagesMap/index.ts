import type { Language } from 'state-shared';
import type { Catalog } from 'utils-shared/i18n';

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

// The shared UI's text (HUD, menus, autoplay, settings, errors), for every game.
// One file per language in ../locales, the English text as the key. English needs no entries:
// a missing key shows the English. tools/i18n/check.mjs lists what each language still lacks.
const messagesMap = {
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

export default messagesMap;
