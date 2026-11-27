import { stateUrlDerived } from 'state-shared';

import type { Bet } from './typesBookEvent';
import config from './config';

// The RGS never receives the player's numbers, so a round resumed after a reload does not know
// them. A round is resumed when its end-round did not get through (the connection dropped), and
// the shared flow sends end-round as soon as the play answers, before the game sees the round:
// so the numbers are kept here before the round is asked for, with the session and the mode. A
// session has one open round at a time, so a resumed round of the same session and mode is the
// one these numbers played. A reload in the same session plays it on the player's own numbers; a
// new session (the game opened again from the lobby), another device or blocked storage shows the
// book's own board.
const KEY = 'keno-chain:round-picks';

type Saved = { session: string; mode: string; picks: number[] };

const validPicks = (picks: unknown): picks is number[] =>
	Array.isArray(picks) &&
	(config.pickSizes as readonly number[]).includes(picks.length) &&
	new Set(picks).size === picks.length &&
	picks.every((n) => Number.isInteger(n) && n >= 1 && n <= config.boardNumbers);

export const savePicks = (mode: string, picks: number[]) => {
	const session = stateUrlDerived.sessionID();
	try {
		if (session && validPicks(picks)) {
			const saved: Saved = { session, mode: mode.toLowerCase(), picks: [...picks] };
			localStorage.setItem(KEY, JSON.stringify(saved));
		} else {
			localStorage.removeItem(KEY);
		}
	} catch {
		// storage blocked (private mode, a sandboxed frame): a resumed round shows the book's board
	}
};

// The numbers this session played in the round to resume, or null when they are not known.
export const loadPicks = (bet: Bet): number[] | null => {
	const session = stateUrlDerived.sessionID();
	if (!session || !bet.mode) return null;
	try {
		const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<Saved> | null;
		return saved?.session === session &&
			saved.mode === bet.mode.toLowerCase() &&
			validPicks(saved.picks)
			? [...saved.picks]
			: null;
	} catch {
		return null;
	}
};
