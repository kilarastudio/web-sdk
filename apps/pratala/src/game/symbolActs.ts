// What each symbol does when it wins, after the hit and the white pop that every symbol shares:
// the dragon marks it. Symbols are solid objects: they shake, swing and rock, but never bend. Distances are in
// ART_PIXEL (a fortieth of the cell, whatever the art's own size) from the middle of the cell, angles in radians, and t runs from 0 to 1 over the
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
// a small shake that dies away, in art pixels: what a thing does while the dragon's heat, teeth
// or claws are on it
const tremble = (t: number, reach: number) => reach * Math.sin(Math.PI * 2 * 7 * t) * (1 - t);

// What the dragon does to the symbol is drawn as its Hurt frames (pixel/symbols.ts); the last of
// them stays until the symbol leaves the board.
const hurt = (pivot: { x: number; y: number }, pose: SymbolAct['pose']): SymbolAct => ({
	pivot,
	pose,
	frames: { suffix: 'Hurt', from: 0.1 },
});

// Every paying symbol takes the same act for now: it shakes as the dragon strikes and cracks
// through (its Hurt frames, pixel/symbols.ts). Generic until each drawn symbol gets its own.
const struck = hurt({ x: 0, y: 0 }, (t) => ({ x: tremble(t, 0.7) }));

export const SYMBOL_ACTS: Record<string, SymbolAct> = {
	symbolH1: struck,
	symbolH2: struck,
	symbolH3: struck,
	symbolH4: struck,
	symbolL1: struck,
	symbolL2: struck,
	symbolL3: struck,
	symbolL4: struck,
	// the dragon's eye flares wide and beats twice, throwing off a ring of fire
	symbolScatter: {
		pivot: { x: 0, y: 0 },
		pose: (t) => ({ scale: 1 + 0.16 * Math.abs(Math.sin(Math.PI * 2 * t)) * (1 - t * 0.5) }),
		effects: (t) =>
			t >= 0.04 && t < 0.5 ? [{ key: 'burst', at: span(t, 0.04, 0.5), x: 0, y: 0, size: 64 }] : [],
		frames: { suffix: 'Alert', from: 0 },
	},
};

// What a symbol at rest does now and then, as a frame run played once: a band of light slides
// over a paying symbol, the dragon's eye blinks. chance is how likely it is to start on any tick
// of the pixel clock (ten a second).
export const SYMBOL_RESTS: Record<string, { suffix: string; duration: number; chance: number }> = {
	symbolL1: { suffix: 'Rest', duration: 560, chance: 1 / 260 },
	symbolL2: { suffix: 'Rest', duration: 560, chance: 1 / 260 },
	symbolL3: { suffix: 'Rest', duration: 560, chance: 1 / 260 },
	symbolL4: { suffix: 'Rest', duration: 560, chance: 1 / 260 },
	symbolH1: { suffix: 'Rest', duration: 560, chance: 1 / 220 },
	symbolH2: { suffix: 'Rest', duration: 560, chance: 1 / 220 },
	symbolH3: { suffix: 'Rest', duration: 560, chance: 1 / 220 },
	symbolH4: { suffix: 'Rest', duration: 560, chance: 1 / 220 },
	symbolScatter: { suffix: 'Blink', duration: 300, chance: 1 / 45 },
};
