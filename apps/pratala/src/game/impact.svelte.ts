import { prefersReducedMotion } from 'svelte/motion';

import { stateBetDerived } from 'state-shared';

import { ART_PIXEL } from './constants';

// What a hit does to the board. A win shakes it: the board jumps by whole art pixels, a new place
// every beat, and comes to rest as the shake dies away. `step` counts the wins the current spin's
// tumbles have paid so far (1 on the first), so each one can hit a little harder than the last.
export const impact = $state({ x: 0, y: 0, step: 0 });

const BEAT = 34;
let run = 0;

// pixels: how far the first jolt throws the board, in art pixels
export const shake = (pixels: number, duration = 240) => {
	if (prefersReducedMotion.current || pixels <= 0) return;
	const id = ++run;
	const total = duration / stateBetDerived.timeScale();
	const start = performance.now();
	let beat = -1;
	const tick = (now: number) => {
		if (id !== run) return;
		const progress = (now - start) / total;
		if (progress >= 1) {
			impact.x = 0;
			impact.y = 0;

			return;
		}
		const current = Math.floor((now - start) / BEAT);
		if (current !== beat) {
			beat = current;
			const reach = Math.max(1, Math.round(pixels * (1 - progress)));
			// side to side on alternate beats, with a smaller jolt up or down
			impact.x = (beat % 2 ? 1 : -1) * reach * ART_PIXEL;
			impact.y = Math.round((Math.random() - 0.5) * reach) * ART_PIXEL;
		}
		requestAnimationFrame(tick);
	};
	requestAnimationFrame(tick);
};
