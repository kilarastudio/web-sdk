<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';
	import { prefersReducedMotion, Tween } from 'svelte/motion';
	import { backOut } from 'svelte/easing';

	import { Container } from 'pixi-svelte';

	type Props = {
		x?: number;
		y?: number;
		children: Snippet;
	};

	const props: Props = $props();
	// grows in from a little smaller as it fades in, settling with a slight overshoot
	const scale = new Tween(prefersReducedMotion.current ? 1 : 0.9);

	onMount(() => {
		scale.set(1, { duration: 320, easing: backOut });
	});
</script>

<Container x={props.x} y={props.y} scale={scale.current}>
	{@render props.children()}
</Container>
