import { stateI18n } from 'state-shared';

import { BOOK_AMOUNT_MULTIPLIER } from 'constants-shared/bet';
import { stateBet } from 'state-shared';

import { CURRENCY_META } from './currency';

// bookEventAmount: is the amount or win numbers in the events of books, e.g. the amount in setTotalWin bookEvent
// {
// 	"index": 3,
// 	"type": "setTotalWin",
// 	"amount": 100
// },
// if betting on $1,   100 bookEventAmount equals to $1.    betAmountMultiplier is (100 / BOOK_AMOUNT_MULTIPLIER =) 1
// if betting on $1,    50 bookEventAmount equals to $0.5.  betAmountMultiplier is ( 50 / BOOK_AMOUNT_MULTIPLIER =) 0.5
// if betting on $0.5, 100 bookEventAmount equals to $0.5.  betAmountMultiplier is (100 / BOOK_AMOUNT_MULTIPLIER =) 1
// if betting on $0.5,  50 bookEventAmount equals to $0.25. betAmountMultiplier is ( 50 / BOOK_AMOUNT_MULTIPLIER =) 0.5

export const bookEventAmountToBetAmountMultiplier = (bookEventAmount: number) =>
	bookEventAmount / BOOK_AMOUNT_MULTIPLIER;

export const bookEventAmountToNormalisedAmount = (bookEventAmount: number) => {
	const betAmountMultiplier = bookEventAmountToBetAmountMultiplier(bookEventAmount);
	return stateBet.wageredBetAmount * betAmountMultiplier;
};

export const numberToFloat = (value: number) => Number.parseFloat(`${value}`);

const formatCurrency = (value: number, win: boolean) => {
	const meta = CURRENCY_META[stateBet.currency] ?? {
		symbol: stateBet.currency,
		decimals: 2,
		after: true,
	};
	const amount = stateI18n.i18n.number(value, {
		minimumFractionDigits: meta.decimals,
		maximumFractionDigits: win ? Math.max(meta.decimals, 4) : meta.decimals,
	});
	return meta.after ? `${amount} ${meta.symbol}` : `${meta.symbol}${amount}`;
};

export const numberToCurrencyString = (value: number) => formatCurrency(value, false);
export const numberToWinCurrencyString = (value: number) => formatCurrency(value, true);

export const bookEventAmountToCurrencyString = (bookEventAmount: number) => {
	const normalisedAmount = bookEventAmountToNormalisedAmount(bookEventAmount);
	return numberToWinCurrencyString(normalisedAmount);
};

// A win amount on its way up to its target, for a count-up: whole display units (cents) while
// it climbs, rounded down so it never shows more than the win, and the exact win, sub-cent
// digits included, once it has arrived.
export const bookEventAmountToCountUpCurrencyString = (
	bookEventAmount: number,
	targetBookEventAmount: number,
) => {
	if (bookEventAmount === targetBookEventAmount)
		return bookEventAmountToCurrencyString(bookEventAmount);

	const decimals = CURRENCY_META[stateBet.currency]?.decimals ?? 2;
	const unit = 10 ** decimals;
	const normalisedAmount = bookEventAmountToNormalisedAmount(bookEventAmount);

	return numberToCurrencyString(Math.floor(normalisedAmount * unit + 1e-6) / unit);
};
