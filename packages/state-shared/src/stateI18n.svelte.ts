import { i18n, type Messages } from '@lingui/core';
import { type Language } from './stateUrl.svelte';

export type TranslateValues = Record<string, string | number>;

// Lingui stays for locale-aware number formatting (utils-shared/amount). Text is a plain lookup:
// the English text is the key, a missing translation shows the English, and {name} in a message
// is filled from `values`. Catalogs are never compiled, so Lingui's own lookup would warn on every
// call in a production build.
export const stateI18n = $state({
	i18n,
	messages: {} as Record<string, string>,
});

const RTL_LANGUAGES: readonly Language[] = ['ar'];

// In a right-to-left language each filled-in value is isolated (FSI … PDI), so 25,000× stays one
// left-to-right piece inside the Arabic sentence.
const fill = (text: string, values?: TranslateValues) => {
	if (!values) return text;
	const isolate = RTL_LANGUAGES.includes(stateI18n.i18n.locale as Language);
	return text.replace(/\{(\w+)\}/g, (match, name) =>
		name in values ? (isolate ? `\u2068${values[name]}\u2069` : String(values[name])) : match,
	);
};

// Canvas text (Pixi) is drawn left to right whatever its language, so an Arabic line with a Latin
// word or a number in it comes out in the wrong order. For a right-to-left language every 2D
// context draws and measures a line that holds right-to-left letters right to left instead (a
// line with none, like ×4,096, stays left to right). Pixi places each line itself from its left
// edge, so its default alignment is pinned to the left.
const RTL_LETTERS = /[\u0590-\u08ff\ufb1d-\ufdff\ufe70-\ufefc]/;
let canvasRightToLeft = false;
const drawCanvasTextRightToLeft = () => {
	if (canvasRightToLeft || typeof CanvasRenderingContext2D === 'undefined') return;
	canvasRightToLeft = true;
	const prototype = CanvasRenderingContext2D.prototype;
	for (const name of ['fillText', 'strokeText', 'measureText'] as const) {
		const draw = prototype[name] as (...args: unknown[]) => unknown;
		Object.defineProperty(prototype, name, {
			configurable: true,
			writable: true,
			value: function (this: CanvasRenderingContext2D, ...args: unknown[]) {
				const rightToLeft = RTL_LETTERS.test(String(args[0]));
				this.direction = rightToLeft ? 'rtl' : 'ltr';
				if (rightToLeft && this.textAlign === 'start') this.textAlign = 'left';
				return draw.apply(this, args);
			},
		});
	}
};

export const stateI18nDerived = {
	init: (lang: Language, messages: Messages) => {
		stateI18n.i18n.load(lang, messages as Messages);
		stateI18n.i18n.activate(lang);
		stateI18n.messages = (messages ?? {}) as Record<string, string>;
		if (typeof document !== 'undefined') document.documentElement.lang = lang;
		if (RTL_LANGUAGES.includes(lang)) drawCanvasTextRightToLeft();
	},
	// a number in the player's language (25.000 in German, 25 000 in French), always in Latin
	// digits, which every market's slot screens use
	number: (value: number, options?: Intl.NumberFormatOptions) =>
		new Intl.NumberFormat(`${stateI18n.i18n.locale || 'en'}-u-nu-latn`, options).format(value),
	// a multiplier: 25,000× / 1.85× in English
	times: (value: number) => `${stateI18nDerived.number(value, { maximumFractionDigits: 2 })}×`,
	// a return to player as a percentage with two decimals: 96.70% in English
	percent: (share: number) =>
		`${stateI18nDerived.number(share * 100, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`,
	translate: (value: string, values?: TranslateValues) =>
		fill(Object.hasOwn(stateI18n.messages, value) ? stateI18n.messages[value] : value, values),
};
