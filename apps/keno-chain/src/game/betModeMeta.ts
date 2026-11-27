import { stateI18nDerived, type BetModeMeta, type BetModeData } from 'state-shared';

import config from './config';
import { isPremium, type Level, type ModeName } from './keno';
import { CHAIN_PICTURES } from './modePictures';

// Every mode as the shell knows it, keyed by the math's mode name (the name the RGS plays and the
// replay link carries). Calm, Bold and Wild cost 1× and are chosen freely. Unbroken Chain costs 10× and Golden
// Chain 100×: they are "activate" modes, so the shell charges and checks the balance for the real cost
// and arms them only through its confirmation. Player-facing names never contain "buy", "bet" or "pay".
export const LEVEL_NAMES: Record<Level, string> = {
	calm: 'CALM',
	bold: 'BOLD',
	wild: 'WILD',
	chain: 'UNBROKEN CHAIN',
	chainmax: 'GOLDEN CHAIN',
};

// the same names as the level buttons and the lines of the game screen write them
export const LEVEL_LABELS: Record<Level, string> = {
	calm: 'Calm',
	bold: 'Bold',
	wild: 'Wild',
	chain: 'Unbroken Chain',
	chainmax: 'Golden Chain',
};

// The name a player sees for a mode. The 1× modes carry the math's own name, e.g. BOLD_8. The two
// bonus modes carry a name of their own: Unbroken Chain (a miss lowers the run by one step and
// never breaks it) and Golden Chain (three lucky numbers, gold on the board, in every round).
// Engine wants the math file's name beside a game's own wherever a mode is listed: the rules'
// mode table and the replay's summary write both.
export const modeTitle = (name: string) => {
	const mode = config.betModes[name as ModeName];
	return mode && isPremium(mode.level as Level)
		? LEVEL_NAMES[mode.level as Level]
		: name.toUpperCase();
};

// The bonus modes' pictures on their cards: the lobby tile's chain of square links.
const picture = (svg: string) => `data:image/svg+xml,${encodeURIComponent(svg)}`;
const MODE_PICTURES: Partial<Record<Level, string>> = {
	chain: picture(CHAIN_PICTURES.chain),
	chainmax: picture(CHAIN_PICTURES.chainmax),
};

// Social play must not show "bet": the word for the stake in each kind of play.
export const stakeWord = (social: boolean) =>
	stateI18nDerived.translate(social ? 'play amount' : 'bet');

const modeData = (name: ModeName, social: boolean): BetModeData => {
	const { level, picks, draws, kilau, kilauMost, cost, maxWin, rtp } = config.betModes[name];
	const t = stateI18nDerived.translate;
	const title = modeTitle(name);
	const chain = isPremium(level as Level);
	const levelName = LEVEL_NAMES[level as Level];
	const [one, every] = config.kilauRound.share;
	// Chain marks 1 lucky number and 3 in a lucky round; Chain Max marks 3 in every round
	const rules =
		kilauMost > kilau
			? t(
					'{picks} numbers, {draws} drawn. Lucky numbers: {kilau}, or {most} in a lucky round ({one} round in {every}). A hit raises the streak one step, a miss lowers it one step.',
					{ picks, draws, kilau, most: kilauMost, one, every },
				)
			: t(
					'{picks} numbers, {draws} drawn, {kilau} lucky numbers in every round. A hit raises the streak one step, a miss lowers it one step.',
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
		image: MODE_PICTURES[level as Level],
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
