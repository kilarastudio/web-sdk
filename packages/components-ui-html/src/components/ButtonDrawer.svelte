<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicInOut } from 'svelte/easing';

	import { stateUi } from 'state-shared';

	import UiButton from './UiButton.svelte';
	import { getContext } from '../context';

	type Props = {
		disabled?: boolean;
	};

	const props: Props = $props();
	const context = getContext();

	const DRAWER_ROTATION = {
		up: -180,
		down: 0,
	};

	const rotationTween = new Tween(stateUi.drawerFold ? DRAWER_ROTATION.up : DRAWER_ROTATION.down, {
		easing: cubicInOut,
	});

	let moving = $state(false);
	const disabled = $derived(props.disabled || moving);

	const onpress = async () => {
		if (stateUi.drawerFold) {
			await context.eventEmitter.broadcastAsync({ type: 'drawerUnfold' });
		} else {
			await context.eventEmitter.broadcastAsync({ type: 'drawerFold' });
		}
	};

	context.eventEmitter.subscribeOnMount({
		drawerUnfold: async () => {
			if (stateUi.drawerFold) {
				moving = true;
				await rotationTween.set(DRAWER_ROTATION.down);
				stateUi.drawerFold = false;
				moving = false;
			}
		},
		drawerFold: async () => {
			if (!stateUi.drawerFold) {
				moving = true;
				await rotationTween.set(DRAWER_ROTATION.up);
				stateUi.drawerFold = true;
				moving = false;
			}
		},
	});
</script>

<UiButton {disabled} {onpress}>
	<span class="arrow" style:transform="rotate({rotationTween.current}deg)">↓</span>
</UiButton>

<style lang="scss">
	.arrow {
		position: absolute;
	}
</style>
