<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		// cut a round notch in the middle that cradles the spin button sitting in it
		notch?: boolean;
		children: Snippet;
	};

	const props: Props = $props();
</script>

<!--
	The HUD dock: a floating rounded bar centred at the bottom of the stage, its corners a small
	share of its height (--ui-corner) so the ends read as a bar rather than a pill. The layout
	sizes it with --bar-width, --bar-height, --bar-bottom and --bar-padding.
-->
<div class="ui-bar" class:notch={props.notch}>
	<div class="surface"></div>
	{@render props.children()}
</div>

<style lang="scss">
	.ui-bar {
		/*
			icon buttons sit flat in the dock and light up on hover, their corners concentric with
			the dock's: its radius minus the gap between button and dock edge
		*/
		--ui-button-bg: transparent;
		--ui-button-hover-bg: var(--ui-field);
		--ui-squircle: max(
			4px,
			calc(var(--bar-height) * var(--ui-corner) - (var(--bar-height) - var(--ui-button-size)) / 2)
		);

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
		border-radius: calc(var(--bar-height) * var(--ui-corner));
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
		border-radius: inherit;
		filter: drop-shadow(var(--ui-shadow));

		&::before {
			content: '';
			position: absolute;
			inset: 0;
			border-radius: inherit;
			background-color: var(--ui-surface);
		}
	}

	.notch .surface::before {
		/* the spin button's radius plus a 12px gap */
		--notch-radius: calc(var(--ui-button-size-large) / 2 + 12px);
		--notch-mask: radial-gradient(
			circle at 50% 50%,
			transparent var(--notch-radius),
			#000 calc(var(--notch-radius) + 1px)
		);

		-webkit-mask: var(--notch-mask);
		mask: var(--notch-mask);
	}
</style>
