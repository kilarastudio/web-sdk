// The fires on the floor of the bonus hall, scattered and no two alike: some creep long and low
// across the flagstones, some are a small patch, some stand tall. They belong to the hall, not
// the board, so they never shake with it. Each kind has its own drawing (sizes in art pixels,
// `taper` the share of its length each end sinks away over); each fire stands with the middle of
// its foot at x, y in the background's own art pixels, on the floor, clear of the pillars' bases,
// and burns its own loop. `flip` mirrors it. Listed back to front.
export const FLOOR_FIRE_KINDS = {
	creep: { length: 230, depth: 30, under: 5, taper: 0.2 },
	run: { length: 150, depth: 38, under: 6, taper: 0.28 },
	bed: { length: 90, depth: 46, under: 6, taper: 0.42 },
	tall: { length: 56, depth: 64, under: 5, taper: 0.45 },
	patch: { length: 40, depth: 26, under: 4, taper: 0.42 },
	lick: { length: 24, depth: 20, under: 3, taper: 0.4 },
};

export type FloorFire = { kind: keyof typeof FLOOR_FIRE_KINDS; x: number; y: number; flip?: boolean };

export const FLOOR_FIRES: Record<'Landscape' | 'Portrait', FloorFire[]> = {
	// the halls remade on 2026-11-18 have their own lava in the floor's cracks: only a few small
	// fires lick up from them, near the sides (the floor starts at y 285 wide, 390 tall)
	Landscape: [
		{ kind: 'lick', x: 40, y: 298 },
		{ kind: 'lick', x: 600, y: 300, flip: true },
		{ kind: 'patch', x: 150, y: 318 },
		{ kind: 'patch', x: 492, y: 316, flip: true },
	],
	Portrait: [
		{ kind: 'lick', x: 40, y: 420 },
		{ kind: 'lick', x: 322, y: 418, flip: true },
		{ kind: 'patch', x: 108, y: 456 },
		{ kind: 'patch', x: 252, y: 452, flip: true },
	],
};
