import { asset } from '$app/paths';
import type { BetModeMeta, BetModeData } from 'state-shared';

import config from './config';

// The modes published by math (games/dragons_glint/library/publish_files/index.json). Titles are the
// math mode names: Stake wants the same names in the game, the replay and the math files.
const activate = (
	key: 'ANTE' | 'BOOST',
	mode: keyof typeof config.betModes,
	dialog: string,
	description: string,
): BetModeData => ({
	mode: key,
	costMultiplier: config.betModes[mode].cost,
	type: 'activate',
	image: asset(`assets/ui/mode-${mode}.png`),
	parent: '',
	children: '',
	text: {
		title: key,
		dialog,
		description,
		button: 'ACTIVATE',
		betAmountLabel: key,
		tickerIdle: `${key} IS ACTIVE`,
		tickerSpin: 'GOOD LUCK',
		bannerText: '',
	},
	maxWin: config.betModes[mode].max_win,
});

const buy = (
	key: 'BONUS' | 'SUPER',
	mode: keyof typeof config.betModes,
	dialog: string,
	description: string,
): BetModeData => ({
	mode: key,
	costMultiplier: config.betModes[mode].cost,
	type: 'buy',
	image: asset(`assets/ui/mode-${mode}.png`),
	parent: '',
	children: '',
	text: {
		title: key,
		dialog,
		description,
		button: 'BUY',
		tickerIdle: '',
		tickerSpin: '',
		bannerText: '',
	},
	maxWin: config.betModes[mode].max_win,
});

export const betModeMeta: BetModeMeta = {
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
	},
	ANTE: activate(
		'ANTE',
		'ante',
		`Twice the chance to trigger FREE SPINS, for ${config.betModes.ante.cost}x the bet. ANTE stays active until you turn it off.`,
		'Twice the chance of FREE SPINS on every spin.',
	),
	BOOST: activate(
		'BOOST',
		'boost',
		`A Glint Strike lights 3 to 6 Glint Spots before every spin is evaluated, for ${config.betModes.boost.cost}x the bet. BOOST stays active until you turn it off.`,
		'A Glint Strike on every spin.',
	),
	BONUS: buy(
		'BONUS',
		'bonus',
		`Starts FREE SPINS straight away for ${config.betModes.bonus.cost}x the bet. Glint Spots stay lit for the whole feature.`,
		'Start FREE SPINS now. Glint Spots stay lit all feature.',
	),
	SUPER: buy(
		'SUPER',
		'super',
		`Starts FREE SPINS for ${config.betModes.super.cost}x the bet with every Glint Spot already lit at 2x.`,
		'FREE SPINS with every Glint Spot lit at 2x.',
	),
};
