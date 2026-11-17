import { untrack } from 'svelte';
import type { Tween } from 'svelte/motion';

import { BOARD_SIZES, SYMBOL_SIZE } from './constants';

// The moment a falling symbol reaches its place on the board. The fall's curve (settleEasing)
// gets there about three quarters of the way through, runs a hair past and eases back, and the
// reel only calls the symbol landed at the very end: the hit belongs to the first touch, not the
// end of the ease. Counts each touch, so a component can react to every one. Call while a
// component is set up; symbolY is read anew each time, as reels hand their symbols round.
export const watchContact = (symbolY: () => Tween<number>, ontouch: () => void) => {
	// falling toward a place well below where the symbol is
	let falling = false;
	$effect(() => {
		const tween = symbolY();
		const y = tween.current;
		const target = tween.target;
		untrack(() => {
			if (y < target - SYMBOL_SIZE * 0.3) falling = true;
			else if (falling && y >= target - 0.5) {
				falling = false;
				// only a place on the board: the reels also drop symbols out of sight below it
				if (target > 0 && target < BOARD_SIZES.height) ontouch();
			}
		});
	});
};
