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

	import { Container, Circle } from 'pixi-svelte';
	import { stateBetDerived } from 'state-shared';
	import { SECOND } from 'constants-shared/time';
	import { waitForTimeout } from 'utils-shared/wait';

	import BoardContainer from './BoardContainer.svelte';
	import GlintTile from './GlintTile.svelte';
	import GlintPrimed from './GlintPrimed.svelte';
	import { getContext } from '../game/context';
	import { SYMBOL_SIZE } from '../game/constants';
	import { GLINT_TIERS, glintTier } from '../game/glint';

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
	let struck: GlintStrikeSpot[] = $state([]);
	const strikePulse = new Tween(0);
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
			struck = spots;
			strikePulse.set(0, { duration: 0 });
			await strikePulse.set(1, {
				duration: (SECOND * 0.6) / stateBetDerived.timeScale(),
				easing: cubicOut,
			});
			await waitForTimeout((SECOND * 0.3) / stateBetDerived.timeScale());
			struck = [];
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
			<Circle
				x={(spot.reel + 0.5) * SYMBOL_SIZE}
				y={(spot.row + 0.5) * SYMBOL_SIZE}
				anchor={0.5}
				diameter={SYMBOL_SIZE * (0.4 + 0.8 * strikePulse.current)}
				backgroundAlpha={0}
				borderColor={GLINT_TIERS[glintTier(spot.value)].color}
				borderWidth={6}
				borderAlpha={1 - strikePulse.current * 0.7}
			/>
		{/each}
	{/if}
</BoardContainer>
