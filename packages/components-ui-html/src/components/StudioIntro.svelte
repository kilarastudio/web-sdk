<!--
	Kilara Studio intro: the studio splash every Kilara game opens with, ahead of the game's own
	loading screen. kilara rises out of its baseline letter by letter, the Kilau dot lights once
	over the i, and "studio" follows. It runs while the first assets load, then holds until the
	game is ready, so it never adds waiting time of its own. An error modal ends it early.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	import { stateModal } from 'state-shared';
	import { zIndex } from 'constants-shared/zIndex';

	import { LOCKUP_VIEWBOX, KILARA_LETTERS, KILAU_DOT, STUDIO } from './kilaraLogo';

	type Props = {
		/** true once the game can show its own loading screen; the intro holds until then */
		ready?: boolean;
		onend?: () => void;
	};

	const props: Props = $props();
	const clipId = $props.id();

	// the motion settles at about 1.5 s; the rest of the minimum is time to read the logo
	const MIN_DURATION = 2300;
	const LETTER_START = 200;
	const LETTER_STAGGER = 55;

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
		<svg viewBox={LOCKUP_VIEWBOX} aria-hidden="true">
			<defs>
				<!-- the letters rise from below their baseline, so nothing shows under it -->
				<clipPath id={clipId}>
					<rect x="-20" y="-80" width="300" height="157" />
				</clipPath>
			</defs>

			<g class="lockup">
				<g clip-path="url(#{clipId})">
					{#each KILARA_LETTERS as d, index}
						<path class="letter" {d} style:--delay="{LETTER_START + index * LETTER_STAGGER}ms" />
					{/each}
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
		/* the lockup is 7.4 : 1, so this keeps it between about 30 and 57 px tall */
		width: min(64vw, 420px);
		overflow: visible;
	}

	.lockup,
	.dot,
	.halo,
	.studio {
		transform-box: fill-box;
		transform-origin: center;
	}

	.lockup {
		animation: push 2400ms var(--intro-ease) both;
	}

	.letter {
		fill: var(--intro-ink);
		animation: rise 560ms var(--intro-ease) var(--delay) both;
	}

	.dot {
		fill: var(--intro-light);
		animation: ignite 380ms ease-out 600ms both;
	}

	/* no fill mode: it stays hidden while it waits for the dot, and after it has spread */
	.halo {
		fill: var(--intro-light);
		opacity: 0;
		animation: halo 800ms ease-out 640ms;
	}

	.studio {
		fill: var(--intro-sub);
		animation: follow 520ms var(--intro-ease) 900ms both;
	}

	@keyframes push {
		from {
			transform: scale(0.96);
		}
	}

	@keyframes rise {
		from {
			transform: translateY(84px);
		}
	}

	/* the dot lights once: a small overshoot, then a single halo that spreads and fades */
	@keyframes ignite {
		0% {
			transform: scale(0);
		}
		60% {
			transform: scale(1.12);
		}
		100% {
			transform: scale(1);
		}
	}

	@keyframes halo {
		from {
			opacity: 0.45;
			transform: scale(1);
		}
		to {
			opacity: 0;
			transform: scale(3.6);
		}
	}

	@keyframes follow {
		from {
			opacity: 0;
			transform: translateX(-14px);
		}
	}

	@keyframes appear {
		from {
			opacity: 0;
		}
	}

	/* same timing, no movement: the lockup fades in whole and the dot does not flash */
	@media (prefers-reduced-motion: reduce) {
		.lockup {
			animation: none;
		}

		.letter,
		.dot,
		.studio {
			animation: appear 300ms ease-out 200ms both;
		}

		.halo {
			display: none;
		}
	}
</style>
