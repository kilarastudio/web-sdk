import { asset } from '$app/paths';

export default {
	loader: {
		type: 'spine',
		src: {
			atlas: asset('assets/spines/loader/loader.atlas'),
			skeleton: asset('assets/spines/loader/loader.json'),
			scale: 2,
		},
		preload: true,
	},
	pressToContinueText: {
		type: 'sprites',
		src: asset('assets/sprites/pressToContinueText/MM_pressanywhere.json'),
		preload: true,
	},
	H1: {
		type: 'spine',
		src: {
			atlas: asset('assets/spines/symbols/symbols.atlas'),
			skeleton: asset('assets/spines/symbols/h1.json'),
			scale: 2,
		},
	},
	H2: {
		type: 'spine',
		src: {
			atlas: asset('assets/spines/symbols/symbols.atlas'),
			skeleton: asset('assets/spines/symbols/h2.json'),
			scale: 2,
		},
	},
	H3: {
		type: 'spine',
		src: {
			atlas: asset('assets/spines/symbols/symbols.atlas'),
			skeleton: asset('assets/spines/symbols/h3.json'),
			scale: 2,
		},
	},
	H4: {
		type: 'spine',
		src: {
			atlas: asset('assets/spines/symbols/symbols.atlas'),
			skeleton: asset('assets/spines/symbols/h4.json'),
			scale: 2,
		},
	},
	H5: {
		type: 'spine',
		src: {
			atlas: asset('assets/spines/symbols/symbols.atlas'),
			skeleton: asset('assets/spines/symbols/h5.json'),
			scale: 2,
		},
	},
	L1: {
		type: 'spine',
		src: {
			atlas: asset('assets/spines/symbols/symbols.atlas'),
			skeleton: asset('assets/spines/symbols/l1.json'),
			scale: 2,
		},
	},
	L2: {
		type: 'spine',
		src: {
			atlas: asset('assets/spines/symbols/symbols.atlas'),
			skeleton: asset('assets/spines/symbols/l2.json'),
			scale: 2,
		},
	},
	L3: {
		type: 'spine',
		src: {
			atlas: asset('assets/spines/symbols/symbols.atlas'),
			skeleton: asset('assets/spines/symbols/l3.json'),
			scale: 2,
		},
	},
	L4: {
		type: 'spine',
		src: {
			atlas: asset('assets/spines/symbols/symbols.atlas'),
			skeleton: asset('assets/spines/symbols/l4.json'),
			scale: 2,
		},
	},
	L5: {
		type: 'spine',
		src: {
			atlas: asset('assets/spines/symbols2/symbols2.atlas'),
			skeleton: asset('assets/spines/symbols2/M.json'),
			scale: 2,
		},
	},
	M: {
		type: 'spine',
		src: {
			atlas: asset('assets/spines/symbols2/symbols2.atlas'),
			skeleton: asset('assets/spines/symbols2/M.json'),
			scale: 2,
		},
	},
	S: {
		type: 'spine',
		src: {
			atlas: asset('assets/spines/symbols2/symbols2.atlas'),
			skeleton: asset('assets/spines/symbols2/S.json'),
			scale: 2,
		},
	},
	explosion: {
		type: 'spine',
		src: {
			atlas: asset('assets/spines/symbols3/symbols3.atlas'),
			skeleton: asset('assets/spines/symbols3/explosion.json'),
			scale: 2,
		},
	},
	W: {
		type: 'spine',
		src: {
			atlas: asset('assets/spines/symbols3/symbols3.atlas'),
			skeleton: asset('assets/spines/symbols3/W.json'),
			scale: 2,
		},
	},
	reelsFrame: {
		type: 'sprites',
		src: asset('assets/sprites/reelsFrame/reels_frame.json'),
	},
	payFrame: {
		type: 'sprite',
		src: asset('assets/sprites/payFrame/payFrame.png'),
	},
	anticipation: {
		type: 'spine',
		src: {
			atlas: asset('assets/spines/anticipation/anticipation.atlas'),
			skeleton: asset('assets/spines/anticipation/anticipation.json'),
			scale: 2,
		},
	},
	goldFont: {
		type: 'font',
		src: asset('assets/fonts/goldFont/mm_gold.xml'),
	},
	goldBlur: {
		type: 'font',
		src: asset('assets/fonts/goldBlur/miningfont_gold_blur.xml'),
	},
	silverFont: {
		type: 'font',
		src: asset('assets/fonts/silverFont/mm_silver.xml'),
	},
	purpleFont: {
		type: 'font',
		src: asset('assets/fonts/purpleFont/mm_purple.xml'),
	},
	bigwin: {
		type: 'spine',
		src: {
			atlas: asset('assets/spines/bigwin/big_wins.atlas'),
			skeleton: asset('assets/spines/bigwin/mm_bigwin.json'),
			scale: 2,
		},
	},
	globalMultiplier: {
		type: 'spine',
		src: {
			atlas: asset('assets/spines/globalMultiplier/multiframe.atlas'),
			skeleton: asset('assets/spines/globalMultiplier/multiframe.json'),
			scale: 2,
		},
	},
	fsIntro: {
		type: 'spine',
		src: {
			atlas: asset('assets/spines/fsIntro/fs_screen.atlas'),
			skeleton: asset('assets/spines/fsIntro/fs_screen.json'),
			scale: 2,
		},
	},
	fsIntroNumber: {
		type: 'spine',
		src: {
			atlas: asset('assets/spines/fsIntro/fs_screen.atlas'),
			skeleton: asset('assets/spines/fsIntro/fs_screen_number.json'),
			scale: 2,
		},
	},
	fsOutroNumber: {
		type: 'spine',
		src: {
			atlas: asset('assets/spines/fsIntro/fs_screen.atlas'),
			skeleton: asset('assets/spines/fsIntro/fs_total_number.json'),
			scale: 2,
		},
	},
	foregroundAnimation: {
		type: 'spine',
		src: {
			atlas: asset('assets/spines/foregroundAnimation/mm_bg.atlas'),
			skeleton: asset('assets/spines/foregroundAnimation/mm_bg.json'),
			scale: 2,
		},
		preload: true,
	},
	foregroundFeatureAnimation: {
		type: 'spine',
		src: {
			atlas: asset('assets/spines/foregroundFeatureAnimation/mm_bg_feature.atlas'),
			skeleton: asset('assets/spines/foregroundFeatureAnimation/mm_bg_feature.json'),
			scale: 2,
		},
		preload: true,
	},
	tumble_multiplier: {
		type: 'spine',
		src: {
			atlas: asset('assets/spines/tumbleWin/tumble_win.atlas'),
			skeleton: asset('assets/spines/tumbleWin/tumble_multiplier.json'),
			scale: 2,
		},
	},
	tumble_win: {
		type: 'spine',
		src: {
			atlas: asset('assets/spines/tumbleWin/tumble_win.atlas'),
			skeleton: asset('assets/spines/tumbleWin/tumble_win.json'),
			scale: 2,
		},
	},
	reelhouse: {
		type: 'spine',
		src: {
			atlas: asset('assets/spines/reelhouse/reelhouse_glow.atlas'),
			skeleton: asset('assets/spines/reelhouse/reelhouse_glow.json'),
			scale: 2,
		},
	},
	progressBar: {
		type: 'sprites',
		src: asset('assets/sprites/progressBar/progressBar.json'),
		preload: true,
	},
	freeSpins: {
		type: 'sprites',
		src: asset('assets/sprites/freeSpins/freeSpins.json'),
	},
	winSmall: {
		type: 'sprites',
		src: asset('assets/sprites/winSmall/MM_Localisation_winsmall.json'),
	},
	clusterWin: {
		type: 'spine',
		src: {
			atlas: asset('assets/spines/clusterWin/clusterpay.atlas'),
			skeleton: asset('assets/spines/clusterWin/clusterpay.json'),
			scale: 2,
		},
	},
	transition: {
		type: 'spine',
		src: {
			atlas: asset('assets/spines/transition/transition.atlas'),
			skeleton: asset('assets/spines/transition/transition.json'),
			scale: 2,
		},
	},
	symbolsStatic: {
		type: 'sprites',
		src: asset('assets/sprites/symbolsStatic/symbolsStatic.json'),
	},
	coins: {
		type: 'spriteSheet',
		src: asset('assets/sprites/coin/SD2_Coin.json'),
	},
	sound: {
		type: 'audio',
		src: asset('assets/audio/sounds.json'),
		preload: true,
	},
	specialSymbolsStatic: {
		type: 'sprites',
		src: asset('assets/sprites/symbols-static/symbols-static.json'),
	},
	symbols: {
		type: 'spine',
		src: {
			skeleton: asset('assets/spines/symbolsSpecial/symbols.json'),
			atlas: asset('assets/spines/symbolsSpecial/symbols.atlas'),
			scale: 2,
		},
	},
} as const;
