<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	import * as PIXI from 'pixi.js';

	import { BaseSprite } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { hallMood } from '../game/hallMood.svelte';

	// Dust and grit shaken out of the vault when a big win from SUPER up lands: it falls from the
	// top of the screen, the grit faster than the dust, and is gone before it reaches the floor's
	// front. Between wins a few motes are always drifting down through the hall, slowly, swaying
	// on the draught, so the hall is never still. `scale` is the size of one
	// of the hall's art pixels.
	type Props = { scale: number };

	const props: Props = $props();
	const context = getContext();
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());
	const pixel = $derived(
		(context.stateApp.loadedAssets.pixel ?? PIXI.Texture.EMPTY) as PIXI.Texture,
	);

	const STONE = [0x8b93af, 0x6b7191, 0x4a5272];
	const LIFE = 1700;

	type Mote = { x: number; from: number; fall: number; size: number; tint: number; drift: number };
	let motes = $state<Mote[]>([]);
	let now = $state(0);
	let request = 0;

	const tick = (time: number) => {
		now = time;
		motes = motes.filter((mote) => time < mote.from + LIFE);
		request = motes.length ? requestAnimationFrame(tick) : 0;
	};

	$effect(() => {
		const landed = hallMood.landed;
		untrack(() => {
			if (!landed || hallMood.tier < 2 || prefersReducedMotion.current) return;
			const start = performance.now();
			const count = 22 + hallMood.tier * 10;
			motes = [
				...motes,
				...Array.from({ length: count }, () => {
					const grit = Math.random() < 0.3;

					return {
						x: Math.random(),
						from: start + Math.random() * 500,
						fall: (grit ? 0.9 : 0.45) + Math.random() * 0.3,
						size: grit ? 2 : 1,
						tint: STONE[Math.floor(Math.random() * STONE.length)],
						drift: (Math.random() - 0.5) * 0.03,
					};
				}),
			];
			if (!request) request = requestAnimationFrame(tick);
		});
	});

	$effect(() => () => cancelAnimationFrame(request));

	// The quiet motes: few, one or two art pixels, in the greys of stone the torches light. Speeds
	// in art pixels a second, times in ms. Each fades in and out over a long stretch of its life,
	// so none appears or goes at once.
	const QUIET = {
		count: 24,
		fall: [5, 12],
		sway: { reach: [1.5, 4], period: [4000, 8000] },
		life: [9000, 16000],
		ease: 0.2,
		alpha: [0.5, 0.85],
		tint: [0x858585, 0x858585, 0xb4b4b4, 0x5d5d5d],
	};
	type Drift = {
		x: number;
		y: number;
		from: number;
		life: number;
		fall: number;
		reach: number;
		period: number;
		phase: number;
		size: number;
		alpha: number;
		tint: number;
	};
	const between = ([low, high]: number[]) => low + Math.random() * (high - low);
	// a mote anywhere in the hall, part way through its life the first time round
	const drift = (time: number, into = 0): Drift => {
		const life = between(QUIET.life);

		return {
			x: Math.random(),
			y: Math.random(),
			from: time - into * life,
			life,
			fall: between(QUIET.fall),
			reach: between(QUIET.sway.reach),
			period: between(QUIET.sway.period),
			phase: Math.random() * Math.PI * 2,
			size: Math.random() < 0.25 ? 2 : 1,
			alpha: between(QUIET.alpha),
			tint: QUIET.tint[Math.floor(Math.random() * QUIET.tint.length)],
		};
	};
	let drifts = $state<Drift[]>([]);
	let drifting = $state(0);

	onMount(() => {
		if (prefersReducedMotion.current) return;
		const start = performance.now();
		drifts = Array.from({ length: QUIET.count }, () => drift(start, Math.random()));
		let frame = 0;
		const update = (time: number) => {
			frame = requestAnimationFrame(update);
			drifting = time;
			if (drifts.some((mote) => time >= mote.from + mote.life))
				drifts = drifts.map((mote) => (time >= mote.from + mote.life ? drift(time) : mote));
		};
		frame = requestAnimationFrame(update);

		return () => cancelAnimationFrame(frame);
	});

	const quiet = (mote: Drift) => {
		const age = (drifting - mote.from) / mote.life;
		const seconds = (drifting - mote.from) / 1000;
		const fade = Math.min(1, age / QUIET.ease, (1 - age) / QUIET.ease);

		return {
			alpha: mote.alpha * Math.max(0, fade),
			x:
				Math.round(
					(mote.x * canvas.width) / props.scale +
						mote.reach *
							Math.sin((2 * Math.PI * (drifting - mote.from)) / mote.period + mote.phase),
				) * props.scale,
			y: Math.round((mote.y * canvas.height) / props.scale + mote.fall * seconds) * props.scale,
		};
	};
</script>

{#each drifts as mote}
	{@const at = quiet(mote)}
	<BaseSprite
		texture={pixel}
		tint={mote.tint}
		alpha={at.alpha}
		x={at.x}
		y={at.y}
		width={mote.size * props.scale}
		height={mote.size * props.scale}
	/>
{/each}

{#each motes as mote}
	{@const age = (now - mote.from) / LIFE}
	{#if age > 0}
		<BaseSprite
			texture={pixel}
			tint={mote.tint}
			alpha={Math.min(1, (1 - age) * 2.5)}
			x={Math.round(((mote.x + mote.drift * age) * canvas.width) / props.scale) * props.scale}
			y={Math.round((mote.fall * age * age * canvas.height) / props.scale) * props.scale}
			width={mote.size * props.scale}
			height={mote.size * props.scale}
		/>
	{/if}
{/each}
