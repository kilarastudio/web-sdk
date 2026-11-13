import { asset } from '$app/paths';
import type { Assets } from 'pixi-svelte';

import { CHARACTER } from './character';

// Image art (backgrounds, the dragon, the logo, mode pictures), the bitmap fonts and the audio
// sprite ship in static/assets. Symbols, the board, panels, Glint Spots and particles are not
// here: they are drawn by code (src/pixel) and join the loaded assets in GeneratedArt.
const assets: Assets = {
	// shown while the rest loads
	logo: { type: 'sprite', src: asset('assets/ui/logo.png'), preload: true },

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

	// one strip of frames for each of the dragon's animations
	...Object.fromEntries(
		Object.keys(CHARACTER.animations).map((name) => [
			`character_${name}`,
			{ type: 'sprite', src: asset(`assets/character/${name}.png`) },
		]),
	),

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
