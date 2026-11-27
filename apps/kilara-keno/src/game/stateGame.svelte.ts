import { stateBet, stateI18nDerived, stateModal, stateUrlDerived } from 'state-shared';
// the shared confirmation reads the mode it confirms from here; the package does not export it
import { stateBonus } from 'components-ui-html/src/stateBonus.svelte';

import config from './config';
import { LEVEL_NAMES } from './betModeMeta';
import {
	isMode,
	isPremium,
	levelPicks,
	modeName,
	parseMode,
	quickPick,
	type Level,
	type ModeName,
	type Picks,
} from './keno';

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
	current: number;
	best: number;
	done: boolean;
};

const DEFAULT = { level: 'low' as Level, picks: 5 as Picks };

export const stateGame = $state({
	// the player's numbers, in the order they were picked
	picked: [] as number[],
	round: null as Round | null,
	// the round about to play was resumed after a reload: it shows the book's own board
	resuming: false,
	// the player asked to see the rest of the draw at once (stop button)
	skip: false,
	// a short line under the board when a press did nothing (board full, numbers missing)
	notice: '',
	noticeId: 0,
	// the 1× level to go back to when a premium level is switched off from the HUD
	lastLevel: DEFAULT.level,
	// the pick size in play, kept while the shell's key is its stand-in "BASE"
	lastPicks: DEFAULT.picks,
});

// The mode is the one the RGS is asked to play: stateBet.activeBetModeKey, e.g. "high_8".
const current = () =>
	parseMode(stateBet.activeBetModeKey) ?? {
		level: stateGame.lastLevel,
		picks: stateGame.lastPicks,
	};
const mode = () => modeName(current().level, current().picks);
const level = () => current().level;
const picks = () => current().picks;
const ready = () => stateGame.picked.length === picks();

const setMode = (next: Level, size: Picks) => {
	// a mode the math does not publish would be refused by the RGS; the callers never ask for one,
	// this keeps it that way if one ever does
	if (!isMode(next, size)) {
		console.error(`no mode ${modeName(next, size)}: playing LOW instead`);
		next = 'low';
	}
	if (!isPremium(next)) stateGame.lastLevel = next;
	stateGame.lastPicks = size;
	stateBet.activeBetModeKey = modeName(next, size);
};

// A key the game cannot play (the shell's "BASE" before the first choice, or after a premium level is
// switched off from the HUD) becomes the last 1× level with the current pick size.
const settleMode = () => {
	if (stateUrlDerived.replay()) return;
	if (parseMode(stateBet.activeBetModeKey)) {
		if (!isPremium(level())) stateGame.lastLevel = level();
		stateGame.lastPicks = picks();
		return;
	}
	setMode(isMode(stateGame.lastLevel, picks()) ? stateGame.lastLevel : 'low', picks());
};

const notify = (text: string) => {
	stateGame.notice = text;
	stateGame.noticeId += 1;
};

const editSelection = (picked: number[]) => {
	stateGame.round = null;
	stateGame.notice = '';
	stateGame.picked = picked;
};

const t = (text: string, values?: Record<string, string | number>) =>
	stateI18nDerived.translate(text, values);

// a level's range of numbers, from the math, e.g. "HIGH PLAYS 3 TO 10 NUMBERS."
const notifyRange = (next: Level) => {
	const sizes = levelPicks(next);
	notify(
		t('{level} PLAYS {min} TO {max} NUMBERS.', {
			level: LEVEL_NAMES[next],
			min: sizes[0],
			max: sizes[sizes.length - 1],
		}),
	);
};

const toggle = (n: number) => {
	if (stateGame.picked.includes(n)) {
		editSelection(stateGame.picked.filter((p) => p !== n));
	} else if (stateGame.picked.length < picks()) {
		editSelection([...stateGame.picked, n]);
	} else {
		stateGame.round = null;
		notify(
			picks() === 1
				? t('YOUR NUMBER IS PICKED. TAP IT TO FREE IT.')
				: t('ALL {picks} PICKED. TAP ONE OF YOURS TO FREE IT.', { picks: picks() }),
		);
	}
};

// a smaller pick size keeps the numbers picked first; a larger one keeps them all
// a pick size the current level does not play (the premium levels play 10 only) goes back to the
// last 1× level; one that level does not play either (High has no 1 or 2) goes to Low, and says so
const setPicks = (size: Picks) => {
	editSelection(stateGame.picked.slice(0, size));
	const wanted = levelPicks(level()).includes(size) ? level() : stateGame.lastLevel;
	if (isMode(wanted, size)) {
		setMode(wanted, size);
		return;
	}
	setMode('low', size);
	notifyRange(wanted);
};

// Chain costs 10× the bet and Chain Max 100×, so each is armed only through the shell's
// confirmation, which shows the real cost (Engine: a mode above 2× never plays from one press).
// Both play 10 numbers: arming one sets the pick size to 10.
let confirmingChain = $state(false);

const setLevel = (next: Level) => {
	stateGame.round = null;
	if (next === level()) return;
	if (!isPremium(next)) {
		// a size the level does not play (High with 1 or 2) becomes its smallest; the numbers
		// already picked stay, as arming Chain sets 10
		if (isMode(next, picks())) {
			setMode(next, picks());
		} else {
			setMode(next, levelPicks(next)[0]);
			notifyRange(next);
		}
		return;
	}
	const chain = modeName(next, levelPicks(next)[0]);
	if (stateBet.betAmount * config.betModes[chain].cost > stateBet.balanceAmount) {
		stateModal.modal = { name: 'error', error: { error: 'ERR_IPB' } };
		return;
	}
	stateBonus.selectedBetModeKey = chain;
	confirmingChain = true;
	stateModal.modal = { name: 'buyBonusConfirm' };
};

// The shared confirmation's close goes back to the bonus scene it is usually opened from; opened
// from the level choice, closing it just closes it.
const settleChainConfirm = () => {
	if (!confirmingChain || stateModal.modal?.name === 'buyBonusConfirm') return;
	confirmingChain = false;
	if (stateModal.modal?.name === 'buyBonus') stateModal.modal = null;
};

const quick = () => editSelection(quickPick(stateGame.picked, picks()));
const clear = () => editSelection([]);

export const stateGameDerived = {
	mode,
	level,
	picks,
	ready,
	settleMode,
	settleChainConfirm,
	notify,
	toggle,
	setPicks,
	setLevel,
	quick,
	clear,
};
