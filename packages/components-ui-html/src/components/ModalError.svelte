<!--
	Error message in the Kilara HUD style: a flat, square card on a Malam scrim, no borders or glow.
	The Kilau dot beside the title goes out (gold to grey) as the card lands, the one bit of motion.
	It says what happened in plain words and offers one action: OK when the game can carry on
	(balance, limits, a busy server), RELOAD when it cannot (session, connection, anything unknown).
	The code and raw message sit folded under DETAILS for support.

	It can show before the HUD exists (during the studio intro or loading screen), so it carries its
	own copy of the HUD tokens and font instead of relying on UI.svelte.
-->
<script lang="ts">
	import { fly, fade } from 'svelte/transition';

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
			class="card"
			role="alertdialog"
			aria-modal="true"
			aria-labelledby="{id}-title"
			aria-describedby="{id}-body"
			in:fly={{ y: 12, duration: 320, opacity: 0 }}
		>
			<h2 class="title" id="{id}-title">
				<span class="dot" aria-hidden="true"></span>
				{message.title}
			</h2>
			<p class="body" id="{id}-body">{message.body}</p>

			{#if message.code || message.detail}
				<details class="details">
					<summary>{i18nDerived.errorDetails()}</summary>
					<p class="code">
						{#if message.code}<b>{message.code}</b>{/if}
						{#if message.detail}<span>{message.detail}</span>{/if}
					</p>
				</details>
			{/if}

			<button type="button" class="action" use:focus onclick={act}>
				{message.recoverable ? i18nDerived.ok() : i18nDerived.reload()}
			</button>
		</div>
	</div>
{/if}

<style lang="scss">
	.error-modal {
		/* the HUD tokens from UI.svelte, so the card matches it before the HUD mounts */
		--ui-accent: #ffc53d;
		--ui-text: #f3f4f6;
		--ui-text-muted: #8a92a0;
		--ui-surface-raised: rgba(30, 32, 37, 0.97);
		--ui-field: rgba(243, 244, 246, 0.07);
		--ui-shadow: 0 12px 32px rgba(14, 16, 20, 0.4);
		--ease: cubic-bezier(0.16, 1, 0.3, 1);

		position: fixed;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 16px;
		background-color: rgba(14, 16, 20, 0.72);
		color: var(--ui-text);
		font-family: var(--font-family);
		/* px, not rem: Modals shrinks the root font to 50% on narrow screens */
		font-size: 15px;
		-webkit-tap-highlight-color: transparent;
		user-select: text;
	}

	.card {
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		gap: 12px;
		width: min(100%, 400px);
		max-height: 100%;
		padding: 24px;
		overflow-y: auto;
		background-color: var(--ui-surface-raised);
		box-shadow: var(--ui-shadow);
	}

	.title {
		display: flex;
		align-items: center;
		gap: 10px;
		margin: 0;
		font-size: 17px;
		font-weight: 700;
		line-height: 1.2;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	/* the Kilau dot, a true circle: it lights up once, then goes out */
	.dot {
		flex-shrink: 0;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background-color: var(--ui-text-muted);
		animation: go-out 900ms 160ms both;
	}

	@keyframes go-out {
		0% {
			background-color: var(--ui-accent);
			scale: 1.3;
		}
		35% {
			background-color: var(--ui-accent);
			scale: 1;
		}
		100% {
			background-color: var(--ui-text-muted);
			scale: 1;
		}
	}

	.body {
		margin: 0;
		color: var(--ui-text-muted);
		line-height: 1.5;
	}

	.details {
		summary {
			display: inline-block;
			padding: 2px 0;
			color: var(--ui-text-muted);
			font-size: 11px;
			font-weight: 600;
			letter-spacing: 0.08em;
			cursor: pointer;
			list-style: none;

			&::-webkit-details-marker {
				display: none;
			}

			&::after {
				content: ' +';
			}
		}

		&[open] summary::after {
			content: ' −';
		}
	}

	.code {
		display: flex;
		flex-direction: column;
		gap: 4px;
		max-height: 96px;
		margin: 8px 0 0;
		padding: 10px 12px;
		overflow-y: auto;
		background-color: var(--ui-field);
		color: var(--ui-text-muted);
		font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
		font-size: 12px;
		line-height: 1.45;
		overflow-wrap: anywhere;

		b {
			color: var(--ui-text);
			font-weight: 600;
		}
	}

	/* the one action: a solid Kertas bar, square like every HUD control */
	.action {
		height: 48px;
		margin-top: 8px;
		padding: 0 16px;
		border: none;
		background-color: var(--ui-text);
		color: #0e1014;
		font-family: inherit;
		font-size: 14px;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		cursor: pointer;
		touch-action: manipulation;
		transition: background-color 0.15s;

		@media (hover: hover) {
			&:hover {
				background-color: #ffffff;
			}
		}

		&:active {
			background-color: #d9dbe0;
		}

		&:focus-visible {
			outline: 2px solid var(--ui-text);
			outline-offset: 3px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.dot {
			animation: none;
		}
	}
</style>
