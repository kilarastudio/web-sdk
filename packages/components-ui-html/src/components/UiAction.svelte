<!--
	A menu's button. `primary` is the one main action: a flat Kertas bar, like the error message's.
	`quiet` is everything else: a flat field. Neither has a border, a lip or a shadow; the press
	shows in the content, the label dipping while the face changes a step.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		kind?: 'primary' | 'quiet';
		disabled?: boolean;
		// as wide as its container
		block?: boolean;
		onpress: () => void;
		children: Snippet;
		'data-test'?: string;
	};

	const {
		kind = 'primary',
		disabled = false,
		block = false,
		onpress,
		children,
		...rest
	}: Props = $props();
</script>

<button type="button" class="ui-action {kind}" class:block {disabled} onclick={onpress} {...rest}>
	<span class="content">{@render children()}</span>
</button>

<style lang="scss">
	.ui-action {
		flex: none;
		box-sizing: border-box;
		display: inline-grid;
		place-items: center;
		min-width: calc(var(--sheet-control, 48px) * 2);
		height: var(--sheet-control, 48px);
		padding: 0 1.2em;
		border: none;
		font-family: inherit;
		font-size: 1em;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		white-space: nowrap;
		cursor: pointer;
		touch-action: manipulation;
		transition:
			background-color 0.15s,
			color 0.15s;

		&.block {
			display: grid;
			flex: 1 1 auto;
			width: 100%;
		}
	}

	.content {
		display: inline-flex;
		align-items: center;
		gap: 0.5em;
		transition: transform 0.08s ease-out;
	}

	.primary {
		background-color: var(--ui-text);
		color: #0e1014;

		@media (hover: hover) {
			&:hover:not(:disabled) {
				background-color: #ffffff;
			}
		}

		&:active:not(:disabled) {
			background-color: #d9dbe0;
		}
	}

	.quiet {
		background-color: var(--ui-field);
		color: var(--ui-text);

		@media (hover: hover) {
			&:hover:not(:disabled) {
				background-color: var(--ui-field-hover);
			}
		}
	}

	.ui-action:active:not(:disabled) .content {
		transform: translateY(2px);
	}

	.ui-action:disabled {
		background-color: var(--ui-field);
		color: var(--ui-text-disabled);
		cursor: not-allowed;
	}

	.ui-action:focus-visible {
		outline: 2px solid var(--ui-text);
		outline-offset: 3px;
	}
</style>
