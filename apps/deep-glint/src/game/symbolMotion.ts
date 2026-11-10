import { prefersReducedMotion, type Tween } from 'svelte/motion';
import { cubicIn, cubicOut } from 'svelte/easing';

import { stateBetDerived } from 'state-shared';
import { waitForTimeout } from 'utils-shared/wait';

// Until the symbol art has its own win animations, a winning symbol beats twice in code. Reduced
// motion keeps the timing without the scaling.
const WIN_BEAT = { count: 2, scale: 1.12, up: 150, down: 210 };

export const winPulse = async (scale: Tween<number>) => {
	const timeScale = stateBetDerived.timeScale();

	for (let beat = 0; beat < WIN_BEAT.count; beat++) {
		if (prefersReducedMotion.current) {
			await waitForTimeout((WIN_BEAT.up + WIN_BEAT.down) / timeScale);
		} else {
			await scale.set(WIN_BEAT.scale, { duration: WIN_BEAT.up / timeScale, easing: cubicOut });
			await scale.set(1, { duration: WIN_BEAT.down / timeScale, easing: cubicIn });
		}
	}
};
