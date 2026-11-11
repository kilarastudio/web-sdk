import { Tween } from 'svelte/motion';

// While a column waits on a scatter the whole board holds its breath: `dim` goes to 1 (the other
// symbols darken) and `pulse` beats between 0 and 1 (the scatters already down throb with it).
export const anticipationDim = new Tween(0, { duration: 220 });
export const anticipation = $state({ pulse: 0 });

const BEAT = 420;
let request = 0;

const tick = (now: number) => {
	anticipation.pulse = 0.5 - 0.5 * Math.cos((Math.PI * 2 * now) / BEAT);
	if (anticipationDim.target > 0 || anticipationDim.current > 0)
		request = requestAnimationFrame(tick);
	else {
		request = 0;
		anticipation.pulse = 0;
	}
};

export const setAnticipating = (on: boolean) => {
	if (anticipationDim.target > 0 === on) return;
	anticipationDim.set(on ? 1 : 0);
	if (on && !request) request = requestAnimationFrame(tick);
};
