<script lang="ts">
	import { stateI18nDerived } from 'state-shared';
	import { fitText } from 'components-ui-html/src/components/fitText';

	import { getContext } from '../game/context';

	// The picking tools: a fresh random set of numbers, and clear. A word too long for its button
	// (Russian "Случайный выбор") shrinks to it (fitText).
	type Props = { disabled: boolean };

	const props: Props = $props();
	const context = getContext();
	const t = stateI18nDerived.translate;
</script>

<button
	type="button"
	class="btn"
	data-test="quick-pick"
	disabled={props.disabled}
	onclick={() => context.stateGameDerived.random()}
>
	<svg
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2.2"
		stroke-linecap="round"
		stroke-linejoin="round"
		aria-hidden="true"
	>
		<path d="M3 7h3.5c2 0 3.2 1 4.3 2.6l2.4 4.8C14.3 16 15.5 17 17.5 17H21" />
		<path d="M3 17h3.5c1.3 0 2.3-.5 3.1-1.300M14 8.300c.9-.8 2-1.300 3.500-1.300H21" />
		<path d="M18.500 4.500 21 7l-2.500 2.500M18.500 14.500 21 17l-2.500 2.500" />
	</svg>
	<span use:fitText>{t('Random Pick')}</span>
</button>
<button
	type="button"
	class="btn"
	data-test="clear"
	disabled={props.disabled}
	onclick={() => {
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		context.stateGameDerived.clear();
	}}
>
	<svg
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2.2"
		stroke-linecap="round"
		aria-hidden="true"
	>
		<path d="M6 6l12 12M18 6 6 18" />
	</svg>
	<span use:fitText>{t('Clear')}</span>
</button>

<style lang="scss">
	/* lengths in the HUD's unit: the button's own text is 1.4 of it */
	.btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.57em;
		min-width: 0;
		height: calc(4.6em / 1.4 / var(--ctl, 1));
		padding: 0 0.4em;
		border: none;
		background-color: var(--field);
		color: var(--text);
		font-family: inherit;
		font-size: calc(1.4em * var(--ctl, 1));
		font-weight: 500;
		white-space: nowrap;
		cursor: pointer;
		transition:
			background-color 0.12s,
			opacity 0.15s;

		svg {
			flex: none;
			width: 1.29em;
			height: 1.29em;
		}

		/* takes the room the icon leaves, and no more: a longer word shrinks (fitText) */
		span {
			min-width: 0;
			font-size: calc(1em * var(--ui-fit, 1));
		}

		@media (hover: hover) {
			&:hover:not(:disabled) {
				background-color: var(--field-hover);
			}
		}

		&:active:not(:disabled) > * {
			transform: translateY(1px);
		}

		&:focus-visible {
			outline: 2px solid var(--text);
			outline-offset: 2px;
		}

		&:disabled {
			opacity: 0.45;
			cursor: default;
		}
	}
</style>
