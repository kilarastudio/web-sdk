import _ from 'lodash';

import { recordBookEvent, checkIsMultipleRevealEvents, type BookEventHandlerMap } from 'utils-book';
import { stateBet, stateUi, stateI18nDerived } from 'state-shared';
import { bookEventAmountToCurrencyString } from 'utils-shared/amount';

import { eventEmitter } from './eventEmitter';
import { playBookEvent } from './utils';
import { winLevelMap, type WinLevel } from './winLevelMap';
import { stateGame, stateGameDerived } from './stateGame.svelte';
import { CREW_LOOK } from './constants';
import type { BookEvent, BookEventOfType, BookEventContext, CrewMember } from './typesBookEvent';
import type { Position, RawSymbol } from './types';
import config from './config';

const t = stateI18nDerived.translate;

const animateSymbols = async ({ positions }: { positions: Position[] }) => {
	eventEmitter.broadcast({ type: 'boardShow' });
	eventEmitter.broadcast({ type: 'crewMark', positions });
	await eventEmitter.broadcastAsync({
		type: 'boardWithAnimateSymbols',
		symbolPositions: positions,
	});
};

// the free spins The Job has in all, for what a retrigger adds
let freeSpinsTotal = 0;

const setFreeSpinCounter = (current: number | undefined, total: number) => {
	freeSpinsTotal = total;
	eventEmitter.broadcast({ type: 'freeSpinCounterShow' });
	eventEmitter.broadcast({ type: 'freeSpinCounterUpdate', current, total });
	stateUi.freeSpinCounterShow = true;
	if (current !== undefined) stateUi.freeSpinCounterCurrent = current;
	stateUi.freeSpinCounterTotal = total;
};

// "SAFECRACKER ×1" or "3 SAFECRACKERS ×1 ×3 ×3": the crew The Job starts with
const describeCrew = (crew: Omit<CrewMember, 'sticky'>[]) =>
	_.map(_.groupBy(crew, 'crew'), (members, name) => {
		const look = CREW_LOOK[name as CrewMember['crew']];
		const multipliers = members.map((member) => `×${member.multiplier}`).join(' ');
		return members.length > 1
			? `${members.length} ${look.name}S ${multipliers}`
			: `${look.name} ${multipliers}`;
	}).join(', ');

const startJob = async (bookEvent: BookEventOfType<'freeSpinTrigger'>, bookEvents: BookEvent[]) => {
	const crewStart = bookEvents.find((event) => event.type === 'crewStart') as
		BookEventOfType<'crewStart'> | undefined;

	await eventEmitter.broadcastAsync({ type: 'uiHide' });
	await eventEmitter.broadcastAsync({ type: 'transition' });
	eventEmitter.broadcast({ type: 'freeSpinIntroShow' });
	eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_freespin' });
	await eventEmitter.broadcastAsync({
		type: 'freeSpinIntroUpdate',
		totalFreeSpins: bookEvent.totalFs,
		crew: crewStart ? describeCrew(crewStart.crew) : '',
	});
	stateGame.gameType = 'freegame';
	eventEmitter.broadcast({ type: 'freeSpinIntroHide' });
	eventEmitter.broadcast({ type: 'boardFrameGlowShow' });
	setFreeSpinCounter(undefined, bookEvent.totalFs);
	await eventEmitter.broadcastAsync({ type: 'uiShow' });
	await eventEmitter.broadcastAsync({ type: 'drawerButtonShow' });
	eventEmitter.broadcast({ type: 'drawerFold' });
};

export const bookEventHandlerMap: BookEventHandlerMap<BookEvent, BookEventContext> = {
	reveal: async (bookEvent: BookEventOfType<'reveal'>, { bookEvents }: BookEventContext) => {
		const isBonusGame = checkIsMultipleRevealEvents({ bookEvents });
		if (isBonusGame) {
			eventEmitter.broadcast({ type: 'stopButtonEnable' });
			recordBookEvent({ bookEvent });
		}

		eventEmitter.broadcast({ type: 'winLineHide' });
		// sticky crew stay in their cells while the reels spin under them; nothing else does
		eventEmitter.broadcast({
			type: bookEvent.gameType === 'freegame' ? 'crewKeepSticky' : 'crewClear',
		});
		stateGame.gameType = bookEvent.gameType;
		await stateGameDerived.enhancedBoard.spin({
			revealEvent: bookEvent,
			paddingBoard: config.paddingReels[bookEvent.gameType] as RawSymbol[][],
		});
		eventEmitter.broadcast({ type: 'soundScatterCounterClear' });
	},
	crewStart: async (bookEvent: BookEventOfType<'crewStart'>) => {
		await eventEmitter.broadcastAsync({
			type: 'crewArrive',
			crew: bookEvent.crew.map((member) => ({ ...member, sticky: true })),
		});
	},
	crewMove: async (bookEvent: BookEventOfType<'crewMove'>) => {
		eventEmitter.broadcast({ type: 'bannerShow', text: t('DRIVERS DRIVE') });
		await eventEmitter.broadcastAsync({ type: 'crewDrive', moves: bookEvent.moves });
	},
	crewExpand: async (bookEvent: BookEventOfType<'crewExpand'>) => {
		eventEmitter.broadcast({ type: 'bannerShow', text: t('MUSCLE FILLS THE REEL') });
		await eventEmitter.broadcastAsync({
			type: 'crewExpand',
			reels: bookEvent.reels.map((reel) => reel.reel),
		});
	},
	crewHack: async (bookEvent: BookEventOfType<'crewHack'>) => {
		eventEmitter.broadcast({
			type: 'bannerShow',
			text: t('HACKER COPIES ×{multiplier}', { multiplier: bookEvent.hacks[0]?.multiplier ?? 2 }),
		});
		await eventEmitter.broadcastAsync({ type: 'crewMultiply', changes: bookEvent.hacks });
	},
	crewBoard: async (bookEvent: BookEventOfType<'crewBoard'>) => {
		// what the math pays the lines with: the crew layer shows exactly this
		eventEmitter.broadcast({ type: 'crewSet', crew: bookEvent.crew });
	},
	crewUpgrade: async (bookEvent: BookEventOfType<'crewUpgrade'>) => {
		eventEmitter.broadcast({ type: 'bannerShow', text: t('SAFECRACKERS CLIMB') });
		await eventEmitter.broadcastAsync({ type: 'crewMultiply', changes: bookEvent.upgrades });
	},
	winInfo: async (bookEvent: BookEventOfType<'winInfo'>) => {
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_winlevel_small' });
		for (const win of bookEvent.wins) {
			const times = win.meta.multiplier > 1 ? `  ×${win.meta.multiplier}` : '';
			eventEmitter.broadcast({
				type: 'winLineShow',
				lineIndex: win.meta.lineIndex,
				kind: win.kind,
				label: `${t('LINE')} ${win.meta.lineIndex}   ${win.kind} ${win.symbol}${times}   ${bookEventAmountToCurrencyString(win.win)}`,
			});
			await animateSymbols({ positions: win.positions });
		}
		eventEmitter.broadcast({ type: 'winLineHide' });
	},
	setTotalWin: async (bookEvent: BookEventOfType<'setTotalWin'>) => {
		stateBet.winBookEventAmount = bookEvent.amount;
	},
	wincap: async () => {
		// The max win ends the round; the amount is shown when The Job ends.
		await eventEmitter.broadcastAsync({ type: 'bannerShow', text: t('MAX WIN'), hold: 1400 });
	},
	freeSpinTrigger: async (
		bookEvent: BookEventOfType<'freeSpinTrigger'>,
		{ bookEvents }: BookEventContext,
	) => {
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_scatter_win_v2' });
		await animateSymbols({ positions: bookEvent.positions });
		await startJob(bookEvent, bookEvents);
	},
	freeSpinRetrigger: async (bookEvent: BookEventOfType<'freeSpinRetrigger'>) => {
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_scatter_win_v2' });
		await animateSymbols({ positions: bookEvent.positions });
		const added = bookEvent.totalFs - freeSpinsTotal;
		setFreeSpinCounter(undefined, bookEvent.totalFs);
		await eventEmitter.broadcastAsync({ type: 'freeSpinCounterRetrigger', added });
	},
	updateFreeSpin: async (bookEvent: BookEventOfType<'updateFreeSpin'>) => {
		setFreeSpinCounter(bookEvent.amount, bookEvent.total);
	},
	freeSpinEnd: async (bookEvent: BookEventOfType<'freeSpinEnd'>) => {
		const winLevelData = winLevelMap[bookEvent.winLevel as WinLevel];

		await eventEmitter.broadcastAsync({ type: 'uiHide' });
		eventEmitter.broadcast({ type: 'winLineHide' });
		eventEmitter.broadcast({ type: 'freeSpinOutroShow' });
		await eventEmitter.broadcastAsync({
			type: 'freeSpinOutroCountUp',
			amount: bookEvent.amount,
			winLevelData,
		});
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_main' });
		stateGame.gameType = 'basegame';
		eventEmitter.broadcast({ type: 'crewUnstick' });
		eventEmitter.broadcast({ type: 'boardFrameGlowHide' });
		eventEmitter.broadcast({ type: 'freeSpinOutroHide' });
		eventEmitter.broadcast({ type: 'freeSpinCounterHide' });
		stateUi.freeSpinCounterShow = false;
		await eventEmitter.broadcastAsync({ type: 'transition' });
		await eventEmitter.broadcastAsync({ type: 'uiShow' });
		await eventEmitter.broadcastAsync({ type: 'drawerUnfold' });
		eventEmitter.broadcast({ type: 'drawerButtonHide' });
	},
	setWin: async (bookEvent: BookEventOfType<'setWin'>) => {
		const winLevelData = winLevelMap[bookEvent.winLevel as WinLevel];

		eventEmitter.broadcast({ type: 'winShow' });
		await eventEmitter.broadcastAsync({
			type: 'winUpdate',
			amount: bookEvent.amount,
			winLevelData,
		});
		eventEmitter.broadcast({ type: 'winHide' });
	},
	finalWin: async () => {
		eventEmitter.broadcast({ type: 'winLineHide' });
	},
	// customised: a round resumed in the middle of The Job is brought back to where it was
	createBonusSnapshot: async (bookEvent: BookEventOfType<'createBonusSnapshot'>) => {
		const { bookEvents } = bookEvent;

		function findLastBookEvent<T>(type: T) {
			return _.findLast(bookEvents, (event) => event.type === type) as
				BookEventOfType<T> | undefined;
		}

		const lastFreeSpinTriggerEvent = findLastBookEvent('freeSpinTrigger' as const);
		const lastUpdateFreeSpinEvent = findLastBookEvent('updateFreeSpin' as const);
		const lastSetTotalWinEvent = findLastBookEvent('setTotalWin' as const);

		if (lastFreeSpinTriggerEvent) await startJob(lastFreeSpinTriggerEvent, bookEvents);
		if (lastUpdateFreeSpinEvent) playBookEvent(lastUpdateFreeSpinEvent, { bookEvents });
		if (lastSetTotalWinEvent) playBookEvent(lastSetTotalWinEvent, { bookEvents });

		// the sticky crew as they stand now: the last crew board, its Safecrackers' climbs and the
		// Drivers' moves since
		let crew: CrewMember[] = [];
		const at = (cell: Position) => `${cell.reel}:${cell.row}`;
		for (const event of bookEvents) {
			if (event.type === 'crewStart') {
				crew = event.crew.map((member) => ({ ...member, sticky: true }));
			} else if (event.type === 'crewBoard') {
				crew = event.crew.filter((member) => member.sticky).map((member) => ({ ...member }));
			} else if (event.type === 'crewUpgrade') {
				for (const upgrade of event.upgrades) {
					const member = crew.find((m) => at(m.cell) === at(upgrade.cell));
					if (member) member.multiplier = upgrade.multiplier;
				}
			} else if (event.type === 'crewMove') {
				for (const move of event.moves) {
					const member = crew.find((m) => at(m.cell) === at(move.from));
					if (!member) continue;
					if (move.to) member.cell = move.to;
					else crew = crew.filter((m) => m !== member);
				}
			}
		}
		if (lastFreeSpinTriggerEvent) eventEmitter.broadcast({ type: 'crewSet', crew });
	},
};
