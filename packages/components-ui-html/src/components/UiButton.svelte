<script lang="ts">
	import type { Snippet } from 'svelte';

	import UiIcon, { type UiIconName } from './UiIcon.svelte';

	type Props = {
		// shown as text, or as the accessible name and tooltip when the button only has an icon
		label: string;
		icon?: UiIconName;
		iconRotation?: number;
		onpress: () => void;
		disabled?: boolean;
		// greyed out like a disabled button, but still pressable
		muted?: boolean;
		active?: boolean;
		// an on/off switch: reports aria-pressed="false" when off as well
		toggle?: boolean;
		// icon: squircle icon button, spin/stop: the one oversized round bet button,
		// feature: round text badge (buy bonus), row: icon and label in a menu list
		kind?: 'icon' | 'spin' | 'stop' | 'feature' | 'row';
		children?: Snippet;
	};

	const {
		label,
		icon,
		iconRotation,
		onpress,
		disabled = false,
		muted = false,
		active = false,
		toggle = false,
		kind = 'icon',
		children,
	}: Props = $props();

	const iconOnly = $derived(!!icon && kind !== 'row');
</script>

<button
	type="button"
	class="ui-button {kind}"
	class:muted
	class:active
	aria-label={iconOnly ? label : undefined}
	title={iconOnly ? label : undefined}
	aria-pressed={toggle ? active : active || undefined}
	{disabled}
	onclick={onpress}
>
	{#if icon}
		<span class="ui-button-icon">
			<UiIcon name={icon} rotation={iconRotation} />
		</span>
	{/if}
	{#if !iconOnly}
		<span class="ui-button-label">{label}</span>
	{/if}
	{@render children?.()}
</button>

<!--
	Sizes and the icon button background come from the layout (--ui-button-size,
	--ui-button-size-large, --ui-button-bg, --ui-feature-*, --ui-row-height), so one button looks
	right in the dock, floating over the game, or in the menu.
-->
<style lang="scss">
	.ui-button {
		--size: var(--ui-button-size);

		position: relative;
		box-sizing: border-box;
		display: flex;
		flex-shrink: 0;
		justify-content: center;
		align-items: center;
		width: var(--size);
		height: var(--size);
		padding: 0;
		border: none;
		border-radius: var(--ui-squircle);
		background-color: var(--ui-button-bg);
		color: var(--ui-text);
		font-family: inherit;
		font-size: calc(var(--ui-font-size) * 0.9);
		font-weight: 600;
		line-height: 1.1;
		text-align: center;
		text-transform: uppercase;
		cursor: pointer;
		pointer-events: auto;
		touch-action: manipulation;
		transition:
			transform 0.12s ease-out,
			color 0.15s,
			background-color 0.15s;

		&.active {
			color: var(--ui-accent);
		}

		&.muted,
		&:disabled {
			color: var(--ui-text-disabled);
		}

		&:disabled {
			cursor: not-allowed;
		}

		&:not(:disabled):active {
			transform: scale(0.95);
		}

		&:focus-visible {
			outline: calc(var(--ui-button-size) / 30) solid var(--ui-text);
			outline-offset: calc(var(--ui-button-size) / 30);
		}

		@media (hover: hover) {
			&:not(:disabled):hover {
				background-color: var(--ui-button-hover-bg, var(--ui-button-bg));
			}
		}
	}

	/*
		The primary action, a large circle kept neutral so it sits on any game art: a dark body with
		a ring and icon in the text colour. The only gold is the Kilau dot inside the Kilara spin
		icon. While a round runs (stop) only the icon changes.
	*/
	.spin,
	.stop {
		--size: var(--ui-button-size-large);
		/* the stop square, sized to sit optically level with the spin arrow's ring */
		--ui-icon-scale: 0.6;
		--ui-button-hover-bg: var(--ui-surface-raised);
		--ring: var(--ui-text);

		border-radius: 50%;
		background-color: var(--ui-surface);
		box-shadow:
			inset 0 0 0 calc(var(--size) * 0.035) var(--ring),
			var(--ui-shadow);
		transition:
			transform 0.12s ease-out,
			color 0.2s,
			background-color 0.2s,
			box-shadow 0.2s;

		&.muted,
		&:disabled {
			--ring: var(--ui-text-disabled);
			/* the Kilau dot greys out with the rest of the icon */
			--ui-icon-dot: currentColor;

			color: var(--ui-text-disabled);
		}

		@media (hover: hover) {
			&:not(:disabled):hover {
				transform: scale(1.03);
			}
		}
	}

	.spin {
		/* the arrow's ring spans about half the button; above 0.64 its head crowds the ring */
		--ui-icon-scale: 0.64;
	}

	/*
		Buy bonus: a round badge in the dock's own surface with a Kilau ring (as thick as the spin
		button's) and the Kilau dot from the Kilara wordmark. The dot sits near the top edge, out of
		the text flow, so the two-line label keeps the whole centre. Smaller than the spin button,
		which stays the one primary action.
	*/
	.feature {
		--size: var(--ui-feature-size);
		--ui-button-hover-bg: var(--ui-surface-raised);
		--kilau: var(--ui-accent);

		border-radius: 50%;
		background-color: var(--ui-surface);
		box-shadow:
			inset 0 0 0 calc(var(--size) * 0.035) var(--kilau),
			var(--ui-shadow);
		font-size: calc(var(--size) * 0.18);
		font-weight: 700;
		line-height: 1.05;
		letter-spacing: 0.03em;

		&::before {
			content: '';
			position: absolute;
			top: calc(var(--size) * 0.115);
			left: 50%;
			width: calc(var(--size) * 0.085);
			height: calc(var(--size) * 0.085);
			border-radius: 50%;
			background-color: var(--kilau);
			transform: translateX(-50%);
		}

		.ui-button-label {
			max-width: calc(var(--size) * 0.82);
			text-wrap: balance;
		}

		&.active {
			--ui-button-hover-bg: var(--ui-activate);
			--kilau: var(--ui-activate-contrast);

			/* no ring on the filled state: a dark ring on a coloured disc is the look to avoid */
			box-shadow: var(--ui-shadow);
			background-color: var(--ui-activate);
			color: var(--ui-activate-contrast);
		}

		&.muted,
		&:disabled {
			--kilau: var(--ui-text-disabled);

			color: var(--ui-text-disabled);
		}

		@media (hover: hover) {
			&:not(:disabled):hover {
				transform: scale(1.03);
			}
		}
	}

	.row {
		justify-content: flex-start;
		gap: 0.75em;
		width: 100%;
		height: var(--ui-row-height);
		padding: 0 0.75em;
		border-radius: calc(var(--ui-row-height) * 0.3);
		background-color: transparent;
		font-size: calc(var(--ui-font-size) * 0.72);
		letter-spacing: 0.04em;
		text-align: left;

		&.active {
			color: var(--ui-text);
		}

		.ui-button-icon {
			font-size: 1.35em;
			color: var(--ui-text-muted);
		}
	}

	.ui-button-label {
		max-width: 100%;
	}

	.ui-button-icon {
		/* the Kilara glyphs keep an 8/96 margin, so they need a larger share than Phosphor did */
		font-size: calc(var(--size) * var(--ui-icon-scale, 0.56));
	}
</style>
