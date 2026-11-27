import type { Snippet } from 'svelte';

export type EmitterEventModal =
	| { type: 'soundPressGeneral' }
	| { type: 'soundBetMode'; betModeKey: string }
	| { type: 'buyBonusConfirm' }
	| { type: 'bet' }
	| { type: 'autoBet' };

export type EmitterEventUi =
	| { type: 'hotKeySpace' }
	| { type: 'hotKeyEscape' }
	| { type: 'stopButtonClick' }
	| { type: 'stopButtonEnable' }
	| { type: 'uiShow' }
	| { type: 'uiHide' }
	| { type: 'drawerUnfold' }
	| { type: 'drawerFold' }
	| { type: 'drawerButtonShow' }
	| { type: 'drawerButtonHide' }
	// sound
	| { type: 'soundBetMode'; betModeKey: string }
	| { type: 'soundPressGeneral' }
	| { type: 'soundPressBet' }
	// bet services
	| { type: 'resumeBet' }
	| { type: 'autoBet' }
	| { type: 'bet' };

// What a game may add to the autoplay sheet (ModalAutoSpin); a game that passes nothing gets the
// sheet as it was.
export type AutoplayOptions = {
	// a game's own section, above the limits (Keno Chain: the numbers of each round)
	extra?: Snippet;
	// stop once the balance has grown by this many rounds' cost
	profitLimit?: boolean;
	// the limits also hold in an armed mode, counted in the round's real cost
	limitsInModes?: boolean;
	// why autoplay cannot start yet; the start button waits until it is empty
	blocked?: string;
};
