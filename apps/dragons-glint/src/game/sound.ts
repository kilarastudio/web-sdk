import { createSound } from 'utils-sound';

// Every name here is a sound in the audio sprite (static/assets/audio/sounds.json), made with
// ElevenLabs; the build scripts and a listening page are in output/dragon/audio.
export type MusicName =
	| 'bgm_freespin'
	| 'bgm_main'
	| 'bgm_winlevel_big'
	| 'bgm_winlevel_epic'
	| 'bgm_winlevel_max'
	| 'bgm_winlevel_mega'
	| 'bgm_winlevel_superwin';

export type SoundEffectName =
	| 'jng_intro_fs'
	| 'sfx_anticipation'
	| 'sfx_bigwin_coinloop'
	| 'sfx_brand_land'
	| 'sfx_btn_general'
	| 'sfx_btn_spin'
	| 'sfx_claw_rake'
	| 'sfx_coin_1'
	| 'sfx_coin_2'
	| 'sfx_coin_3'
	| 'sfx_coin_4'
	| 'sfx_coin_5'
	| 'sfx_coin_6'
	| 'sfx_coin_7'
	| 'sfx_coin_8'
	| 'sfx_dragon_strike'
	| 'sfx_glint_apply'
	| 'sfx_glint_double'
	| 'sfx_glint_light'
	| 'sfx_glint_prime'
	| 'sfx_hall_cool'
	| 'sfx_mode_activate'
	| 'sfx_multiplier_explosion_b'
	| 'sfx_reel_stop_1'
	| 'sfx_scatter_stop_1'
	| 'sfx_scatter_stop_2'
	| 'sfx_scatter_stop_3'
	| 'sfx_scatter_stop_4'
	| 'sfx_scatter_stop_5'
	| 'sfx_scatter_win_v2'
	| 'sfx_spot_out'
	| 'sfx_superfreespin'
	| 'sfx_transition'
	| 'sfx_tumble_land'
	| 'sfx_welcome_start'
	| 'sfx_win_collect'
	| 'sfx_win_countup'
	| 'sfx_win_medium'
	| 'sfx_win_step_1'
	| 'sfx_win_step_2'
	| 'sfx_win_step_3'
	| 'sfx_win_step_4'
	| 'sfx_win_step_5'
	| 'sfx_winlevel_big'
	| 'sfx_winlevel_end'
	| 'sfx_winlevel_epic'
	| 'sfx_winlevel_max'
	| 'sfx_winlevel_mega'
	| 'sfx_winlevel_super'
	| 'sfx_youwon_panel';

export type SoundName = MusicName | SoundEffectName;

const sound = createSound<SoundName>();

export { sound };
