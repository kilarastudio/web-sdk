import _ from 'lodash';
import { stateBet, stateBetDerived, stateUrlDerived } from 'state-shared';

import config from './config';
import {
	isMode,
	isPremium,
	levelPicks,
	modeName,
	NUMBERS,
	parseMode,
	playedSize,
	randomPick,
	type Level,
	type ModeName,
	type Picks,
} from './keno';
import { sound } from './sound';

// What the board shows of a round: the numbers played (the player's, or the book's own in a
// replay or a resumed round), its lucky numbers, the numbers drawn so far and the meter after the
// last one.
export type Round = {
	mode: ModeName;
	selected: number[];
	// the lucky numbers marked so far (all of them before the first ball)
	kilau: number[];
	// this round marks 3 lucky numbers in a level that usually marks 1
	kilauRound: boolean;
	drawn: number[];
	pattern: number[];
	draws: number;
	hits: number;
	kilauHits: number;
	bestRun: number;
	run: number;
	current: number;
	best: number;
	// the last ball decides a large win: the numbers still open blink for a beat
	waiting: boolean;
	done: boolean;
};

// The round's win as the screen shows it: the amount counting up (hundredths of the base bet),
// and its size against what the round cost.
export type ShownWin = { shown: number; amount: number; ratio: number; max: boolean };

const MOST = Math.max(...config.pickSizes);
const RANDOM_PICK_STEP = 28;
const RECENT = 6;

export const stateGame = $state({
	// the player's numbers, in the order they were picked
	picked: [] as number[],
	// numbers of a random pick the board has not shown yet: they appear one after another
	hidden: [] as number[],
	round: null as Round | null,
	win: null as ShownWin | null,
	// what the last rounds won, oldest first. times: multiples of the base bet, the unit of the
	// win table, which is what the chip writes; ratio: against what the round cost, which gives
	// the chip its colour (a bonus round that wins 400× the bet for a cost of 100× is 4)
	recent: [] as { id: number; times: number; ratio: number }[],
	// the round about to play was resumed after a reload: it shows the book's own board
	resuming: false,
	// the player asked to see the rest of the draw at once (stop button)
	skip: false,
	// counts the presses that did nothing (board full, numbers missing): the line under the board
	// shakes once for each
	nudges: 0,
	// the 1× level to go back to when a premium level is switched off from the HUD
	lastLevel: 'calm' as Level,
	// autoplay's numbers: the same set every round, or a fresh Random Pick before each one
	autoNumbers: 'same' as 'same' | 'random',
});

// The mode is the one the RGS is asked to play: stateBet.activeBetModeKey, e.g. "wild_8". Its
// level is the player's choice; its size follows the numbers picked on the board.
const level = () => parseMode(stateBet.activeBetModeKey)?.level ?? stateGame.lastLevel;
const count = () => stateGame.picked.length;
const mode = () => modeName(level(), playedSize(level(), count()));
// the level plays this many numbers: a round can start
const ready = () => levelPicks(level()).includes(count() as Picks);
// numbers still to pick before the level can play: up to the next size it plays (7 picked: 1)
const missing = () => Math.max(0, playedSize(level(), count()) - count());

// Only modes the math publishes may reach the RGS. While the numbers picked are fewer than the
// level plays, the key is the level's smallest mode: the same cost, and no round starts until
// the board is ready.
const setMode = (next: Level) => {
	const name = modeName(next, playedSize(next, count()));
	if (!isMode(next, playedSize(next, count()))) {
		console.error(`no mode ${name}`);
		return;
	}
	if (!isPremium(next)) stateGame.lastLevel = next;
	if (stateBet.activeBetModeKey !== name) stateBet.activeBetModeKey = name;
};

// A key the game cannot play (the shell's "BASE" before the first choice, or after a premium level is
// switched off from the HUD) becomes the last 1× level; any other follows the numbers picked.
const settleMode = () => {
	if (stateUrlDerived.replay()) return;
	setMode(parseMode(stateBet.activeBetModeKey) ? level() : stateGame.lastLevel);
	// A finished round of another level leaves the board (a bonus mode armed or switched off from
	// the shell's scene): the board shows the numbers picked again, and the line under it says
	// what the new level still needs.
	const played = stateGame.round?.done ? parseMode(stateGame.round.mode)?.level : undefined;
	if (played && played !== level()) {
		stateGame.round = null;
		stateGame.win = null;
	}
};

const nudge = () => {
	stateGame.nudges += 1;
	sound.deny();
};

// counts the random picks being shown, so a newer one (or any other edit) ends an older showing
let showing = 0;

const editSelection = (picked: number[]) => {
	showing += 1;
	stateGame.round = null;
	stateGame.win = null;
	stateGame.hidden = [];
	stateGame.picked = picked;
	settleMode();
};

const toggle = (n: number) => {
	// each number picked plays the next note up, each one freed the note it had
	if (stateGame.picked.includes(n)) {
		editSelection(stateGame.picked.filter((p) => p !== n));
		sound.unpick(count());
	} else if (count() < MOST) {
		editSelection([...stateGame.picked, n]);
		sound.pick(count());
	} else {
		nudge();
	}
};

// The risk level of the 1× game. Chain and Chain Max cost 10× and 100× the bet, so they are armed
// only from the shell's bonus scene and its confirmation, which show the real cost (Engine: a
// mode above 2× never plays from one press); choosing a risk switches an armed one off.
const setLevel = (next: Level) => {
	stateGame.round = null;
	stateGame.win = null;
	if (next === level() || isPremium(next)) return;
	setMode(next);
};

// A fresh random set; its numbers light up one after another. The choice itself is made at once,
// so a round started before the last one shows plays the whole set.
const random = () => {
	const next = randomPick(level(), count());
	editSelection(next);
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

	const run = showing;
	stateGame.hidden = [...next];
	const step = () => {
		if (run !== showing || !stateGame.hidden.length) return;
		// a quick run up the scale, one note for each number that lights up
		sound.deal(next.length - stateGame.hidden.length);
		stateGame.hidden = stateGame.hidden.slice(1);
		setTimeout(step, RANDOM_PICK_STEP);
	};
	step();
};

const clear = () => editSelection([]);

// Autoplay with a fresh set each round: as many numbers as now, chosen at once (the round starts
// right after), and only a complete set is replaced, so the mode the RGS plays stays the same.
const autoPick = () => {
	if (stateGame.autoNumbers !== 'random' || !stateBetDerived.hasAutoBetCounter() || !ready())
		return;
	editSelection(_.shuffle(NUMBERS).slice(0, count()));
};

// a round is about to play: the whole selection shows
const showSelection = () => {
	showing += 1;
	stateGame.hidden = [];
};

let rounds = 0;
const addRecent = (times: number, ratio: number) => {
	rounds += 1;
	stateGame.recent = [...stateGame.recent, { id: rounds, times, ratio }].slice(-RECENT);
};

export const stateGameDerived = {
	mode,
	level,
	count,
	ready,
	missing,
	settleMode,
	nudge,
	toggle,
	setLevel,
	random,
	clear,
	autoPick,
	showSelection,
	addRecent,
};
