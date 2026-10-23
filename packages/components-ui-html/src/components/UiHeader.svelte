<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		gameName: Snippet;
		logo?: Snippet;
	};

	const props: Props = $props();
</script>

<header class="ui-header">
	<div>{@render props.gameName()}</div>
	<div>{@render props.logo?.()}</div>
</header>

<style lang="scss">
	.ui-header {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		padding: 0.5em 0.9em;
		color: var(--ui-text-muted);
		font-size: clamp(10px, 1.8vmin, 15px);
		font-weight: 600;
		letter-spacing: 0.06em;
		line-height: 1.4;
		text-transform: uppercase;
		text-shadow: var(--ui-text-shadow);
		white-space: nowrap;
		pointer-events: none;
	}
</style>
