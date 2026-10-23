import type { BetModeMeta } from 'state-shared';

import config from './config';

// Only the modes published by math (games/kilara_poc/library/publish_files/index.json),
// so the bonus menu never offers a mode the RGS does not know and shows the real cost.
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
	BONUS: {
		mode: 'BONUS',
		costMultiplier: config.betModes.bonus.cost,
		type: 'buy',
		parent: '',
		children: '',
		text: {
			title: 'FREE SPINS',
			dialog: `Triggers the FREE SPINS feature for ${config.betModes.bonus.cost}x the bet amount. Every tumble during FREE SPINS raises the Global Multiplier by 1.`,
			description: 'Start FREE SPINS straight away. The Global Multiplier grows with every tumble.',
			button: 'BUY',
			tickerIdle: '',
			tickerSpin: '',
			bannerText: '',
		},
		maxWin: config.betModes.bonus.max_win,
	},
};
