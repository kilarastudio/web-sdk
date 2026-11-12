// What each symbol does when it wins, after the hit and the white pop that every symbol shares.
// Symbols are solid objects: they hop, swing, slam and rock, but never bend. Distances are in art
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
const easeOut = (t: number) => 1 - (1 - t) ** 3;
const easeIn = (t: number) => t ** 3;
// one hop: up and down on an arc
const arc = (t: number) => 4 * t * (1 - t);
// a swing that dies away
const ring = (t: number, turns: number, damping: number) =>
	Math.exp(-damping * t) * Math.cos(Math.PI * 2 * turns * t);

// a gem: the light goes once round its facets, and it swells once as the light comes home
const gem: SymbolAct = {
	pivot: { x: 0, y: 0 },
	pose: (t) => ({ scale: 1 + 0.1 * Math.sin(Math.PI * span(t, 0.55, 1)) }),
	frames: { suffix: 'Turn', from: 0.55 },
};

export const SYMBOL_ACTS: Record<string, SymbolAct> = {
	symbolL1: gem,
	symbolL2: gem,
	symbolL3: gem,
	symbolL4: gem,
	// the crown is tossed: one hop and a smaller one, tipping from side to side
	symbolH1: {
		pivot: { x: 0, y: 14 },
		pose: (t) => ({
			y: -8 * arc(span(t, 0, 0.5)) - 2.5 * arc(span(t, 0.5, 0.78)),
			rotation: 0.17 * Math.sin(Math.PI * 4 * t) * (1 - t),
		}),
	},
	// the sword is drawn back about its grip, cuts, and rings to rest; the cut leaves an arc
	symbolH2: {
		pivot: { x: -13, y: 13 },
		pose: (t) => {
			if (t < 0.28) return { rotation: -0.5 * easeOut(t / 0.28) };
			if (t < 0.4) return { rotation: -0.5 + 1.05 * easeIn(span(t, 0.28, 0.4)) };

			return { rotation: 0.55 * ring(span(t, 0.4, 1), 1.2, 4.5) };
		},
		effects: (t) =>
			t >= 0.34 && t < 0.66
				? [{ key: 'slash', at: span(t, 0.34, 0.66), x: 4, y: -4, size: 34 }]
				: [],
	},
	// the shield is pulled back and slammed forward, with a ring of force off its face
	symbolH3: {
		pivot: { x: 0, y: 0 },
		pose: (t) => {
			if (t < 0.24) return { scale: 1 - 0.12 * easeOut(t / 0.24) };
			if (t < 0.36) return { scale: 0.88 + 0.4 * easeIn(span(t, 0.24, 0.36)) };

			return { scale: 1 + 0.28 * ring(span(t, 0.36, 1), 1.3, 5.5) };
		},
		effects: (t) =>
			t >= 0.34 && t < 0.74
				? [{ key: 'burst', at: span(t, 0.34, 0.74), x: 0, y: 0, size: 60 }]
				: [],
	},
	// the potion rocks on its base and bubbles rise out of its neck
	symbolH4: {
		pivot: { x: 0, y: 15 },
		pose: (t) => ({ rotation: 0.26 * Math.sin(Math.PI * 4.4 * t) * (1 - t) ** 1.3 }),
		effects: (t) =>
			[0, 1, 2, 3, 4].flatMap((bubble) => {
				const life = span(t, 0.08 + bubble * 0.13, 0.5 + bubble * 0.13);
				if (life <= 0 || life >= 1) return [];

				return [
					{
						key: 'pixel',
						x: [-2, 2, 0, -3, 3][bubble] + Math.sin(life * 7 + bubble) * 1.5,
						y: -17 - 13 * life,
						size: bubble % 2 ? 2 : 3,
						alpha: life > 0.75 ? 0.55 : 1,
						tint: [0xfdd2ed, 0xf389f5, 0xffffff, 0xf389f5, 0xfdd2ed][bubble],
					},
				];
			}),
	},
	// the dragon's eye flares wide and beats twice, throwing off a ring of fire
	symbolScatter: {
		pivot: { x: 0, y: 0 },
		pose: (t) => ({ scale: 1 + 0.16 * Math.abs(Math.sin(Math.PI * 2 * t)) * (1 - t * 0.5) }),
		effects: (t) =>
			t >= 0.04 && t < 0.5 ? [{ key: 'burst', at: span(t, 0.04, 0.5), x: 0, y: 0, size: 64 }] : [],
		frames: { suffix: 'Alert', from: 0 },
	},
};

// What a symbol at rest does now and then, as a frame run played once: the light goes round a
// gem, the dragon's eye blinks. chance is how likely it is to start on any tick of the pixel
// clock (ten a second).
export const SYMBOL_RESTS: Record<string, { suffix: string; duration: number; chance: number }> = {
	symbolL1: { suffix: 'Turn', duration: 640, chance: 1 / 260 },
	symbolL2: { suffix: 'Turn', duration: 640, chance: 1 / 260 },
	symbolL3: { suffix: 'Turn', duration: 640, chance: 1 / 260 },
	symbolL4: { suffix: 'Turn', duration: 640, chance: 1 / 260 },
	symbolScatter: { suffix: 'Blink', duration: 300, chance: 1 / 45 },
};
