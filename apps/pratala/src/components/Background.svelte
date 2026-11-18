<script lang="ts" module>
	import type { GameType } from '../game/types';

	// the hall changes in view, behind the board; resolves when it has changed
	export type EmitterEventBackground = { type: 'hallChange'; gameType: GameType };
</script>

<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { prefersReducedMotion, Tween } from 'svelte/motion';
	import * as PIXI from 'pixi.js';
	import { asset } from '$app/paths';

	import { BaseSprite, Container, Rectangle, Sprite } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { FLOOR_FIRES } from '../game/floorFires';
	import { TORCHES } from '../game/torches';
	import { EYES } from '../game/dragonEye';
	import { FRAME_ART_PIXEL } from '../game/constants';
	import { animate } from '../game/motion';
	import { createHallHeat, HEAT_FROM, HEAT_TO, type HallHeat } from '../game/hallHeat';
	import { COOL, createHallCool, type HallCool } from '../game/hallCool';
	import { shake } from '../game/impact.svelte';
	import { hallMood } from '../game/hallMood.svelte';
	import DragonEye from './DragonEye.svelte';
	import HallDust from './HallDust.svelte';
	import FloorFires from './FloorFires.svelte';
	import Torches from './Torches.svelte';

	// The dragon's hall, in a wide and a tall composition (640 × 360 and 360 × 640 art pixels), one
	// room: a cold stone hall, and the same hall burnt and broken for free spins (remade 2026-11-18,
	// workspace output/dragon/bg-2026-11-18). The dragon's eye looks out of a breach in the back
	// wall, a layer that follows the board (DragonEye, below).
	// Its torches are painted without their flames, which burn over the picture (Torches); in the
	// bonus hall fires burn on the floor too (FloorFires).
	// Each covers the canvas; the tall one is used where the screen is taller than it is wide.
	// The halls change in view and nothing covers the screen: when free spins start a painted
	// animation plays in the hall's place, fire catching on the floor and climbing the walls until
	// the hall is the boss hall; when they end the boss hall cools back through ash, pixel by pixel
	// (game/hallCool.ts). Meanwhile each hall's eye, torches and fires give way to the other's.
	// Anything else that sets the game type (a resumed round, a new spin) changes the hall at once.
	// A big win heats the hall for a while (game/hallHeat.ts).
	const SIZES = {
		Landscape: { width: 640, height: 360 },
		Portrait: { width: 360, height: 640 },
	};

	const context = getContext();
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());
	const shape = $derived(canvas.width >= canvas.height ? 'Landscape' : 'Portrait');
	const backgroundProps = $derived.by(() => {
		const sizes = SIZES[shape];
		const scale = Math.max(canvas.width / sizes.width, canvas.height / sizes.height);

		return {
			anchor: 0.5,
			x: canvas.width * 0.5,
			y: canvas.height * 0.5,
			width: sizes.width * scale,
			height: sizes.height * scale,
		};
	});
	// the torches' flames are drawn over the picture, in its own art pixels
	const flameProps = $derived.by(() => {
		const sizes = SIZES[shape];
		const scale = Math.max(canvas.width / sizes.width, canvas.height / sizes.height);

		return {
			scale,
			origin: {
				x: canvas.width * 0.5 - sizes.width * scale * 0.5,
				y: canvas.height * 0.5 - sizes.height * scale * 0.5,
			},
		};
	});
	// The eye in its breach is a layer of its own that follows the board, so it shows whatever the
	// screen's shape. It is as big as it was painted, in the hall's own art pixels, so the dragon
	// behind the wall stays huge (the user, 2026-11-18: a small eye loses the dread). It is centred
	// over the board with its lower TUCK behind the frame's top band; where the room above the
	// board is short it sinks further behind the band, up to MAX_TUCK so the iris (the middle of
	// the breach) still shows, and may rise past the header, which is clear in the middle, to the
	// screen's top edge, its broken rim just past it. Only when even that does not fit does it shrink.
	const TUCK = 0.3;
	const MAX_TUCK = 0.45;
	const RIM_PAST_TOP = 0.08;
	// the eye's layer: its own origin and art pixel, so the breach and the eye's frames land on it
	const eyeLayer = $derived.by(() => {
		const main = context.stateLayoutDerived.mainLayout();
		const board = context.stateGameDerived.boardLayout();
		const toX = (u: number) => main.x + (u - 0.5 * main.width) * main.scale;
		const toY = (u: number) => main.y + (u - 0.5 * main.height) * main.scale;
		const bandTop = toY(board.y - board.height / 2 - 34 * FRAME_ART_PIXEL);
		const centre = toX(board.x);
		const eye = EYES[shape];
		// how tall the breach may be with `tuck` of it behind the band and its top at the limit
		const fits = (tuck: number) => bandTop / (1 - tuck - RIM_PAST_TOP);
		const painted = eye.height * flameProps.scale;
		const height = Math.max(0.2 * eye.height, Math.min(painted, fits(MAX_TUCK)));
		// as little behind the band as the room allows, from TUCK up to MAX_TUCK
		const tuck = Math.min(MAX_TUCK, Math.max(TUCK, 1 - RIM_PAST_TOP - bandTop / height));
		const scale = height / eye.height;
		const bottom = bandTop + height * tuck;
		return {
			scale,
			origin: {
				x: centre - (eye.x + eye.width / 2) * scale,
				y: bottom - (eye.y + eye.height) * scale,
			},
		};
	});
	const baseKey = $derived(`backgroundBase${shape}`);
	const bonusKey = $derived(`backgroundBonus${shape}`);

	// 0 in the hall, 1 in the boss hall; between them while the hall changes
	let mix = $state(context.stateGame.gameType === 'freegame' ? 1 : 0);
	// which picture lies under the changing one
	let boss = $state(context.stateGame.gameType === 'freegame');
	// the picture a big win heats, how much of it shows, and where the heat is in it
	let changing = $state<HallHeat>();
	let shown = $state(0);
	let heat = $state(HEAT_TO);
	// the picture cooling, or the animation of the hall catching fire, while the hall changes
	let cooling = $state<HallCool>();
	let burnTexture = $state<PIXI.Texture>();
	// while it does, how much each hall's eye, torches and fires show (`dim` gutters both halls'
	// torches, `flare` makes them leap), and where the floor fires are
	type Look = {
		baseEye: number;
		bonusEye: number;
		baseTorches: number;
		bonusTorches: number;
		fires: number;
		dim: number;
		flare: number;
	};
	let cut = $state<Look>();
	let fires = $state<{ heat: number; starts: number[] }>();
	let busy = false;

	$effect(() => {
		const free = context.stateGame.gameType === 'freegame';
		if (busy) return;
		mix = free ? 1 : 0;
		boss = free;
		heat = free ? HEAT_TO : HEAT_FROM;
	});

	const look = $derived<Look>(
		cut ?? {
			baseEye: 1 - mix,
			bonusEye: Math.min(1, mix * 1.5),
			baseTorches: 1 - mix,
			bonusTorches: Math.min(1, mix * 1.5),
			fires: Math.min(1, mix * 1.5),
			dim: 1,
			flare: 0,
		},
	);

	// the heat's path and the cooling's are worked out once, a little after the game opens
	const heats = new Map<string, HallHeat>();
	const hallHeat = () => {
		const base = context.stateApp.loadedAssets[baseKey] as PIXI.Texture | undefined;
		const bonus = context.stateApp.loadedAssets[bonusKey] as PIXI.Texture | undefined;
		if (!base?.source?.resource || !bonus?.source?.resource) return undefined;
		if (!heats.has(shape))
			heats.set(shape, createHallHeat(base, bonus, SIZES[shape].width, SIZES[shape].height));

		return heats.get(shape);
	};
	const cools = new Map<string, HallCool>();
	const hallCool = () => {
		const base = context.stateApp.loadedAssets[baseKey] as PIXI.Texture | undefined;
		const bonus = context.stateApp.loadedAssets[bonusKey] as PIXI.Texture | undefined;
		if (!base?.source?.resource || !bonus?.source?.resource) return undefined;
		if (!cools.has(shape))
			cools.set(shape, createHallCool(base, bonus, SIZES[shape].width, SIZES[shape].height));

		return cools.get(shape);
	};
	// the middle of the eye's breach as it is on screen, in the hall's art pixels: the eye's layer
	// follows the board, so the breach is wherever the board has put it
	const breach = () => {
		const eye = EYES[shape];
		const x = eyeLayer.origin.x + (eye.x + eye.width / 2) * eyeLayer.scale;
		const y = eyeLayer.origin.y + (eye.y + eye.height / 2) * eyeLayer.scale;

		return {
			x: (x - flameProps.origin.x) / flameProps.scale,
			y: (y - flameProps.origin.y) / flameProps.scale,
		};
	};
	// The hall catching fire, painted frame by frame (static/assets/backgrounds/burn-*.mp4, made in
	// workspace output/dragon/bg-2026-11-18/video): 49 frames at 12 fps, one video pixel to one art
	// pixel of the hall, its first frame the hall and its last the boss hall, its own torch flames
	// dimmed so the game's cover them. It loads once the game is idle, for the screen's shape, and
	// again only when the shape changes; it plays once and is let go, and the next one loads.
	const BURN_VIDEOS = {
		Landscape: asset('assets/backgrounds/burn-landscape.mp4'),
		Portrait: asset('assets/backgrounds/burn-portrait.mp4'),
	};
	type Burn = {
		shape: 'Landscape' | 'Portrait';
		video: HTMLVideoElement;
		source: PIXI.VideoSource;
		ready: boolean;
	};
	let burn: Burn | undefined;
	const dropBurn = () => {
		burn?.source.destroy();
		burn = undefined;
	};
	const loadBurn = (want: 'Landscape' | 'Portrait') => {
		if (burn?.shape === want) return;
		dropBurn();
		const video = document.createElement('video');
		// muted and inline, so phones (iOS Safari above all) let it play without a tap of its own
		video.muted = true;
		video.defaultMuted = true;
		video.playsInline = true;
		video.setAttribute('muted', '');
		video.setAttribute('playsinline', '');
		video.loop = false;
		video.preload = 'auto';
		video.src = BURN_VIDEOS[want];
		const source = new PIXI.VideoSource({ resource: video, autoPlay: false, scaleMode: 'nearest' });
		const loading: Burn = { shape: want, video, source, ready: false };
		burn = loading;
		source
			.load()
			.then(() => (loading.ready = true))
			.catch(() => {
				if (burn === loading) dropBurn();
			});
	};
	let burnLoadTimer = 0;
	onMount(() => {
		const timers = [
			setTimeout(hallHeat, 4000),
			setTimeout(() => {
				const { x, y } = breach();
				hallCool()?.aim(x, y);
			}, 4600),
		];
		burnLoadTimer = window.setTimeout(() => loadBurn(shape), 5200);

		return () => {
			timers.forEach(clearTimeout);
			clearTimeout(burnLoadTimer);
			dropBurn();
		};
	});
	// the screen turned: the other shape's animation, if one was loaded
	$effect(() => {
		const want = shape;
		untrack(() => {
			if (burn && burn.shape !== want && !burnTexture) loadBurn(want);
		});
	});

	const smooth = (value: number) => {
		const at = Math.max(0, Math.min(1, value));

		return at * at * (3 - 2 * at);
	};

	// Free spins start: the animation plays in the hall's place, and resolves true when it has
	// played (false when it was not ready or the browser would not play it, for a plain fade
	// instead). Over it the eye snaps alert and the board jolts, and jolts again as the stones fall
	// (about 2 s in); the hall's torches die over the first 1.5 s, and in the last second the boss
	// hall's leap up, its floor fires catching, and the eye turns to the boss hall's.
	const burnIn = async () => {
		const playing = burn;
		if (!playing?.ready || playing.shape !== shape) return false;
		const { video, source } = playing;
		video.currentTime = 0;
		// its first frame is the hall as it stands, so it can show before it plays
		const texture = new PIXI.Texture({ source });
		burnTexture = texture;
		changing = undefined;
		shown = 0;
		const done = () => {
			burnTexture = undefined;
			texture.destroy();
			dropBurn();
			burnLoadTimer = window.setTimeout(() => loadBurn(shape), 1500);
		};
		try {
			await video.play();
		} catch {
			done();

			return false;
		}
		const total = (Number.isFinite(video.duration) ? video.duration : 4.1) * 1000;
		context.eventEmitter.broadcast({ type: 'dragonReact', reaction: 'wake' });
		shake(5, 420);
		let jolted = false;
		const starts = FLOOR_FIRES[shape].map((_, index) => index * 0.04);
		const grow = 0.3 + 0.04 * (starts.length - 1);
		fires = { heat: 0, starts };
		const started = performance.now();
		await new Promise<void>((resolve) => {
			const tick = () => {
				// a stalled video never holds up the round
				const late = performance.now() - started > total + 2000;
				const ms = video.ended || late ? total : video.currentTime * 1000;
				if (!jolted && ms >= 2000) {
					jolted = true;
					shake(3, 360);
				}
				const end = total - ms;
				const eye = end < 500 ? 1 : 0;
				cut = {
					baseEye: 1 - eye,
					bonusEye: eye,
					baseTorches: 1 - smooth(ms / 1500),
					bonusTorches: smooth((1000 - end) / 600),
					fires: 1,
					dim: 1,
					flare: end > 1000 ? 0 : end > 400 ? (1000 - end) / 600 : end / 400,
				};
				if (fires) fires.heat = smooth((1200 - end) / 1200) * grow;
				if (video.ended || late) resolve();
				else requestAnimationFrame(tick);
			};
			requestAnimationFrame(tick);
		});
		boss = true;
		mix = 1;
		done();

		return true;
	};

	// Free spins end, in COOL.total: the glow dies from the far edges in toward the breach, the
	// boss hall's eye and torches last of all.
	const coolDown = async (picture: HallCool) => {
		await animate(
			COOL.total,
			(progress) => {
				const ms = progress * COOL.total;
				picture.draw(ms);
				const torches = smooth((ms - 500) / 900);
				const eye = smooth((ms - 1100) / 600);
				cut = {
					baseEye: eye,
					bonusEye: 1 - eye,
					baseTorches: torches,
					bonusTorches: 1 - torches,
					fires: 1,
					dim: 1,
					flare: 0,
				};
				if (fires) fires.heat = 1 - ms / COOL.total;
			},
			{ timeScaled: false },
		);
	};

	context.eventEmitter.subscribeOnMount({
		hallChange: async ({ gameType }) => {
			const free = gameType === 'freegame';
			if (context.stateGame.gameType === gameType) return;
			busy = true;
			cancelAnimationFrame(moodRequest);
			const still = prefersReducedMotion.current;
			let shownInView = false;
			if (!still && free) shownInView = await burnIn();
			const picture = !still && !free ? hallCool() : undefined;
			if (picture) {
				const { x, y } = breach();
				picture.aim(x, y);
				// each floor fire dies as the cooling reaches its stone
				fires = {
					heat: 1,
					starts: FLOOR_FIRES[shape].map(
						(fire) => 1 - (picture.coolAt(fire.x, fire.y) + COOL.pass) / COOL.total,
					),
				};
				picture.draw(0);
				cooling = picture;
				changing = undefined;
				shown = 0;
				await coolDown(picture);
				cooling = undefined;
				shownInView = true;
			}
			if (!shownInView) {
				// nothing to show it with: the boss hall fades over the hall, or away from it
				boss = true;
				await animate(400, (progress) => (mix = free ? progress : 1 - progress), {
					timeScaled: false,
				});
			}
			boss = free;
			mix = free ? 1 : 0;
			heat = free ? HEAT_TO : HEAT_FROM;
			cut = undefined;
			fires = undefined;
			busy = false;
			context.stateGame.gameType = gameType;
		},
	});

	// A big win heats the hall for as long as it shows (game/hallMood.svelte.ts): the cracks glow
	// at MEGA, most of the hall is red at EPIC, all of it burns at MAX, and it cools when the win
	// leaves. In the boss hall, already hot, the fires burn higher instead.
	const MOOD_HEAT = [HEAT_FROM, HEAT_FROM, HEAT_FROM, 0.17, 0.5, HEAT_TO];
	const MOOD_PACE = 0.8; // of the heat's whole range, a second
	let moodRequest = 0;
	const moodHeat = $derived(
		context.stateGame.gameType === 'basegame' ? MOOD_HEAT[hallMood.tier] : undefined,
	);
	$effect(() => {
		const to = moodHeat;
		untrack(() => {
			cancelAnimationFrame(moodRequest);
			if (busy || to === undefined || prefersReducedMotion.current) return;
			if (!changing && to <= HEAT_FROM) return;
			const picture = hallHeat();
			if (!picture) return;
			if (!changing) {
				heat = HEAT_FROM;
				picture.draw(heat);
				changing = picture;
				shown = 1;
			}
			let last = performance.now();
			const step = (now: number) => {
				const move = ((now - last) / 1000) * MOOD_PACE;
				last = now;
				const rising = to > heat;
				heat = rising ? Math.min(to, heat + move) : Math.max(to, heat - move);
				picture.draw(heat, rising ? 1 : 0.25);
				mix = smooth(heat);
				if (heat !== to) moodRequest = requestAnimationFrame(step);
				else if (to <= HEAT_FROM) {
					changing = undefined;
					shown = 0;
					mix = 0;
				}
			};
			moodRequest = requestAnimationFrame(step);
		});
	});
	// the torches leap from SUPER up, and the boss hall's fires burn higher from MEGA up
	const flare = new Tween(0, { duration: 350 });
	const surge = new Tween(0, { duration: 500 });
	$effect(() => {
		flare.set(hallMood.tier >= 2 ? Math.min(1, 0.55 + 0.15 * (hallMood.tier - 2)) : 0);
		surge.set(hallMood.tier >= 3 ? Math.min(1, 0.4 + 0.3 * (hallMood.tier - 3)) : 0);
	});

	// each floor fire catches as the heat reaches the stone it stands on
	const fireStarts = $derived.by(() => {
		if (fires) return fires.starts;
		const picture = changing;

		return FLOOR_FIRES[shape].map((fire) => picture?.orderAt(fire.x, fire.y) ?? 0);
	});
	const fireHeat = $derived(fires ? fires.heat : changing ? heat : undefined);
</script>

<Rectangle {...canvas} backgroundColor={0x0e071b} zIndex={-3} />

<!-- the pictures: the hall, the boss hall over it, and the picture that changes one into the other -->
{#if context.stateApp.loadedAssets[baseKey] && !(boss && mix >= 1)}
	{#key baseKey}
		<Sprite key={baseKey} {...backgroundProps} zIndex={-2.2} />
	{/key}
{/if}
{#if context.stateApp.loadedAssets[bonusKey] && boss}
	{#key bonusKey}
		<Sprite key={bonusKey} {...backgroundProps} zIndex={-2.1} alpha={changing ? 1 : mix} />
	{/key}
{/if}
{#if changing}
	<BaseSprite texture={changing.texture} {...backgroundProps} zIndex={-2} alpha={shown} />
{/if}
{#if cooling}
	<BaseSprite texture={cooling.texture} {...backgroundProps} zIndex={-1.95} />
{/if}
{#if burnTexture}
	<BaseSprite texture={burnTexture} {...backgroundProps} zIndex={-1.95} />
{/if}

<!-- what moves over the pictures: each hall's eye and torches, and the boss hall's floor fires;
     while the hall catches fire both eyes stay, so the boss hall's opens alert too -->
{#if look.baseEye > 0 || look.baseTorches > 0}
	<Container zIndex={-1}>
		{#if look.baseEye > 0}
			<Container alpha={look.baseEye}>
				<DragonEye hall="Base" {shape} {...eyeLayer} />
			</Container>
		{/if}
		{#if look.baseTorches > 0}
			<Container alpha={look.baseTorches * look.dim}>
				<Torches
					torches={TORCHES[shape].base}
					flare={Math.max(flare.current, look.flare)}
					{...flameProps}
				/>
			</Container>
		{/if}
	</Container>
{/if}
{#if cooling || burnTexture || look.bonusEye > 0 || look.bonusTorches > 0 || look.fires > 0}
	<Container zIndex={-1}>
		<Container alpha={look.bonusEye}>
			<DragonEye hall="Bonus" {shape} {...eyeLayer} />
		</Container>
		{#if look.fires > 0}
			<Container alpha={look.fires}>
				<FloorFires
					fires={FLOOR_FIRES[shape]}
					burning
					heat={fireHeat}
					starts={fireStarts}
					surge={surge.current}
					{...flameProps}
				/>
			</Container>
		{/if}
		{#if look.bonusTorches > 0}
			<Container alpha={look.bonusTorches * look.dim}>
				<Torches
					torches={TORCHES[shape].bonus}
					flare={Math.max(flare.current, look.flare)}
					{...flameProps}
				/>
			</Container>
		{/if}
	</Container>
{/if}

<Container zIndex={-1}>
	<HallDust scale={flameProps.scale} />
</Container>
