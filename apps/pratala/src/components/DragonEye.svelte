<script lang="ts" module>
	// what the dragon does when the game tells it something happened
	export type DragonReaction =
		'nod' | 'puff' | 'flap' | 'power' | 'gaze' | 'win' | 'bigWin' | 'bonus' | 'wake' | 'stare';

	export type EmitterEventDragon = {
		type: 'dragonReact';
		reaction: DragonReaction;
	};
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	import * as PIXI from 'pixi.js';

	import { BaseSprite } from 'pixi-svelte';
	import { stateBetDerived } from 'state-shared';

	import { getContext } from '../game/context';
	import {
		EYES,
		EYE_FIRE_DELAY,
		EYE_FRAMES,
		EYE_STRIP_COLUMNS,
		EYE_STRIP_SCALE,
		type EyeFrame,
	} from '../game/dragonEye';
	import { GAZE_FADE_MS, GAZE_ROW_MS } from '../game/glint';
	import { hallMood } from '../game/hallMood.svelte';
	import { shake } from '../game/impact.svelte';

	type Props = {
		hall: 'Base' | 'Bonus';
		shape: 'Landscape' | 'Portrait';
		// where the background's art pixel (0, 0) is on the canvas, and how big one art pixel is
		origin: { x: number; y: number };
		scale: number;
	};

	const props: Props = $props();
	const context = getContext();
	const eye = $derived(EYES[props.shape]);

	// the strip cut into its frames, once per loaded strip
	const cache = new Map<PIXI.TextureSource, PIXI.Texture[]>();
	const textures = $derived.by(() => {
		const strip = context.stateApp.loadedAssets[`eye${props.hall}${props.shape}`] as
			PIXI.Texture | undefined;
		if (!strip) return [];
		const cached = cache.get(strip.source);
		if (cached) return cached;
		const width = eye.width * EYE_STRIP_SCALE;
		const height = eye.height * EYE_STRIP_SCALE;
		const cut = EYE_FRAMES.map(
			(_, index) =>
				new PIXI.Texture({
					source: strip.source,
					frame: new PIXI.Rectangle(
						(index % EYE_STRIP_COLUMNS) * width,
						Math.floor(index / EYE_STRIP_COLUMNS) * height,
						width,
						height,
					),
				}),
		);
		cache.set(strip.source, cut);

		return cut;
	});

	// The eye answers the game: it glances down at a small win, holds the board with a narrowed
	// pupil for a bigger one, and stays narrowed while a column waits on a scatter. Each answer is
	// a frame held for a time, in ms; some jolt the board as the old dragon's did.
	const ANSWERS: Record<
		DragonReaction,
		{ frame: EyeFrame; ms: number; delay?: number; shake?: number }
	> = {
		nod: { frame: 'lookDown', ms: 380 },
		puff: { frame: 'lookDown', ms: 700 },
		flap: { frame: 'alert', ms: 600, shake: 1 },
		win: { frame: 'alert', ms: 1000, shake: 1 },
		// BIG: it looks down at the board; from EPIC up the pupil stays narrowed (hallMood)
		bigWin: { frame: 'lookDown', ms: 1800, shake: 2 },
		bonus: { frame: 'alert', ms: 1600, shake: 2 },
		// the fire leaves once the pupil has narrowed
		power: { frame: 'alert', ms: 900, delay: EYE_FIRE_DELAY, shake: 2 },
		// the gaze: it looks down at the board for as long as its gaze takes to come down a reel
		gaze: { frame: 'lookDown', ms: GAZE_ROW_MS * 5 + GAZE_FADE_MS + 300 },
		// free spins: it wakes, then looks down at the board while its gaze crosses it
		wake: { frame: 'alert', ms: 380 },
		stare: { frame: 'lookDown', ms: 1700 },
	};
	// At rest it blinks and now and then looks aside. Times are drawn between these bounds, in ms,
	// so it never ticks like a clock.
	const BLINK = {
		every: [2600, 6200],
		steps: [
			['half', 60],
			['shut', 90],
			['half', 70],
		] as const,
	};
	// now and then the lid comes half down and stays there a moment before it shuts and lifts: a
	// slow blink, so the eye is seen to rest rather than tick
	const DROWSE = { chance: 0.35, hold: [700, 1300] };
	const GLANCE = {
		every: [3800, 8000],
		hold: [700, 1300],
		frames: ['lookLeft', 'lookRight', 'lookDown'] as const,
	};

	const between = ([low, high]: readonly [number, number] | number[]) =>
		low + Math.random() * (high - low);

	const anticipating = $derived(
		context.stateGame.board.some((reel) => reel.reelState.anticipating),
	);

	let frame = $state<EyeFrame>('open');
	let answer: { frame: EyeFrame; until: number } | undefined;
	let blinkAt = 0;
	let blinkSteps: readonly (readonly [EyeFrame, number])[] = BLINK.steps;
	const nextBlink = (now: number) => {
		blinkAt = now + between(BLINK.every);
		blinkSteps =
			Math.random() < DROWSE.chance
				? [['half', between(DROWSE.hold)], ...BLINK.steps.slice(1)]
				: BLINK.steps;
	};
	let glance: { frame: EyeFrame; from: number; until: number } | undefined;

	const react = (reaction: DragonReaction) => {
		if (prefersReducedMotion.current) return;
		const { frame: held, ms, delay = 0, shake: jolt } = ANSWERS[reaction];
		const timeScale = stateBetDerived.timeScale();
		answer = { frame: held, until: performance.now() + ms / timeScale };
		if (jolt) setTimeout(() => shake(jolt), delay / timeScale);
	};

	const restingFrame = (now: number): EyeFrame => {
		if (!blinkAt) nextBlink(now);
		if (!glance) {
			const from = now + between(GLANCE.every);
			glance = {
				frame: GLANCE.frames[Math.floor(Math.random() * GLANCE.frames.length)],
				from,
				until: from + between(GLANCE.hold),
			};
		}
		let into = now - blinkAt;
		if (into >= 0) {
			for (const [step, ms] of blinkSteps) {
				if (into < ms) return step;
				into -= ms;
			}
			nextBlink(now);
		}
		if (now >= glance.until) glance = undefined;
		else if (now >= glance.from) return glance.frame;

		return 'open';
	};

	onMount(() => {
		let request = 0;
		const tick = (now: number) => {
			request = requestAnimationFrame(tick);
			let next: EyeFrame;
			if (prefersReducedMotion.current) next = 'open';
			else if (answer && now < answer.until) next = answer.frame;
			else if (anticipating || hallMood.tier >= 4) next = 'alert';
			else next = restingFrame(now);
			if (next !== frame) frame = next;
		};
		request = requestAnimationFrame(tick);

		return () => cancelAnimationFrame(request);
	});

	context.eventEmitter.subscribeOnMount({
		dragonReact: ({ reaction }) => react(reaction),
	});

	const texture = $derived(textures[EYE_FRAMES.indexOf(frame)]);

	// The eye lights the vault round it, in the bands of the torches' pools: the light breathes
	// slowly brighter and dimmer, on two slow waves so no breath is quite like the last, and the
	// lid cuts it off as it closes. Sizes are in eye boxes.
	const GLOW = {
		tint: 0xff5000,
		alpha: [0.05, 0.36],
		waves: [
			{ period: 4400, depth: 0.6 },
			{ period: 7300, depth: 0.4 },
		],
		size: { width: 1.75, height: 1.8 },
		lid: { half: 0.55, shut: 0.15 } as Partial<Record<EyeFrame, number>>,
	};
	const glowTexture = $derived(
		(context.stateApp.loadedAssets.flameGlow ?? PIXI.Texture.EMPTY) as PIXI.Texture,
	);
	let breath = $state(0.5);
	onMount(() => {
		let request = 0;
		const update = (now: number) => {
			request = requestAnimationFrame(update);
			breath = prefersReducedMotion.current
				? 0.5
				: GLOW.waves.reduce(
						(sum, { period, depth }, wave) =>
							sum - 0.5 * depth * Math.cos((2 * Math.PI * now) / period + wave),
						0.5,
					);
		};
		request = requestAnimationFrame(update);

		return () => cancelAnimationFrame(request);
	});
	const glowAlpha = $derived(
		(GLOW.alpha[0] + (GLOW.alpha[1] - GLOW.alpha[0]) * breath) * (GLOW.lid[frame] ?? 1),
	);
</script>

<!-- the open eye is the picture itself -->
{#if texture && frame !== 'open'}
	<BaseSprite
		{texture}
		x={props.origin.x + eye.x * props.scale}
		y={props.origin.y + eye.y * props.scale}
		width={eye.width * props.scale}
		height={eye.height * props.scale}
	/>
{/if}
<BaseSprite
	texture={glowTexture}
	anchor={0.5}
	x={props.origin.x + (eye.x + eye.width * 0.5) * props.scale}
	y={props.origin.y + (eye.y + eye.height * 0.5) * props.scale}
	width={eye.width * GLOW.size.width * props.scale}
	height={eye.height * GLOW.size.height * props.scale}
	tint={GLOW.tint}
	alpha={glowAlpha}
	blendMode="add"
/>
