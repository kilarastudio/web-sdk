import type { BetType } from 'rgs-requests';

import type { SymbolName, RawSymbol, GameType, Position } from './types';
import type { CrewName } from './constants';

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

type BookEventFreeSpinTrigger = {
	index: number;
	type: 'freeSpinTrigger';
	totalFs: number;
	positions: Position[];
};

type BookEventUpdateFreeSpin = {
	index: number;
	type: 'updateFreeSpin';
	amount: number;
	total: number;
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

type BookEventFreeSpinRetrigger = {
	index: number;
	type: 'freeSpinRetrigger';
	totalFs: number;
	positions: Position[];
};

type BookEventWincap = {
	index: number;
	type: 'wincap';
	amount: number;
};

// the crew (math-sdk/games/vault_job/readme.txt, "Events")
export type CrewMember = {
	cell: Position;
	crew: CrewName;
	multiplier: number;
	sticky: boolean;
};

type BookEventCrewStart = {
	index: number;
	type: 'crewStart';
	crew: Omit<CrewMember, 'sticky'>[];
};

type BookEventCrewMove = {
	index: number;
	type: 'crewMove';
	moves: { from: Position; to: Position | null; multiplier: number }[];
};

type BookEventCrewExpand = {
	index: number;
	type: 'crewExpand';
	reels: { reel: number; from: Position }[];
};

type BookEventCrewHack = {
	index: number;
	type: 'crewHack';
	hacks: { cell: Position; multiplier: number }[];
};

type BookEventCrewBoard = {
	index: number;
	type: 'crewBoard';
	crew: CrewMember[];
};

type BookEventCrewUpgrade = {
	index: number;
	type: 'crewUpgrade';
	upgrades: { cell: Position; multiplier: number }[];
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
	| BookEventFreeSpinTrigger
	| BookEventUpdateFreeSpin
	| BookEventCreateBonusSnapshot
	| BookEventFinalWin
	| BookEventSetWin
	| BookEventFreeSpinEnd
	| BookEventFreeSpinRetrigger
	| BookEventWincap
	| BookEventCrewStart
	| BookEventCrewMove
	| BookEventCrewExpand
	| BookEventCrewHack
	| BookEventCrewBoard
	| BookEventCrewUpgrade;

export type Bet = BetType<BookEvent>;
export type BookEventOfType<T> = Extract<BookEvent, { type: T }>;
export type BookEventContext = { bookEvents: BookEvent[] };
