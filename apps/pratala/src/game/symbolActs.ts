// What each symbol does when it wins, after the hit and the white pop that every symbol shares:
// the dragon marks it. Symbols are solid objects: they move by whole art pixels and never bend.
// Distances are in ART_PIXEL (a fortieth of the cell, whatever the art's own size) from the middle
// of the cell, angles in radians, and t runs from 0 to 1 over the act.
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

// A paying symbol's win is drawn whole in its own Hurt frames (pixel/symbolRuns.ts): the skull
// laughs, the helm's gashes flare and it breathes smoke, the bottles boil, surge or fume. Nothing
// is added here: any move happens inside the frames by whole art pixels. The last frame stays
// until the symbol goes.
const own: SymbolAct = {
	pivot: { x: 0, y: 0 },
	pose: () => ({}),
	frames: { suffix: 'Hurt', from: 0.06 },
};

export const SYMBOL_ACTS: Record<string, SymbolAct> = {
	symbolH1: own,
	symbolH2: own,
	symbolH3: own,
	symbolH4: own,
	symbolL1: own,
	symbolL2: own,
	symbolL3: own,
	symbolL4: own,
	// the dragon's eye flares (its slit narrows, the iris heats, the seams round it blaze), beats
	// twice and throws off a ring of fire
	symbolScatter: {
		pivot: { x: 0, y: 0 },
		pose: (t) => ({ scale: 1 + 0.16 * Math.abs(Math.sin(Math.PI * 2 * t)) * (1 - t * 0.5) }),
		effects: (t) =>
			t >= 0.04 && t < 0.5 ? [{ key: 'burst', at: span(t, 0.04, 0.5), x: 0, y: 0, size: 64 }] : [],
		frames: { suffix: 'Flare', from: 0 },
	},
};

// What a symbol at rest does now and then, one of its acts played once: an ember breathes, a
// potion beats or fills with light, bubbles rise, poison seeps, the dragon's eye blinks or
// glances. chance is how likely one is to start on any tick of the pixel clock (ten a second);
// frame is how long each frame holds, in ms. Rare and at random, so the board never stirs all at
// once.
type Rest = { suffix: string; frame: number };
export const SYMBOL_RESTS: Record<string, { chance: number; acts: Rest[] }> = {
	symbolH1: {
		chance: 1 / 240,
		acts: [
			{ suffix: 'RestGlow', frame: 110 },
			{ suffix: 'RestDrip', frame: 120 },
		],
	},
	symbolH2: { chance: 1 / 240, acts: [{ suffix: 'Rest', frame: 110 }] },
	symbolH3: {
		chance: 1 / 240,
		acts: [
			{ suffix: 'RestSmoulder', frame: 120 },
			{ suffix: 'RestSmoke', frame: 110 },
		],
	},
	symbolH4: { chance: 1 / 240, acts: [{ suffix: 'Rest', frame: 110 }] },
	symbolL1: {
		chance: 1 / 280,
		acts: [
			{ suffix: 'RestBeat', frame: 110 },
			{ suffix: 'RestBubble', frame: 100 },
		],
	},
	symbolL2: {
		chance: 1 / 280,
		acts: [
			{ suffix: 'RestLight', frame: 120 },
			{ suffix: 'RestBubble', frame: 100 },
		],
	},
	symbolL3: {
		chance: 1 / 280,
		acts: [
			{ suffix: 'RestSeep', frame: 120 },
			{ suffix: 'RestBubble', frame: 100 },
		],
	},
	symbolL4: {
		chance: 1 / 280,
		acts: [
			{ suffix: 'RestLight', frame: 120 },
			{ suffix: 'RestBubble', frame: 110 },
		],
	},
	symbolScatter: {
		chance: 1 / 45,
		acts: [
			{ suffix: 'Blink', frame: 100 },
			{ suffix: 'RestGlance', frame: 110 },
		],
	},
};

// How long each frame of a symbol's Land run holds, in ms: the jaw's clack, the helm's clank, the
// slosh of a potion, the eye snapping open. It plays over the symbol as it settles and keeps
// nothing waiting.
export const LAND_FRAME = 70;
