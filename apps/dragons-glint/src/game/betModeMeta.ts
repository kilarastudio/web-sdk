import { asset } from '$app/paths';
import type { BetModeMeta, BetModeData } from 'state-shared';

import config from './config';
import { MODE_START_GLINT } from './glint';

type MathMode = keyof typeof config.betModes;

// One row per mode the player can choose, as math publishes them
// (games/dragons_glint/library/publish_files/index.json). The bonus menu, the confirmation and the
// rules are all written from this table, so a mode is described the same way everywhere. Titles are
// the math mode names: Stake wants the same names in the game, the replay and the math files.
export const MODES = [
	{
		key: 'ANTE',
		mode: 'ante',
		type: 'activate',
		rule: 'FREE SPINS trigger about 7 times as often.',
		card: 'FREE SPINS about 7× as often.',
	},
	{
		key: 'BOOST',
		mode: 'boost',
		type: 'activate',
		rule: 'A Glint Strike lights 3 to 6 Glint Spots before every spin is evaluated.',
		card: 'A Glint Strike on every spin.',
	},
	{
		key: 'BONUS',
		mode: 'bonus',
		type: 'buy',
		rule: 'Starts FREE SPINS straight away. Glint Spots stay lit for the whole feature.',
		card: 'FREE SPINS straight away.',
	},
	{
		key: 'SUPER',
		mode: 'super',
		type: 'buy',
		rule: `Starts FREE SPINS with every Glint Spot already lit at ×${MODE_START_GLINT.super}.`,
		card: `FREE SPINS, every spot ×${MODE_START_GLINT.super}.`,
	},
	{
		key: 'HOARD',
		mode: 'hoard',
		type: 'buy',
		rule: `Starts FREE SPINS with every Glint Spot already lit at ×${MODE_START_GLINT.hoard}.`,
		card: `FREE SPINS, every spot ×${MODE_START_GLINT.hoard}.`,
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
	amount: social ? 'play amount' : 'bet',
	buy: social ? 'PLAY' : 'BUY',
});

const modeData = (row: (typeof MODES)[number], social: boolean): BetModeData => {
	const { cost, max_win: maxWin, rtp } = config.betModes[row.mode];
	const words = modeWords(social);
	const price = `Costs ${cost}× the ${words.amount}.`;
	const stays = row.type === 'activate' ? ` ${row.key} stays on until you turn it off.` : '';

	return {
		mode: row.key,
		costMultiplier: cost,
		type: row.type,
		image: asset(`assets/ui/mode-${row.mode}.png`),
		parent: '',
		children: '',
		text: {
			title: row.key,
			dialog: `${row.rule} ${price}${stays}`,
			description: row.card,
			button: row.type === 'activate' ? 'ACTIVATE' : words.buy,
			betAmountLabel: row.type === 'activate' ? row.key : undefined,
			tickerIdle: row.type === 'activate' ? `${row.key} IS ACTIVE` : '',
			tickerSpin: row.type === 'activate' ? 'GOOD LUCK' : '',
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
