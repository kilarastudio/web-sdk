<!--
	Kilara Studio intro: the studio splash every Kilara game opens with, ahead of the game's own
	loading screen. kilara rises out of its baseline letter by letter, the Kilau dot drops onto the
	i and bounces twice before it settles, and STUDIO follows. No shine or glow: the motion ends with
	the dot.

	The markup lives in studioIntroShell.ts. A game's server hook writes it into the page, so it is
	on screen with the first HTML; this component takes it over (or adds it, where the page has
	none), holds it for its minimum time, counted from when it first painted, and until the game is
	ready, then fades it out. An error modal ends it early. stateUi.studioIntro tells the game when
	it has ended, so its own loading screen starts after it.
-->
<script lang="ts">
	import { onMount } from 'svelte';

	import { stateModal, stateUi } from 'state-shared';

	import { STUDIO_INTRO_ID, studioIntroHtml } from './studioIntroShell';

	type Props = {
		/** true once the game can show its own loading screen; the intro holds until then */
		ready?: boolean;
		onend?: () => void;
	};

	const props: Props = $props();

	// the motion settles at about 1.7 s; the rest of the minimum is time to read the logo
	const MIN_DURATION = 2300;
	const FADE_DURATION = 400;

	// set before anything below this component renders, so a loading screen never starts under it
	stateUi.studioIntro = 'showing';

	let minElapsed = $state(false);
	let ended = $state(false);
	let element: HTMLElement | null = null;

	// how long the intro has been on screen: its animations started when it first painted
	const shownFor = (intro: HTMLElement) => {
		const times = (intro.getAnimations?.({ subtree: true }) ?? []).map((animation) =>
			Number(animation.currentTime ?? 0),
		);
		return times.length > 0 ? Math.max(...times) : 0;
	};

	onMount(() => {
		element = document.getElementById(STUDIO_INTRO_ID);
		if (!element) {
			document.body.insertAdjacentHTML('beforeend', studioIntroHtml());
			element = document.getElementById(STUDIO_INTRO_ID);
		}

		const timeout = setTimeout(
			() => (minElapsed = true),
			Math.max(0, MIN_DURATION - (element ? shownFor(element) : 0)),
		);

		return () => {
			clearTimeout(timeout);
			element?.remove();
			element = null;
			stateUi.studioIntro = 'ended';
		};
	});

	$effect(() => {
		if (!ended && minElapsed && ((props.ready ?? true) || stateModal.modal)) {
			ended = true;
			stateUi.studioIntro = 'ended';
			props.onend?.();

			const intro = element;
			if (!intro) return;
			intro.style.pointerEvents = 'none';
			intro
				.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FADE_DURATION, fill: 'forwards' })
				.finished.catch(() => {})
				.then(() => intro.remove());
		}
	});
</script>
