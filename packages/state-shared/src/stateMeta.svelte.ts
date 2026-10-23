import { DEFAULT_BET_MODE_META } from './constants';

export type BetModeData = {
	maxWin?: number;
	mode: string;
	costMultiplier: number;
	type: 'default' | 'activate' | 'buy';
	parent: string;
	children: string;
	text: {
		bannerText?: string;
		description?: string;
		betAmountLabel?: string;
		title: string;
		dialog: string;
		button: string;
		tickerIdle: string;
		tickerSpin: string;
	};
};

export type BetModeMeta = Record<string, BetModeData>;

export const stateMeta = $state({
	betModeMeta: DEFAULT_BET_MODE_META as BetModeMeta,
});

export const stateMetaDerived = {
	betModeMetaList: () => Object.values(stateMeta.betModeMeta),
};
