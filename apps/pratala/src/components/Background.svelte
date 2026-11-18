<script lang="ts" module>
	import type { GameType } from '../game/types';

	// the hall changes in view, behind the board; resolves when it has changed
	export type EmitterEventBackground = { type: 'hallChange'; gameType: GameType };
</script>

<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { prefersReducedMotion, Tween } from 'svelte/motion';
	import * as PIXI from 'pixi.js';

	import { BaseSprite, Container, getContextParent, Rectangle, Sprite } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { FLOOR_FIRES } from '../game/floorFires';
	import { TORCHES } from '../game/torches';
	import { EYES } from '../game/dragonEye';
	import { FRAME_ART_PIXEL } from '../game/constants';
	import { animate } from '../game/motion';
	import { createHallHeat, HEAT_FROM, HEAT_TO, type HallHeat } from '../game/hallHeat';
	import {
		BREAK,
		COOL,
		createHallBreak,
		createHallDebris,
		type HallBreak,
	} from '../game/hallBreak';
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
	// The halls change in view and nothing covers the screen: when free spins start the wall cracks
	// open from the eye's breach and breaks away into the boss hall, and when they end the boss hall
	// cools back through ash, pixel by pixel (game/hallBreak.ts), while each hall's eye, torches and
	// fires give way to the other's. Anything else that sets the game type (a resumed round, a new
	// spin) changes the hall at once. A big win heats the hall for a while (game/hallHeat.ts).
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

	// where the floor starts in each composition, in art pixels: the wall above it breaks away, the
	// floor's cracks below it open
	const FLOOR = { Landscape: 285, Portrait: 390 };

	// 0 in the hall, 1 in the boss hall; between them while the hall changes
	let mix = $state(context.stateGame.gameType === 'freegame' ? 1 : 0);
	// which picture lies under the changing one
	let boss = $state(context.stateGame.gameType === 'freegame');
	// the picture a big win heats, how much of it shows, and where the heat is in it
	let changing = $state<HallHeat>();
	let shown = $state(0);
	let heat = $state(HEAT_TO);
	// the picture breaking open or cooling, while the hall changes
	let breaking = $state<HallBreak>();
	// while it does, how much each hall's eye, torches and fires show (`dim` gutters both halls'
	// torches, `flare` makes them leap, `flash` reddens the hall), and where the floor fires are
	type Look = {
		baseEye: number;
		bonusEye: number;
		baseTorches: number;
		bonusTorches: number;
		fires: number;
		dim: number;
		flare: number;
		flash: number;
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
			flash: 0,
		},
	);

	// the heat's path and the break's are worked out once, a little after the game opens
	const heats = new Map<string, HallHeat>();
	const hallHeat = () => {
		const base = context.stateApp.loadedAssets[baseKey] as PIXI.Texture | undefined;
		const bonus = context.stateApp.loadedAssets[bonusKey] as PIXI.Texture | undefined;
		if (!base?.source?.resource || !bonus?.source?.resource) return undefined;
		if (!heats.has(shape))
			heats.set(shape, createHallHeat(base, bonus, SIZES[shape].width, SIZES[shape].height));

		return heats.get(shape);
	};
	const breaks = new Map<string, HallBreak>();
	const hallBreak = () => {
		const base = context.stateApp.loadedAssets[baseKey] as PIXI.Texture | undefined;
		const bonus = context.stateApp.loadedAssets[bonusKey] as PIXI.Texture | undefined;
		if (!base?.source?.resource || !bonus?.source?.resource) return undefined;
		if (!breaks.has(shape)) {
			const { width, height } = SIZES[shape];
			breaks.set(shape, createHallBreak(base, bonus, width, height, FLOOR[shape]));
		}

		return breaks.get(shape);
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
	onMount(() => {
		const timers = [
			setTimeout(hallHeat, 4000),
			setTimeout(() => {
				const { x, y } = breach();
				hallBreak()?.aim(x, y);
			}, 4600),
		];

		return () => timers.forEach(clearTimeout);
	});

	// what flies off the wall as it breaks: over the hall, behind the eye, torches and fires
	const debrisLayer = new PIXI.Container({ zIndex: -1.5 });
	getContextParent().addToParent(debrisLayer);
	const debris = createHallDebris(debrisLayer);

	const smooth = (value: number) => {
		const at = Math.max(0, Math.min(1, value));

		return at * at * (3 - 2 * at);
	};

	// Free spins start, in BREAK.total: the eye snaps alert, the board jolts and the torches gutter;
	// the cracks race out of the breach (from 0.3 s); the wall gives way, chunks dropping and the
	// floor's cracks spitting embers (from 1 s); then the torches leap up as the boss hall's and the
	// hall flashes red (at 1.9 s).
	const breakOpen = async (picture: HallBreak) => {
		context.eventEmitter.broadcast({ type: 'dragonReact', reaction: 'wake' });
		shake(5, 420);
		const { x: fromX } = breach();
		let last = 0;
		let jolted = false;
		await animate(
			BREAK.total,
			(progress) => {
				const ms = progress * BREAK.total;
				const { width } = SIZES[shape];
				for (const cell of picture.breaking(last, ms)) {
					const chunk = cell.falls ? picture.chunkTexture(cell) : undefined;
					if (chunk) debris.chunk(cell, chunk, fromX);
					const embers = Math.min(3, Math.ceil(cell.embers.length / 6));
					for (let ember = 0; ember < embers; ember++) {
						const index = cell.embers[Math.floor(Math.random() * cell.embers.length)];
						debris.ember(index % width, Math.floor(index / width));
					}
				}
				debris.step(ms - last, flameProps);
				last = ms;
				picture.drawBreak(ms);
				if (!jolted && ms >= BREAK.wall[0]) {
					jolted = true;
					shake(3, 360);
				}
				const rise = (ms - 1900) / 400;
				cut = {
					baseEye: 1 - smooth(rise),
					bonusEye: smooth(rise),
					baseTorches: 1 - smooth((ms - 1900) / 200),
					bonusTorches: smooth((ms - 1900) / 200),
					fires: 1,
					dim: ms < 400 ? 1 - 0.7 * Math.sin((Math.PI * ms) / 400) : 1,
					flare: ms < 1900 ? 0 : ms < 2050 ? (ms - 1900) / 150 : Math.max(0, 1 - (ms - 2050) / 550),
					flash: ms >= 1900 && ms < 2020 ? 0.22 * (1 - (ms - 1900) / 120) : 0,
				};
				if (fires) fires.heat = ms / BREAK.total;
			},
			{ timeScaled: false },
		);
		// the last pieces finish falling over the boss hall
		await animate(
			500,
			(progress) => {
				const ms = BREAK.total + progress * 500;
				debris.step(ms - last, flameProps);
				last = ms;
			},
			{ timeScaled: false },
		);
		debris.clear();
	};

	// Free spins end, in COOL.total: the glow dies from the far edges in toward the breach, the
	// boss hall's eye and torches last of all.
	const coolDown = async (picture: HallBreak) => {
		await animate(
			COOL.total,
			(progress) => {
				const ms = progress * COOL.total;
				picture.drawCool(ms);
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
					flash: 0,
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
			const picture = prefersReducedMotion.current ? undefined : hallBreak();
			if (!picture) {
				// no break to show: the boss hall fades over the hall, or away from it
				boss = true;
				await animate(400, (progress) => (mix = free ? progress : 1 - progress), {
					timeScaled: false,
				});
			} else {
				const { x, y } = breach();
				picture.aim(x, y);
				// each floor fire catches as the break reaches its stone, and dies as it cools
				fires = {
					heat: free ? 0 : 1,
					starts: FLOOR_FIRES[shape].map((fire) =>
						free
							? (picture.breakAt(fire.x, fire.y) - 400) / BREAK.total
							: 1 - (picture.coolAt(fire.x, fire.y) + COOL.pass) / COOL.total,
					),
				};
				if (free) picture.drawBreak(0);
				else picture.drawCool(0);
				breaking = picture;
				// a big win may have left the hall part heated: the break starts from the cold hall
				changing = undefined;
				shown = 0;
				if (free) await breakOpen(picture);
				else await coolDown(picture);
				boss = free;
				mix = free ? 1 : 0;
				heat = free ? HEAT_TO : HEAT_FROM;
				breaking = undefined;
				cut = undefined;
				fires = undefined;
			}
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
{#if breaking}
	<BaseSprite texture={breaking.texture} {...backgroundProps} zIndex={-1.95} />
{/if}

<!-- what moves over the pictures: each hall's eye and torches, and the boss hall's floor fires;
     while the hall breaks open both eyes stay, so the boss hall's opens alert too -->
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
{#if breaking || look.bonusEye > 0 || look.bonusTorches > 0 || look.fires > 0}
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
{#if look.flash > 0}
	<Rectangle {...canvas} backgroundColor={0xff3a10} alpha={look.flash} zIndex={-0.9} />
{/if}

<Container zIndex={-1}>
	<HallDust scale={flameProps.scale} />
</Container>
