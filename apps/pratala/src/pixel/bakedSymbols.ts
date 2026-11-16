// The baked symbol frames (scripts/bake-art.ts), decoded once for the game. Kept apart from the
// codec so the bake scripts, which run under Node, never import the JSON they write.
import type { PixelCanvas } from './canvas.ts';
import { decodeBaked, type Baked } from './baked.ts';
import bakedSymbols from './baked/symbols.json';

let decoded: Record<string, PixelCanvas | PixelCanvas[]> | undefined;
export const bakedSymbolFrames = () => (decoded ??= decodeBaked(bakedSymbols as Baked));

// a symbol's still, as drawn for the reels
export const bakedSymbolStill = (key: string) => {
	const frame = bakedSymbolFrames()[key];
	return frame && !Array.isArray(frame) ? frame : undefined;
};
