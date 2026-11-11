<script lang="ts" module>
	// one-off reactions that book events trigger, each a strip of frames; anticipation follows the
	// reels themselves
	export type CharacterReaction = 'power' | 'win' | 'bigWin' | 'bonus' | 'puff' | 'flap';
	// a smaller acknowledgement with no frames of its own: the dragon's body does it
	export type CharacterGesture = 'nod';

	export type EmitterEventCharacter = {
		type: 'characterReact';
		reaction: CharacterReaction | CharacterGesture;
	};
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import * as PIXI from 'pixi.js';

	import { BaseSprite, Graphics } from 'pixi-svelte';
	import { stateBetDerived } from 'state-shared';

	import { waitForTimeout } from 'utils-shared/wait';

	import { getContext } from '../game/context';
	import {
		CHARACTER,
		CHARACTER_FIRE_DELAY,
		CHARACTER_MOUTH,
		type CharacterAnimation,
	} from '../game/character';
	import { animate } from '../game/motion';
	import { shake } from '../game/impact.svelte';
	import CharacterParticles, {
		type ParticleBurst,
		type ParticleKind,
	} from './CharacterParticles.svelte';

	// Each pose is a strip of frames. Loops run until the pose changes; reactions play once and
	// settle back to idle. Reduced motion holds idle's first frame and skips the reactions.
	type Pose = CharacterAnimation;

	// bigWin loops until the celebration is over, in ms
	const BIG_WIN_HOLD = 3000;
	const { cell, figure } = CHARACTER;
	const frameCache = new Map<string, PIXI.Texture[]>();

	const context = getContext();
	const layout = $derived(context.stateGameDerived.characterLayout());
	const scale = $derived(layout.height / (figure.bottom - figure.top));
	const anticipating = $derived(
		context.stateGame.board.some((reel) => reel.reelState.anticipating),
	);

	let reaction = $state<CharacterAnimation>();
	let reactionId = 0;
	const pose = $derived<Pose>(reaction ?? (anticipating ? 'anticipation' : 'idle'));

	let frame = $state(0);
	let playing: Pose = 'idle';
	let poseStart = 0;

	// the strip cut into its frames, once per loaded strip
	const framesOf = (name: CharacterAnimation) => {
		const strip = context.stateApp.loadedAssets[`character_${name}`] as PIXI.Texture | undefined;
		if (!strip) return [];
		const cached = frameCache.get(name);
		if (cached && cached[0]?.source === strip.source) return cached;
		const frames = Array.from(
			{ length: CHARACTER.animations[name].frames },
			(_, index) =>
				new PIXI.Texture({
					source: strip.source,
					frame: new PIXI.Rectangle(index * cell.width, 0, cell.width, cell.height),
				}),
		);
		frameCache.set(name, frames);

		return frames;
	};

	const texture = $derived.by(() => {
		if (prefersReducedMotion.current) return framesOf('idle')[0];
		const frames = framesOf(pose);

		return frames[Math.min(frame, frames.length - 1)] ?? framesOf('idle')[0];
	});

	// The dragon's body, moved by code on top of its frames, so every reaction lands with weight:
	// it crouches, hops and squashes on its feet as it comes down, lunges as it breathes fire, and
	// smoke or embers leave its mouth. Sizes are fractions of its height.
	const MOVES: Record<CharacterReaction | CharacterGesture, Move> = {
		nod: { hop: 0.02, air: 190 },
		// the body moves on the frame where the strip snorts, or beats its wing down
		puff: { lunge: 0.025, delay: 330, particles: { kind: 'smoke', count: 6 } },
		flap: { hop: 0.05, air: 260, delay: 290, shake: 1 },
		win: { hop: 0.06, air: 280, particles: { kind: 'embers', count: 12 }, shake: 1 },
		bigWin: { hop: 0.09, air: 320, particles: { kind: 'embers', count: 22 }, shake: 2 },
		bonus: { hop: 0.09, air: 320, particles: { kind: 'embers', count: 18 }, shake: 2 },
		// the fire leaves on the lunge
		power: {
			lunge: 0.05,
			delay: CHARACTER_FIRE_DELAY,
			particles: { kind: 'embers', count: 10 },
			shake: 2,
		},
	};
	const CROUCH = { duration: 70, depth: 0.06 };
	const LANDING = { duration: 230, depth: 0.12, damping: 4.5 };
	const LUNGE = { duration: 300 };

	type Move = {
		hop?: number;
		air?: number;
		lunge?: number;
		delay?: number;
		particles?: { kind: ParticleKind; count: number };
		shake?: number;
	};

	// offsets in layout units, and the body's squash about its feet
	let body = $state({ x: 0, y: 0, wide: 1, tall: 1 });
	let moveId = 0;
	let particles = $state<{ emit: (burst: ParticleBurst) => void }>();

	const move = async (name: CharacterReaction | CharacterGesture) => {
		const id = ++moveId;
		const { hop, air = 0, lunge, delay, particles: burst, shake: jolt } = MOVES[name];
		const still = () => id !== moveId;
		const { height, width, x, y } = layout;

		if (delay) await waitForTimeout(delay / stateBetDerived.timeScale());
		if (still()) return;
		if (jolt) shake(jolt);
		if (burst)
			particles?.emit({
				...burst,
				x: x - width / 2 + width * CHARACTER_MOUTH.x,
				y: y - height + height * CHARACTER_MOUTH.y,
				// the strips are drawn four strip pixels to an art pixel
				pixel: 4 * scale,
				scale: height / 400,
			});

		if (lunge) {
			// forward toward the board and back, stretched along the way
			await animate(LUNGE.duration, (progress) => {
				if (still()) return;
				const reach = Math.sin(Math.PI * cubicOut(progress));
				body = { x: -lunge * height * reach, y: 0, wide: 1 + 0.05 * reach, tall: 1 - 0.03 * reach };
			});
		} else if (hop) {
			await animate(CROUCH.duration, (progress) => {
				if (still()) return;
				body = {
					x: 0,
					y: 0,
					wide: 1 + CROUCH.depth * 0.6 * progress,
					tall: 1 - CROUCH.depth * progress,
				};
			});
			await animate(air, (progress) => {
				if (still()) return;
				// up and down on one arc, a little taller in the air
				const lift = 4 * progress * (1 - progress);
				body = { x: 0, y: -hop * height * lift, wide: 1 - 0.03 * lift, tall: 1 + 0.05 * lift };
			});
			await animate(LANDING.duration, (progress) => {
				if (still()) return;
				const tall =
					1 -
					LANDING.depth * Math.exp(-LANDING.damping * progress) * Math.sin(3 * Math.PI * progress);
				body = { x: 0, y: 0, wide: 1 + (1 - tall) * 0.6, tall };
			});
		}
		if (!still()) body = { x: 0, y: 0, wide: 1, tall: 1 };
	};

	const react = (next: CharacterReaction | CharacterGesture) => {
		if (prefersReducedMotion.current) return;
		void move(next);
		// a gesture is the body alone; the frames stay on what they were playing
		if (!(next in CHARACTER.animations)) return;
		const strip = next as CharacterAnimation;
		const id = ++reactionId;
		reaction = strip;
		// the same pose again starts over
		poseStart = performance.now();
		playing = strip;
		frame = 0;
		if (CHARACTER.animations[strip].loop)
			setTimeout(() => {
				if (id === reactionId) reaction = undefined;
			}, BIG_WIN_HOLD);
	};

	onMount(() => {
		let request = 0;
		const tick = (now: number) => {
			request = requestAnimationFrame(tick);
			if (playing !== pose) {
				playing = pose;
				poseStart = now;
			}
			const { frames, fps, loop } = CHARACTER.animations[pose];
			const at = Math.floor(((now - poseStart) / 1000) * fps * stateBetDerived.timeScale());
			if (loop) frame = at % frames;
			else if (at >= frames) {
				// a one-shot reaction settles back once it has played
				if (reaction === pose) reaction = undefined;
			} else frame = at;
		};
		request = requestAnimationFrame(tick);

		return () => cancelAnimationFrame(request);
	});

	context.eventEmitter.subscribeOnMount({
		characterReact: ({ reaction }) => react(reaction),
	});
</script>

<!-- left out where the screen has no room for it -->
{#if layout.placement !== 'hidden' && texture}
	<Graphics
		draw={(graphics) => {
			graphics
				.ellipse(layout.x, layout.y - 2, layout.width * 0.5, layout.height * 0.03)
				.fill({ color: 0x0e071b, alpha: 0.5 });
		}}
	/>
	<!-- the figure's box centred on the layout box, the hoard on its feet line -->
	<BaseSprite
		{texture}
		x={layout.x + body.x - ((figure.left + figure.right) / 2) * scale * body.wide}
		y={layout.y + body.y - figure.bottom * scale * body.tall}
		width={cell.width * scale * body.wide}
		height={cell.height * scale * body.tall}
	/>
	<CharacterParticles bind:this={particles} />
{/if}
