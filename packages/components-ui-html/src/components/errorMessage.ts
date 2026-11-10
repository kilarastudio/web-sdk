import { i18nDerived } from '../i18n/i18nDerived';

/*
	Turns whatever reached stateModal.modal.error (an RGS error body, a thrown Error, a plain
	string) into what the player reads: a title, one sentence on what to do, and whether the game
	can carry on after closing the message or needs a reload. Codes follow the current RGS
	contract (ERR_VAL, ERR_IPB, ERR_GLE, ERR_ACT, ERR_GEN) plus the legacy ones still in the schema.
*/

export type ErrorMessage = {
	title: string;
	body: string;
	/** true: closing the message is enough; false: the game needs a reload */
	recoverable: boolean;
	/** the code and raw message, for support */
	code: string;
	detail: string;
};

const SESSION_CODES = ['ERR_VAL', 'ERR_IS', 'ERR_ATE', 'ERR_BNF', 'ERR_BE'];

const readCode = (error: any): string => {
	if (typeof error?.error === 'string') return error.error;
	if (typeof error?.code === 'string') return error.code;
	if (error instanceof Error) return error.name;
	return '';
};

const readDetail = (error: any): string => {
	if (error == null) return '';
	if (typeof error === 'string') return error;
	if (typeof error?.message === 'string') return error.message;
	try {
		return JSON.stringify(error);
	} catch {
		return String(error);
	}
};

// fetch() failures and non-200 responses read as a lost connection
const isConnection = (error: any, detail: string) =>
	error instanceof TypeError ||
	/failed to fetch|networkerror|load failed|unable to load rgs data/i.test(detail);

export const errorMessage = (error: any): ErrorMessage => {
	const code = readCode(error);
	const detail = readDetail(error);
	const base = { code, detail };

	if (code === 'ERR_IPB') {
		return {
			...base,
			title: i18nDerived.errorBalanceTitle(),
			body: i18nDerived.errorBalanceBody(),
			recoverable: true,
		};
	}

	if (code === 'ERR_GLE') {
		return {
			...base,
			title: i18nDerived.errorLimitTitle(),
			body: i18nDerived.errorLimitBody(),
			recoverable: true,
		};
	}

	if (code === 'ERR_ACT') {
		return {
			...base,
			title: i18nDerived.errorBusyTitle(),
			body: i18nDerived.errorBusyBody(),
			recoverable: true,
		};
	}

	if (SESSION_CODES.includes(code)) {
		return {
			...base,
			title: i18nDerived.errorSessionTitle(),
			body: i18nDerived.errorSessionBody(),
			recoverable: false,
		};
	}

	if (isConnection(error, detail)) {
		return {
			...base,
			title: i18nDerived.errorConnectionTitle(),
			body: i18nDerived.errorConnectionBody(),
			recoverable: false,
		};
	}

	return {
		...base,
		title: i18nDerived.errorGeneralTitle(),
		body: i18nDerived.errorGeneralBody(),
		recoverable: false,
	};
};
