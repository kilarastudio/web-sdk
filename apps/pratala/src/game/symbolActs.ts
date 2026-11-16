// What each symbol does when it wins, after the hit and the white pop that every symbol shares:
// the dragon marks it. Symbols are solid objects: they shake, swing and rock, but never bend. Distances are in art
// pixels from the middle of the symbol's cell, angles in radians, and t runs from 0 to 1 over the
// act.
export type SymbolPose = { x?: number; y?: number; rotation?: number; scale?: number };

export type SymbolEffect = {
	// a frame run among the loaded art, or a single texture
	key: string;
	// how far through its frames, 0 to 1
	at?: number;
	x: number;
	y: number;
	size: number;
	alpha?: number;
	tint?: number;
};

export type SymbolAct = {
	// the point the symbol turns and grows about
	pivot: { x: number; y: number };
	pose: (t: number) => SymbolPose;
	effects?: (t: number) => SymbolEffect[];
	// a frame run that replaces the symbol's art from `from` to the end of the act
	frames?: { suffix: string; from: number };
};

export const ACT_DURATION = 660;

const clamp = (value: number) => Math.max(0, Math.min(1, value));
// how far through the stretch from start to end t is
const span = (t: number, start: number, end: number) => clamp((t - start) / (end - start));
// a swing that dies away
const ring = (t: number, turns: number, damping: number) =>
	Math.exp(-damping * t) * Math.cos(Math.PI * 2 * turns * t);

// a small shake that dies away, in art pixels: what a thing does while the dragon's heat, teeth
// or claws are on it
const tremble = (t: number, reach: number) => reach * Math.sin(Math.PI * 2 * 7 * t) * (1 - t);

// What the dragon does to the symbol is drawn as its Hurt frames (pixel/render/symbols); the last of
// them stays until the symbol leaves the board.
const hurt = (pivot: { x: number; y: number }, pose: SymbolAct['pose']): SymbolAct => ({
	pivot,
	pose,
	frames: { suffix: 'Hurt', from: 0.1 },
});

// a gem cracks: from the middle of its table, out along its facets
const gem = hurt({ x: 0, y: 0 }, (t) => ({ x: tremble(t, 0.7) }));

export const SYMBOL_ACTS: Record<string, SymbolAct> = {
	// v2 symbols (pixel/render/symbols): the dragon marks each one over its Hurt frames, and the
	// object answers as a solid thing: a tremble, a rock, a lift
	symbolL1: hurt({ x: 0, y: 12 }, (t) => ({ x: tremble(t, 0.7) })),
	symbolL2: hurt({ x: 0, y: 12 }, (t) => ({ x: tremble(t, 0.7) })),
	symbolL3: hurt({ x: 0, y: 12 }, (t) => ({ x: tremble(t, 0.7) })),
	symbolL4: hurt({ x: 0, y: 12 }, (t) => ({ x: tremble(t, 0.7) })),
	// the skull's jaw hangs; it rocks back on its horns as the embers catch
	symbolH1: hurt({ x: 0, y: 8 }, (t) => ({
		rotation: -0.1 * Math.sin(Math.PI * 2.2 * t) * (1 - t) ** 1.2,
		y: -1.5 * Math.sin(Math.PI * Math.min(1, t * 1.6)),
	})),
	// the keris is drawn from the air: a wrench about its grip
	symbolH2: hurt({ x: -13, y: 13 }, (t) => ({
		rotation: 0.12 * ring(span(t, 0.1, 1), 2.2, 3.5) * span(t, 0.1, 0.2),
	})),
	// the horn is blown: it swells back, then sounds
	symbolH3: hurt({ x: -12, y: 0 }, (t) => ({
		rotation: 0.08 * ring(span(t, 0.05, 1), 1.6, 3) * span(t, 0.05, 0.2),
		x: tremble(span(t, 0.4, 1), 0.6),
	})),
	// the lantern swings on its ring as its flame leaps
	symbolH4: hurt({ x: 0, y: -16 }, (t) => ({
		rotation: 0.14 * ring(span(t, 0.08, 1), 1.8, 2.6) * span(t, 0.08, 0.25),
	})),
	// the dragon's eye flares wide and beats twice, throwing off a ring of fire
	symbolScatter: {
		pivot: { x: 0, y: 0 },
		pose: (t) => ({ scale: 1 + 0.16 * Math.abs(Math.sin(Math.PI * 2 * t)) * (1 - t * 0.5) }),
		effects: (t) =>
			t >= 0.04 && t < 0.5 ? [{ key: 'burst', at: span(t, 0.04, 0.5), x: 0, y: 0, size: 64 }] : [],
		frames: { suffix: 'Hurt', from: 0 },
	},
};

// What a symbol at rest does now and then, as a frame run played once: the light goes round a
// gem, slides over the metal of the crown, sword, shield and helm, the dragon's eye blinks. chance is how likely it is to start on any tick of the pixel
// clock (ten a second): each symbol stirs every three to four seconds on average, so the board
// between spins is never still.
export const SYMBOL_RESTS: Record<string, { suffix: string; duration: number; chance: number }> = {
	symbolL1: { suffix: 'Turn', duration: 900, chance: 1 / 40 },
	symbolL2: { suffix: 'Turn', duration: 900, chance: 1 / 40 },
	symbolL3: { suffix: 'Turn', duration: 900, chance: 1 / 40 },
	symbolL4: { suffix: 'Turn', duration: 900, chance: 1 / 40 },
	symbolH1: { suffix: 'Rest', duration: 1100, chance: 1 / 38 },
	symbolH2: { suffix: 'Rest', duration: 800, chance: 1 / 40 },
	symbolH3: { suffix: 'Rest', duration: 1000, chance: 1 / 40 },
	symbolH4: { suffix: 'Rest', duration: 1200, chance: 1 / 30 },
	symbolScatter: { suffix: 'Blink', duration: 300, chance: 1 / 30 },
};
