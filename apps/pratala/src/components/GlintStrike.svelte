<script lang="ts">
	import { untrack } from 'svelte';
	import * as PIXI from 'pixi.js';

	import { BaseSprite } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { FRAME_ART_PIXEL } from '../game/constants';
	import { glintTier } from '../game/glint';
	import { frameAt } from '../game/motion';
	import { random } from '../pixel/ui';

	type Props = {
		// the value before the strike and after it
		from: number;
		to: number;
		// how far through the strike, 0 to 1
		progress: number;
	};

	const props: Props = $props();
	const context = getContext();

	// A spot struck: a doubling throws a white-hot ring round the cell and a burst of solid ember
	// clumps, and the old value cracks in three and drifts apart in the cell's top half; a new tier
	// is heavier: a ring in the new tier and a broken shock ring further out, the old tile breaking
	// into chunks, more and bigger clumps. Everything moves in held poses, by whole art pixels, and
	// nothing bends. Sizes in art pixels on the 64 grid.
	const U = FRAME_ART_PIXEL;
	const POSES = 6;
	const from = untrack(() => props.from);
	const to = untrack(() => props.to);
	const tierUp = glintTier(to) > glintTier(from) && from >= 2;
	const next = random(to * 131 + from * 7 + 3);
	const between = (low: number, high: number) => low + next() * (high - low);

	const textures = (key: string) => (context.stateApp.loadedAssets[key] ?? []) as PIXI.Texture[];
	const texture = (key: string) => context.stateApp.loadedAssets[key] as PIXI.Texture | undefined;

	type Flier = { key: string; index: number; angle: number; reach: number; start: number };
	// ember clumps: of the fire, and of the new tier for a tier-up; bigger near the cell
	const CLUMPS = tierUp ? 16 : 11;
	const clumps: Flier[] = Array.from({ length: CLUMPS }, (_, i) => {
		const angle = (i / CLUMPS) * Math.PI * 2 + between(-0.25, 0.25);
		const reach = between(0.45, 1) * (tierUp ? 78 : 58);
		const kind = Math.floor(next() * 3);
		const size = tierUp ? 2 + Math.floor(next() * 4) : 1 + Math.floor(next() * 3);
		return tierUp && kind === 1
			? { key: `glintClump${glintTier(to)}`, index: size, angle, reach, start: 30 }
			: {
					key: 'glintClumpFire',
					index: (tierUp ? kind : kind % 2) * 6 + size,
					angle,
					reach,
					start: 26,
				};
	});
	// the old tile's border breaking into chunks
	const chunks: Flier[] = tierUp
		? Array.from({ length: 12 }, (_, i) => ({
				key: `glintChunk${glintTier(from)}`,
				index: Math.floor(next() * 3),
				angle: (i / 12) * Math.PI * 2 + between(-0.2, 0.2),
				reach: between(36, 52),
				start: 28,
			}))
		: [];

	const pose = $derived(frameAt(props.progress, POSES) / (POSES - 1));
	const out = $derived(1 - (1 - pose) ** 2);
	// solid until late, then gone in two steps
	const fade = $derived(pose < 0.7 ? 1 : pose < 0.9 ? 0.5 : 0);
	const place = (flier: Flier) => {
		const reach = flier.start + (flier.reach - flier.start) * out;
		return {
			x: Math.round(Math.cos(flier.angle) * reach) * U,
			y: Math.round(Math.sin(flier.angle) * reach * 0.85 + 10 * pose * pose) * U,
		};
	};
	const sized = (t: PIXI.Texture | undefined) => ({
		width: (t?.width ?? 0) * U,
		height: (t?.height ?? 0) * U,
	});
	// the old value's three pieces drift apart from where it stood, in the cell's top half
	const DRIFT = [
		[-10, 6],
		[0, -4],
		[10, 7],
	];
	const broken = $derived(textures(`glintBroken${from}`));
	const ring = $derived(texture(tierUp ? `glintTierRing${glintTier(to)}` : 'glintStrikeRing'));
	const shock = $derived(tierUp ? texture(`glintShockRing${glintTier(to)}`) : undefined);
</script>

{#if ring && pose < 0.8}
	<BaseSprite texture={ring} anchor={0.5} {...sized(ring)} alpha={pose < 0.6 ? 1 : 0.5} />
{/if}
{#if shock && pose > 0.15 && pose < 0.75}
	<BaseSprite texture={shock} anchor={0.5} {...sized(shock)} />
{/if}
{#each broken as piece, index}
	<BaseSprite
		texture={piece}
		anchor={0.5}
		{...sized(piece)}
		x={Math.round(DRIFT[index][0] * out) * U}
		y={(-32 + 2 + piece.height / 2 + Math.round(DRIFT[index][1] * out) - (tierUp ? 4 : 0)) * U}
		alpha={pose < 0.5 ? 1 : pose < 0.8 ? 0.6 : 0.3}
	/>
{/each}
{#each [...chunks, ...clumps] as flier}
	{@const t = textures(flier.key)[flier.index]}
	{#if t && fade > 0}
		<BaseSprite texture={t} anchor={0.5} {...sized(t)} {...place(flier)} alpha={fade} />
	{/if}
{/each}
