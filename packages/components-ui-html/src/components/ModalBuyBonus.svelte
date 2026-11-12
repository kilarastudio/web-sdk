<script lang="ts">
	import { fade } from 'svelte/transition';

	import { zIndex } from 'constants-shared/zIndex';
	import { stateBet, stateConfig, stateModal, stateMetaDerived } from 'state-shared';
	import type { BetModeData } from 'state-shared';
	import { getContextEventEmitter } from 'utils-event-emitter';
	import { numberToCurrencyString } from 'utils-shared/amount';

	import './font.css';
	import './tokens.css';
	import UiStepper from './UiStepper.svelte';
	import { KILARA_ICONS } from './kilaraIcons';
	import { stateBonus } from '../stateBonus.svelte';
	import { i18nDerived } from '../i18n/i18nDerived';
	import type { EmitterEventModal } from '../types';

	const { eventEmitter } = getContextEventEmitter<EmitterEventModal>();
	const id = $props.id();

	// the modes that are armed for the next rounds first, then the ones that are bought outright
	const modes = $derived(
		(['activate', 'buy'] as const).flatMap((type) =>
			stateMetaDerived.betModeMetaList().filter((mode) => mode.type === type),
		),
	);

	const cost = (multiplier: number) => stateBet.betAmount * multiplier;
	const affordable = (multiplier: number) =>
		stateBet.betAmount > 0 && cost(multiplier) <= stateBet.balanceAmount;

	// what Stake requires next to every mode: its return and its top prize
	const modeFacts = (mode: BetModeData) =>
		[
			mode.rtp !== undefined && `RTP ${(mode.rtp * 100).toFixed(2)}%`,
			mode.maxWin !== undefined && `MAX WIN ${mode.maxWin.toLocaleString('en-US')}×`,
		]
			.filter(Boolean)
			.join(' · ');

	const close = () => (stateModal.modal = null);
	const choose = (mode: string, multiplier: number) => {
		// a mode the balance cannot cover says why instead of opening its confirmation ([222])
		if (!affordable(multiplier)) {
			stateModal.modal = { name: 'error', error: { error: 'ERR_IPB' } };
			return;
		}
		stateBonus.selectedBetModeKey = mode;
		eventEmitter.broadcast({ type: 'buyBonusConfirm' });
		eventEmitter.broadcast({ type: 'soundPressGeneral' });
	};
	const onkeydown = (event: KeyboardEvent) => {
		if (event.key === 'Escape') close();
	};
</script>

<svelte:window onkeydown={stateModal.modal?.name === 'buyBonus' ? onkeydown : undefined} />

<!--
	The game's modes, as a scene of the game rather than a menu: no panel, the game darkened behind
	a row of big cards that drop in one after another, each a mode with its picture, what it does,
	what it costs at the current bet, and its call to action. The bet they are priced from sits
	under them. A card never plays by itself: it opens the confirmation (ModalBuyBonusConfirm).
	Wide screens show the cards in one row, tall ones two by two; everything is sized from the
	screen, so the scene fits without scrolling down to the mini player.
-->
{#if stateModal.modal?.name === 'buyBonus'}
	<div
		class="bonus-scene"
		style:z-index={zIndex.modal}
		style:--count={modes.length}
		role="dialog"
		aria-modal="true"
		aria-labelledby="{id}-title"
		transition:fade={{ duration: 180 }}
	>
		<div class="scrim" role="presentation" onclick={close}></div>

		<header>
			<h2 id="{id}-title">{i18nDerived.buyBonus()}</h2>
			<button
				type="button"
				class="close"
				data-test="close-button"
				aria-label="Close"
				onclick={close}
			>
				<svg viewBox="0 0 96 96" focusable="false" aria-hidden="true">
					<path d={KILARA_ICONS.close.d} />
				</svg>
			</button>
		</header>

		<div class="cards">
			{#each modes as mode, index (mode.mode)}
				<button
					type="button"
					class="card {mode.type}"
					style:--order={index}
					class:unaffordable={!affordable(mode.costMultiplier)}
					onclick={() => choose(mode.mode, mode.costMultiplier)}
				>
					{#if mode.image}
						<img src={mode.image} alt="" draggable="false" />
					{/if}
					<span class="title">{mode.text.title}</span>
					{#if mode.text.description}
						<span class="description">{mode.text.description}</span>
					{/if}
					{#if mode.rtp !== undefined || mode.maxWin !== undefined}
						<span class="facts">{modeFacts(mode)}</span>
					{/if}
					<span class="cost">
						<span class="amount">{numberToCurrencyString(cost(mode.costMultiplier))}</span>
						<span class="times">{mode.costMultiplier}×</span>
					</span>
					<span class="action"><span>{mode.text.button}</span></span>
				</button>
			{/each}
		</div>

		<div class="bet">
			<UiStepper
				value={stateBet.betAmount}
				options={stateConfig.betAmountOptions}
				format={numberToCurrencyString}
				onchange={(value) => {
					stateBet.betAmount = value;
					eventEmitter.broadcast({ type: 'soundPressGeneral' });
				}}
			/>
		</div>
	</div>
{/if}

<style lang="scss">
	.bonus-scene {
		/* one unit for the whole scene, taken from the screen: text and gaps are multiples of it */
		--u: clamp(9px, 1.55vmin + 4px, 17px);
		--columns: var(--count);
		--sheet-control: calc(var(--u) * 3);

		position: fixed;
		inset: 0;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		align-items: center;
		/* centred, and from the top where the scene is taller than the screen */
		justify-content: safe center;
		gap: calc(var(--u) * 1.4);
		padding: calc(var(--u) * 1.2) calc(var(--u) * 1.4)
			calc(var(--u) * 1.4 + env(safe-area-inset-bottom, 0px));
		overflow-y: auto;
		color: var(--ui-text);
		font-family: var(--font-family);
		font-size: var(--u);
		-webkit-tap-highlight-color: transparent;
		touch-action: manipulation;
	}

	/* the game stays in view, darkened: the scene belongs to it */
	.scrim {
		position: fixed;
		inset: 0;
		background: radial-gradient(
			ellipse at 50% 45%,
			rgba(14, 16, 20, 0.62),
			rgba(14, 16, 20, 0.86) 75%
		);
		cursor: pointer;
	}

	header {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		pointer-events: none;
	}

	h2 {
		margin: 0;
		font-size: 2em;
		font-weight: 800;
		letter-spacing: 0.14em;
		line-height: 1;
		text-shadow: 0 2px 0 rgba(14, 16, 20, 0.7);
		text-transform: uppercase;
	}

	.close {
		position: absolute;
		right: 0;
		top: 50%;
		display: grid;
		place-items: center;
		width: 3em;
		height: 3em;
		padding: 0;
		border: none;
		background-color: rgba(14, 16, 20, 0.62);
		color: var(--ui-text);
		cursor: pointer;
		pointer-events: auto;
		transform: translateY(-50%);

		svg {
			width: 40%;
			height: 40%;
			fill: currentColor;
			transition: transform 0.08s ease-out;
		}

		&:active svg {
			transform: translateY(2px);
		}

		&:focus-visible {
			outline: 2px solid var(--ui-text);
			outline-offset: 2px;
		}
	}

	.cards {
		position: relative;
		display: grid;
		grid-template-columns: repeat(var(--columns), minmax(0, 1fr));
		gap: calc(var(--u) * 0.9);
		width: min(100%, calc(var(--u) * 17 * var(--columns)));
	}

	/* a mode: its picture large on top, then name, what it does, its cost and its call to action */
	.card {
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5em;
		min-width: 0;
		padding: 1.1em 0.9em 0.9em;
		border: none;
		background-color: var(--ui-surface);
		color: inherit;
		font-family: inherit;
		font-size: 1em;
		text-align: center;
		cursor: pointer;
		animation: drop-in 380ms cubic-bezier(0.2, 0.9, 0.3, 1.15) both;
		animation-delay: calc(var(--order) * 70ms);
		transition: background-color 0.15s;

		@media (hover: hover) {
			&:hover:not(.unaffordable) {
				background-color: rgba(30, 32, 37, 0.92);

				.action {
					background-color: #ffffff;
				}
			}
		}

		&:active:not(.unaffordable) .action span {
			transform: translateY(2px);
		}

		&:focus-visible {
			outline: 2px solid var(--ui-text);
			outline-offset: 3px;
		}

		&.unaffordable {
			cursor: not-allowed;

			img {
				filter: grayscale(1);
				opacity: 0.45;
			}

			.cost,
			.title {
				color: var(--ui-text-muted);
			}

			.action {
				background-color: var(--ui-field);
				color: var(--ui-text-disabled);
			}
		}
	}

	img {
		width: min(62%, 8.5em);
		aspect-ratio: 1;
		object-fit: contain;
		/* the games' mode pictures are pixel art: scaled without smoothing */
		image-rendering: pixelated;
	}

	.title {
		font-size: 1.5em;
		font-weight: 800;
		letter-spacing: 0.1em;
		line-height: 1.1;
		text-transform: uppercase;
	}

	.description {
		flex: 1 1 auto;
		color: #c4c9d1;
		font-size: 0.92em;
		line-height: 1.35;
		text-wrap: balance;
		white-space: pre-line;
	}

	.facts {
		color: var(--ui-text-muted);
		font-size: 0.72em;
		font-weight: 600;
		letter-spacing: 0.06em;
		white-space: nowrap;
	}

	.cost {
		display: flex;
		align-items: baseline;
		gap: 0.4em;
		margin-top: 0.2em;
		color: var(--ui-accent);
		white-space: nowrap;
	}

	.amount {
		font-size: 1.45em;
		font-weight: 800;
		font-variant-numeric: tabular-nums;
	}

	.times {
		color: var(--ui-text-muted);
		font-size: 0.85em;
		font-weight: 600;
	}

	.action {
		display: grid;
		place-items: center;
		align-self: stretch;
		height: 2.8em;
		background-color: var(--ui-text);
		color: #0e1014;
		font-weight: 800;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		transition: background-color 0.15s;

		span {
			transition: transform 0.08s ease-out;
		}
	}

	/*
		The two kinds of mode read apart at a glance. Buying pays now and plays the feature: Kilau,
		the colour of a win. Activating arms the mode for the rounds that follow: Langit, the HUD's
		colour for something switched on. Each kind's cost wears its colour too.
	*/
	.card.buy {
		--kind: var(--ui-accent);
		--kind-hover: #ffd466;
	}

	.card.activate {
		--kind: var(--ui-activate);
		--kind-hover: #9ccbff;
	}

	.card:not(.unaffordable) {
		.cost {
			color: var(--kind);
		}

		.action {
			background-color: var(--kind);
		}

		@media (hover: hover) {
			&:hover .action {
				background-color: var(--kind-hover);
			}
		}
	}

	.bet {
		position: relative;
		width: min(100%, calc(var(--u) * 20));
		background-color: var(--ui-surface);
	}

	@keyframes drop-in {
		from {
			opacity: 0;
			transform: translateY(-1.6em) scale(0.94);
		}
	}

	/*
		Taller than wide: one card per row, the picture on the left, what the mode does in the middle
		and its price and call to action on the right, so every mode fits on a phone without scrolling.
	*/
	@media (max-aspect-ratio: 1/1) {
		.bonus-scene {
			--u: clamp(9px, min(3.1vw, 1.45vh) + 2px, 18px);
			--columns: 1;
		}

		.cards {
			width: min(100%, calc(var(--u) * 34));
		}

		.card {
			display: grid;
			grid-template-columns: auto minmax(0, 1fr) 8em;
			grid-template-areas:
				'img title cost'
				'img description action'
				'img facts action';
			align-items: center;
			column-gap: 0.9em;
			row-gap: 0.25em;
			padding: 0.7em 0.8em;
			text-align: left;
		}

		img {
			grid-area: img;
			width: 5.2em;
		}

		.title {
			grid-area: title;
			font-size: 1.3em;
		}

		.description {
			grid-area: description;
			align-self: start;
			text-wrap: pretty;
		}

		.facts {
			grid-area: facts;
			align-self: start;
			white-space: normal;
		}

		.cost {
			grid-area: cost;
			justify-content: flex-end;
			margin: 0;
		}

		.action {
			grid-area: action;
			align-self: stretch;
			height: auto;
			min-height: 2.6em;
		}
	}

	/* short and wide (a phone on its side, the mini player): flatter cards, the text kept brief */
	@media (max-height: 499px) and (min-aspect-ratio: 1/1) {
		.bonus-scene {
			--u: clamp(7px, 2.7vh + 1px, 13px);

			gap: calc(var(--u) * 0.9);
		}

		h2 {
			font-size: 1.6em;
		}

		.card {
			gap: 0.3em;
			padding: 0.7em 0.7em 0.7em;
		}

		img {
			width: min(40%, 6em);
		}

		.facts {
			font-size: 0.66em;
			white-space: normal;
		}

		.description {
			display: -webkit-box;
			overflow: hidden;
			-webkit-box-orient: vertical;
			-webkit-line-clamp: 2;
			line-clamp: 2;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.card {
			animation: none;
		}
	}
</style>
