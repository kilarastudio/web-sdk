import { asset } from '$app/paths';

export default {
	// the Deep Glint logo with the miner for the loading screen, exported from
	// brand/deep-glint/deep-glint-logo-v2-character.png
	logoCharacter: {
		type: 'sprite',
		src: asset('assets/ai/deep-glint/logo-character.webp'),
		preload: true,
	},
	explosion: {
		type: 'spine',
		src: {
			atlas: asset('assets/spines/symbols3/symbols3.atlas'),
			skeleton: asset('assets/spines/symbols3/explosion.json'),
			scale: 2,
		},
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
	tumble_multiplier: {
		type: 'spine',
		src: {
			atlas: asset('assets/spines/tumbleWin/tumble_win.atlas'),
			skeleton: asset('assets/spines/tumbleWin/tumble_multiplier.json'),
			scale: 2,
		},
	},
	progressBar: {
		type: 'sprites',
		src: asset('assets/sprites/progressBar/progressBar.json'),
		preload: true,
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
	// Polished Kilara art; keys stay stable for the book-event contract.
	symbolH1: {
		type: 'sprite',
		src: asset('assets/ai/kilara-mine-v4/runtime/symbol-h1-gold-ore.webp'),
	},
	symbolH2: {
		type: 'sprite',
		src: asset('assets/ai/kilara-mine-v4/runtime/symbol-h2-ruby-ore.webp'),
	},
	symbolH3: {
		type: 'sprite',
		src: asset('assets/ai/kilara-mine-v4/runtime/symbol-h3-emerald-ore.webp'),
	},
	symbolH4: {
		type: 'sprite',
		src: asset('assets/ai/kilara-mine-v4/runtime/symbol-h4-amethyst-ore.webp'),
	},
	symbolH5: {
		type: 'sprite',
		src: asset('assets/ai/kilara-mine-v4/runtime/symbol-h5-lantern.webp'),
	},
	symbolL1: {
		type: 'sprite',
		src: asset('assets/ai/kilara-mine-v4/runtime/symbol-l1-k-copper.webp'),
	},
	symbolL2: {
		type: 'sprite',
		src: asset('assets/ai/kilara-mine-v4/runtime/symbol-l2-q-steel.webp'),
	},
	symbolL3: {
		type: 'sprite',
		src: asset('assets/ai/kilara-mine-v4/runtime/symbol-l3-j-tin.webp'),
	},
	symbolL4: {
		type: 'sprite',
		src: asset('assets/ai/kilara-mine-v4/runtime/symbol-l4-spade.webp'),
	},
	symbolScatter: {
		type: 'sprite',
		src: asset('assets/ai/kilara-mine-v4/runtime/symbol-scatter.webp'),
	},
	symbolWild: {
		type: 'sprite',
		src: asset('assets/ai/kilara-mine-v4/runtime/symbol-wild.webp'),
	},
	symbolMultiplierLow: {
		type: 'sprite',
		src: asset('assets/ai/kilara-mine-v4/runtime/symbol-multiplier-low.webp'),
	},
	symbolMultiplierMid: {
		type: 'sprite',
		src: asset('assets/ai/kilara-mine-v4/runtime/symbol-multiplier-mid.webp'),
	},
	symbolMultiplierHigh: {
		type: 'sprite',
		src: asset('assets/ai/kilara-mine-v4/runtime/symbol-multiplier-high.webp'),
	},
	boardFrame: {
		type: 'sprite',
		src: asset('assets/ai/kilara-mine-v4/runtime/board-frame.webp'),
	},
	characterIdle: {
		type: 'sprite',
		src: asset('assets/ai/kilara-mine-v4/runtime/character-idle.webp'),
	},
	backgroundBase: {
		type: 'sprite',
		src: asset('assets/ai/kilara-mine-v4/runtime/background-base.webp'),
	},
	backgroundBonus: {
		type: 'sprite',
		src: asset('assets/ai/kilara-mine-v4/runtime/background-bonus.webp'),
	},
	// Kilara Mine panels, still static art; their layout is in panels.ts
	panelTumble: {
		type: 'sprite',
		src: asset('assets/ai/kilara-mine-v4/runtime/panel-tumble.webp'),
	},
	panelGlobalMultiplier: {
		type: 'sprite',
		src: asset('assets/ai/kilara-mine-v4/runtime/panel-global-multiplier.webp'),
	},
	panelFreeSpinsIntro: {
		type: 'sprite',
		src: asset('assets/ai/kilara-mine-v4/runtime/panel-free-spins-intro.webp'),
	},
	panelFreeSpinsOutro: {
		type: 'sprite',
		src: asset('assets/ai/kilara-mine-v4/runtime/panel-free-spins-outro.webp'),
	},
	celebrationBig: {
		type: 'sprite',
		src: asset('assets/ai/kilara-mine-v4/runtime/celebration-big.webp'),
	},
	celebrationSuper: {
		type: 'sprite',
		src: asset('assets/ai/kilara-mine-v4/runtime/celebration-super.webp'),
	},
	celebrationMega: {
		type: 'sprite',
		src: asset('assets/ai/kilara-mine-v4/runtime/celebration-mega.webp'),
	},
	celebrationEpic: {
		type: 'sprite',
		src: asset('assets/ai/kilara-mine-v4/runtime/celebration-epic.webp'),
	},
	celebrationMax: {
		type: 'sprite',
		src: asset('assets/ai/kilara-mine-v4/runtime/celebration-max.webp'),
	},
	sound: {
		type: 'audio',
		src: asset('assets/audio/sounds.json'),
		preload: true,
	},
} as const;
