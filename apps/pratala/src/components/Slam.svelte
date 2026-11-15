<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';
	import { prefersReducedMotion, Tween } from 'svelte/motion';
	import { backOut, cubicIn } from 'svelte/easing';

	import { Container } from 'pixi-svelte';

	// Words that land: they come down out of the air, big and faint, and hit their place hard.
	type Props = { x?: number; y?: number; children: Snippet };

	const props: Props = $props();
	const still = prefersReducedMotion.current;
	const scale = new Tween(still ? 1 : 2.4);
	const alpha = new Tween(still ? 1 : 0);

	onMount(async () => {
		if (still) return;
		alpha.set(1, { duration: 120 });
		await scale.set(0.92, { duration: 170, easing: cubicIn });
		scale.set(1, { duration: 220, easing: backOut });
	});
</script>

<Container x={props.x} y={props.y} scale={scale.current} alpha={alpha.current}>
	{@render props.children()}
</Container>
