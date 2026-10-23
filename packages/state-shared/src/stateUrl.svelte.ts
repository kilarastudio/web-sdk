import { locales } from 'config-lingui';
import { page } from '$app/state';

export type Language = (typeof locales)[number];

export type Key =
	// keys for play
	| 'sessionID'
	| 'rgs_url'
	| 'lang'
	| 'currency'
	| 'device'
	| 'social'
	| 'demo'
	// keys for replay
	| 'replay'
	| 'amount'
	| 'game'
	| 'mode'
	| 'version'
	| 'event';

const getUrlSearchParam = (key: Key) => page.url.searchParams.get(key) as string;

// params for play
const lang = (): Language => {
	const requested = getUrlSearchParam('lang');
	const language = requested === 'br' ? 'pt' : requested;
	return locales.includes(language as Language) ? (language as Language) : 'en';
};
const currency = () => {
	const value = (getUrlSearchParam('currency') || '').trim().toUpperCase();
	return /^[A-Z]{3}$/.test(value) ? value : 'USD';
};
const sessionID = () => getUrlSearchParam('sessionID') || '';
const rgsUrl = () => getUrlSearchParam('rgs_url') || '';
const social = () => getUrlSearchParam('social') === 'true';

// params for replay
const replay = () => getUrlSearchParam('replay') === 'true';
const amount = () => {
	const value = Number(getUrlSearchParam('amount'));
	return Number.isFinite(value) && value > 0 ? value : 0;
};
const game = () => getUrlSearchParam('game') || '';
const version = () => getUrlSearchParam('version') || '';
const mode = () => getUrlSearchParam('mode') || '';
const event = () => getUrlSearchParam('event') || '';

export const stateUrlDerived = {
	// states for play
	lang,
	currency,
	sessionID,
	rgsUrl,
	social,
	// states for replay
	replay,
	amount,
	game,
	mode,
	version,
	event,
};
