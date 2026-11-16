<script lang="ts" module>
	import type { Position } from '../game/types';

	export type EmitterEventFreeSpinIntro =
		// the count is known as the intro is shown, so it never shows 0 while the screen uncovers;
		// the scatters that won the free spins are lit by the dragon's gaze
		| { type: 'freeSpinIntroShow'; totalFreeSpins?: number; scatters?: Position[] }
		| { type: 'freeSpinIntroHide' }
		| { type: 'freeSpinIntroUpdate'; totalFreeSpins: number };
</script>

<script lang="ts">
	import { FadeContainer } from 'components-pixi';
	import { waitForResolve } from 'utils-shared/wait';

	import { getContext } from '../game/context';
	import { setAnticipating } from '../game/anticipation.svelte';
	import PressToContinue from './PressToContinue.svelte';
	import FreeSpinAnimation from './FreeSpinAnimation.svelte';

	const context = getContext();

	let show = $state(false);
	let freeSpinsFromEvent = $state(0);
	let scatters = $state<Position[]>([]);
	let oncomplete = $state(() => {});

	context.eventEmitter.subscribeOnMount({
		freeSpinIntroShow: (emitterEvent) => {
			if (emitterEvent.totalFreeSpins) freeSpinsFromEvent = emitterEvent.totalFreeSpins;
			scatters = emitterEvent.scatters ?? [];
			show = true;
			// the board holds its breath: the scatters stay awake, every other symbol goes dark
			setAnticipating(true, true);
		},
		freeSpinIntroHide: () => {
			show = false;
			setAnticipating(false);
		},
		freeSpinIntroUpdate: async (emitterEvent) => {
			// if (emitterEvent.extraSpins) {
			// 	context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_fs_respins' });
			// }
			// freeSpinsFromEvent = emitterEvent.extraSpins ?? emitterEvent.totalFreeSpins;
			freeSpinsFromEvent = emitterEvent.totalFreeSpins;
			await waitForResolve((resolve) => (oncomplete = resolve));
		},
	});
</script>

<FadeContainer {show}>
	<FreeSpinAnimation
		key="panelFreeSpinsIntro"
		label={context.i18nDerived.youWon()}
		value={String(freeSpinsFromEvent)}
		caption={context.i18nDerived.freeSpins()}
		{scatters}
	/>

	<PressToContinue underBoard onpress={() => oncomplete()} />
</FadeContainer>
