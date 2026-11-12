<script lang="ts" module>
	export type EmitterEventFreeSpinIntro =
		// the count is known as the intro is shown, so it never shows 0 while the screen uncovers
		| { type: 'freeSpinIntroShow'; totalFreeSpins?: number }
		| { type: 'freeSpinIntroHide' }
		| { type: 'freeSpinIntroUpdate'; totalFreeSpins: number };
</script>

<script lang="ts">
	import { CanvasSizeRectangle } from 'components-layout';
	import { FadeContainer } from 'components-pixi';
	import { waitForResolve } from 'utils-shared/wait';

	import { getContext } from '../game/context';
	import PressToContinue from './PressToContinue.svelte';
	import FreeSpinAnimation from './FreeSpinAnimation.svelte';

	const context = getContext();

	let show = $state(false);
	let freeSpinsFromEvent = $state(0);
	let oncomplete = $state(() => {});

	context.eventEmitter.subscribeOnMount({
		freeSpinIntroShow: (emitterEvent) => {
			if (emitterEvent.totalFreeSpins) freeSpinsFromEvent = emitterEvent.totalFreeSpins;
			show = true;
		},
		freeSpinIntroHide: () => (show = false),
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
	<CanvasSizeRectangle backgroundColor={0x000000} backgroundAlpha={0.5} />

	<FreeSpinAnimation
		key="panelFreeSpinsIntro"
		label={context.i18nDerived.youWon()}
		value={String(freeSpinsFromEvent)}
		caption={context.i18nDerived.freeSpins()}
	/>

	<PressToContinue onpress={() => oncomplete()} />
</FadeContainer>
