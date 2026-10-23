<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import { Tween } from 'svelte/motion';

	import { getContext } from '../context';

	type Props = {
		children: Snippet;
	};

	const props: Props = $props();
	const context = getContext();
	const opacity = new Tween(0);

	// Tween.set() never resolves when it is interrupted, so only animate when the target changes.
	const fadeTo = async (value: number) => {
		if (opacity.target !== value) await opacity.set(value);
	};

	onMount(() => {
		fadeTo(1);
	});

	context.eventEmitter.subscribeOnMount({
		uiShow: () => fadeTo(1),
		uiHide: () => fadeTo(0),
	});
</script>

<div class="ui-fade" class:hidden={opacity.current === 0} style:opacity={opacity.current}>
	{@render props.children()}
</div>

<style lang="scss">
	.ui-fade {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.hidden {
		visibility: hidden;
	}
</style>
