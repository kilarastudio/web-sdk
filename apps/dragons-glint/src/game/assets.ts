import { asset } from '$app/paths';
import type { Assets } from 'pixi-svelte';

// Image art (backgrounds, the dragon's eye, the logo, mode pictures), the bitmap fonts and the audio
// sprite ship in static/assets. Symbols, the board, panels, Glint Spots and particles are not
// here: they are drawn by code (src/pixel) and join the loaded assets in GeneratedArt.
const assets: Assets = {
	// the welcome screen's; the loading screen is HTML and shows its own copy (game/loader.ts)
	logo: { type: 'sprite', src: asset('assets/ui/logo.png') },

	backgroundBaseLandscape: {
		type: 'sprite',
		src: asset('assets/backgrounds/base-landscape.png'),
	},
	backgroundBasePortrait: { type: 'sprite', src: asset('assets/backgrounds/base-portrait.png') },
	backgroundBonusLandscape: {
		type: 'sprite',
		src: asset('assets/backgrounds/bonus-landscape.png'),
	},
	backgroundBonusPortrait: {
		type: 'sprite',
		src: asset('assets/backgrounds/bonus-portrait.png'),
	},

	// the dragon's eye: one strip of frames for each background (game/dragonEye.ts)
	eyeBaseLandscape: { type: 'sprite', src: asset('assets/eye/base-landscape-eye.png') },
	eyeBasePortrait: { type: 'sprite', src: asset('assets/eye/base-portrait-eye.png') },
	eyeBonusLandscape: { type: 'sprite', src: asset('assets/eye/bonus-landscape-eye.png') },
	eyeBonusPortrait: { type: 'sprite', src: asset('assets/eye/bonus-portrait-eye.png') },

	modeAnte: { type: 'sprite', src: asset('assets/ui/mode-ante.png') },
	modeBoost: { type: 'sprite', src: asset('assets/ui/mode-boost.png') },
	modeBonus: { type: 'sprite', src: asset('assets/ui/mode-bonus.png') },
	modeSuper: { type: 'sprite', src: asset('assets/ui/mode-super.png') },

	fontGold: { type: 'font', src: asset('assets/fonts/dragons-glint-gold.fnt') },
	fontInk: { type: 'font', src: asset('assets/fonts/dragons-glint-ink.fnt') },

	// not preloaded: the audio is several MB, and the loading screen should not wait for it
	sound: { type: 'audio', src: asset('assets/audio/sounds.json') },
};

export default assets;
