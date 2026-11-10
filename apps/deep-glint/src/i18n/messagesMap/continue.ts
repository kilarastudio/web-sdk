import type { Language } from 'state-shared';
import type { MessagesMap } from 'utils-shared/i18n';

// Preserve every language previously supplied by the instruction sprite sheet.
const instructions = {
	ar: 'اضغط في أي مكان للمتابعة',
	de: 'Zum Fortfahren an einer beliebigen Stelle drücken',
	en: 'Press anywhere to continue',
	es: 'Pulsa en cualquier lugar para continuar',
	fi: 'Jatka painamalla mitä tahansa kohtaa',
	fr: 'Appuyez n’importe où pour continuer',
	hi: 'जारी रखने के लिए कहीं भी दबाएँ',
	id: 'Tekan di mana saja untuk melanjutkan',
	ja: '画面のどこかを押して続行',
	ko: '계속하려면 아무 곳이나 누르세요',
	pl: 'Naciśnij w dowolnym miejscu, aby kontynuować',
	pt: 'Pressione em qualquer lugar para continuar',
	ru: 'Нажмите в любом месте, чтобы продолжить',
	tr: 'Devam etmek için herhangi bir yere basın',
	vi: 'Nhấn vào bất kỳ đâu để tiếp tục',
	zh: '点击任意位置继续',
} satisfies Record<Language, string>;

export default Object.fromEntries(
	Object.entries(instructions).map(([lang, text]) => [
		lang,
		{ 'Press anywhere to continue': text },
	]),
) as MessagesMap;
