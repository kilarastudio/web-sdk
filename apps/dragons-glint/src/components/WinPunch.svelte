<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';
	import { prefersReducedMotion, Tween } from 'svelte/motion';
	import { backOut, cubicInOut, cubicOut } from 'svelte/easing';

	import { Container } from 'pixi-svelte';

	// A counting amount: it can grow in as it appears, and it swells once, like a struck bell, at
	// the moment the count reaches the full amount.
	type Props = {
		x?: number;
		y?: number;
		// the count has reached the full amount
		completed: boolean;
		// grow in on mount; leave it out where a parent already brings the amount in
		appear?: boolean;
		children: Snippet;
	};

	const props: Props = $props();
	const still = prefersReducedMotion.current;
	const scale = new Tween(props.appear && !still ? 0.6 : 1);

	onMount(() => {
		if (props.appear && !still) scale.set(1, { duration: 240, easing: backOut });
	});

	$effect(() => {
		if (!props.completed || still) return;
		scale
			.set(1.2, { duration: 110, easing: cubicOut })
			.then(() => scale.set(1, { duration: 280, easing: cubicInOut }));
	});
</script>

<Container x={props.x} y={props.y} scale={scale.current}>
	{@render props.children()}
</Container>
