<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		// cut a round notch that cradles the spin button sitting in it
		notch?: boolean;
		// the notch's centre across the dock (CSS length); the middle by default
		notchX?: string;
		children: Snippet;
	};

	const props: Props = $props();
</script>

<!--
	The HUD dock: a floating square-cornered bar centred at the bottom of the stage. The layout
	sizes it with --bar-width, --bar-height, --bar-bottom and --bar-padding (the inset round its
	contents: as wide as the space above and below a button in it).
-->
<div class="ui-bar" class:notch={props.notch} style:--notch-x={props.notchX}>
	<div class="surface"></div>
	{@render props.children()}
</div>

<style lang="scss">
	.ui-bar {
		/* icon buttons sit flat in the dock and light up on hover */
		--ui-button-bg: transparent;
		--ui-button-hover-bg: var(--ui-field);

		/* the spin button's radius plus a 12px gap; on the bar so its contents can lay out round it */
		--notch-radius: calc(var(--ui-button-size-large) / 2 + 12px);

		position: absolute;
		left: 50%;
		bottom: var(--bar-bottom);
		box-sizing: border-box;
		display: flex;
		align-items: center;
		gap: 20px;
		width: var(--bar-width);
		height: var(--bar-height);
		padding: 0 var(--bar-padding);
		transform: translateX(-50%);
	}

	/*
		The fill sits on a pseudo-element so the notch mask only cuts the background, never the
		buttons, and the drop shadow on its parent follows the cut shape.
	*/
	.surface {
		position: absolute;
		inset: 0;
		z-index: -1;
		filter: drop-shadow(var(--ui-shadow));

		&::before {
			content: '';
			position: absolute;
			inset: 0;
			background-color: var(--ui-surface);
		}
	}

	.notch .surface::before {
		--notch-mask: radial-gradient(
			circle at var(--notch-x, 50%) 50%,
			transparent var(--notch-radius),
			#000 calc(var(--notch-radius) + 1px)
		);

		-webkit-mask: var(--notch-mask);
		mask: var(--notch-mask);
	}
</style>
