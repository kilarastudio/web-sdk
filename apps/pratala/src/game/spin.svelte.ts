import _ from 'lodash';
import { cubicOut } from 'svelte/easing';
import { prefersReducedMotion } from 'svelte/motion';

import { stateBet } from 'state-shared';

import type { RawSymbol } from './types';
import { stateGame, stateGameDerived } from './stateGame.svelte';
import { getSymbolY } from './utils';
import {
	BOARD_DIMENSIONS,
	COLUMN_LANDING,
	SPIN_FLOW,
	STREAM_SYMBOLS,
	SYMBOL_SIZE,
	fallOutEasing,
	settleEasing,
} from './constants';

// The start of a spin, tumble style (numbers in constants.ts SPIN_FLOW). The board never stands
// empty while the round is on its way:
// 1. At the press the round is asked for (game/actor.ts does not wait for this) and the whole
//    board falls out at once, bottom row first, gathering speed.
// 2. A stream of dimmed paying symbols follows the old board's last symbol down every column, a
//    cell apart and at the falling speed, for as long as the answer takes.
// 3. Once the answer is in (and not before minDuration), each column in its turn ends its stream:
//    the result follows the last stream symbol a cell behind at the same speed and lands on the
//    settle curve's slowing half. The columns keep their left-to-right beat and the wait on a
//    scatter (COLUMN_LANDING), and a column waiting its turn keeps streaming.
// Everything is a function of the time since the press, so the stream and the symbols that follow
// it move as one. One frame loop moves the falling board and the stream; each landing is a single
// tween to the symbol's place, so its touch (contact.svelte.ts) reads as any landing does.

type Flow = (typeof SPIN_FLOW)['normal'];

export type StreamSymbol = { id: string; reelIndex: number; y: number; rawSymbol: RawSymbol };

// the stream's symbols in view, for SpinStream.svelte
export const spinStream = $state({ symbols: [] as StreamSymbol[] });

const ROWS = BOARD_DIMENSIONS.y;
const CELL = SYMBOL_SIZE;
const BOARD_HEIGHT = ROWS * CELL;
// a symbol is drawn while its middle is inside these (SymbolWrap); a little past them it is gone
const TOP = -CELL / 2;
const BOTTOM = BOARD_HEIGHT + CELL / 2;
const GONE = BOTTOM + CELL;

// The landing is the settle curve from its fastest point on, so a symbol that arrives at a steady
// speed slows into place exactly as a dropped one does: TAIL_SLOPE says how fast it starts (a
// landing over distance d in time t starts at d × TAIL_SLOPE / t) and TAIL_TOUCH when it first
// reaches its place, the touch. Reduced motion lands on cubicOut, without running past.
const tailOf = (easing: (t: number) => number) => {
	const steps = 2000;
	const at = (t: number) => (easing(t + 1 / steps) - easing(t)) * steps;
	const peak = _.maxBy(_.range(steps), (step) => at(step / steps))! / steps;
	const from = easing(peak);
	const tail = (s: number) => (easing(peak + s * (1 - peak)) - from) / (1 - from);
	const slope = (tail(1 / steps) - tail(0)) * steps;
	const touch = (_.find(_.range(steps + 1), (step) => tail(step / steps) >= 1) ?? steps) / steps;

	return { tail, slope, touch };
};
const SETTLE_TAIL = tailOf(settleEasing);
const REDUCED_TAIL = { tail: cubicOut, slope: 3, touch: 1 };

// how far a symbol has fallen τ ms after it started: gathering speed, then steady
const fallen = (flow: Flow, time: number) => {
	const gatherTime = (1.75 * flow.gather) / flow.speed;
	if (time <= 0) return 0;
	if (time < gatherTime) return flow.gather * fallOutEasing(time / gatherTime);
	return flow.gather + flow.speed * (time - gatherTime);
};
const timeToFall = (flow: Flow, distance: number) => {
	const gatherTime = (1.75 * flow.gather) / flow.speed;
	if (distance >= flow.gather) return gatherTime + (distance - flow.gather) / flow.speed;
	// fallOutEasing is 0.25 s + 0.75 s²
	return (gatherTime * (-0.25 + Math.sqrt(0.0625 + (3 * distance) / flow.gather))) / 1.5;
};

// bottom row first, the padding row under the board with it, the one above it last
const rowDelay = (flow: Flow, row: number) => flow.rowInterval * Math.max(0, ROWS - 1 - row);
// the old board's last symbol (the padding row above it) heads the stream
const HEAD_ROW = -1;
const headDelay = (flow: Flow) => rowDelay(flow, HEAD_ROW);
// from the press until the old board is out of sight
const oldBoardGone = (flow: Flow) =>
	headDelay(flow) + timeToFall(flow, GONE - getSymbolY(HEAD_ROW));

// a long run of stream symbols per column, never the same twice in a row
const STREAM_LENGTH = 48;
const streamSequence = () => {
	const sequence: RawSymbol[] = [];
	while (sequence.length < STREAM_LENGTH) {
		const name = _.sample(STREAM_SYMBOLS)!;
		if (
			name !== sequence.at(-1)?.name &&
			(sequence.length < STREAM_LENGTH - 1 || name !== sequence[0].name)
		)
			sequence.push({ name });
	}
	return sequence;
};

type Landing = {
	at: number;
	rawSymbols: RawSymbol[];
	// a column after the first scatter wait: never hurried by a slam
	noStop: boolean;
	fast: boolean;
	// putting the board back after a failed request: no sounds
	quiet: boolean;
	started: boolean;
	onFinishing: () => void;
	resolve: () => void;
};

type Column = {
	// the stream's last symbol (its place in the chain behind the head) once the result follows it
	streamEnd: number | undefined;
	landing: Landing | undefined;
	landed: boolean;
};

type Run = {
	at: number;
	flow: Flow;
	// where each reel symbol was when the board started to fall, and whether it is still falling
	fallingFrom: number[][];
	falling: boolean[][];
	columns: Column[];
	sequences: RawSymbol[][];
	landing: boolean;
	slammed: boolean;
};

let run: Run | undefined;
let frame = 0;

// where the head of the stream (the old board's last symbol) is: the stream rides a cell apart
// behind it
const headY = (current: Run, now: number) =>
	getSymbolY(HEAD_ROW) + fallen(current.flow, now - current.at - headDelay(current.flow));

const tick = () => {
	frame = 0;
	const current = run;
	if (!current) return;
	const now = performance.now();
	let moving = false;

	// the old board falls out
	stateGame.board.forEach((reel, reelIndex) =>
		reel.reelState.symbols.forEach((reelSymbol, symbolIndex) => {
			if (!current.falling[reelIndex][symbolIndex]) return;
			const time = now - current.at - rowDelay(current.flow, reelSymbol.symbolIndexOfBoard);
			if (time < 0) return (moving = true);
			if (reelSymbol.symbolState !== 'spin') reelSymbol.symbolState = 'spin';
			const y = current.fallingFrom[reelIndex][symbolIndex] + fallen(current.flow, time);
			reelSymbol.symbolY.set(y, { duration: 0 });
			if (y > GONE) current.falling[reelIndex][symbolIndex] = false;
			else moving = true;
		}),
	);

	// a column whose turn has come ends its stream and lands
	current.columns.forEach((column, reelIndex) => {
		if (column.landing && !column.landing.started && now >= column.landing.at)
			land(current, reelIndex, now);
	});

	// the stream: chain place k rides k cells behind the head
	const head = headY(current, now);
	const symbols: StreamSymbol[] = [];
	current.columns.forEach((column, reelIndex) => {
		const last = Math.min(column.streamEnd ?? Infinity, Math.ceil((head - TOP) / CELL) - 1);
		const first = Math.max(1, Math.floor((head - GONE) / CELL) + 1);
		for (let place = first; place <= last; place++) {
			symbols.push({
				id: `${reelIndex}:${place}`,
				reelIndex,
				y: head - place * CELL,
				rawSymbol: current.sequences[reelIndex][place % STREAM_LENGTH],
			});
		}
		// the loop runs until every column has landed and its stream has run out of the board
		if (!column.landed || last >= first) moving = true;
	});
	spinStream.symbols = symbols;

	if (moving) frame = requestAnimationFrame(tick);
	else if (run === current) run = undefined;
};

const loop = () => {
	if (!frame) frame = requestAnimationFrame(tick);
};

// The result follows the stream's last symbol into the column.
const land = (current: Run, reelIndex: number, now: number) => {
	const column = current.columns[reelIndex];
	const landing = column.landing!;
	const reel = stateGame.board[reelIndex];
	const { flow } = current;
	const { tail, slope, touch } = prefersReducedMotion.current ? REDUCED_TAIL : SETTLE_TAIL;
	const interval = landing.fast ? 0 : flow.landInterval;
	landing.started = true;

	// the topmost symbol of the chain in view (the old board's head if no stream symbol has come
	// in yet); the ones behind it are out of sight and are dropped
	const head = headY(current, now);
	const streamEnd = Math.max(0, Math.ceil((head - TOP) / CELL) - 1);
	column.streamEnd = streamEnd;
	const lastY = head - streamEnd * CELL;

	reel.reelState.motion = 'fallingIn';
	let left = ROWS;
	reel.reelState.symbols.forEach((reelSymbol, symbolIndex) => {
		const row = reelSymbol.symbolIndexOfBoard;
		const target = getSymbolY(row);
		current.falling[reelIndex][symbolIndex] = false;
		reelSymbol.rawSymbol = landing.rawSymbols[symbolIndex];
		reelSymbol.symbolState = 'spin';

		// the padding rows are never seen: straight to their places
		if (row < 0 || row >= ROWS) {
			reelSymbol.symbolY.set(target, { duration: 0 });
			return;
		}

		// a cell behind the stream, each row further back by what it lands after the one under it
		const behind = ROWS - 1 - row;
		const from = lastY - CELL - behind * (CELL + flow.speed * interval);
		const distance = target - from;
		const settle = Math.min(flow.settle, distance);
		const steady = distance - settle;
		const steadyTime = steady / flow.speed;
		const settleTime = (settle * slope) / flow.speed;
		const duration = steadyTime + settleTime;
		const easing = (t: number) => {
			const time = t * duration;
			if (time < steadyTime) return (flow.speed * time) / distance;
			return (steady + settle * tail((time - steadyTime) / settleTime)) / distance;
		};

		reelSymbol.symbolY.set(from, { duration: 0 });
		reelSymbol.symbolY.set(target, { duration, easing }).then(() => {
			if (run !== current) return;
			reelSymbol.symbolState = 'land';
			// the column's first symbol down lets the next column wait on a scatter, as before
			if (row === ROWS - 1) landing.onFinishing();
			if (--left > 0) return;
			reel.reelState.motion = 'stopped';
			column.landed = true;
			landing.resolve();
		});

		// the sounds go with the touch: one stop per column, and each scatter's own
		if (landing.quiet) return;
		setTimeout(
			() => {
				if (run !== current) return;
				if (row === ROWS - 1) reel.onReelStopping();
				stateGameDerived.onSymbolLand({ rawSymbol: landing.rawSymbols[symbolIndex] });
			},
			steadyTime + settleTime * touch,
		);
	});
};

// Puts every symbol where it belongs and ends the stream at once: a new spin while the last one
// was still landing, or a board set directly.
export const cancelSpin = () => {
	if (!run) return;
	run = undefined;
	if (frame) cancelAnimationFrame(frame);
	frame = 0;
	spinStream.symbols = [];
	stateGame.board.forEach((reel) => {
		reel.reelState.motion = 'stopped';
		reel.reelState.symbols.forEach((reelSymbol) => {
			reelSymbol.symbolY.set(getSymbolY(reelSymbol.symbolIndexOfBoard), { duration: 0 });
			reelSymbol.symbolState = 'static';
		});
	});
};

// The press: the board falls out and the stream starts. Returns at once.
export const startSpin = () => {
	cancelSpin();
	const flow = stateBet.isTurbo ? SPIN_FLOW.fast : SPIN_FLOW.normal;
	run = {
		at: performance.now(),
		flow,
		fallingFrom: stateGame.board.map((reel) =>
			reel.reelState.symbols.map((reelSymbol) => reelSymbol.symbolY.current),
		),
		falling: stateGame.board.map((reel) => reel.reelState.symbols.map(() => true)),
		columns: stateGame.board.map(() => ({
			streamEnd: undefined,
			landing: undefined,
			landed: false,
		})),
		sequences: stateGame.board.map(() => streamSequence()),
		landing: false,
		slammed: false,
	};
	stateGame.board.forEach((reel) => {
		reel.reelState.motion = 'fallingOut';
		reel.reelState.anticipating = false;
	});
	loop();
};

// When each column may land, from the earliest moment on: the same beat as the reels always had
// (COLUMN_LANDING). A column after the first scatter wait always waits its turn; the others land
// at once in turbo.
const columnWaits = (anticipation: number[]) => {
	const reelLength = BOARD_DIMENSIONS.y + 2;
	const hasAnticipation = anticipation.some(Boolean);
	const firstAnticipated = anticipation.findIndex(Boolean);
	let padding = 0;

	return stateGame.board.map((_reel, reelIndex) => {
		const noStop = hasAnticipation && reelIndex >= firstAnticipated;
		const anticipated = (anticipation[reelIndex] || 0) > 0;
		const fast = !anticipated && !noStop && stateBet.isTurbo;
		padding = fast
			? 0
			: padding +
				reelLength *
					(anticipated ? COLUMN_LANDING.paddingAnticipated : COLUMN_LANDING.paddingNormal);
		const wait = fast ? 0 : COLUMN_LANDING.reelFallInDelay * (padding / reelLength - 1);

		return { noStop, fast, wait: Math.max(0, wait) };
	});
};

// The answer is in: land it (starting the spin first when nothing is falling yet, as in free spins,
// a replay or a resumed round). Resolves once every column has landed.
export const landSpin = ({
	board,
	anticipation,
	quiet = false,
}: {
	board: RawSymbol[][];
	anticipation: number[];
	quiet?: boolean;
}) => {
	if (!run || run.landing) startSpin();
	const current = run!;
	current.landing = true;
	const now = performance.now();
	const earliest =
		current.at +
		(current.slammed
			? oldBoardGone(current.flow)
			: Math.max(current.flow.minDuration, oldBoardGone(current.flow)));
	const from = Math.max(now, earliest);
	const waits = columnWaits(anticipation);

	return Promise.all(
		waits.map(
			({ noStop, fast, wait }, reelIndex) =>
				new Promise<void>((resolve) => {
					current.columns[reelIndex].landing = {
						at: from + (current.slammed && !noStop ? 0 : wait),
						rawSymbols: board[reelIndex],
						noStop,
						fast: fast || (current.slammed && !noStop),
						quiet,
						started: false,
						onFinishing: () => {
							const next = stateGame.board[reelIndex + 1];
							if (next && (anticipation[reelIndex + 1] || 0) > 0)
								next.reelState.anticipating = true;
						},
						resolve,
					};
				}),
		),
	).then(() => undefined);
};

// The stop button while the reels run: every column not waiting on a scatter lands as soon as the
// answer is there.
export const slamSpin = () => {
	if (!run) return;
	const current = run;
	current.slammed = true;
	const now = performance.now();
	const earliest = current.at + oldBoardGone(current.flow);
	current.columns.forEach((column) => {
		const { landing } = column;
		if (!landing || landing.started || landing.noStop) return;
		landing.at = Math.min(landing.at, Math.max(now, earliest));
		landing.fast = true;
	});
};

// The request failed: the stream ends and the board that was there comes back down.
export const failSpin = (board: RawSymbol[][]) => {
	if (!run) return;
	landSpin({ board, anticipation: board.map(() => 0), quiet: true });
};
