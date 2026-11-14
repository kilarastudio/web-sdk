<!--
	Kilara Studio intro: the studio splash every Kilara game opens with, ahead of the game's own
	loading screen. kilara rises out of its baseline letter by letter, the Kilau dot drops onto the
	i and bounces twice before it settles, and STUDIO follows. No shine or glow: the motion ends with
	the dot.

	The markup lives in studioIntroShell.ts. A game's server hook writes it into the page, so it is
	on screen with the first HTML; this component takes it over, or adds it where the page has none.
	Its minimum time counts from when it first painted.
	- Written in with autoEnd (the game has an HTML loading screen under it): it fades out on time by
	  itself, script or not; this component only marks the end and clears it away.
	- Otherwise it holds until the game is ready, then this component fades it out.
	An error modal ends it early. stateUi.studioIntro tells the game when it has ended, so its own
	loading screen starts after it.
-->
<script lang="ts">
	import { onMount } from 'svelte';

	import { stateModal, stateUi } from 'state-shared';

	import {
		STUDIO_INTRO_DURATION,
		STUDIO_INTRO_FADE,
		STUDIO_INTRO_ID,
		studioIntroHtml,
	} from './studioIntroShell';

	type Props = {
		/** true once the game can show its own loading screen; the intro holds until then */
		ready?: boolean;
		onend?: () => void;
	};

	const props: Props = $props();

	// set before anything below this component renders, so a loading screen never starts under it
	stateUi.studioIntro = 'showing';

	let minElapsed = $state(false);
	let autoEnd = $state(false);
	let ended = $state(false);
	let element: HTMLElement | null = null;

	// how long the intro has been on screen: its animations started when it first painted
	const shownFor = (intro: HTMLElement) => {
		const times = (intro.getAnimations?.({ subtree: true }) ?? []).map((animation) =>
			Number(animation.currentTime ?? 0),
		);
		return times.length > 0 ? Math.max(...times) : 0;
	};

	const fadeOut = (intro: HTMLElement) => {
		intro.style.pointerEvents = 'none';
		intro
			.animate([{ opacity: getComputedStyle(intro).opacity }, { opacity: 0 }], {
				duration: STUDIO_INTRO_FADE,
				fill: 'forwards',
			})
			.finished.catch(() => {})
			.then(() => intro.remove());
	};

	onMount(() => {
		element = document.getElementById(STUDIO_INTRO_ID);
		if (!element) {
			document.body.insertAdjacentHTML('beforeend', studioIntroHtml());
			element = document.getElementById(STUDIO_INTRO_ID);
		}
		autoEnd = element?.hasAttribute('data-auto-end') ?? false;

		const shown = element ? shownFor(element) : 0;
		const timeouts = [
			setTimeout(() => (minElapsed = true), Math.max(0, STUDIO_INTRO_DURATION - shown)),
		];
		// its own fade is over: take it out of the page
		if (autoEnd) {
			const intro = element;
			const gone = STUDIO_INTRO_DURATION + STUDIO_INTRO_FADE - shown;
			timeouts.push(setTimeout(() => intro?.remove(), Math.max(0, gone)));
		}

		return () => {
			timeouts.forEach(clearTimeout);
			element?.remove();
			element = null;
			stateUi.studioIntro = 'ended';
		};
	});

	$effect(() => {
		if (ended) return;
		const timeUp = minElapsed && (autoEnd || (props.ready ?? true));
		if (!timeUp && !stateModal.modal) return;

		ended = true;
		stateUi.studioIntro = 'ended';
		props.onend?.();

		// an auto-ending intro fades by itself once its time is up; anything else fades from here
		const intro = element;
		if (!intro || (autoEnd && timeUp)) return;
		intro.getAnimations().forEach((animation) => {
			if (animation instanceof CSSAnimation && animation.animationName === 'kilara-intro-out')
				animation.cancel();
		});
		fadeOut(intro);
	});
</script>
