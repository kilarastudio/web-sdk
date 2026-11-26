import type { BetType } from 'rgs-requests';

import type { Level } from './keno';

// math-sdk/games/kilara_keno/readme.txt, "Books"
type BookEventDraw = {
	index: number;
	type: 'draw';
	level: Level;
	picks: number;
	draws: number;
	// the book's own picks, ascending
	selected: number[];
	// the book's Kilau numbers (marked numbers that were not picked), ascending
	kilau: number[];
	// the numbers drawn, in order
	numbers: number[];
	// 1 = hit, 2 = Kilau ball, 0 = miss, in draw order
	pattern: number[];
	hits: number;
	// the best run of hits
	streak: number;
	// Kilau balls drawn: each adds one meter step
	kilauHits: number;
	multiplier: number;
	// hundredths of the base bet, before the multiplier
	pay: number;
};

type BookEventFinalWin = {
	index: number;
	type: 'finalWin';
	// hundredths of the base bet: pay × multiplier
	amount: number;
};

export type BookEvent = BookEventDraw | BookEventFinalWin;

export type Bet = BetType<BookEvent>;
export type BookEventOfType<T> = Extract<BookEvent, { type: T }>;
export type BookEventContext = { bookEvents: BookEvent[] };
