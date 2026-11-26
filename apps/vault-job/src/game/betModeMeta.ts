import { stateI18nDerived, type BetModeMeta, type BetModeData } from 'state-shared';
import { i18nKey } from 'utils-shared/i18n';

import config from './config';

type MathMode = keyof typeof config.betModes;

// One row per mode the player can choose, as math publishes them
// (math-sdk/games/vault_job/library/publish_files/index.json). The bonus menu, the
// confirmation and the rules are all written from this table. Titles are the math mode names:
// Stake wants the same names in the game, the replay and the math files.
export const MODES = [
	{
		key: 'ANTE',
		mode: 'ante',
		type: 'activate',
		rule: i18nKey('THE JOB triggers about 3 times as often.'),
		card: i18nKey('THE JOB about 3× as often.'),
	},
	{
		key: 'BONUS',
		mode: 'bonus',
		type: 'buy',
		rule: i18nKey('Starts THE JOB straight away with 10 free spins.'),
		card: i18nKey('THE JOB, 10 free spins.'),
	},
	{
		key: 'INSIDE',
		mode: 'inside',
		type: 'buy',
		rule: i18nKey(
			'Starts THE JOB straight away with 10 free spins and a second Safecracker at ×2 on reel 2.',
		),
		card: i18nKey('THE JOB with a second Safecracker at ×2.'),
	},
	{
		key: 'HEIST',
		mode: 'heist',
		type: 'buy',
		rule: i18nKey(
			'Starts THE JOB straight away with 10 free spins and two more Safecrackers at ×3 on reel 2.',
		),
		card: i18nKey('THE JOB with two more Safecrackers at ×3.'),
	},
] as const satisfies readonly {
	key: string;
	mode: MathMode;
	type: 'activate' | 'buy';
	rule: string;
	card: string;
}[];

// Social play must not show "bet" or "buy": the words a mode uses in each kind of play.
export const modeWords = (social: boolean) => ({
	amount: stateI18nDerived.translate(social ? 'play amount' : 'bet'),
	buy: stateI18nDerived.translate(social ? 'PLAY' : 'BUY'),
});

const modeData = (row: (typeof MODES)[number], social: boolean): BetModeData => {
	const { cost, max_win: maxWin, rtp } = config.betModes[row.mode];
	const words = modeWords(social);
	const t = stateI18nDerived.translate;
	// social play has no "cost": Stake's own wording for it, in English like all of social play
	const price = social
		? `Can be played for ${stateI18nDerived.times(cost)} the play amount.`
		: t('Costs {cost} the {amount}.', { cost: stateI18nDerived.times(cost), amount: words.amount });
	const stays =
		row.type === 'activate'
			? ` ${t('{mode} stays on until you turn it off.', { mode: row.key })}`
			: '';

	return {
		mode: row.key,
		costMultiplier: cost,
		type: row.type,
		parent: '',
		children: '',
		text: {
			title: row.key,
			dialog: `${t(row.rule)} ${price}${stays}`,
			description: t(row.card),
			button: row.type === 'activate' ? t('ACTIVATE') : words.buy,
			betAmountLabel: row.type === 'activate' ? row.key : undefined,
			tickerIdle: row.type === 'activate' ? t('{mode} IS ACTIVE', { mode: row.key }) : '',
			tickerSpin: row.type === 'activate' ? t('GOOD LUCK') : '',
			bannerText: '',
		},
		maxWin,
		rtp,
	};
};

export const betModeMeta = (social: boolean): BetModeMeta => ({
	BASE: {
		mode: 'BASE',
		costMultiplier: config.betModes.base.cost,
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
		maxWin: config.betModes.base.max_win,
		rtp: config.betModes.base.rtp,
	},
	...Object.fromEntries(MODES.map((row) => [row.key, modeData(row, social)])),
});
