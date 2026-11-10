<!--
	Error message, game style rather than web style: a centred panel that pops in, a Kilau emblem
	(the square buy bonus frame) whose dot drops in and bounces like the studio intro, a big title,
	and one chunky button that presses down on its lip. The dot stays gold when the game can carry
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
	import { i18nDerived } from '../i18n/i18nDerived';

	const id = $props.id();

	const message = $derived(
		stateModal.modal?.name === 'error' ? errorMessage(stateModal.modal.error) : undefined,
	);

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
				<span class="dot"></span>
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

	/* the buy bonus frame: square, with a Kilau edge, and the Kilau dot in the middle */
	.emblem {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 76px;
		height: 76px;
		margin-bottom: 20px;
		background-color: rgba(14, 16, 20, 0.6);
		box-shadow: inset 0 0 0 4px var(--kilau);
		animation: frame-in 360ms 120ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
	}

	/* a true circle */
	.dot {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background-color: var(--kilau);
		transform-origin: 50% 100%;
		animation: drop 900ms 300ms both;
	}

	/* fatal: the dot lands, then the light goes out, frame and all */
	.fatal {
		.emblem {
			animation:
				frame-in 360ms 120ms cubic-bezier(0.34, 1.56, 0.64, 1) both,
				frame-out 500ms 1150ms ease-out both;
		}

		.dot {
			animation:
				drop 900ms 300ms both,
				go-out 500ms 1150ms ease-out both;
		}
	}

	@keyframes frame-in {
		from {
			scale: 0.6;
			opacity: 0;
		}
	}

	/* the studio intro bounce, shorter: fall, squash, one hop, settle */
	@keyframes drop {
		0% {
			opacity: 0;
			transform: translateY(-64px) scale(0.92, 1.08);
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
			transform: translateY(-14px) scale(0.96, 1.04);
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
			background-color: var(--ui-text-muted);
		}
	}

	@keyframes frame-out {
		to {
			box-shadow: inset 0 0 0 4px var(--ui-text-muted);
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
		The chunky game button: a Kertas face on a darker lip. Pressing pushes the face down onto
		the lip instead of shrinking the button.
	*/
	.action {
		--lip: 5px;

		width: 100%;
		height: calc(56px + var(--lip));
		padding: 0 0 var(--lip);
		border: none;
		background: none;
		cursor: pointer;
		touch-action: manipulation;

		span {
			display: flex;
			align-items: center;
			justify-content: center;
			height: 56px;
			background-color: var(--ui-text);
			box-shadow: 0 var(--lip) 0 #9aa1ad;
			color: #0e1014;
			font-family: inherit;
			font-size: 18px;
			font-weight: 800;
			letter-spacing: 0.1em;
			text-transform: uppercase;
			transition:
				transform 0.08s ease-out,
				box-shadow 0.08s ease-out,
				background-color 0.15s;
		}

		@media (hover: hover) {
			&:hover span {
				background-color: #ffffff;
			}
		}

		&:active span {
			transform: translateY(calc(var(--lip) - 1px));
			box-shadow: 0 1px 0 #9aa1ad;
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
		.fatal .emblem,
		.fatal .dot {
			animation: none;
		}

		.fatal {
			--kilau: var(--ui-text-muted);
		}
	}
</style>
