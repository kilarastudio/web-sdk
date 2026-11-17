import type { Surface } from '../pixel/potionLiquid';

// The liquid in a potion: its surface wants to lie level whatever the bottle does, but it has
// weight, so it trails the bottle, swings past level and back, and calms down (a damped spring on
// its angle against the bottle), and a jolt up or down sends it down and up past where it rests
// (a spring on its height). While it moves a ripple runs over it. Plain numbers, no Pixi: the
// sprite steps it every frame it moves (components/SymbolSprite.svelte), the previews offline.
export type Slosh = {
	// the surface's angle against the bottle, radians, and how fast it turns
	tilt: number;
	spin: number;
	// how far below its rest the surface is, art pixels, and how fast it goes
	level: number;
	sink: number;
	ripple: number;
	phase: number;
	// what the bottle did last step: its turn and its height (art pixels)
	turned: number;
	height: number;
	rise: number;
};

export const SLOSH = {
	// a swing of the surface takes about half a second; each swings back a little less far
	hz: 1.9,
	damping: 0.13,
	// up and down, quicker and calmer
	levelHz: 3.2,
	levelDamping: 0.3,
	// how much a jolt of the bottle up or down moves the surface (per art pixel a second squared)
	lag: 0.25,
	// it never stands steeper than this against the bottle, nor sinks or rises further
	maxTilt: (40 * Math.PI) / 180,
	maxLevel: 3,
	// the ripple grows with the surface's swing (a pixel high at most; a boil raises it more) and
	// calms over this long (s)
	ripplePerSpin: 0.45,
	rippleCalm: 0.5,
	// crests a second
	rippleSpeed: 2.2,
} as const;

export const restingSlosh = (turned = 0, height = 0): Slosh => ({
	tilt: -turned,
	spin: 0,
	level: 0,
	sink: 0,
	ripple: 0,
	phase: 0,
	turned,
	height,
	rise: 0,
});

// One step of dt seconds, with the bottle now turned `turned` radians (clockwise) and its foot at
// `height` art pixels (down is more). boil: a ripple the liquid keeps up by itself (a potion
// boiling as it wins), in pixels.
export const stepSlosh = (s: Slosh, dt: number, turned: number, height: number, boil = 0) => {
	dt = Math.min(dt, 1 / 30);
	if (dt <= 0) return s;
	const w = 2 * Math.PI * SLOSH.hz;
	// how fast the bottle turns, so the ripple follows the liquid's swing in the world
	const turning = (turned - s.turned) / dt;
	// level in the world: against the bottle, the opposite of the bottle's turn
	const pull = -turned - s.tilt;
	s.spin += (w * w * pull - 2 * SLOSH.damping * w * s.spin) * dt;
	s.tilt += s.spin * dt;
	s.tilt = Math.max(-turned - SLOSH.maxTilt, Math.min(-turned + SLOSH.maxTilt, s.tilt));

	// the bottle thrown up leaves the liquid behind (the surface sinks), stopped falling it goes on
	const rise = (s.height - height) / dt;
	const kick = (rise - s.rise) / dt;
	s.rise = rise;
	const wl = 2 * Math.PI * SLOSH.levelHz;
	s.sink +=
		(-wl * wl * s.level - 2 * SLOSH.levelDamping * wl * s.sink + kick * SLOSH.lag * wl) * dt;
	s.level = Math.max(-SLOSH.maxLevel, Math.min(SLOSH.maxLevel, s.level + s.sink * dt));

	const stirred = Math.min(
		1,
		Math.abs(s.spin + turning) * SLOSH.ripplePerSpin + Math.abs(s.sink) * 0.08,
	);
	s.ripple = Math.max(stirred, boil, s.ripple - (dt / SLOSH.rippleCalm) * 2);
	s.phase = (s.phase + dt * SLOSH.rippleSpeed) % 1;
	s.turned = turned;
	s.height = height;

	return s;
};

// a push to the liquid as the bottle lands: the surface goes down (pixels a second) and gets a
// turn (radians a second) to one side
export const jolt = (s: Slosh, sink: number, spin: number) => {
	s.sink += sink;
	s.spin += spin;
	s.ripple = Math.max(s.ripple, 1);
};

// calm: lying level, still, and the bottle not moving
export const calm = (s: Slosh) =>
	Math.abs(s.tilt + s.turned) < 0.004 &&
	Math.abs(s.spin) < 0.02 &&
	Math.abs(s.level) < 0.05 &&
	Math.abs(s.sink) < 0.1 &&
	Math.abs(s.rise) < 0.1 &&
	s.ripple < 0.01;

// The surface as drawn: on whole steps, so the mask only changes when a pixel would. Its angle in
// steps of 2 degrees, its height in half pixels, the ripple 0, 1 or 2 pixels high in six phases.
const TILT_STEP = (2 * Math.PI) / 180;
export const drawnSurface = (s: Slosh): Surface => {
	const ripple = s.ripple < 0.45 ? 0 : s.ripple < 1.4 ? 1 : 2;

	return {
		tilt: Math.round(s.tilt / TILT_STEP) * TILT_STEP,
		level: Math.round(s.level * 2) / 2,
		ripple,
		phase: ripple ? Math.floor(s.phase * 6) / 6 : 0,
	};
};
