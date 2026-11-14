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
	// the floor starts at y 262
	Landscape: [
		{ kind: 'lick', x: 150, y: 264 },
		{ kind: 'lick', x: 426, y: 265, flip: true },
		{ kind: 'patch', x: 28, y: 267 },
		{ kind: 'patch', x: 552, y: 268, flip: true },
		{ kind: 'tall', x: 474, y: 271 },
		{ kind: 'creep', x: 92, y: 275 },
		{ kind: 'bed', x: 528, y: 286, flip: true },
		{ kind: 'lick', x: 122, y: 290 },
		{ kind: 'patch', x: 352, y: 292 },
		{ kind: 'run', x: 436, y: 298 },
		{ kind: 'bed', x: 186, y: 302 },
		{ kind: 'patch', x: 66, y: 306, flip: true },
		{ kind: 'lick', x: 506, y: 312 },
		{ kind: 'creep', x: 300, y: 316, flip: true },
	],
	// the floor starts at y 405
	Portrait: [
		{ kind: 'patch', x: 62, y: 412 },
		{ kind: 'lick', x: 250, y: 414, flip: true },
		{ kind: 'creep', x: 122, y: 424 },
		{ kind: 'tall', x: 214, y: 444 },
		{ kind: 'lick', x: 160, y: 458 },
		{ kind: 'run', x: 238, y: 482, flip: true },
		{ kind: 'bed', x: 74, y: 494 },
		{ kind: 'patch', x: 300, y: 508, flip: true },
		{ kind: 'lick', x: 28, y: 522 },
		{ kind: 'creep', x: 176, y: 534, flip: true },
		{ kind: 'patch', x: 96, y: 556 },
	],
};
