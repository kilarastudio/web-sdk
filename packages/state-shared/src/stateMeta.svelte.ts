import { DEFAULT_BET_MODE_META } from './constants';

export type BetModeData = {
	maxWin?: number;
	// the mode's theoretical return, 0-1, shown with its max win wherever the mode is offered
	rtp?: number;
	mode: string;
	costMultiplier: number;
	type: 'default' | 'activate' | 'buy';
	// the URL of a picture for the mode's card (a file the game ships, never a remote one)
	image?: string;
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
