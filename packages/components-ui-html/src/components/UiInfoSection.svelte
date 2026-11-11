<!--
	A titled block of text in a menu (the rules, a feature's description): a small Kilau heading
	and the game's own paragraphs, lists and pictures under it, set in the menu's text style.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		title?: string;
		children: Snippet;
	};

	const props: Props = $props();
</script>

<section class="ui-info-section">
	{#if props.title}<h3 class="title">{props.title}</h3>{/if}
	{@render props.children()}
</section>

<style lang="scss">
	.ui-info-section {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
		min-width: 0;
		color: #d5d9df;
		line-height: 1.5;
		text-wrap: pretty;
		user-select: text;

		:global(p),
		:global(ul) {
			margin: 0;
		}

		:global(ul) {
			display: flex;
			flex-direction: column;
			gap: 0.35em;
			padding-left: 1.1em;
		}

		:global(strong) {
			color: var(--ui-text);
			font-weight: 700;
		}
	}

	.title {
		margin: 0;
		color: var(--ui-accent);
		font-size: 0.8em;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}
</style>
