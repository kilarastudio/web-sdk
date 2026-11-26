import { stateI18nDerived, type BetModeMeta, type BetModeData } from 'state-shared';

import config from './config';
import { isPremium, type Level, type ModeName } from './keno';

// Every mode as the shell knows it, keyed by the math's mode name (the name the RGS plays and the
// replay link carries). Low and High cost 1× and are chosen freely. Chain costs 10× and Chain Max
// 100×: they are "activate" modes, so the shell charges and checks the balance for the real cost
// and arms them only through its confirmation. Player-facing names never contain "buy", "bet" or "pay".
export const LEVEL_NAMES: Record<Level, string> = {
	low: 'LOW',
	high: 'HIGH',
	chain: 'CHAIN',
	chainmax: 'CHAIN MAX',
};

// The name a player sees for a mode: the math's own (Engine wants the same name in the game, the
// replay and the math files), e.g. CHAIN_8.
export const modeTitle = (name: string) => name.toUpperCase();

// Social play must not show "bet": the word for the stake in each kind of play.
export const stakeWord = (social: boolean) =>
	stateI18nDerived.translate(social ? 'play amount' : 'bet');

const modeData = (name: ModeName, social: boolean): BetModeData => {
	const { level, picks, draws, kilau, cost, maxWin, rtp } = config.betModes[name];
	const t = stateI18nDerived.translate;
	const title = modeTitle(name);
	const chain = isPremium(level as Level);
	const levelName = LEVEL_NAMES[level as Level];
	const rules = t(
		'{picks} numbers, {draws} drawn, {kilau} Kilau numbers. A hit raises the streak one step, a miss lowers it one step.',
		{ picks, draws, kilau },
	);
	// social play has no "cost": Engine's own wording for it, in English like all of social play
	const price = social
		? `Can be played for ${stateI18nDerived.times(cost)} the play amount.`
		: t('Costs {cost} the {amount}.', {
				cost: stateI18nDerived.times(cost),
				amount: stakeWord(social),
			});

	return {
		mode: name,
		costMultiplier: cost,
		type: chain ? 'activate' : 'default',
		parent: '',
		children: '',
		text: {
			title,
			dialog: chain
				? `${rules} ${price} ${t('{level} stays on until you turn it off.', { level: levelName })}`
				: '',
			description: chain ? rules : '',
			button: chain ? t('ACTIVATE') : '',
			betAmountLabel: chain ? levelName : undefined,
			tickerIdle: chain ? t('{level} IS ACTIVE', { level: levelName }) : '',
			tickerSpin: '',
			bannerText: '',
		},
		maxWin,
		rtp,
	};
};

export const betModeMeta = (social: boolean): BetModeMeta => ({
	// the shell starts on, and falls back to, "BASE": a stand-in until the game names its mode
	// (stateGameDerived.settleMode); it is never sent to the RGS
	BASE: {
		mode: 'BASE',
		costMultiplier: 1,
		type: 'default',
		parent: '',
		children: '',
		text: {
			title: '',
			dialog: '',
			button: '',
			betAmountLabel: '',
			tickerIdle: '',
			tickerSpin: '',
			bannerText: '',
		},
	},
	...Object.fromEntries(
		(Object.keys(config.betModes) as ModeName[]).map((name) => [name, modeData(name, social)]),
	),
});
