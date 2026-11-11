<script lang="ts" module>
	export type GlintStrikeSpot = { reel: number; row: number; value: number };

	import type { GlintChange } from '../game/glint';
	export type GlintApplySpot = GlintStrikeSpot & { targetReel: number; targetRow: number };
	export type EmitterEventGlintSpots =
		| { type: 'glintStrikeShow'; spots: GlintStrikeSpot[] }
		| { type: 'glintApplyFly'; spots: GlintApplySpot[] }
		| { type: 'glintResetShow' }
		| { type: 'glintSuperShow' }
		| { type: 'glintAnimateShow'; spots: GlintChange[] };
</script>

<script lang="ts">
	// Every tier and the primed state uses artwork; strike retains its existing effect.
	// `under` sits behind symbols; `over` keeps the runtime multiplier text readable.
	import { Tween, prefersReducedMotion } from 'svelte/motion';
	import { onDestroy } from 'svelte';
	import { cubicOut } from 'svelte/easing';

	import * as PIXI from 'pixi.js';

	import { BaseSprite, Container } from 'pixi-svelte';
	import { stateBetDerived } from 'state-shared';
	import { SECOND } from 'constants-shared/time';
	import { waitForTimeout } from 'utils-shared/wait';

	import BoardContainer from './BoardContainer.svelte';
	import GlintTile from './GlintTile.svelte';
	import GlintPrimed from './GlintPrimed.svelte';
	import { getContext } from '../game/context';
	import { SYMBOL_SIZE } from '../game/constants';
	import { CHARACTER_FIRE_DELAY, CHARACTER_MOUTH } from '../game/character';
	import { animate, frameAt } from '../game/motion';

	type Props = { layer: 'under' | 'over' };

	const props: Props = $props();
	const context = getContext();

	type GlintPlayback = GlintChange & { id: number; complete: () => void };
	let nextPlaybackId = 0;
	let playbacks: GlintPlayback[] = $state([]);
	onDestroy(() => playbacks.forEach((playback) => playback.complete()));

	const resetOpacity = new Tween(1);
	const superProgress = new Tween(1);
	let superActive = $state(false);
	// A Glint Strike: fireballs leave the dragon's mouth, arc to the struck spots and burst there.
	let struck: GlintStrikeSpot[] = $state([]);
	let flight = $state(0);
	let impact = $state(-1);
	const FLIGHT = { duration: 380, arc: 46, size: { width: 60, height: 35 } };
	const IMPACT = { duration: 380, size: SYMBOL_SIZE * 1.5 };

	const frames = (key: string) => (context.stateApp.loadedAssets[key] ?? []) as PIXI.Texture[];
	// the dragon's mouth in the board's own units, or off the board's top right where there is
	// no room to show the dragon
	const mouth = $derived.by(() => {
		const board = context.stateGameDerived.boardLayout();
		const character = context.stateGameDerived.characterLayout();
		if (character.placement === 'hidden') return { x: board.width + 80, y: -60 };

		return {
			x:
				character.x -
				character.width / 2 +
				character.width * CHARACTER_MOUTH.x -
				(board.x - board.width / 2),
			y:
				character.y -
				character.height +
				character.height * CHARACTER_MOUTH.y -
				(board.y - board.height / 2),
		};
	});
	const fireball = (spot: GlintStrikeSpot) => {
		const target = { x: (spot.reel + 0.5) * SYMBOL_SIZE, y: (spot.row + 0.5) * SYMBOL_SIZE };
		// held on eight steps along the arc
		const at = frameAt(flight, 8) / 7;
		const textures = frames('fireball');

		return {
			texture: textures[Math.floor(flight * 12) % Math.max(1, textures.length)],
			x: mouth.x + (target.x - mouth.x) * at,
			y: mouth.y + (target.y - mouth.y) * at - Math.sin(Math.PI * at) * FLIGHT.arc,
			rotation: Math.atan2(target.y - mouth.y, target.x - mouth.x),
		};
	};
	const spotAlpha = (reel: number) =>
		resetOpacity.current *
		(superActive
			? prefersReducedMotion.current
				? superProgress.current
				: Math.max(0, Math.min(1, superProgress.current * 7 - reel))
			: 1);

	context.eventEmitter.subscribeOnMount({
		glintStrikeShow: async ({ spots }) => {
			if (props.layer !== 'over') return;
			const timeScale = stateBetDerived.timeScale();
			if (prefersReducedMotion.current) {
				await waitForTimeout((SECOND * 0.4) / timeScale);

				return;
			}
			// the dragon rears first; the fire leaves on its roar
			await waitForTimeout(CHARACTER_FIRE_DELAY / timeScale);
			impact = -1;
			flight = 0;
			struck = spots;
			await animate(FLIGHT.duration, (progress) => (flight = progress));
			// the bursts play out while the spots light
			impact = 0;
			void animate(IMPACT.duration, (progress) => (impact = progress)).then(() => {
				struck = [];
				impact = -1;
			});
		},
		glintAnimateShow: async ({ spots }) => {
			// Superseding an in-flight transition resolves it before replacing it.
			const superseded = playbacks.filter((active) =>
				spots.some((spot) => spot.reel === active.reel && spot.row === active.row),
			);
			superseded.forEach((active) => active.complete());
			const pending: GlintPlayback[] = [];
			const completions = spots.map(
				(spot) =>
					new Promise<void>((resolve) => {
						pending.push({ ...spot, id: ++nextPlaybackId, complete: resolve });
					}),
			);
			playbacks = [...playbacks.filter((active) => !superseded.includes(active)), ...pending];
			await Promise.all(completions);
			const ids = new Set(pending.map((playback) => playback.id));
			playbacks = playbacks.filter((playback) => !ids.has(playback.id));
		},
		glintResetShow: async () => {
			resetOpacity.set(1, { duration: 0 });
			await resetOpacity.set(0, { duration: 250 / stateBetDerived.timeScale(), easing: cubicOut });
		},
		glintSuperShow: async () => {
			superProgress.set(0, { duration: 0 });
			superActive = true;
			await superProgress.set(1, { duration: 800 / stateBetDerived.timeScale() });
			superActive = false;
		},
	});
	$effect(() => {
		if (context.stateGame.glint.every((column) => column.every((value) => value === 0)))
			resetOpacity.set(1, { duration: 0 });
	});
</script>

<BoardContainer>
	{#each context.stateGame.glint as column, reel}
		{#each column as value, row}
			{@const playback = playbacks.find(
				(spot) => spot.reel === reel && spot.row === row && spot.to === value,
			)}
			{#if value >= 2}
				<Container
					x={(reel + 0.5) * SYMBOL_SIZE}
					y={(row + 0.5) * SYMBOL_SIZE}
					alpha={spotAlpha(reel)}
				>
					{#key playback?.id}
						<GlintTile
							layer={props.layer}
							{value}
							animation={playback?.animation}
							previousValue={playback?.from}
							oncomplete={playback?.complete}
						/>
					{/key}
				</Container>
			{:else if value === 1}
				<Container
					x={(reel + 0.5) * SYMBOL_SIZE}
					y={(row + 0.5) * SYMBOL_SIZE}
					alpha={spotAlpha(reel)}
				>
					{#key playback?.id}
						<GlintPrimed
							layer={props.layer}
							animate={playback?.animation === 'prime'}
							oncomplete={playback?.complete}
						/>
					{/key}
				</Container>
			{/if}
		{/each}
	{/each}
	{#if props.layer === 'over'}
		{#each struck as spot}
			{#if impact < 0}
				{@const ball = fireball(spot)}
				{#if ball.texture}
					<BaseSprite
						texture={ball.texture}
						anchor={{ x: 0.75, y: 0.5 }}
						x={ball.x}
						y={ball.y}
						rotation={ball.rotation}
						{...FLIGHT.size}
					/>
				{/if}
			{:else}
				{@const burst = frames('burst')}
				{#if burst.length}
					<BaseSprite
						texture={burst[frameAt(impact, burst.length)]}
						anchor={0.5}
						x={(spot.reel + 0.5) * SYMBOL_SIZE}
						y={(spot.row + 0.5) * SYMBOL_SIZE}
						width={IMPACT.size}
						height={IMPACT.size}
					/>
				{/if}
			{/if}
		{/each}
	{/if}
</BoardContainer>
