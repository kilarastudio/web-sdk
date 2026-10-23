export type EmitterEventModal =
	| { type: 'soundPressGeneral' }
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
