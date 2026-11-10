<!--
	Kilara Studio intro: the studio splash every Kilara game opens with, ahead of the game's own
	loading screen. kilara rises out of its baseline letter by letter, the Kilau dot drops onto the
	i and lands, a slanted streak of Kilau light runs through the letters, and STUDIO follows. It
	runs while the first assets load, then holds until the game is ready, so it never adds waiting
	time of its own. An error modal ends it early.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	import { stateModal } from 'state-shared';
	import { zIndex } from 'constants-shared/zIndex';

	import {
		LOCKUP_VIEWBOX,
		WORDMARK_BASELINE,
		KILARA_LETTERS,
		KILARA_PATH,
		KILAU_DOT,
		STUDIO,
	} from './kilaraLogo';

	type Props = {
		/** true once the game can show its own loading screen; the intro holds until then */
		ready?: boolean;
		onend?: () => void;
	};

	const props: Props = $props();
	const id = $props.id();

	// the motion settles at about 2.1 s; the rest of the minimum is time to read the logo
	const MIN_DURATION = 2600;
	const LETTER_START = 180;
	const LETTER_STAGGER = 50;

	const [, , WIDTH] = LOCKUP_VIEWBOX.split(' ').map(Number);
	// a band of light as steep as the slanted terminals, starting left of the word
	const STREAK_WIDTH = 46;
	const STREAK = `M${-STREAK_WIDTH - 60} ${WORDMARK_BASELINE + 20}L-60 ${WORDMARK_BASELINE + 20}L10 -20L${-STREAK_WIDTH + 10} -20Z`;

	let minElapsed = $state(false);
	let ended = $state(false);

	onMount(() => {
		const timeout = setTimeout(() => (minElapsed = true), MIN_DURATION);
		return () => clearTimeout(timeout);
	});

	$effect(() => {
		if (!ended && minElapsed && ((props.ready ?? true) || stateModal.modal)) {
			ended = true;
			props.onend?.();
		}
	});
</script>

{#if !ended}
	<div
		class="intro"
		style:z-index={zIndex.intro}
		role="img"
		aria-label="Kilara Studio"
		out:fade={{ duration: 400 }}
	>
		<svg
			viewBox={LOCKUP_VIEWBOX}
			aria-hidden="true"
			style:--rise="{WORDMARK_BASELINE + 8}px"
			style:--travel="{WIDTH + 160}px"
		>
			<defs>
				<!-- the letters rise from below their baseline, so nothing shows under it -->
				<clipPath id="{id}-base">
					<rect x="-60" y="-400" width={WIDTH + 120} height={WORDMARK_BASELINE + 400} />
				</clipPath>
				<!-- the streak only lights the letters -->
				<mask id="{id}-ink">
					<path d={KILARA_PATH} fill="#fff" />
				</mask>
				<linearGradient id="{id}-glint" x1="0" x2="1">
					<stop offset="0" style="stop-color: var(--intro-light); stop-opacity: 0" />
					<stop offset="0.5" style="stop-color: var(--intro-light)" />
					<stop offset="1" style="stop-color: var(--intro-light); stop-opacity: 0" />
				</linearGradient>
			</defs>

			<g class="lockup">
				<g clip-path="url(#{id}-base)">
					{#each KILARA_LETTERS as d, index}
						<path class="letter" {d} style:--delay="{LETTER_START + index * LETTER_STAGGER}ms" />
					{/each}
				</g>
				<g mask="url(#{id}-ink)">
					<path class="streak" d={STREAK} fill="url(#{id}-glint)" />
				</g>
				<circle class="halo" cx={KILAU_DOT.cx} cy={KILAU_DOT.cy} r={KILAU_DOT.r} />
				<circle class="dot" cx={KILAU_DOT.cx} cy={KILAU_DOT.cy} r={KILAU_DOT.r} />
				<path class="studio" d={STUDIO} />
			</g>
		</svg>
	</div>
{/if}

<style lang="scss">
	.intro {
		/* palette A: Malam, Kertas, Kabut, Kilau */
		--intro-background: #0e1014;
		--intro-ink: #f3f4f6;
		--intro-sub: #8a92a0;
		--intro-light: #ffc53d;
		/* firm ease-out, the same feel as the reel settle: fast in, no bounce */
		--intro-ease: cubic-bezier(0.16, 1, 0.3, 1);

		position: fixed;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--intro-background);
		-webkit-tap-highlight-color: transparent;
	}

	svg {
		/* the lockup is about 1.8 : 1, so this keeps it between about 90 and 160 px tall */
		width: min(46vw, 290px);
		min-width: 160px;
		overflow: visible;
	}

	.lockup,
	.letter,
	.dot,
	.halo,
	.streak,
	.studio {
		transform-box: fill-box;
		transform-origin: center;
	}

	.lockup {
		animation: push 2600ms var(--intro-ease) both;
	}

	.letter {
		fill: var(--intro-ink);
		animation: rise 620ms var(--intro-ease) var(--delay) both;
	}

	/* the dot falls in from above, then lands with a short squash; the squash has no backwards
	   fill, so it does not show while the dot is still falling */
	.dot {
		fill: var(--intro-light);
		animation:
			drop 420ms cubic-bezier(0.5, 0, 0.75, 0) 620ms both,
			land 260ms var(--intro-ease) 1040ms;
	}

	/* no fill mode: it stays hidden while it waits for the landing, and after it has spread */
	.halo {
		fill: var(--intro-light);
		opacity: 0;
		animation: halo 900ms ease-out 1040ms;
	}

	.streak {
		opacity: 0;
		animation: streak 760ms cubic-bezier(0.55, 0, 0.2, 1) 1060ms;
	}

	.studio {
		fill: var(--intro-sub);
		animation: follow 600ms var(--intro-ease) 1500ms both;
	}

	@keyframes push {
		from {
			transform: scale(0.95);
		}
	}

	@keyframes rise {
		from {
			transform: translateY(var(--rise));
		}
	}

	@keyframes drop {
		from {
			opacity: 0;
			transform: translateY(-140px);
		}
		30% {
			opacity: 1;
		}
		to {
			transform: translateY(0);
		}
	}

	@keyframes land {
		from {
			transform: scale(1.18, 0.82);
		}
	}

	@keyframes halo {
		from {
			opacity: 0.5;
			transform: scale(1);
		}
		to {
			opacity: 0;
			transform: scale(4);
		}
	}

	@keyframes streak {
		0% {
			opacity: 1;
			transform: translateX(0);
		}
		85% {
			opacity: 1;
		}
		100% {
			opacity: 0;
			transform: translateX(var(--travel));
		}
	}

	@keyframes follow {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
	}

	@keyframes appear {
		from {
			opacity: 0;
		}
	}

	/* same timing, no movement: the lockup fades in whole, no drop, streak or halo */
	@media (prefers-reduced-motion: reduce) {
		.lockup {
			animation: none;
		}

		.letter,
		.dot,
		.studio {
			animation: appear 300ms ease-out 200ms both;
		}

		.halo,
		.streak {
			display: none;
		}
	}
</style>
