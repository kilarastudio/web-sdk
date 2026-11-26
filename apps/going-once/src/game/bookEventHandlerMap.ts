import _ from 'lodash';

import { recordBookEvent, checkIsMultipleRevealEvents, type BookEventHandlerMap } from 'utils-book';
import { stateBet, stateI18nDerived } from 'state-shared';
import { bookEventAmountToCurrencyString } from 'utils-shared/amount';

import { eventEmitter } from './eventEmitter';
import { winLevelMap, type WinLevel } from './winLevelMap';
import { stateGame, stateGameDerived } from './stateGame.svelte';
import type { BookEvent, BookEventOfType, BookEventContext, Lot } from './typesBookEvent';
import type { Position, RawSymbol } from './types';
import config from './config';

const t = stateI18nDerived.translate;

// "going once, going twice, sold": what the hammer says as the respins run down
const CALLS: Record<number, string> = { 2: 'GOING ONCE', 1: 'GOING TWICE', 0: 'SOLD' };

const animateSymbols = async ({ positions }: { positions: Position[] }) => {
	eventEmitter.broadcast({ type: 'boardShow' });
	await eventEmitter.broadcastAsync({
		type: 'boardWithAnimateSymbols',
		symbolPositions: positions,
	});
};

const openAuction = async (lots: Lot[], respins: number, bookEvents: BookEvent[]) => {
	const openingStrikes = bookEvents.filter(
		(event) => event.type === 'gavelStrike' && event.cell === null,
	).length;
	const extra =
		openingStrikes === 1
			? t('OPENS WITH A GAVEL STRIKE')
			: openingStrikes > 1
				? t('OPENS WITH {count} GAVEL STRIKES', { count: openingStrikes })
				: '';

	await eventEmitter.broadcastAsync({ type: 'uiHide' });
	await eventEmitter.broadcastAsync({ type: 'transition' });
	eventEmitter.broadcast({ type: 'freeSpinIntroShow' });
	eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_freespin' });
	await eventEmitter.broadcastAsync({
		type: 'freeSpinIntroUpdate',
		line: t('{lots} LOTS · {respins} RESPINS', { lots: lots.length, respins }),
		extra,
	});
	stateGame.auction = true;
	eventEmitter.broadcast({ type: 'freeSpinIntroHide' });
	eventEmitter.broadcast({ type: 'boardFrameGlowShow' });
	eventEmitter.broadcast({ type: 'boardHide' });
	eventEmitter.broadcast({ type: 'auctionShow', lots, respinsLeft: respins });
	await eventEmitter.broadcastAsync({ type: 'uiShow' });
	await eventEmitter.broadcastAsync({ type: 'drawerButtonShow' });
	eventEmitter.broadcast({ type: 'drawerFold' });
};

export const bookEventHandlerMap: BookEventHandlerMap<BookEvent, BookEventContext> = {
	reveal: async (bookEvent: BookEventOfType<'reveal'>, { bookEvents }: BookEventContext) => {
		const isBonusGame = checkIsMultipleRevealEvents({ bookEvents });
		if (isBonusGame) {
			eventEmitter.broadcast({ type: 'stopButtonEnable' });
			recordBookEvent({ bookEvent });
		}

		eventEmitter.broadcast({ type: 'winLineHide' });
		stateGame.gameType = bookEvent.gameType;
		await stateGameDerived.enhancedBoard.spin({
			revealEvent: bookEvent,
			paddingBoard: config.paddingReels[bookEvent.gameType] as RawSymbol[][],
		});
		eventEmitter.broadcast({ type: 'soundScatterCounterClear' });
	},
	baseGavel: async (bookEvent: BookEventOfType<'baseGavel'>) => {
		eventEmitter.broadcast({
			type: 'bannerShow',
			text: t('GAVEL: LINE WINS ×{multiplier}', { multiplier: bookEvent.multiplier }),
			hold: 1000,
		});
		await animateSymbols({ positions: [bookEvent.cell] });
	},
	winInfo: async (bookEvent: BookEventOfType<'winInfo'>) => {
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_winlevel_small' });
		for (const win of bookEvent.wins) {
			const times = win.meta.multiplier > 1 ? `  ×${win.meta.multiplier}` : '';
			eventEmitter.broadcast({
				type: 'winLineShow',
				lineIndex: win.meta.lineIndex,
				kind: win.kind,
				label: `${t('LINE')} ${win.meta.lineIndex}   ${win.kind} ${win.symbol}${times}   ${bookEventAmountToCurrencyString(win.win)}`,
			});
			await animateSymbols({ positions: win.positions });
		}
		eventEmitter.broadcast({ type: 'winLineHide' });
	},
	setTotalWin: async (bookEvent: BookEventOfType<'setTotalWin'>) => {
		stateBet.winBookEventAmount = bookEvent.amount;
	},
	wincap: async () => {
		// The max win ends the round; the amount is shown when the Auction ends.
		await eventEmitter.broadcastAsync({
			type: 'auctionCall',
			title: t('MAX WIN'),
			line: stateI18nDerived.times(config.betModes.base.max_win),
			hold: 1600,
		});
	},
	auctionStart: async (
		bookEvent: BookEventOfType<'auctionStart'>,
		{ bookEvents }: BookEventContext,
	) => {
		// the Auction's progress is recorded, so a round left in the middle resumes where it was
		recordBookEvent({ bookEvent });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_scatter_win_v2' });
		await animateSymbols({ positions: bookEvent.lots.map((lot) => lot.cell) });
		await openAuction(bookEvent.lots, bookEvent.respins, bookEvents);
	},
	auctionRespin: async (bookEvent: BookEventOfType<'auctionRespin'>) => {
		recordBookEvent({ bookEvent });
		await eventEmitter.broadcastAsync({
			type: 'auctionRespin',
			landed: bookEvent.landed,
			respinsLeft: bookEvent.respinsLeft,
		});
		const call = bookEvent.landed.length ? undefined : CALLS[bookEvent.respinsLeft];
		if (call) await eventEmitter.broadcastAsync({ type: 'bannerShow', text: t(call), hold: 450 });
	},
	buyerCollect: async (bookEvent: BookEventOfType<'buyerCollect'>) => {
		eventEmitter.broadcast({
			type: 'bannerShow',
			text: t('BUYER COLLECTS {value}', { value: `${bookEvent.value}×` }),
		});
		await eventEmitter.broadcastAsync({
			type: 'auctionBuyer',
			cell: bookEvent.cell,
			value: bookEvent.value,
		});
	},
	gavelStrike: async (bookEvent: BookEventOfType<'gavelStrike'>) => {
		eventEmitter.broadcast({ type: 'bannerShow', text: t('GAVEL: EVERY LOT ×2') });
		await eventEmitter.broadcastAsync({
			type: 'auctionGavel',
			cell: bookEvent.cell,
			lots: bookEvent.lots,
		});
	},
	lastBid: async (bookEvent: BookEventOfType<'lastBid'>) => {
		const after = bookEvent.before * bookEvent.multiplier;
		await eventEmitter.broadcastAsync({
			type: 'auctionCall',
			title:
				bookEvent.multiplier > 1
					? t('LAST BID ×{multiplier}', { multiplier: bookEvent.multiplier })
					: t('LAST BID ×1: NO RAISE'),
			line:
				bookEvent.multiplier > 1
					? `${bookEventAmountToCurrencyString(bookEvent.before)}  →  ${bookEventAmountToCurrencyString(after)}`
					: bookEventAmountToCurrencyString(after),
			hold: 1500,
		});
	},
	auctionEnd: async (bookEvent: BookEventOfType<'auctionEnd'>) => {
		eventEmitter.broadcast({ type: 'auctionLots', lots: bookEvent.lots });
		if (bookEvent.fullHouse) {
			await eventEmitter.broadcastAsync({
				type: 'auctionCall',
				title: t('FULL HOUSE ×2'),
				line: bookEventAmountToCurrencyString(bookEvent.total),
				hold: 1600,
			});
		}
	},
	freeSpinEnd: async (bookEvent: BookEventOfType<'freeSpinEnd'>) => {
		// the end of the Auction: the math sends it as a free spin end
		const winLevelData = winLevelMap[bookEvent.winLevel as WinLevel];

		await eventEmitter.broadcastAsync({ type: 'uiHide' });
		eventEmitter.broadcast({ type: 'freeSpinOutroShow' });
		await eventEmitter.broadcastAsync({
			type: 'freeSpinOutroCountUp',
			amount: bookEvent.amount,
			winLevelData,
		});
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_main' });
		stateGame.auction = false;
		eventEmitter.broadcast({ type: 'auctionHide' });
		eventEmitter.broadcast({ type: 'boardShow' });
		eventEmitter.broadcast({ type: 'boardFrameGlowHide' });
		eventEmitter.broadcast({ type: 'freeSpinOutroHide' });
		await eventEmitter.broadcastAsync({ type: 'transition' });
		await eventEmitter.broadcastAsync({ type: 'uiShow' });
		await eventEmitter.broadcastAsync({ type: 'drawerUnfold' });
		eventEmitter.broadcast({ type: 'drawerButtonHide' });
	},
	setWin: async (bookEvent: BookEventOfType<'setWin'>) => {
		// the Auction's own win is counted up once, when it ends (freeSpinEnd)
		if (stateGame.auction) return;
		const winLevelData = winLevelMap[bookEvent.winLevel as WinLevel];

		eventEmitter.broadcast({ type: 'winShow' });
		await eventEmitter.broadcastAsync({
			type: 'winUpdate',
			amount: bookEvent.amount,
			winLevelData,
		});
		eventEmitter.broadcast({ type: 'winHide' });
	},
	finalWin: async () => {
		eventEmitter.broadcast({ type: 'winLineHide' });
	},
	// customised: a round resumed in the middle of the Auction is brought back to where it was
	createBonusSnapshot: async (bookEvent: BookEventOfType<'createBonusSnapshot'>) => {
		const { bookEvents } = bookEvent;
		const lastSetTotalWinEvent = _.findLast(bookEvents, (event) => event.type === 'setTotalWin') as
			BookEventOfType<'setTotalWin'> | undefined;
		if (lastSetTotalWinEvent) stateBet.winBookEventAmount = lastSetTotalWinEvent.amount;

		const start = bookEvents.find((event) => event.type === 'auctionStart') as
			BookEventOfType<'auctionStart'> | undefined;
		if (!start) return;

		// the lots and respins as they stand now, from the auction's events so far
		const key = (cell: Position) => `${cell.reel}:${cell.row}`;
		const lots = new Map(start.lots.map((lot) => [key(lot.cell), lot]));
		let respinsLeft = start.respins;
		for (const event of bookEvents) {
			if (event.type === 'auctionRespin') {
				respinsLeft = event.respinsLeft;
				event.landed
					.filter((item) => item.kind === 'P')
					.forEach((item) => lots.set(key(item.cell), { cell: item.cell, value: item.value }));
			} else if (event.type === 'buyerCollect') {
				lots.set(key(event.cell), { cell: event.cell, value: event.value });
			} else if (event.type === 'gavelStrike') {
				event.lots.forEach((lot) => lots.set(key(lot.cell), lot));
			}
		}

		await openAuction(start.lots, start.respins, []);
		eventEmitter.broadcast({ type: 'auctionShow', lots: [...lots.values()], respinsLeft });
	},
};
