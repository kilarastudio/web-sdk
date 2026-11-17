<script lang="ts">
	import { onMount } from 'svelte';
	import { getContextParent } from 'pixi-svelte';

	import { boardSpace } from '../game/boardSpace';

	// Placed inside a BoardContainer: makes the board's container known (game/boardSpace.ts).
	const parent = getContextParent().parent;
	onMount(() => {
		boardSpace.container = parent;
		return () => {
			if (boardSpace.container === parent) boardSpace.container = undefined;
		};
	});
</script>
