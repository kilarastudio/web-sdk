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
		left: 20px;
		right: 20px;
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		color: #ffffff;
		font-size: 1.5rem;
		font-weight: 600;
		line-height: 2rem;
		white-space: nowrap;
		pointer-events: none;
	}
</style>
