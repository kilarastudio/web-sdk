import { Tween } from 'svelte/motion';
import { cubicOut } from 'svelte/easing';

import { SYMBOL_GLOW, type SymbolKey } from '../pixel/symbols';

// What the board shows round its symbols, drawn by components/SymbolFx.svelte in board units:
// the light behind a winning symbol (under every symbol) and the dust a landing symbol throws up
// (over them).

// A win holds the symbol grown by this much, uniformly, until the tumble takes it.
export const WIN_SCALE = 1.22;
// how far a winning symbol and its light breathe, and how long one breath takes: the light's beat
// (WIN_GLOW_WAVES frames on the pixel clock) runs on the same time, so they pulse as one
export const WIN_BREATH = { reach: 0.035, period: 600 };

export type GlowCell = {
	id: number;
	x: number;
	y: number;
	ramp: string;
	start: number;
	// a short light (a scatter landing) goes by itself at this time
	until?: number;
	// held on past `until` while a column waits on a scatter (a scatter's landing light)
	anticipated?: boolean;
	// which SymbolFx draws it: the board's (none), or one of the symbol gallery's (dev/)
	scope?: string;
};
export type Puff = { id: number; x: number; y: number; embers: boolean; start: number };

// dimOthers: off on the symbol gallery (dev/), where every symbol takes its turn to win
export const symbolFx = $state({ glows: [] as GlowCell[], puffs: [] as Puff[], dimOthers: true });

// 0 to 1: how far the board has turned to its winners. The other symbols dim a little, so the
// winners stand apart; a winner left waiting for the tumble stays grown by it.
export const spotlight = new Tween(0, { duration: 200, easing: cubicOut });

// the breath every winner shares, so a cluster pulses together: 1 ± WIN_BREATH.reach
export const winBeat = $state({ scale: 1 });

let id = 0;
let request = 0;
const beat = (now: number) => {
	winBeat.scale = 1 + WIN_BREATH.reach * Math.sin((Math.PI * 2 * now) / WIN_BREATH.period);
	if (spotlight.target > 0) request = requestAnimationFrame(beat);
	else {
		request = 0;
		winBeat.scale = 1;
	}
};

const glowOf = (key: string) => SYMBOL_GLOW[key as SymbolKey];

// the board turns to these winners: each gets its light, the rest dim
export const showWin = (cells: { x: number; y: number; key: string }[], scope?: string) => {
	const start = performance.now();
	for (const { x, y, key } of cells) {
		const ramp = glowOf(key);
		const lit = symbolFx.glows.some(
			(glow) => glow.x === x && glow.y === y && glow.scope === scope && glow.until === undefined,
		);
		if (!ramp || lit) continue;
		symbolFx.glows.push({ id: ++id, x, y, ramp, start, scope });
	}
	spotlight.set(1);
	if (!request && typeof window !== 'undefined') request = requestAnimationFrame(beat);
};

// the winners are gone (or the round moved on): their lights go out and the board comes back up
export const endWin = (scope?: string) => {
	symbolFx.glows = symbolFx.glows.filter(
		(glow) => glow.until !== undefined || glow.scope !== scope,
	);
	if (!symbolFx.glows.some((glow) => glow.until === undefined)) spotlight.set(0);
};

// the winners are breaking: their lights shrink away with them, after `delay` ms
export const closeWinLights = (delay: number, scope?: string) => {
	const until = performance.now() + delay;
	for (const glow of symbolFx.glows)
		if (glow.until === undefined && glow.scope === scope) glow.until = until;
};

// a short light behind one symbol: the dragon's eye landing, held while a column waits on a
// scatter so the eyes already down stay lit through the wait
export const flashGlow = (x: number, y: number, key: string, duration: number) => {
	const ramp = glowOf(key);
	if (!ramp) return;
	const start = performance.now();
	symbolFx.glows.push({ id: ++id, x, y, ramp, start, until: start + duration, anticipated: true });
};

// the dust (and for a heavy symbol, embers) knocked up where a symbol lands; y is its cell's middle
const HEAVY = new Set(['symbolH1', 'symbolH2', 'symbolH3', 'symbolH4', 'symbolScatter']);
export const landPuff = (x: number, y: number, key: string) => {
	symbolFx.puffs.push({ id: ++id, x, y, embers: HEAVY.has(key), start: performance.now() });
};
