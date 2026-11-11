<!--
	The one frame every Kilara menu opens in (paytable, info, settings, autoplay, buy bonus, bet
	menu, confirmations), the same in every game: a flat, see-through Malam panel (the HUD dock's own surface) with square corners over a
	scrim, a title bar with a close button, a body that scrolls, and an optional footer that stays
	put for the menu's one main action.

	It fits itself to the screen, with no layout code in the menus:
	- narrow screens (phones held upright): a sheet standing on the bottom edge, as wide as the screen;
	- short screens (phones held sideways, the Stake mini player): the panel takes the full height;
	- everything else: a panel in the middle, as wide as its `size`.
	Sizes are in px, never rem, so a menu looks the same whatever the page's root font is.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { fade } from 'svelte/transition';

	import './font.css';
	import './tokens.css';
	import { KILARA_ICONS } from './kilaraIcons';

	type Props = {
		title: string;
		// how wide the panel may grow where the screen has room: 400, 560 or 880 px
		size?: 'small' | 'medium' | 'large';
		zIndex: number;
		onclose: () => void;
		children: Snippet;
		footer?: Snippet;
	};

	const props: Props = $props();
	const id = $props.id();

	const onkeydown = (event: KeyboardEvent) => {
		if (event.key === 'Escape') {
			event.stopPropagation();
			props.onclose();
		}
	};

	// the panel takes focus, so the keyboard acts on the menu and not on the game behind it
	const focus = (node: HTMLElement) => {
		node.focus({ preventScroll: true });
	};
</script>

<svelte:window {onkeydown} />

<div class="ui-sheet" style:z-index={props.zIndex} transition:fade={{ duration: 160 }}>
	<div class="scrim" role="presentation" onclick={props.onclose}></div>

	<div
		class="panel {props.size ?? 'medium'}"
		role="dialog"
		aria-modal="true"
		aria-labelledby="{id}-title"
		tabindex="-1"
		use:focus
	>
		<header class="bar">
			<h2 class="title" id="{id}-title">{props.title}</h2>
			<button
				type="button"
				class="close"
				data-test="close-button"
				aria-label="Close"
				onclick={props.onclose}
			>
				<svg viewBox="0 0 96 96" focusable="false" aria-hidden="true">
					<path d={KILARA_ICONS.close.d} />
				</svg>
			</button>
		</header>

		<div class="body">
			{@render props.children()}
		</div>

		{#if props.footer}
			<footer class="footer">
				{@render props.footer()}
			</footer>
		{/if}
	</div>
</div>

<style lang="scss">
	.ui-sheet {
		/* one measure for the whole menu: its gutters, gaps and controls are multiples of it */
		--sheet-pad: 20px;
		--sheet-gap: 16px;
		--sheet-bar: 56px;
		--sheet-control: 48px;
		--sheet-font: 15px;

		position: fixed;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 24px;
		color: var(--ui-text);
		font-family: var(--font-family);
		font-size: var(--sheet-font);
		line-height: 1.4;
		text-align: left;
		-webkit-tap-highlight-color: transparent;
		touch-action: manipulation;
	}

	.scrim {
		position: absolute;
		inset: 0;
		background-color: var(--ui-scrim);
		cursor: pointer;
	}

	.panel {
		position: relative;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		width: 100%;
		max-height: min(100%, 760px);
		/* the same see-through Malam as the HUD's dock, the game blurred behind it */
		background-color: var(--ui-surface);
		backdrop-filter: blur(14px);
		-webkit-backdrop-filter: blur(14px);
		box-shadow: var(--ui-shadow);
		outline: none;
		animation: panel-in 220ms cubic-bezier(0.2, 0.9, 0.3, 1) both;

		&.small {
			max-width: 400px;
		}

		&.medium {
			max-width: 560px;
		}

		&.large {
			max-width: 880px;
		}
	}

	.bar {
		flex: none;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		height: var(--sheet-bar);
		padding-left: var(--sheet-pad);
	}

	.title {
		margin: 0;
		overflow: hidden;
		font-size: 1.07em;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-overflow: ellipsis;
		text-transform: uppercase;
		white-space: nowrap;
	}

	/* a square as tall as the bar, flat like the HUD's icon buttons: the icon dips when pressed */
	.close {
		flex: none;
		display: grid;
		place-items: center;
		width: var(--sheet-bar);
		height: var(--sheet-bar);
		padding: 0;
		border: none;
		background: none;
		color: var(--ui-text-muted);
		cursor: pointer;
		transition:
			color 0.15s,
			background-color 0.15s;

		svg {
			width: 38%;
			height: 38%;
			fill: currentColor;
			transition: transform 0.08s ease-out;
		}

		@media (hover: hover) {
			&:hover {
				background-color: var(--ui-field);
				color: var(--ui-text);
			}
		}

		&:active svg {
			transform: translateY(2px);
		}

		&:focus-visible {
			outline: 2px solid var(--ui-text);
			outline-offset: -4px;
		}
	}

	.body {
		flex: 1 1 auto;
		min-height: 0;
		display: flex;
		flex-direction: column;
		gap: var(--sheet-gap);
		padding: 4px var(--sheet-pad) var(--sheet-pad);
		overflow-x: hidden;
		overflow-y: auto;
		overscroll-behavior: contain;
		-webkit-overflow-scrolling: touch;
		scrollbar-width: thin;
		scrollbar-color: var(--ui-text-muted) transparent;

		&::-webkit-scrollbar {
			width: 6px;
		}

		&::-webkit-scrollbar-thumb {
			background: var(--ui-text-muted);
		}
	}

	.footer {
		flex: none;
		display: flex;
		gap: 12px;
		padding: 12px var(--sheet-pad) calc(var(--sheet-pad) + env(safe-area-inset-bottom, 0px));
		/* a step darker than the panel, so the action reads as standing apart from the list */
		background-color: rgba(14, 16, 20, 0.45);
	}

	@keyframes panel-in {
		from {
			opacity: 0;
			transform: scale(0.96);
		}
	}

	@keyframes sheet-up {
		from {
			transform: translateY(100%);
		}
	}

	/* narrow: a sheet standing on the bottom edge */
	@media (max-width: 599px) {
		.ui-sheet {
			--sheet-pad: 16px;
			--sheet-gap: 14px;

			align-items: flex-end;
			padding: 40px 0 0;
		}

		.panel,
		.panel.small,
		.panel.medium,
		.panel.large {
			max-width: none;
			max-height: 100%;
			animation-name: sheet-up;
		}

		.body {
			padding-bottom: calc(var(--sheet-pad) + env(safe-area-inset-bottom, 0px));
		}

		/* with a footer, the footer carries the safe area */
		.body:not(:last-child) {
			padding-bottom: var(--sheet-pad);
		}
	}

	/* short: the panel takes the full height, and everything in it is a size smaller */
	@media (max-height: 499px) {
		.ui-sheet {
			--sheet-pad: 14px;
			--sheet-gap: 10px;
			--sheet-bar: 40px;
			--sheet-control: 38px;
			--sheet-font: 13px;

			align-items: stretch;
			padding: 0;
		}

		.panel,
		.panel.small,
		.panel.medium,
		.panel.large {
			max-height: none;
			animation-name: panel-in;
		}

		.panel.small {
			max-width: 440px;
		}

		.panel.medium {
			max-width: 640px;
		}

		.footer {
			padding-top: 8px;
			padding-bottom: 10px;
		}
	}

	/* the Stake mini player (400 × 225) and anything as small */
	@media (max-height: 299px) {
		.ui-sheet {
			--sheet-pad: 10px;
			--sheet-gap: 8px;
			--sheet-bar: 32px;
			--sheet-control: 30px;
			--sheet-font: 11px;
		}

		.panel.small,
		.panel.medium,
		.panel.large {
			max-width: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.panel {
			animation: none;
		}
	}
</style>
