import _ from 'lodash';

import { recordBookEvent, checkIsMultipleRevealEvents, type BookEventHandlerMap } from 'utils-book';
import { stateBet, stateBetDerived, stateUi } from 'state-shared';
import { BOOK_AMOUNT_MULTIPLIER } from 'constants-shared/bet';
import { waitForTimeout } from 'utils-shared/wait';

import { eventEmitter } from './eventEmitter';
import { playBookEvent } from './utils';
import { winLevelFor, type WinLevelData } from './winLevelMap';
import config from './config';
import { winLevelSoundsPlay, winLevelSoundsStop } from './winSounds';
import { stateGame, stateGameDerived, emptyGlint } from './stateGame.svelte';
import type { BookEvent, BookEventOfType, BookEventContext } from './typesBookEvent';
import type { Position } from './types';
import { glintChanges } from './glint';
import { impact, shake } from './impact.svelte';
import type { GlintApplySpot } from '../components/GlintSpots.svelte';

// how many wins the current spin's tumbles have paid so far, for the rising win sound
const WIN_STEPS = 5;
let winStep = 0;

let awaitingFirstFreeSpinGlint = false;
const updateGlint = async (glint: number[][]) => {
	// SUPER and HOARD open free spins with all 30 spots lit at one value (×4 or ×8)
	const startValue = glint[0]?.[0] ?? 0;
	const superStart =
		awaitingFirstFreeSpinGlint &&
		stateGame.gameType === 'freegame' &&
		startValue >= 2 &&
		glint.length === 6 &&
		glint.every((column) => column.length === 5 && column.every((value) => value === startValue));
	awaitingFirstFreeSpinGlint = false;
	const spots = glintChanges(stateGame.glint, glint);
	stateGame.glint = glint;
	if (superStart) {
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_dragon_strike' });
		await eventEmitter.broadcastAsync({ type: 'glintSuperShow' });
	} else if (spots.length) {
		// one sound for the strongest change of the step
		const name = spots.some(({ animation }) => animation === 'tier_up' || animation === 'double')
			? 'sfx_glint_double'
			: spots.some(({ animation }) => animation === 'light')
				? 'sfx_glint_light'
				: 'sfx_glint_prime';
		eventEmitter.broadcast({ type: 'soundOnce', name, forcePlay: true });
		await eventEmitter.broadcastAsync({ type: 'glintAnimateShow', spots });
	}
};

const clearGlint = () => {
	awaitingFirstFreeSpinGlint = false;
	stateGame.glint = emptyGlint();
};

const resetGlint = async () => {
	if (stateGame.glint.some((column) => column.some((value) => value > 0)))
		await eventEmitter.broadcastAsync({ type: 'glintResetShow' });
	clearGlint();
};

const appliedSpots = (wins: BookEventOfType<'winInfo'>['wins']): GlintApplySpot[] =>
	wins.flatMap((win) => {
		if (win.meta.clusterMult <= 1) return [];
		const position = win.positions.find(
			({ reel, row }) => stateGame.glint[reel]?.[row - 1] === win.meta.clusterMult,
		);
		return position
			? [
					{
						reel: position.reel,
						row: position.row - 1,
						value: win.meta.clusterMult,
						targetReel: win.meta.overlay.reel,
						targetRow: win.meta.overlay.row - 1,
					},
				]
			: [];
	});

// what the round cost, in book amounts: the base bet times the mode's cost (3x in ANTE, 100x for BONUS)
const roundCost = () =>
	(stateBetDerived.activeBetMode()?.costMultiplier ?? 1) * BOOK_AMOUNT_MULTIPLIER;

// The math picks a win's level from the base bet, so an ANTE spin or a bought round would get a
// fanfare or a BIG WIN panel while paying back less than it cost. The game picks the level from
// what the round cost instead: a win at or below it is a loss in disguise, with no celebration.
const MAX_WIN = config.betModes.base.max_win * BOOK_AMOUNT_MULTIPLIER;
const roundWinLevelData = ({ amount }: { amount: number }) =>
	winLevelFor({ amount, cost: roundCost(), maxWin: MAX_WIN });

// the character only celebrates a win above what the round cost, and a big win the most
const characterReactToWin = ({
	amount,
	winLevelData,
}: {
	amount: number;
	winLevelData: WinLevelData;
}) => {
	if (amount <= roundCost()) return;

	eventEmitter.broadcast({
		type: 'characterReact',
		reaction: winLevelData?.type === 'big' ? 'bigWin' : 'win',
	});
};

// How the dragon takes each win of a spin's tumbles: a nod at the first, a snort of smoke at the
// second, a beat of its wing at the third, its roar from the fourth. Until the tumbles have paid
// more than the spin cost it only nods: a win below the cost is not one to celebrate. A base game
// spin costs the round's cost (3x the bet in ANTE); a free spin is measured against the base bet.
const STEP_REACTIONS = ['nod', 'puff', 'flap', 'win'] as const;
const characterReactToStep = ({ step, earned }: { step: number; earned: number }) => {
	const cost = stateGame.gameType === 'freegame' ? BOOK_AMOUNT_MULTIPLIER : roundCost();
	const level = earned > cost ? Math.min(STEP_REACTIONS.length, step) : 1;

	eventEmitter.broadcast({ type: 'characterReact', reaction: STEP_REACTIONS[level - 1] });
};

const animateSymbols = async ({ positions }: { positions: Position[] }) => {
	eventEmitter.broadcast({ type: 'boardShow' });
	await eventEmitter.broadcastAsync({
		type: 'boardWithAnimateSymbols',
		symbolPositions: positions,
	});
};

export const bookEventHandlerMap: BookEventHandlerMap<BookEvent, BookEventContext> = {
	reveal: async (bookEvent: BookEventOfType<'reveal'>, { bookEvents }: BookEventContext) => {
		eventEmitter.broadcast({ type: 'tumbleWinAmountReset' });
		winStep = 0;
		impact.step = 0;
		const isBonusGame = checkIsMultipleRevealEvents({ bookEvents });
		if (isBonusGame) {
			eventEmitter.broadcast({ type: 'stopButtonEnable' });
			recordBookEvent({ bookEvent });
		}

		stateGame.gameType = bookEvent.gameType;
		// spots belong to one base round; free spins keep theirs (updateGlint sets them)
		if (bookEvent.gameType === 'basegame') await resetGlint();
		await stateGameDerived.enhancedBoard.spin({ revealEvent: bookEvent });
		eventEmitter.broadcast({ type: 'soundScatterCounterClear' });
	},
	winInfo: async (bookEvent: BookEventOfType<'winInfo'>, { bookEvents }: BookEventContext) => {
		const applied = appliedSpots(bookEvent.wins);
		const positions = _.flatten(bookEvent.wins.map((win) => win.positions));
		// each win of a spin's tumbles hits harder than the one before: a higher note, a stronger
		// shake, more coins, pieces thrown further, and more from the dragon
		winStep = Math.min(WIN_STEPS, winStep + 1);
		impact.step = winStep;
		// what the spin's tumbles will have paid once this win is in
		const tumbleWin = bookEvents.find(
			(next): next is BookEventOfType<'updateTumbleWin'> =>
				next.type === 'updateTumbleWin' && next.index > bookEvent.index,
		);

		const promise1 = async () => {
			eventEmitter.broadcast({
				type: 'soundOnce',
				name: `sfx_win_step_${winStep as 1 | 2 | 3 | 4 | 5}`,
				forcePlay: true,
			});
			shake(Math.min(3, winStep));
			characterReactToStep({ step: winStep, earned: tumbleWin?.amount ?? 0 });
			await animateSymbols({ positions });
		};

		// the coins carry the win to the tumble win panel, which counts up as they land
		const promise3 = async () => {
			if (!tumbleWin) return;
			eventEmitter.broadcast({ type: 'tumbleWinAmountShow' });
			await eventEmitter.broadcastAsync({ type: 'winCoinsFly', positions, step: winStep });
			eventEmitter.broadcast({
				type: 'tumbleWinAmountUpdate',
				amount: tumbleWin.amount,
				animate: true,
			});
		};

		const promise2 = async () => {
			await eventEmitter.broadcastAsync({
				type: 'showClusterWinAmounts',
				wins: bookEvent.wins.map((win) => {
					// clusterMult is the brightest lit Glint Spot under the win (1 when none)
					return {
						win: win.meta.winWithoutMult,
						mult: win.meta.clusterMult,
						result: win.win,
						reel: win.meta.overlay.reel,
						row: win.meta.overlay.row,
					};
				}),
			});
		};

		const unique = applied.filter(
			(spot, index) =>
				applied.findIndex((s) => s.reel === spot.reel && s.row === spot.row) === index,
		);
		await Promise.all([
			promise1(),
			promise2(),
			promise3(),
			...(applied.length
				? [
						eventEmitter.broadcastAsync({ type: 'glintApplyFly', spots: applied }),
						eventEmitter.broadcastAsync({
							type: 'glintAnimateShow',
							spots: unique.map((spot) => ({
								reel: spot.reel,
								row: spot.row,
								from: spot.value,
								to: spot.value,
								animation: 'apply' as const,
							})),
						}),
					]
				: []),
		]);
	},
	updateTumbleWin: async (bookEvent: BookEventOfType<'updateTumbleWin'>) => {
		if (bookEvent.amount > 0) {
			eventEmitter.broadcast({ type: 'tumbleWinAmountShow' });
			eventEmitter.broadcast({
				type: 'tumbleWinAmountUpdate',
				amount: bookEvent.amount,
				animate: true,
			});
		}
	},
	setTotalWin: async (bookEvent: BookEventOfType<'setTotalWin'>) => {
		stateBet.winBookEventAmount = bookEvent.amount;
	},
	freeSpinTrigger: async (bookEvent: BookEventOfType<'freeSpinTrigger'>) => {
		// animate scatters
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_scatter_win_v2' });
		eventEmitter.broadcast({ type: 'characterReact', reaction: 'bonus' });
		await animateSymbols({ positions: bookEvent.positions });
		// show free spin intro
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_superfreespin' });
		await eventEmitter.broadcastAsync({ type: 'uiHide' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_transition' });
		// the hall changes to the boss fight behind the wipe
		await eventEmitter.broadcastAsync({
			type: 'transition',
			oncovered: () => (stateGame.gameType = 'freegame'),
		});
		// the intro slams in once the smoke has lifted
		eventEmitter.broadcast({ type: 'freeSpinIntroShow', totalFreeSpins: bookEvent.totalFs });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'jng_intro_fs' });
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_freespin' });
		await eventEmitter.broadcastAsync({
			type: 'freeSpinIntroUpdate',
			totalFreeSpins: bookEvent.totalFs,
		});
		awaitingFirstFreeSpinGlint = true;
		eventEmitter.broadcast({ type: 'freeSpinIntroHide' });
		eventEmitter.broadcast({ type: 'boardFrameGlowShow' });
		// the HUD shows the free spins counter in every layout
		stateUi.freeSpinCounterShow = true;
		stateUi.freeSpinCounterCurrent = 0;
		stateUi.freeSpinCounterTotal = bookEvent.totalFs;
		await eventEmitter.broadcastAsync({ type: 'uiShow' });
		await eventEmitter.broadcastAsync({ type: 'drawerButtonShow' });
		eventEmitter.broadcast({ type: 'drawerFold' });
	},
	updateFreeSpin: async (bookEvent: BookEventOfType<'updateFreeSpin'>) => {
		stateUi.freeSpinCounterShow = true;
		stateUi.freeSpinCounterCurrent = bookEvent.amount;
		stateUi.freeSpinCounterTotal = bookEvent.total;
	},
	freeSpinRetrigger: async (bookEvent: BookEventOfType<'freeSpinRetrigger'>) => {
		// animate scatters, then raise the total (the next updateFreeSpin carries the same total)
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_scatter_win_v2' });
		eventEmitter.broadcast({ type: 'characterReact', reaction: 'bonus' });
		await animateSymbols({ positions: bookEvent.positions });
		stateUi.freeSpinCounterTotal = bookEvent.totalFs;
	},
	wincap: async () => {
		// max win reached: math ends the round here, and the setTotalWin, freeSpinEnd and
		// finalWin events that follow already carry the capped amount
	},
	updateGlint: async (bookEvent: BookEventOfType<'updateGlint'>) => {
		await updateGlint(bookEvent.glint);
	},
	glintStrike: async (bookEvent: BookEventOfType<'glintStrike'>) => {
		// Only the initial updateGlint can be the SUPER or HOARD board initialization.
		awaitingFirstFreeSpinGlint = false;
		// the dragon rears and breathes; its fire flies to the struck spots, and they light as it lands
		eventEmitter.broadcast({ type: 'characterReact', reaction: 'power' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_dragon_strike' });
		await eventEmitter.broadcastAsync({
			type: 'glintStrikeShow',
			spots: bookEvent.spots.map((spot) => ({ ...spot, row: spot.row - 1 })),
		});
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_fireball_hit' });
		await updateGlint(bookEvent.glint);
	},
	freeSpinEnd: async (bookEvent: BookEventOfType<'freeSpinEnd'>) => {
		const winLevelData = roundWinLevelData(bookEvent);

		// the total is celebrated in the boss hall; the hall, board and panels change back to base
		// behind the fire wall, as they changed on the way in
		await eventEmitter.broadcastAsync({ type: 'uiHide' });
		eventEmitter.broadcast({ type: 'tumbleWinAmountHide' });
		eventEmitter.broadcast({ type: 'freeSpinOutroShow' });
		// the panel has its own fanfare
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_youwon_panel' });
		characterReactToWin({ amount: bookEvent.amount, winLevelData });
		winLevelSoundsPlay({ winLevelData, fanfare: false });
		await eventEmitter.broadcastAsync({
			type: 'freeSpinOutroCountUp',
			amount: bookEvent.amount,
			cost: roundCost(),
			winLevelData,
		});
		winLevelSoundsStop({ music: 'bgm_main' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_transition' });
		await eventEmitter.broadcastAsync({
			type: 'transition',
			oncovered: () => {
				eventEmitter.broadcast({ type: 'freeSpinOutroHide' });
				eventEmitter.broadcast({ type: 'boardFrameGlowHide' });
				stateGame.gameType = 'basegame';
				stateUi.freeSpinCounterShow = false;
				clearGlint();
			},
		});
		await eventEmitter.broadcastAsync({ type: 'uiShow' });
		await eventEmitter.broadcastAsync({ type: 'drawerUnfold' });
		eventEmitter.broadcast({ type: 'drawerButtonHide' });
	},
	tumbleBoard: async (bookEvent: BookEventOfType<'tumbleBoard'>) => {
		eventEmitter.broadcast({ type: 'boardHide' });
		eventEmitter.broadcast({ type: 'tumbleBoardShow' });
		eventEmitter.broadcast({ type: 'tumbleBoardInit', addingBoard: bookEvent.newSymbols });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_explosion_b' });
		// the pieces fly as the white pop ends
		void waitForTimeout(70 / stateBetDerived.timeScale()).then(() => shake(Math.min(3, winStep)));
		await eventEmitter.broadcastAsync({
			type: 'tumbleBoardExplode',
			explodingPositions: bookEvent.explodingSymbols,
		});
		eventEmitter.broadcast({ type: 'tumbleBoardRemoveExploded' });
		await eventEmitter.broadcastAsync({ type: 'tumbleBoardSlideDown' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_tumble_land', forcePlay: true });
		eventEmitter.broadcast({
			type: 'boardSettle',
			board: stateGameDerived
				.tumbleBoardCombined()
				.map((tumbleReel) => tumbleReel.map((tumbleSymbol) => tumbleSymbol.rawSymbol)),
		});
		eventEmitter.broadcast({ type: 'tumbleBoardReset' });
		eventEmitter.broadcast({ type: 'tumbleBoardHide' });
		eventEmitter.broadcast({ type: 'boardShow' });
	},
	setWin: async (bookEvent: BookEventOfType<'setWin'>) => {
		const winLevelData = roundWinLevelData(bookEvent);

		eventEmitter.broadcast({ type: 'winShow' });
		characterReactToWin({ amount: bookEvent.amount, winLevelData });
		winLevelSoundsPlay({ winLevelData });
		await eventEmitter.broadcastAsync({
			type: 'winUpdate',
			amount: bookEvent.amount,
			cost: roundCost(),
			winLevelData,
		});
		winLevelSoundsStop();
		eventEmitter.broadcast({ type: 'winHide' });
	},
	finalWin: async (bookEvent: BookEventOfType<'finalWin'>) => {
		eventEmitter.broadcast({ type: 'tumbleWinAmountHide' });
	},
	// customised
	createBonusSnapshot: async (bookEvent: BookEventOfType<'createBonusSnapshot'>) => {
		const { bookEvents } = bookEvent;

		function findLastBookEvent<T>(type: T) {
			return _.findLast(bookEvents, (bookEvent) => bookEvent.type === type) as
				BookEventOfType<T> | undefined;
		}

		const lastFreeSpinTriggerEvent = findLastBookEvent('freeSpinTrigger' as const);
		const lastUpdateFreeSpinEvent = findLastBookEvent('updateFreeSpin' as const);
		const lastSetTotalWinEvent = findLastBookEvent('setTotalWin' as const);
		const lastGlintEvent = _.findLast(
			bookEvents,
			(bookEvent) => bookEvent.type === 'updateGlint' || bookEvent.type === 'glintStrike',
		) as BookEventOfType<'updateGlint'> | BookEventOfType<'glintStrike'> | undefined;

		if (lastFreeSpinTriggerEvent) await playBookEvent(lastFreeSpinTriggerEvent, { bookEvents });
		if (lastUpdateFreeSpinEvent) playBookEvent(lastUpdateFreeSpinEvent, { bookEvents });
		if (lastSetTotalWinEvent) playBookEvent(lastSetTotalWinEvent, { bookEvents });
		// a resumed bonus shows the spots as they were, without replaying a strike
		if (lastGlintEvent) stateGame.glint = lastGlintEvent.glint;
		awaitingFirstFreeSpinGlint = false;
	},
};
