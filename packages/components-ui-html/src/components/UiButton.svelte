<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		label?: string;
		onpress: () => void;
		disabled?: boolean;
		// greyed out like a disabled button, but still pressable
		muted?: boolean;
		active?: boolean;
		variant?: 'dark' | 'light';
		size?: 'normal' | 'large';
		children?: Snippet;
	};

	const {
		label,
		onpress,
		disabled = false,
		muted = false,
		active = false,
		variant = 'dark',
		size = 'normal',
		children,
	}: Props = $props();
</script>

<button
	type="button"
	class="ui-button {variant} {size}"
	class:muted
	class:active
	aria-pressed={active || undefined}
	{disabled}
	onclick={onpress}
>
	{#if label}
		<span class="ui-button-label">{label}</span>
	{/if}
	{@render children?.()}
</button>

<style lang="scss">
	.ui-button {
		--size: var(--ui-button-size);

		position: relative;
		box-sizing: border-box;
		display: flex;
		justify-content: center;
		align-items: center;
		width: var(--size);
		height: var(--size);
		padding: 0;
		border: none;
		border-radius: calc(var(--size) / 3);
		font-family: 'proxima-nova', sans-serif;
		font-size: calc(var(--ui-font-size) * 0.9);
		font-weight: 600;
		line-height: 1.1;
		text-align: center;
		cursor: pointer;
		pointer-events: auto;
		touch-action: manipulation;
		transition: transform 0.1s ease-out;

		&.large {
			--size: var(--ui-button-size-large);
		}

		&.dark {
			--color: #ffffff;
			background-color: #000000;
			color: var(--color);
		}

		&.light {
			--color: #000000;
			background-color: #ffffff;
			color: var(--color);
		}

		&.active {
			box-shadow: inset 0 0 0 calc(var(--size) / 15) var(--color);
		}

		&.muted,
		&:disabled {
			background-color: #aaaaaa;
		}

		&:disabled {
			cursor: not-allowed;
		}

		&:not(:disabled):active {
			transform: scale(0.95);
		}

		&:focus-visible {
			outline: calc(var(--size) / 30) solid #ffffff;
			outline-offset: calc(var(--size) / 30);
		}

		@media (hover: hover) {
			&:not(:disabled):hover {
				transform: scale(1.05);
			}
		}
	}

	.ui-button-label {
		max-width: 100%;
	}
</style>
