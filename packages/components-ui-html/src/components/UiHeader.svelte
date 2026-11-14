<script lang="ts">
	import type { Snippet } from 'svelte';

	import { stateUi } from 'state-shared';

	import UiLogo from './UiLogo.svelte';

	type Props = {
		gameName: Snippet;
		logo?: Snippet;
	};

	const props: Props = $props();
</script>

<!--
	the scrims: their own layer under the header, one soft diagonal fade out of each top corner of
	the screen, dark behind the game name and the logo and gone by the diagonal from the far top
	corner down to the screen edge, so the middle of the top stays clear
-->
<div class="ui-top-scrim left"></div>
<div class="ui-top-scrim right"></div>

<!-- its height is published to the game as stateUi.hudInset.top -->
<header class="ui-header" bind:clientHeight={stateUi.hudInset.top}>
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
		color: var(--ui-text-on-art);
		font-size: clamp(10px, 1.8vmin, 15px);
		font-weight: 600;
		letter-spacing: 0.06em;
		line-height: 1.4;
		text-transform: uppercase;
		text-shadow: var(--ui-text-shadow-on-art);
		white-space: nowrap;
		pointer-events: none;
		isolation: isolate;
	}

	.ui-top-scrim {
		position: absolute;
		top: 0;
		/* sized against the screen; on narrow screens never shorter than the text needs */
		height: max(11%, 5.5em);
		font-size: clamp(10px, 1.8vmin, 15px);
		pointer-events: none;

		&.left {
			left: 0;
			width: max(27%, 22em);
			background: linear-gradient(
				to bottom right,
				var(--ui-scrim-edge),
				var(--ui-scrim-mid) 22%,
				transparent 50%
			);
		}

		&.right {
			right: 0;
			width: max(23%, 12em);
			background: linear-gradient(
				to bottom left,
				var(--ui-scrim-edge),
				var(--ui-scrim-mid) 22%,
				transparent 50%
			);
		}
	}
</style>
