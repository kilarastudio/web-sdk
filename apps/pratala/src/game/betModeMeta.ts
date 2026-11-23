import { asset } from '$app/paths';
import { stateI18nDerived, type BetModeMeta, type BetModeData } from 'state-shared';
import { i18nKey } from 'utils-shared/i18n';

import config from './config';
import { MODE_START_GLINT } from './glint';

type MathMode = keyof typeof config.betModes;

// One row per mode the player can choose, as math publishes them
// (games/pratala/library/publish_files/index.json). The bonus menu, the confirmation and the
// rules are all written from this table, so a mode is described the same way everywhere. Titles are
// the math mode names: Stake wants the same names in the game, the replay and the math files.
export const MODES = [
	{
		key: 'ANTE',
		mode: 'ante',
		type: 'activate',
		rule: i18nKey('FREE SPINS trigger about 7 times as often.'),
		card: i18nKey('FREE SPINS about 7× as often.'),
	},
	{
		key: 'BOOST',
		mode: 'boost',
		type: 'activate',
		rule: i18nKey('A Glint Strike lights 3 to 6 Glint Spots before every spin is evaluated.'),
		card: i18nKey('A Glint Strike on every spin.'),
	},
	{
		key: 'BONUS',
		mode: 'bonus',
		type: 'buy',
		rule: i18nKey('Starts FREE SPINS straight away. Glint Spots stay lit for the whole feature.'),
		card: i18nKey('FREE SPINS straight away.'),
	},
	{
		key: 'SUPER',
		mode: 'super',
		type: 'buy',
		rule: i18nKey('Starts FREE SPINS with every Glint Spot already lit at {start}.'),
		card: i18nKey('FREE SPINS, every spot {start}.'),
	},
	{
		key: 'HOARD',
		mode: 'hoard',
		type: 'buy',
		rule: i18nKey(
			"Starts FREE SPINS with every Glint Spot already lit at {start}. Before every free spin the Dragon's Gaze doubles one reel of spots: the first reel before the first spin, then one reel to the right each spin.",
		),
		card: i18nKey("FREE SPINS, a Dragon's Gaze before every spin."),
	},
] as const satisfies readonly {
	key: string;
	mode: MathMode;
	type: 'activate' | 'buy';
	rule: string;
	card: string;
}[];

// a mode's rule or card in the player's language, its starting spot value filled in
export const modeText = (text: string, mode: MathMode) => {
	const start = (MODE_START_GLINT as Partial<Record<MathMode, number>>)[mode];
	return stateI18nDerived.translate(text, start === undefined ? undefined : { start: `×${start}` });
};

// Social play must not show "bet" or "buy": the words a mode uses in each kind of play.
// Mode names stay as math publishes them; the rest is translated (only real-money play has other
// languages: social play is always English).
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
		image: asset(`assets/ui/mode-${row.mode}.png`),
		parent: '',
		children: '',
		text: {
			title: row.key,
			dialog: `${modeText(row.rule, row.mode)} ${price}${stays}`,
			description: modeText(row.card, row.mode),
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
