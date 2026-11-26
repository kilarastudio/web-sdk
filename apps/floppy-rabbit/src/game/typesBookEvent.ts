import type { BetType } from 'rgs-requests';

import type { SymbolName, RawSymbol, GameType, Position } from './types';

type BookEventReveal = {
	index: number;
	type: 'reveal';
	board: RawSymbol[][];
	paddingPositions: number[];
	anticipation: number[];
	gameType: GameType;
};

type BookEventWinInfo = {
	index: number;
	type: 'winInfo';
	totalWin: number;
	wins: {
		symbol: SymbolName;
		win: number;
		positions: Position[];
		meta: {
			globalMult: number;
			clusterMult: number;
			winWithoutMult: number;
			overlay: Position;
		};
	}[];
};

type BookEventSetTumbleWin = { index: number; type: 'updateTumbleWin'; amount: number };
type BookEventSetTotalWin = { index: number; type: 'setTotalWin'; amount: number };
type BookEventSetWin = { index: number; type: 'setWin'; amount: number; winLevel: number };
type BookEventFinalWin = { index: number; type: 'finalWin'; amount: number };
type BookEventWincap = { index: number; type: 'wincap'; amount: number };

type BookEventFreeSpinTrigger = {
	index: number;
	type: 'freeSpinTrigger';
	totalFs: number;
	positions: Position[];
};

type BookEventFreeSpinRetrigger = {
	index: number;
	type: 'freeSpinRetrigger';
	totalFs: number;
	positions: Position[];
};

type BookEventUpdateFreeSpin = {
	index: number;
	type: 'updateFreeSpin';
	amount: number;
	total: number;
};

type BookEventFreeSpinEnd = {
	index: number;
	type: 'freeSpinEnd';
	amount: number;
	winLevel: number;
};

type BookEventTumbleBoard = {
	index: number;
	type: 'tumbleBoard';
	explodingSymbols: Position[];
	newSymbols: RawSymbol[][];
};

// Floppy Rabbit's own events (math-sdk/games/floppy_rabbit/game_events.py). Positions count the
// padding row, like winInfo; `footprints` is the grid afterwards, [reel][row] without padding.
type BookEventRabbitsEnter = {
	index: number;
	type: 'rabbitsEnter';
	rabbits: Position[];
	footprints: number[][];
};

type BookEventRabbitHop = {
	index: number;
	type: 'rabbitHop';
	rabbit: number;
	from: Position | null;
	to: Position;
	value: number;
	footprints: number[][];
};

type BookEventRabbitFlop = {
	index: number;
	type: 'rabbitFlop';
	rabbit: number;
	at: Position;
	footprints: number[][];
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
	| BookEventSetTumbleWin
	| BookEventSetTotalWin
	| BookEventSetWin
	| BookEventFinalWin
	| BookEventWincap
	| BookEventFreeSpinTrigger
	| BookEventFreeSpinRetrigger
	| BookEventUpdateFreeSpin
	| BookEventFreeSpinEnd
	| BookEventTumbleBoard
	| BookEventRabbitsEnter
	| BookEventRabbitHop
	| BookEventRabbitFlop
	| BookEventCreateBonusSnapshot;

export type Bet = BetType<BookEvent>;
export type BookEventOfType<T> = Extract<BookEvent, { type: T }>;
export type BookEventContext = { bookEvents: BookEvent[] };
