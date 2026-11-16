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
	// the floor meets the back wall at y 274 and leaves the picture at y 324 (about z -1.5)
	Landscape: [
		{ kind: 'lick', x: 236, y: 279 },
		{ kind: 'lick', x: 342, y: 280, flip: true },
		{ kind: 'patch', x: 190, y: 286 },
		{ kind: 'patch', x: 392, y: 287, flip: true },
		{ kind: 'tall', x: 420, y: 292 },
		{ kind: 'creep', x: 150, y: 296 },
		{ kind: 'bed', x: 440, y: 303, flip: true },
		{ kind: 'lick', x: 120, y: 306 },
		{ kind: 'patch', x: 300, y: 308 },
		{ kind: 'run', x: 380, y: 312 },
		{ kind: 'bed', x: 200, y: 316 },
		{ kind: 'patch', x: 80, y: 318, flip: true },
		{ kind: 'lick', x: 470, y: 320 },
		{ kind: 'creep', x: 288, y: 323, flip: true },
	],
	// the floor meets the back wall at y 379 and leaves the picture at y 576
	Portrait: [
		{ kind: 'patch', x: 100, y: 387 },
		{ kind: 'lick', x: 230, y: 405, flip: true },
		{ kind: 'creep', x: 140, y: 423 },
		{ kind: 'tall', x: 240, y: 441 },
		{ kind: 'lick', x: 70, y: 460 },
		{ kind: 'run', x: 210, y: 478, flip: true },
		{ kind: 'bed', x: 90, y: 496 },
		{ kind: 'patch', x: 280, y: 515, flip: true },
		{ kind: 'lick', x: 40, y: 533 },
		{ kind: 'creep', x: 180, y: 551, flip: true },
		{ kind: 'patch', x: 110, y: 570 },
	],
};
