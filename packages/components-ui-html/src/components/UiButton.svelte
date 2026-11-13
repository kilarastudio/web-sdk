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
		// icon: square icon button, spin/stop: the one oversized round bet button,
		// feature: square text badge (buy bonus), row: icon and label in a menu list
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

	// The press feedback lives in the content, never in the button itself: the spin arrow whips one
	// turn the way it points, the buy bonus Kilau dot runs once around its frame.
	let iconEl = $state<HTMLSpanElement>();
	let kilauEl = $state<HTMLSpanElement>();
	const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	const playPress = () => {
		if (reducedMotion()) return;
		if (kind === 'spin') {
			iconEl?.animate([{ rotate: '0deg' }, { rotate: '360deg' }], {
				duration: 520,
				easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
			});
		}
		if (kind === 'feature' && kilauEl) {
			// restart the CSS run, which follows the square frame
			kilauEl.classList.remove('run');
			void kilauEl.offsetWidth;
			kilauEl.classList.add('run');
		}
	};

	const onclick = () => {
		playPress();
		onpress();
	};
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
	{onclick}
>
	{#if kind === 'feature'}
		<span
			class="ui-button-kilau"
			bind:this={kilauEl}
			aria-hidden="true"
			onanimationend={() => kilauEl?.classList.remove('run')}
		></span>
	{/if}
	{#if icon}
		<span class="ui-button-icon" bind:this={iconEl}>
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

		/*
			An icon button may be wider or flatter than square (the bet's stacked ▲ ▼), keep room on its
			left or right that only its background covers (--ui-button-inset-start, -end), and have
			that background cut by a mask (--ui-button-mask), as beside the dock's notch. The
			background sits on a pseudo-element so the mask never cuts the icon or the focus ring.
		*/
		&.icon {
			isolation: isolate;
			width: var(--ui-button-width, var(--size));
			height: var(--ui-button-height, var(--size));
			padding-left: var(--ui-button-inset-start, 0);
			padding-right: var(--ui-button-inset-end, 0);
			background-color: transparent;

			&::before {
				content: '';
				position: absolute;
				inset: 0;
				z-index: -1;
				background-color: var(--ui-button-bg);
				transition: background-color 0.15s;
				-webkit-mask: var(--ui-button-mask, none);
				mask: var(--ui-button-mask, none);
			}
		}

		/* no scale on press: the icon dips instead */
		&.icon:not(:disabled):active .ui-button-icon {
			transform: translateY(calc(var(--size) * 0.04));
			transition-duration: 0.06s;
		}

		&:focus-visible {
			outline: calc(var(--ui-button-size) / 30) solid var(--ui-text);
			outline-offset: calc(var(--ui-button-size) / 30);
		}

		@media (hover: hover) {
			&:not(.icon):not(:disabled):hover,
			&.icon:not(:disabled):hover::before {
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
	}

	/*
		Spin: the arrow leans a little into its turn on hover, winds back while held, and whips one
		full turn on release (playPress). The Kilau dot sits at the centre, so it never moves.
	*/
	.spin {
		/* the arrow's ring spans about half the button; above 0.64 its head crowds the ring */
		--ui-icon-scale: 0.64;

		.ui-button-icon {
			transition: transform 0.36s cubic-bezier(0.34, 1.56, 0.64, 1);
		}

		@media (hover: hover) {
			&:not(:disabled):hover .ui-button-icon {
				transform: rotate(30deg);
			}
		}

		&:not(:disabled):active .ui-button-icon {
			transform: rotate(-20deg);
			transition-duration: 0.12s;
			transition-timing-function: ease-out;
		}
	}

	/*
		Buy bonus: a square badge in the dock's own surface with a Kilau frame (as thick as the spin
		button's ring) and the Kilau dot from the Kilara wordmark. The dot sits near the top edge, out
		of the text flow, so the two-line label keeps the whole centre. Smaller than the spin button,
		which stays the one primary action and the only round one.
	*/
	.feature {
		--size: var(--ui-feature-size);
		--ui-button-hover-bg: var(--ui-surface-raised);
		--kilau: var(--ui-accent);

		background-color: var(--ui-surface);
		box-shadow:
			inset 0 0 0 calc(var(--size) * 0.035) var(--kilau),
			var(--ui-shadow);
		font-size: calc(var(--size) * 0.18);
		font-weight: 700;
		line-height: 1.05;
		letter-spacing: 0.03em;

		.ui-button-label {
			max-width: calc(var(--size) * 0.82);
			text-wrap: balance;
			transition: transform 0.24s cubic-bezier(0.34, 1.56, 0.64, 1);
		}

		/* held: the label sinks a touch instead of the button shrinking */
		&:not(:disabled):active .ui-button-label {
			transform: translateY(calc(var(--size) * 0.035));
			transition-duration: 0.08s;
			transition-timing-function: ease-out;
		}

		&.active {
			--ui-button-hover-bg: var(--ui-activate);
			--kilau: var(--ui-activate-contrast);

			/* no frame on the filled state: a dark frame on a coloured square is the look to avoid */
			box-shadow: var(--ui-shadow);
			background-color: var(--ui-activate);
			color: var(--ui-activate-contrast);
		}

		&.muted,
		&:disabled {
			--kilau: var(--ui-text-disabled);

			color: var(--ui-text-disabled);
		}

		/* hover: the Kilau dot runs once around the frame */
		@media (hover: hover) {
			&:not(:disabled):hover .ui-button-kilau {
				animation: kilau-frame 0.9s;
			}
		}
	}

	/* a true circle, so it keeps its radius; it rests at the top centre, inside the frame */
	.ui-button-kilau {
		/* from the button centre to the middle of the dot's track */
		--track: calc(var(--size) * 0.3425);

		position: absolute;
		top: calc(var(--size) * 0.115);
		left: calc(50% - var(--size) * 0.0425);
		width: calc(var(--size) * 0.085);
		height: calc(var(--size) * 0.085);
		border-radius: 50%;
		background-color: var(--kilau);
		pointer-events: none;
		transition: background-color 0.2s;

		&:global(.run) {
			animation: kilau-frame 0.9s;
		}
	}

	/*
		Clockwise along the inside of the square frame, back to the top centre. The stops sit at
		equal distances along the path (half a side, then whole sides), so the speed stays even;
		the run eases in on the first stretch and out on the last.
	*/
	@keyframes kilau-frame {
		0% {
			translate: 0 0;
			animation-timing-function: ease-in;
		}
		12.5% {
			translate: var(--track) 0;
			animation-timing-function: linear;
		}
		37.5% {
			translate: var(--track) calc(var(--track) * 2);
			animation-timing-function: linear;
		}
		62.5% {
			translate: calc(var(--track) * -1) calc(var(--track) * 2);
			animation-timing-function: linear;
		}
		87.5% {
			translate: calc(var(--track) * -1) 0;
			animation-timing-function: ease-out;
		}
		100% {
			translate: 0 0;
		}
	}

	.row {
		justify-content: flex-start;
		gap: 0.75em;
		width: 100%;
		height: var(--ui-row-height);
		padding: 0 0.75em;
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
		/* a box of its own, so the press and hover motions can transform it */
		display: block;
		font-size: calc(var(--size) * var(--ui-icon-scale, 0.56));
		transition: transform 0.2s ease-out;
	}

	@media (prefers-reduced-motion: reduce) {
		.ui-button .ui-button-icon,
		.ui-button .ui-button-label {
			transform: none !important;
		}

		.ui-button .ui-button-kilau {
			animation: none !important;
		}
	}
</style>
