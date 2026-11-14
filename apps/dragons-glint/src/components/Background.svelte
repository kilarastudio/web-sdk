<script lang="ts" module>
	import type { GameType } from '../game/types';

	// the hall changes in view, behind the board; resolves when it has changed
	export type EmitterEventBackground = { type: 'hallChange'; gameType: GameType };
</script>

<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { prefersReducedMotion, Tween } from 'svelte/motion';
	import { quadInOut } from 'svelte/easing';
	import * as PIXI from 'pixi.js';

	import { BaseSprite, Container, Rectangle, Sprite } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { FLOOR_FIRES } from '../game/floorFires';
	import { TORCHES } from '../game/torches';
	import { animate } from '../game/motion';
	import { createHallHeat, HEAT_FROM, HEAT_TO, type HallHeat } from '../game/hallHeat';
	import { hallMood } from '../game/hallMood.svelte';
	import DragonEye from './DragonEye.svelte';
	import HallDust from './HallDust.svelte';
	import FloorFires from './FloorFires.svelte';
	import Torches from './Torches.svelte';

	// The dragon's hall, in a wide and a tall composition (576 × 324 and 324 × 576 art pixels).
	// The dragon's eye looks out of the broken back wall; its blinks and glances are drawn over the
	// picture (DragonEye).
	// Its torches are painted without their flames, which burn over the picture (Torches); in the
	// bonus hall fires burn on the floor too (FloorFires).
	// Each covers the canvas; the tall one is used where the screen is taller than it is wide.
	// The halls change in view and nothing covers the screen: the hall heats into the boss hall and
	// cools back out of it, pixel by pixel (game/hallHeat.ts), while each hall's eye, torches and
	// fires fade over the other's. Anything else that sets the game type (a resumed round, a new
	// spin) changes the hall at once.
	const SIZES = {
		Landscape: { width: 576, height: 324 },
		Portrait: { width: 324, height: 576 },
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
	const baseKey = $derived(`backgroundBase${shape}`);
	const bonusKey = $derived(`backgroundBonus${shape}`);

	const HEAT = { in: 2600, out: 2200, blend: 220 };

	// 0 in the hall, 1 in the boss hall; between them while the hall changes
	let mix = $state(context.stateGame.gameType === 'freegame' ? 1 : 0);
	// which picture lies under the changing one
	let boss = $state(context.stateGame.gameType === 'freegame');
	// the changing picture, how much of it shows, and where the heat is in it
	let changing = $state<HallHeat>();
	let shown = $state(0);
	let heat = $state(HEAT_TO);
	let busy = false;

	$effect(() => {
		const free = context.stateGame.gameType === 'freegame';
		if (busy) return;
		mix = free ? 1 : 0;
		boss = free;
		heat = free ? HEAT_TO : HEAT_FROM;
	});

	// the heat's path through each picture is worked out once, a little after the game opens
	const heats = new Map<string, HallHeat>();
	const hallHeat = () => {
		const base = context.stateApp.loadedAssets[baseKey] as PIXI.Texture | undefined;
		const bonus = context.stateApp.loadedAssets[bonusKey] as PIXI.Texture | undefined;
		if (!base?.source?.resource || !bonus?.source?.resource) return undefined;
		if (!heats.has(shape))
			heats.set(shape, createHallHeat(base, bonus, SIZES[shape].width, SIZES[shape].height));

		return heats.get(shape);
	};
	onMount(() => {
		const timer = setTimeout(hallHeat, 4000);

		return () => clearTimeout(timer);
	});

	const smooth = (value: number) => {
		const at = Math.max(0, Math.min(1, value));

		return at * at * (3 - 2 * at);
	};

	context.eventEmitter.subscribeOnMount({
		hallChange: async ({ gameType }) => {
			const free = gameType === 'freegame';
			if (context.stateGame.gameType === gameType) return;
			busy = true;
			cancelAnimationFrame(moodRequest);
			const picture = prefersReducedMotion.current ? undefined : hallHeat();
			if (!picture) {
				// no heat to show: the boss hall fades over the hall, or away from it
				boss = true;
				await animate(400, (progress) => (mix = free ? progress : 1 - progress), {
					timeScaled: false,
				});
			} else {
				// a big win may have left the hall part heated
				const from = free ? (changing ? Math.max(HEAT_FROM, heat) : HEAT_FROM) : HEAT_TO;
				const to = free ? HEAT_TO : HEAT_FROM;
				picture.draw(from);
				changing = picture;
				await animate(HEAT.blend, (progress) => (shown = progress), { timeScaled: false });
				// the cracks open slowly, the heat gathers pace through the stone and eases into the vault
				await animate(
					free ? HEAT.in : HEAT.out,
					(progress) => {
						heat = from + (to - from) * (0.35 * progress + 0.65 * quadInOut(progress));
						picture.draw(heat, free ? 1 : 0.25);
						mix = smooth(heat);
					},
					{ timeScaled: false },
				);
				boss = free;
				mix = free ? 1 : 0;
				await animate(HEAT.blend, (progress) => (shown = 1 - progress), { timeScaled: false });
				changing = undefined;
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
		const picture = changing;

		return FLOOR_FIRES[shape].map((fire) => picture?.orderAt(fire.x, fire.y) ?? 0);
	});
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

<!-- what moves over the pictures: each hall's eye and torches, and the boss hall's floor fires -->
{#if mix < 1}
	<Container zIndex={-1} alpha={1 - mix}>
		<DragonEye hall="Base" {shape} {...flameProps} />
		<Torches torches={TORCHES[shape].base} flare={flare.current} {...flameProps} />
	</Container>
{/if}
{#if mix > 0}
	<Container zIndex={-1} alpha={Math.min(1, mix * 1.5)}>
		<DragonEye hall="Bonus" {shape} {...flameProps} />
		<FloorFires
			fires={FLOOR_FIRES[shape]}
			burning
			heat={changing ? heat : undefined}
			starts={fireStarts}
			surge={surge.current}
			{...flameProps}
		/>
		<Torches torches={TORCHES[shape].bonus} flare={flare.current} {...flameProps} />
	</Container>
{/if}

<Container zIndex={-1}>
	<HallDust scale={flameProps.scale} />
</Container>
