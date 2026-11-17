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

// What a symbol at rest does by itself now and then: the dragon's eye blinks or glances. chance is
// how likely one is to start on any tick of the pixel clock (ten a second); frame is how long each
// frame holds, in ms. The bigger rest acts of every symbol are cued one at a time across the board
// (IDLE_ACTS, game/idle.ts).
type Rest = { suffix: string; frame: number };
export const SYMBOL_RESTS: Record<string, { chance: number; acts: Rest[] }> = {
	// the eye is alive the way the dragon's eye in the background is: a quick blink every two
	// seconds or so, and now and then a look left, right or down, snapped to and held about a
	// second (a one-frame run held for `frame` ms)
	symbolScatter: {
		chance: 1 / 16,
		acts: [
			{ suffix: 'Blink', frame: 70 },
			{ suffix: 'Blink', frame: 70 },
			{ suffix: 'Blink', frame: 70 },
			{ suffix: 'LookLeft', frame: 1000 },
			{ suffix: 'LookRight', frame: 1000 },
			{ suffix: 'LookDown', frame: 900 },
		],
	},
};

// Sprite-level motion: the whole symbol moves, turns or grows uniformly as the solid object it is,
// never bent. Its frame runs carry the detail (a jaw, a cork, a liquid); this carries the weight,
// big enough to read on a phone where a cell is about 60 CSS px. pivot is the point it turns and
// grows about, in ART_PIXEL below the cell's middle: a symbol standing on the floor of its cell
// (a bottle, the hat, the axe's head) turns about its foot.
export type Move = { x?: number; y?: number; rotation?: number; scale?: number };
export type SpriteMove = {
	pivot: number;
	duration: number;
	move: (t: number, side: number) => Move;
};

const FOOT = 17;
const DEGREE = Math.PI / 180;
const easeOut = (t: number) => 1 - (1 - t) ** 3;
// a quick fall to 1 - depth by `at`, then a long, easing return: the weight of a landing
const dip = (t: number, depth: number, at = 0.2) =>
	t < at
		? 1 - depth * Math.sin((Math.PI / 2) * (t / at))
		: 1 - depth * (1 - easeOut((t - at) / (1 - at)));
// rocking on its foot that dies away: degrees each way, over this many whole sways
const rock = (t: number, degrees: number, sways: number) =>
	degrees * DEGREE * Math.sin(Math.PI * 2 * sways * t) * (1 - t) ** 2;
// up and back down once, smoothly
const swell = (t: number) => Math.sin(Math.PI * t);

// Landing. The fall is one smooth curve (constants.ts settleEasing); what reads is the touch: a
// heavy symbol sinks into its foot and comes back up (no rebound), a bottle or the hat rocks on
// its base, the dragon's eye swells as it snaps open. side (1 or -1) picks which way it rocks.
const thud = (depth: number, degrees: number): SpriteMove => ({
	pivot: FOOT,
	duration: 300,
	move: (t, side) => ({ scale: dip(t, depth), rotation: rock(t, degrees, 1) * side }),
});
const settle = (degrees: number): SpriteMove => ({
	pivot: FOOT,
	duration: 460,
	move: (t, side) => ({ scale: dip(t, 0.05, 0.15), rotation: rock(t, degrees, 1.5) * side }),
});
export const LAND_MOVES: Record<string, SpriteMove> = {
	symbolH1: thud(0.09, 3),
	symbolH2: thud(0.1, 2),
	symbolH3: settle(7),
	symbolH4: thud(0.11, 4),
	symbolL1: settle(8),
	symbolL2: settle(8),
	symbolL3: settle(7),
	symbolL4: settle(8),
	symbolScatter: {
		pivot: 0,
		duration: 420,
		move: (t) => ({
			scale: t < 0.3 ? 1 + 0.22 * easeOut(t / 0.3) : 1 + 0.22 * (1 - easeOut((t - 0.3) / 0.7)),
		}),
	},
};

// The bigger acts of a symbol at rest, cued one at a time somewhere on the board every second or
// so (game/idle.ts): its own frame run (repeated `times`) with a move of the whole symbol over the
// same time. The skull chatters its jaw and shakes with laughter, the helm looks about, the hat
// rocks while its holes smoulder, the axe is hefted as its bite glows, the bottles rock or lift
// as their liquid stirs, the dragon's eye glances and swells.
export type IdleAct = { suffix: string; frame: number; times?: number; motion: SpriteMove };
// an idle move lasts as long as the act's frames, so it carries no time of its own
const idle = (pivot: number, move: (t: number) => Move): SpriteMove => ({
	pivot,
	duration: 0,
	move: (t) => move(t),
});
export const IDLE_ACTS: Record<string, IdleAct[]> = {
	symbolH1: [
		{
			suffix: 'Land',
			frame: 80,
			times: 4,
			motion: idle(FOOT, (t) => ({ rotation: rock(t, 8, 3), scale: 1 + 0.08 * swell(t) })),
		},
		{ suffix: 'RestGlow', frame: 100, motion: idle(0, (t) => ({ scale: 1 + 0.12 * swell(t) })) },
		{
			suffix: 'RestDrip',
			frame: 100,
			motion: idle(FOOT, (t) => ({ rotation: rock(t, 8, 1), scale: 1 + 0.06 * swell(t) })),
		},
	],
	symbolH2: [
		{
			suffix: 'Rest',
			frame: 100,
			motion: idle(FOOT, (t) => ({
				rotation: 11 * DEGREE * Math.sin(Math.PI * 2 * t) * swell(t),
				scale: 1 + 0.08 * swell(t),
			})),
		},
	],
	symbolH3: [
		{
			suffix: 'RestSmoulder',
			frame: 100,
			motion: idle(FOOT, (t) => ({ rotation: rock(t, 12, 2), y: -3 * swell(t) })),
		},
		{
			suffix: 'RestSmoke',
			frame: 90,
			motion: idle(FOOT, (t) => ({ rotation: rock(t, 10, 1.5), scale: 1 + 0.07 * swell(t) })),
		},
	],
	symbolH4: [
		{
			suffix: 'Rest',
			frame: 100,
			motion: idle(FOOT, (t) => ({ rotation: -17 * DEGREE * swell(t) ** 2, y: -4 * swell(t) })),
		},
	],
	symbolL1: [
		{
			suffix: 'RestBeat',
			frame: 100,
			motion: idle(FOOT, (t) => ({ scale: 1 + 0.12 * swell(t), rotation: rock(t, 6, 1) })),
		},
		{
			suffix: 'RestBubble',
			frame: 70,
			motion: idle(FOOT, (t) => ({ rotation: rock(t, 13, 2), y: -3 * swell(t) })),
		},
	],
	symbolL2: [
		{
			suffix: 'RestLight',
			frame: 100,
			motion: idle(FOOT, (t) => ({
				y: -6 * swell(t),
				scale: 1 + 0.08 * swell(t),
				rotation: rock(t, 6, 1),
			})),
		},
		{ suffix: 'RestBubble', frame: 70, motion: idle(FOOT, (t) => ({ rotation: rock(t, 13, 2) })) },
	],
	symbolL3: [
		{
			suffix: 'RestSeep',
			frame: 100,
			motion: idle(FOOT, (t) => ({ rotation: rock(t, 12, 1.5), y: -3 * swell(t) })),
		},
		{
			suffix: 'RestBubble',
			frame: 70,
			motion: idle(FOOT, (t) => ({ rotation: rock(t, 13, 2), y: -3 * swell(t) })),
		},
	],
	symbolL4: [
		{
			suffix: 'RestLight',
			frame: 100,
			motion: idle(FOOT, (t) => ({
				y: -6 * swell(t),
				scale: 1 + 0.08 * swell(t),
				rotation: rock(t, 6, 1),
			})),
		},
		{ suffix: 'RestBubble', frame: 70, motion: idle(FOOT, (t) => ({ rotation: rock(t, 13, 2) })) },
	],
	// the eye acts with the eye alone: a held look aside or a double blink. It used to swell as
	// well, and on a phone the swell was all the user saw ("seperti cuma membesar").
	symbolScatter: [
		{ suffix: 'LookLeft', frame: 1100, motion: idle(0, () => ({})) },
		{ suffix: 'LookRight', frame: 1100, motion: idle(0, () => ({})) },
		{ suffix: 'Blink', frame: 110, times: 2, motion: idle(0, () => ({})) },
	],
};

// How long each frame of a symbol's Land run holds, in ms: the jaw's clack, the helm's clank, the
// slosh of a potion, the eye snapping open. It plays over the symbol as it settles and keeps
// nothing waiting.
export const LAND_FRAME = 70;
