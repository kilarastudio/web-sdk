<!--
	Error message, game style rather than web style: a centred panel that pops in, a large alert
	icon of its own (wallet, gauge, hourglass, broken key, struck signal, warning), unframed, whose
	Kilau dot drops in and bounces like the studio intro, a big title,
	and one big flat button whose label dips when pressed. The dot stays gold when the game can carry
	on (OK: balance, limits, a busy server) and goes out to grey when it cannot (RELOAD: session,
	connection, anything unknown). The error code sits small under the button for support.

	It can show before the HUD exists (during the studio intro or loading screen), so it carries its
	own copy of the HUD tokens and font instead of relying on UI.svelte.
-->
<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { backOut } from 'svelte/easing';

	import { zIndex } from 'constants-shared/zIndex';
	import { stateModal } from 'state-shared';

	import './font.css';
	import { errorMessage } from './errorMessage';
	import { KILARA_ICONS } from './kilaraIcons';
	import { i18nDerived } from '../i18n/i18nDerived';

	const id = $props.id();

	const message = $derived(
		stateModal.modal?.name === 'error' ? errorMessage(stateModal.modal.error) : undefined,
	);

	const icon = $derived(message ? KILARA_ICONS[message.icon] : undefined);

	const act = () => {
		if (message?.recoverable) {
			stateModal.modal = null;
		} else {
			window.location.reload();
		}
	};

	const onkeydown = (event: KeyboardEvent) => {
		if (event.key === 'Escape' && message?.recoverable) stateModal.modal = null;
	};

	// the action takes focus, so Enter or Space answers the message
	const focus = (node: HTMLButtonElement) => {
		node.focus({ preventScroll: true });
	};
</script>

<svelte:window {onkeydown} />

{#if message}
	<div class="error-modal" style:z-index={zIndex.dialog} transition:fade={{ duration: 200 }}>
		<div
			class="panel"
			class:fatal={!message.recoverable}
			role="alertdialog"
			aria-modal="true"
			aria-labelledby="{id}-title"
			aria-describedby="{id}-body"
			in:scale={{ start: 0.82, duration: 420, easing: backOut, opacity: 0 }}
		>
			<div class="emblem" aria-hidden="true">
				{#if icon}
					<svg viewBox="0 0 96 96" focusable="false">
						<path class="ink" d={icon.d} />
						{#if icon.dot}<path class="dot" d={icon.dot} />{/if}
					</svg>
				{/if}
			</div>

			<h2 class="title" id="{id}-title">{message.title}</h2>
			<p class="body" id="{id}-body">{message.body}</p>

			<button type="button" class="action" use:focus onclick={act}>
				<span>{message.recoverable ? i18nDerived.ok() : i18nDerived.reload()}</span>
			</button>

			{#if message.code}
				<p class="code" title={message.detail}>{message.code}</p>
			{/if}
		</div>
	</div>
{/if}

<style lang="scss">
	.error-modal {
		/* the HUD tokens from UI.svelte, so the panel matches it before the HUD mounts */
		--ui-accent: #ffc53d;
		--ui-text: #f3f4f6;
		--ui-text-muted: #8a92a0;
		--ui-surface-raised: rgba(30, 32, 37, 0.97);
		--ui-shadow: 0 12px 32px rgba(14, 16, 20, 0.4);

		position: fixed;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 16px;
		background-color: rgba(14, 16, 20, 0.78);
		color: var(--ui-text);
		font-family: var(--font-family);
		/* px, not rem: Modals shrinks the root font to 50% on narrow screens */
		font-size: 15px;
		text-align: center;
		-webkit-tap-highlight-color: transparent;
	}

	.panel {
		--kilau: var(--ui-accent);

		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		align-items: center;
		width: min(100%, 360px);
		max-height: 100%;
		padding: 32px 24px 20px;
		overflow-y: auto;
		background-color: var(--ui-surface-raised);
		box-shadow: var(--ui-shadow);
	}

	/* the alert icon on its own, no frame: it pops in, then its dot drops */
	.emblem {
		margin-bottom: 18px;
		animation: icon-in 360ms 120ms cubic-bezier(0.34, 1.56, 0.64, 1) both;

		svg {
			display: block;
			width: 80px;
			height: 80px;
			overflow: visible;
		}
	}

	.ink {
		fill: var(--ui-text);
	}

	/* the icon's Kilau dot (a true circle) drops in from above the icon; units are the icon's 96 grid */
	.dot {
		fill: var(--kilau);
		transform-box: fill-box;
		transform-origin: 50% 100%;
		animation: drop 900ms 300ms both;
	}

	/* fatal: the dot lands, then the light goes out */
	.fatal {
		.dot {
			animation:
				drop 900ms 300ms both,
				go-out 500ms 1150ms ease-out both;
		}

		.ink {
			animation: dim 500ms 1150ms ease-out both;
		}
	}

	@keyframes icon-in {
		from {
			scale: 0.6;
			opacity: 0;
		}
	}

	/* the studio intro bounce, shorter: fall, squash, one hop, settle */
	@keyframes drop {
		0% {
			opacity: 0;
			transform: translateY(-80px) scale(0.92, 1.08);
			animation-timing-function: cubic-bezier(0.55, 0, 1, 0.45);
		}
		12% {
			opacity: 1;
		}
		45% {
			transform: translateY(0) scale(1.25, 0.75);
			animation-timing-function: cubic-bezier(0, 0.55, 0.45, 1);
		}
		68% {
			transform: translateY(-18px) scale(0.96, 1.04);
			animation-timing-function: cubic-bezier(0.55, 0, 1, 0.45);
		}
		86% {
			transform: translateY(0) scale(1.1, 0.9);
			animation-timing-function: ease-out;
		}
		100% {
			opacity: 1;
			transform: none;
		}
	}

	@keyframes go-out {
		to {
			fill: var(--ui-text-muted);
		}
	}

	/* the drawing stays readable, a step down from Kertas */
	@keyframes dim {
		to {
			fill: #c4c9d1;
		}
	}

	.title {
		margin: 0 0 10px;
		font-size: 26px;
		font-weight: 800;
		line-height: 1.1;
		letter-spacing: 0.03em;
		text-transform: uppercase;
		text-wrap: balance;
		text-shadow: 0 2px 0 rgba(14, 16, 20, 0.6);
	}

	.body {
		max-width: 280px;
		margin: 0 0 24px;
		color: var(--ui-text-muted);
		line-height: 1.5;
		text-wrap: pretty;
	}

	/*
		The one action: a big flat Kertas bar, no lip or shadow. Like the HUD buttons, the press
		shows in the content: the label dips while the face darkens a step.
	*/
	.action {
		width: 100%;
		height: 56px;
		padding: 0;
		border: none;
		background-color: var(--ui-text);
		color: #0e1014;
		font-family: inherit;
		font-size: 18px;
		font-weight: 800;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		cursor: pointer;
		touch-action: manipulation;
		transition: background-color 0.15s;

		span {
			display: block;
			transition: transform 0.08s ease-out;
		}

		@media (hover: hover) {
			&:hover {
				background-color: #ffffff;
			}
		}

		&:active {
			background-color: #d9dbe0;

			span {
				transform: translateY(2px);
			}
		}

		&:focus-visible {
			outline: 2px solid var(--ui-text);
			outline-offset: 4px;
		}
	}

	.code {
		margin: 14px 0 0;
		color: var(--ui-text-muted);
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.1em;
		opacity: 0.7;
		user-select: text;
	}

	@media (prefers-reduced-motion: reduce) {
		.emblem,
		.dot,
		.fatal .dot,
		.fatal .ink {
			animation: none;
		}

		.fatal {
			--kilau: var(--ui-text-muted);
		}
	}
</style>
