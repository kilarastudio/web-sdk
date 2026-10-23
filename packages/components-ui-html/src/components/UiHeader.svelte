<script lang="ts">
	import type { Snippet } from 'svelte';

	import UiLogo from './UiLogo.svelte';

	type Props = {
		gameName: Snippet;
		logo?: Snippet;
	};

	const props: Props = $props();
</script>

<header class="ui-header">
	<div>{@render props.gameName()}</div>
	<!-- every game shows the Kilara logo; the logo snippet only replaces it when a game passes one -->
	<div>
		{#if props.logo}
			{@render props.logo()}
		{:else}
			<UiLogo />
		{/if}
	</div>
</header>

<style lang="scss">
	.ui-header {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		display: flex;
		justify-content: space-between;
		/* the logo sits on the game name's baseline */
		align-items: baseline;
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
