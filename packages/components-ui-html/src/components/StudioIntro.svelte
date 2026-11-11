<!--
	Kilara Studio intro: the studio splash every Kilara game opens with, ahead of the game's own
	loading screen. kilara rises out of its baseline letter by letter, the Kilau dot drops onto the
	i and bounces twice before it settles, and STUDIO follows. No shine or glow: the motion ends with the dot. It
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

	// the motion settles at about 1.7 s; the rest of the minimum is time to read the logo
	const MIN_DURATION = 2300;
	const LETTER_START = 180;
	const LETTER_STAGGER = 50;

	const [, , WIDTH] = LOCKUP_VIEWBOX.split(' ').map(Number);

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
		<svg viewBox={LOCKUP_VIEWBOX} aria-hidden="true" style:--rise="{WORDMARK_BASELINE + 8}px">
			<defs>
				<!-- the letters rise from below their baseline, so nothing shows under it -->
				<clipPath id="{id}-base">
					<rect x="-60" y="-400" width={WIDTH + 120} height={WORDMARK_BASELINE + 400} />
				</clipPath>
			</defs>

			<g class="lockup">
				<g clip-path="url(#{id}-base)">
					{#each KILARA_LETTERS as d, index}
						<path class="letter" {d} style:--delay="{LETTER_START + index * LETTER_STAGGER}ms" />
					{/each}
				</g>
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
	.studio {
		transform-box: fill-box;
		transform-origin: center;
	}

	.lockup {
		animation: push 2200ms var(--intro-ease) both;
	}

	.letter {
		fill: var(--intro-ink);
		animation: rise 620ms var(--intro-ease) var(--delay) both;
	}

	/* the dot falls in from above and bounces; it squashes from its bottom edge, so each impact
	   stays on its resting spot */
	.dot {
		fill: var(--intro-light);
		transform-origin: 50% 100%;
		animation: bounce 1000ms 620ms both;
	}

	.studio {
		fill: var(--intro-sub);
		animation: follow 600ms var(--intro-ease) 1300ms both;
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

	/*
		Falls (ease-in), squashes on the hit, rises a third of the way back (ease-out), falls again,
		then a small hop and a last light squash. Each segment's easing sits on its start keyframe.
	*/
	@keyframes bounce {
		0% {
			opacity: 0;
			transform: translateY(-140px) scale(0.92, 1.08);
			animation-timing-function: cubic-bezier(0.55, 0, 1, 0.45);
		}
		10% {
			opacity: 1;
		}
		40% {
			transform: translateY(0) scale(1.22, 0.78);
			animation-timing-function: cubic-bezier(0, 0.55, 0.45, 1);
		}
		60% {
			transform: translateY(-34px) scale(0.96, 1.04);
			animation-timing-function: cubic-bezier(0.55, 0, 1, 0.45);
		}
		76% {
			transform: translateY(0) scale(1.12, 0.88);
			animation-timing-function: cubic-bezier(0, 0.55, 0.45, 1);
		}
		86% {
			transform: translateY(-9px) scale(1);
			animation-timing-function: cubic-bezier(0.55, 0, 1, 0.45);
		}
		94% {
			transform: translateY(0) scale(1.05, 0.95);
			animation-timing-function: ease-out;
		}
		100% {
			opacity: 1;
			transform: translateY(0) scale(1);
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

	/* same timing, no movement: the lockup fades in whole and the dot does not drop */
	@media (prefers-reduced-motion: reduce) {
		.lockup {
			animation: none;
		}

		.letter,
		.dot,
		.studio {
			animation: appear 300ms ease-out 200ms both;
		}
	}
</style>
