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

// What the dragon does to the symbol is drawn as its Hurt frames (pixel/symbols.ts); the last of
// them stays until the symbol leaves the board.
const hurt = (pivot: { x: number; y: number }, pose: SymbolAct['pose']): SymbolAct => ({
	pivot,
	pose,
	frames: { suffix: 'Hurt', from: 0.1 },
});

// a gem cracks: from the middle of its table, out along its facets
const gem = hurt({ x: 0, y: 0 }, (t) => ({ x: tremble(t, 0.7) }));

export const SYMBOL_ACTS: Record<string, SymbolAct> = {
	symbolL1: gem,
	symbolL2: gem,
	symbolL3: gem,
	symbolL4: gem,
	// the crown takes the dragon's heat: it glows from its tips down, softens and starts to run
	symbolH1: hurt({ x: 0, y: 14 }, (t) => ({ x: tremble(t, 0.6) })),
	// the sword is bitten through: it is wrenched about its grip as the teeth close, and the
	// point comes away
	symbolH2: hurt({ x: -13, y: 13 }, (t) => ({
		rotation: 0.12 * ring(span(t, 0.1, 1), 2.2, 3.5) * span(t, 0.1, 0.2),
	})),
	// the shield is raked by three claws, and knocked back by each
	symbolH3: hurt({ x: 0, y: 0 }, (t) => {
		const blow = [0.12, 0.4, 0.68].reduce(
			(sum, at) => sum + (t >= at ? Math.exp(-14 * (t - at)) : 0),
			0,
		);

		return { x: -1.6 * blow, y: 1.6 * blow };
	}),
	// the helm is scorched: it rocks on its rim as the burn spreads, and smoke rises off it
	symbolH4: {
		...hurt({ x: 0, y: 15 }, (t) => ({
			rotation: 0.1 * Math.sin(Math.PI * 4.4 * t) * (1 - t) ** 1.3,
		})),
		effects: (t) =>
			[0, 1, 2, 3, 4].flatMap((bubble) => {
				const life = span(t, 0.08 + bubble * 0.13, 0.5 + bubble * 0.13);
				if (life <= 0 || life >= 1) return [];

				return [
					{
						key: 'pixel',
						x: [8, 12, 10, 7, 13][bubble] + Math.sin(life * 7 + bubble) * 1.5,
						y: -17 - 13 * life,
						size: bubble % 2 ? 2 : 3,
						alpha: life > 0.75 ? 0.55 : 1,
						tint: [0x858585, 0x5d5d5d, 0xb4b4b4, 0xed7614, 0x858585][bubble],
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
// gem, slides over the metal of the crown, sword, shield and helm, the dragon's eye blinks. chance is how likely it is to start on any tick of the pixel
// clock (ten a second).
export const SYMBOL_RESTS: Record<string, { suffix: string; duration: number; chance: number }> = {
	symbolL1: { suffix: 'Turn', duration: 640, chance: 1 / 260 },
	symbolL2: { suffix: 'Turn', duration: 640, chance: 1 / 260 },
	symbolL3: { suffix: 'Turn', duration: 640, chance: 1 / 260 },
	symbolL4: { suffix: 'Turn', duration: 640, chance: 1 / 260 },
	symbolH1: { suffix: 'Rest', duration: 560, chance: 1 / 220 },
	symbolH2: { suffix: 'Rest', duration: 560, chance: 1 / 220 },
	symbolH3: { suffix: 'Rest', duration: 560, chance: 1 / 220 },
	symbolH4: { suffix: 'Rest', duration: 560, chance: 1 / 220 },
	symbolScatter: { suffix: 'Blink', duration: 300, chance: 1 / 45 },
};
