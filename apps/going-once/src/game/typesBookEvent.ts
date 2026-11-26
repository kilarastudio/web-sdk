import type { BetType } from 'rgs-requests';

import type { SymbolName, RawSymbol, GameType, Position } from './types';

// the SDK's standard lines events
type BookEventReveal = {
	index: number;
	type: 'reveal';
	board: RawSymbol[][];
	paddingPositions: number[];
	anticipation: number[];
	gameType: GameType;
};

type BookEventSetTotalWin = {
	index: number;
	type: 'setTotalWin';
	amount: number;
};

type BookEventFinalWin = {
	index: number;
	type: 'finalWin';
	amount: number;
};

type BookEventSetWin = {
	index: number;
	type: 'setWin';
	amount: number;
	winLevel: number;
};

type BookEventFreeSpinEnd = {
	index: number;
	type: 'freeSpinEnd';
	amount: number;
	winLevel: number;
};

type BookEventWinInfo = {
	index: number;
	type: 'winInfo';
	totalWin: number;
	wins: {
		symbol: SymbolName;
		kind: number;
		win: number;
		positions: Position[];
		meta: {
			lineIndex: number;
			multiplier: number;
			winWithoutMult: number;
			globalMult: number;
			lineMultiplier: number;
		};
	}[];
};

type BookEventWincap = {
	index: number;
	type: 'wincap';
	amount: number;
};

// the auction (math-sdk/games/going_once/readme.txt, "Events")
export type Lot = { cell: Position; value: number };

type BookEventBaseGavel = {
	index: number;
	type: 'baseGavel';
	cell: Position;
	multiplier: number;
};

type BookEventAuctionStart = {
	index: number;
	type: 'auctionStart';
	lots: Lot[];
	respins: number;
};

type BookEventAuctionRespin = {
	index: number;
	type: 'auctionRespin';
	respin: number;
	landed: { cell: Position; kind: 'P' | 'G' | 'B'; value: number }[];
	respinsLeft: number;
};

type BookEventBuyerCollect = {
	index: number;
	type: 'buyerCollect';
	cell: Position;
	value: number;
};

type BookEventGavelStrike = {
	index: number;
	type: 'gavelStrike';
	// null for a strike a buy mode starts with
	cell: Position | null;
	lots: Lot[];
};

type BookEventLastBid = {
	index: number;
	type: 'lastBid';
	multiplier: number;
	before: number;
};

type BookEventAuctionEnd = {
	index: number;
	type: 'auctionEnd';
	lots: Lot[];
	total: number;
	fullHouse: boolean;
};

// customised
type BookEventCreateBonusSnapshot = {
	index: number;
	type: 'createBonusSnapshot';
	bookEvents: BookEvent[];
};

export type BookEvent =
	| BookEventReveal
	| BookEventWinInfo
	| BookEventSetTotalWin
	| BookEventCreateBonusSnapshot
	| BookEventFinalWin
	| BookEventSetWin
	| BookEventFreeSpinEnd
	| BookEventWincap
	| BookEventBaseGavel
	| BookEventAuctionStart
	| BookEventAuctionRespin
	| BookEventBuyerCollect
	| BookEventGavelStrike
	| BookEventLastBid
	| BookEventAuctionEnd;

export type Bet = BetType<BookEvent>;
export type BookEventOfType<T> = Extract<BookEvent, { type: T }>;
export type BookEventContext = { bookEvents: BookEvent[] };
