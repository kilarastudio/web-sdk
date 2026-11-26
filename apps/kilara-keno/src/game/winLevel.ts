import { SECOND } from 'constants-shared/time';

import config from './config';
import type { ModeName } from './keno';

// How a win is shown, from its size against what the round cost (the math-sdk's standard win
// levels, measured against the real cost so a Chain round's 10× is the line between acknowledged
// and celebrated). A win below the cost is acknowledged, not celebrated (style-kilara.md, Wins).
export type WinLevel = {
	alias: 'standard' | 'small' | 'nice' | 'substantial' | 'big' | 'super' | 'mega' | 'epic' | 'max';
	big: boolean;
	celebrated: boolean;
	text: string | null;
	duration: number;
};

const LEVELS: (WinLevel & { from: number })[] = [
	{ from: 100, alias: 'epic', big: true, celebrated: true, text: 'EPIC WIN', duration: 7 * SECOND },
	{ from: 50, alias: 'mega', big: true, celebrated: true, text: 'MEGA WIN', duration: 6 * SECOND },
	{
		from: 30,
		alias: 'super',
		big: true,
		celebrated: true,
		text: 'SUPER WIN',
		duration: 5 * SECOND,
	},
	{ from: 15, alias: 'big', big: true, celebrated: true, text: 'BIG WIN', duration: 4 * SECOND },
	{ from: 5, alias: 'substantial', big: false, celebrated: true, text: null, duration: 2 * SECOND },
	{ from: 2, alias: 'nice', big: false, celebrated: true, text: null, duration: 1.5 * SECOND },
	{ from: 1, alias: 'small', big: false, celebrated: true, text: null, duration: 1 * SECOND },
	{ from: 0, alias: 'standard', big: false, celebrated: false, text: null, duration: 0.6 * SECOND },
];

const MAX: WinLevel = {
	alias: 'max',
	big: true,
	celebrated: true,
	text: 'MAX WIN',
	duration: 8 * SECOND,
};

// amount: the book's win in hundredths of the base bet
export const winLevel = (amount: number, mode: ModeName): WinLevel => {
	const { cost, maxWin } = config.betModes[mode];
	const times = amount / 100;
	if (times >= maxWin) return MAX;
	return LEVELS.find((level) => times / cost >= level.from)!;
};
