<!--
	Drives a game's HTML loading screen (gameLoaderShell.ts) once the game's scripts run. It takes the
	bar over from its CSS creep where it stands, after the studio intro has ended, and carries it on
	with the assets' real progress: the creep's share (GAME_LOADER_ESTIMATE) stands for the scripts,
	the rest for the assets. The bar follows at most FILL_MS_PER_PERCENT a percent and never runs
	ahead of the load; when it is full it holds a moment, calls onend and fades out, so the game's
	next screen shows through as it goes.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { Tween } from 'svelte/motion';

	import { stateUi } from 'state-shared';

	import { GAME_LOADER_ESTIMATE, GAME_LOADER_ID } from './gameLoaderShell';

	type Props = {
		/** the game's loading screen markup (gameLoaderHtml), added if the page does not have it */
		html: string;
		/** how much of the game's assets has loaded, 0 to 100 */
		progress: number;
		/** every asset is in */
		loaded: boolean;
		/** the bar is full: the loading screen starts to fade, the game's next screen can show */
		onend: () => void;
	};

	const props: Props = $props();

	const FILL_MS_PER_PERCENT = 9; // an empty bar would fill in 0.9 s
	const FULL_HOLD = 300;
	const FADE = 400;

	let element = $state<HTMLElement | null>(null);
	let mask = $state<HTMLElement | null>(null);
	let fill = $state<HTMLElement | null>(null);
	let taken = $state(false);
	let ended = $state(false);

	const bar = new Tween(0, {
		duration: (from, to) => Math.abs(to - from) * FILL_MS_PER_PERCENT,
	});
	const target = $derived(
		GAME_LOADER_ESTIMATE + (100 - GAME_LOADER_ESTIMATE) * (props.loaded ? 1 : props.progress / 100),
	);

	// where the CSS creep has the bar now, in %
	const creepAt = (mask: HTMLElement) => {
		const transform = getComputedStyle(mask).transform;
		if (!transform || transform === 'none' || mask.offsetWidth === 0) return 0;
		const x = new DOMMatrixReadOnly(transform).m41;
		return Math.min(100, Math.max(0, 100 + (x / mask.offsetWidth) * 100));
	};

	onMount(() => {
		let loader = document.getElementById(GAME_LOADER_ID);
		if (!loader) {
			document.body.insertAdjacentHTML('beforeend', props.html);
			loader = document.getElementById(GAME_LOADER_ID);
		}
		element = loader;
		mask = loader?.querySelector<HTMLElement>('.kilara-loader-mask') ?? null;
		fill = loader?.querySelector<HTMLElement>('.kilara-loader-fill') ?? null;

		return () => loader?.remove();
	});

	// take the bar over from the creep once the intro is gone
	$effect(() => {
		if (taken || !mask || !fill || stateUi.studioIntro === 'showing') return;
		const at = creepAt(mask);
		mask.style.animation = 'none';
		fill.style.animation = 'none';
		bar.set(at, { duration: 0 });
		taken = true;
	});

	// the target only grows, and starts at the estimate, which the creep never reaches
	$effect(() => {
		if (taken) bar.target = target;
	});

	$effect(() => {
		if (!taken || !mask || !fill) return;
		const at = bar.current;
		mask.style.transform = `translateX(${at - 100}%)`;
		fill.style.transform = `translateX(${100 - at}%)`;
	});

	$effect(() => {
		if (ended || !taken || !props.loaded || bar.current < 100) return;
		const timeout = setTimeout(() => {
			ended = true;
			props.onend();
			const loader = element;
			if (!loader) return;
			loader.style.pointerEvents = 'none';
			loader
				.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FADE, fill: 'forwards' })
				.finished.catch(() => {})
				.then(() => loader.remove());
		}, FULL_HOLD);
		return () => clearTimeout(timeout);
	});
</script>
