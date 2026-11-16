// The v2 symbol set: which model draws each symbol key, and the frame runs each one has. Models
// still being modelled fall back to the old code-drawn symbol (pixel/symbols.ts) until they land.
import type { PixelCanvas } from '../../canvas.ts';
import { DEFAULT_VIEW, renderSymbol, SYMBOL_PIXELS, type SymbolModel, type View } from './rig.ts';
import { lantern } from './lantern.ts';
import { crystal } from './crystal.ts';
import { eye } from './eye.ts';
import { horn } from './horn.ts';
import { skull } from './skull.ts';
import { coin } from './coin.ts';
import { keris } from './keris.ts';

export type FrameRun = { count: number; frame: (t: number, index: number) => { model: SymbolModel; view?: View } };

export type SymbolEntry = {
	still: { model: SymbolModel; view?: View };
	// what the symbol does at rest, as a loop
	rest?: FrameRun;
	// the win act (the dragon marks it): the model at marking strength t, 0..1; the last frame
	// stays until the symbol goes, and the symbol leaves in that state
	marked?: (t: number) => SymbolModel;
	// the symbol's own stir frames the game asks for by suffix (Turn, Blink, Alert)
	runs?: Record<string, FrameRun>;
};

export const HURT_FRAMES = 8;
export const GONE_FRAMES = 10;
// the leaving frames are drawn on a wider canvas, the cell in its middle
export const GONE_PIXELS = 64;

const loop = (count: number, at: (t: number) => { model: SymbolModel; view?: View }): FrameRun => ({
	count,
	frame: (t) => at(t),
});

const crystalEntry = (kind: 'ruby' | 'sapphire' | 'emerald' | 'amethyst'): SymbolEntry => ({
	still: { model: crystal(kind) },
	// the dragon's heat wakes the ember inside until the whole cluster blazes
	marked: (t) => crystal(kind, { glow: 0.5 + 1.5 * t }),
	// the ember inside breathes, and the cluster turns a little toward the light and back
	runs: {
		Turn: loop(8, (t) => ({ model: crystal(kind, { glow: 0.5 + 0.5 * Math.sin(t * Math.PI * 2) }), view: { yaw: -0.42 + 0.35 * Math.sin(t * Math.PI * 2) } })),
	},
});

export const SYMBOLS_V2: Partial<Record<string, SymbolEntry>> = {
	symbolScatter: {
		still: { model: eye() },
		marked: (t) => eye({ pupil: 1 + 0.7 * t, glow: t }),
		runs: {
			Blink: { count: 3, frame: (_, i) => ({ model: eye({ open: [0.45, 0.05, 0.45][i] }) }) },
			Alert: { count: 1, frame: () => ({ model: eye({ pupil: 1.6, glow: 1 }) }) },
			// a glance aside and back, at rest
			Rest: { count: 6, frame: (_, i) => ({ model: eye({ look: [[-0.3, 0], [-0.7, 0], [-0.7, 0], [-0.3, 0], [0.3, -0.2], [0, 0]][i] as [number, number] }) }) },
		},
	},
	symbolH1: {
		still: { model: skull() },
		marked: (t) => skull({ glow: 0.5 + 0.5 * t }),
		// the embers in its sockets flare now and then
		rest: loop(8, (t) => ({ model: skull({ glow: 0.5 * Math.max(0, Math.sin(t * Math.PI * 2)) }) })),
	},
	symbolH2: {
		// the keris is slender; it is drawn a little larger than the others so it holds its cell
		still: { model: keris(), view: { scale: 1.1 } },
		// the dragon's breath heats the blade from its edges inward
		marked: (t) => keris({ heat: t }),
		// a glint runs up the blade as it turns a little in the light
		rest: loop(8, (t) => ({ model: keris(), view: { scale: 1.1, yaw: -0.42 + 0.3 * Math.sin(t * Math.PI * 2) } })),
	},
	symbolWild: {
		still: { model: coin() },
		// the coin turning on its edge, for the coins that fly to the win
		runs: { Turn: { count: 8, frame: (t) => ({ model: coin({ turn: t }), view: { yaw: t * Math.PI * 2, pitch: 0.2 } }) } },
	},
	symbolH3: {
		still: { model: horn() },
		marked: (t) => horn({ blow: t }),
		// the bell warms with a breath now and then
		rest: loop(8, (t) => ({ model: horn({ blow: 0.35 * Math.max(0, Math.sin(t * Math.PI * 2)) }) })),
	},
	symbolL1: crystalEntry('ruby'),
	symbolL2: crystalEntry('sapphire'),
	symbolL3: crystalEntry('emerald'),
	symbolL4: crystalEntry('amethyst'),
	symbolH4: {
		still: { model: lantern() },
		marked: (t) => lantern({ flare: t }),
		rest: loop(10, (t) => ({ model: lantern({ phase: t }) })),
	},
};

// every frame of every v2 symbol, keyed as the game loads them
export const renderAll = () => {
	const out: Record<string, PixelCanvas | PixelCanvas[]> = {};
	for (const [key, entry] of Object.entries(SYMBOLS_V2)) {
		if (!entry) continue;
		out[key] = renderSymbol(entry.still.model, entry.still.view);
		const run = (suffix: string, frames: FrameRun) => {
			out[`${key}${suffix}`] = Array.from({ length: frames.count }, (_, i) => {
				const { model, view } = frames.frame(i / frames.count, i);
				return renderSymbol(model, view);
			});
		};
		if (entry.rest) run('Rest', entry.rest);
		if (entry.marked) {
			const marked = entry.marked;
			const view = entry.still.view ?? {};
			out[`${key}Hurt`] = Array.from({ length: HURT_FRAMES }, (_, i) =>
				renderSymbol(marked((i + 1) / HURT_FRAMES), view),
			);
			// leaving: the marked symbol is flung up and away, turning over in the air, and drops
			// out of the cell, smaller as it goes
			out[`${key}Gone`] = Array.from({ length: GONE_FRAMES }, (_, i) => {
				const t = (i + 0.5) / GONE_FRAMES;
				const base = { ...DEFAULT_VIEW, ...view };
				const fling = Math.sin(Math.PI * Math.min(1, t * 1.15));
				return renderSymbol(
					marked(1),
					{
						yaw: base.yaw + t * Math.PI * 2.4,
						roll: base.roll + t * 1.3,
						pitch: base.pitch,
						dy: 0.55 * fling - 1.1 * t * t,
						dx: 0.18 * t,
						scale: 1 - 0.45 * t,
					},
					GONE_PIXELS,
					GONE_PIXELS / SYMBOL_PIXELS,
				);
			});
		}
		for (const [suffix, frames] of Object.entries(entry.runs ?? {})) run(suffix, frames);
	}
	return out;
};
