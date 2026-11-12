import { stateI18nDerived, stateUrlDerived } from 'state-shared';

const translateSafe = (key: string) => {
	try {
		return stateI18nDerived.translate(key);
	} catch {
		return key;
	}
};

export const i18nDerived = {
	bet: () => (stateUrlDerived.social() ? 'SPIN' : stateI18nDerived.translate('BET')),
	max: () => stateI18nDerived.translate('MAX'),
	betMenu: () =>
		stateUrlDerived.social() ? 'PLAY AMOUNT' : stateI18nDerived.translate('BET MENU'),
	selectYourBet: () =>
		stateUrlDerived.social()
			? 'SELECT YOUR PLAY AMOUNT'
			: stateI18nDerived.translate('SELECT YOUR BET'),
	confirm: () => stateI18nDerived.translate('CONFIRM'),
	masterVolume: () => stateI18nDerived.translate('MASTER VOLUME'),
	musicVolume: () => stateI18nDerived.translate('MUSIC VOLUME'),
	soundEffectVolume: () => stateI18nDerived.translate('SOUND EFFECT VOLUME'),
	autoSpins: () => stateI18nDerived.translate('AUTO SPINS'),
	numberOfRounds: () => stateI18nDerived.translate('NUMBER OF ROUNDS'),
	advanced: () => stateI18nDerived.translate('ADVANCED'),
	singleWinLimit: () => stateI18nDerived.translate('SINGLE WIN LIMIT'),
	lossLimit: () => stateI18nDerived.translate('LOSS LIMIT'),
	startAutoplay: () => stateI18nDerived.translate('START AUTOPLAY'),
	notification: () => stateI18nDerived.translate('NOTIFICATION'),
	autoSpinsStopInfo: () => stateI18nDerived.translate('AUTO PLAY HAS STOPPED DUE TO'),
	// no restricted social words (bet, funds), so one text serves both modes
	insufficientFunds: () =>
		stateI18nDerived.translate(
			'YOUR BALANCE DOES NOT COVER THE NEXT ROUND. LOWER THE AMOUNT OR ADD TO YOUR BALANCE.',
		),
	lossLimitReached: () => stateI18nDerived.translate('LOSS LIMIT REACHED'),
	singleWinLimitReached: () => stateI18nDerived.translate('SINGLE WIN LIMIT REACHED'),
	settings: () => stateI18nDerived.translate('SETTINGS'),
	// error messages: no restricted social words (bet, money, gamble), so one text serves both
	// modes; an error can come before the language loads, so these fall back to the English key
	errorBalanceTitle: () => translateSafe('BALANCE TOO LOW'),
	errorBalanceBody: () =>
		translateSafe('Your balance does not cover this round. Choose a lower amount or add to your balance.'),
	errorLimitTitle: () => translateSafe('LIMIT REACHED'),
	errorLimitBody: () => translateSafe('You have reached a play limit set on your account.'),
	errorBusyTitle: () => translateSafe('ONE MOMENT'),
	errorBusyBody: () =>
		translateSafe('The server is busy right now. Wait a few seconds, then try again.'),
	errorSessionTitle: () => translateSafe('SESSION ENDED'),
	errorSessionBody: () =>
		translateSafe('Your session is no longer valid. Reload the game to continue.'),
	errorConnectionTitle: () => translateSafe('CONNECTION LOST'),
	errorConnectionBody: () =>
		translateSafe('The game could not reach the server. Check your connection and reload.'),
	errorGeneralTitle: () => translateSafe('SOMETHING WENT WRONG'),
	errorGeneralBody: () =>
		translateSafe('The game ran into a problem. Reload the game to continue.'),
	ok: () => translateSafe('OK'),
	reload: () => translateSafe('RELOAD'),
	// hud
	audio: () => stateI18nDerived.translate('AUDIO'),
	balance: () => stateI18nDerived.translate('BALANCE'),
	win: () => stateI18nDerived.translate('WIN'),
	stop: () => stateI18nDerived.translate('STOP'),
	buyBonus: () =>
		stateUrlDerived.social() ? 'PLAY BONUS' : stateI18nDerived.translate('BUY BONUS'),
	disable: () => stateI18nDerived.translate('DISABLE'),
	freeSpins: () => stateI18nDerived.translate('FREE SPINS'),
	decrease: () => stateI18nDerived.translate('-'),
	increase: () => stateI18nDerived.translate('+'),
	menu: () => stateI18nDerived.translate('MENU'),
	turbo: () => stateI18nDerived.translate('TURBO'),
	autoSpin: () => stateI18nDerived.translate('AUTO SPIN'),
	payTable: () => (stateUrlDerived.social() ? 'WIN TABLE' : stateI18nDerived.translate('PAYTABLE')),
	info: () => stateI18nDerived.translate('INFO'),
	soundOn: () => stateI18nDerived.translate('SOUND ON'),
	soundOff: () => stateI18nDerived.translate('SOUND OFF'),
	menuExit: () => stateI18nDerived.translate('EXIT'),
	showControls: () => stateI18nDerived.translate('SHOW CONTROLS'),
	hideControls: () => stateI18nDerived.translate('HIDE CONTROLS'),
	// replay
	play: () => stateI18nDerived.translate('PLAY'),
	playing: () => stateI18nDerived.translate('PLAYING'),
	playAgain: () => stateI18nDerived.translate('PLAY AGAIN'),
	realCost: () => stateI18nDerived.translate('REAL COST'),
};
