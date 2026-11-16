<script lang="ts" module>
	// a column has come to rest; row is the lowest cell that landed
	export type EmitterEventReelDust = {
		type: 'reelLand';
		reelIndex: number;
		row: number;
		anticipated: boolean;
	};
</script>

<script lang="ts">
	import { prefersReducedMotion } from 'svelte/motion';
	import * as PIXI from 'pixi.js';

	import { BaseSprite } from 'pixi-svelte';
	import { stateBetDerived } from 'state-shared';

	import { getContext } from '../game/context';
	import { ART_PIXEL, SYMBOL_SIZE } from '../game/constants';
	import { knock } from '../game/impact.svelte';
	import { getSymbolX } from '../game/utils';

	// A column that comes to rest hits the tray: the board jolts by a pixel and a puff of stone dust
	// is knocked off the floor at the foot of the cell that landed, solid flecks that jump and fall
	// back. The anticipated column, which has been held back on a scatter, lands harder. Drawn in
	// the board's own units, inside BoardContainer, on its art-pixel grid.
	const LAND = {
		normal: { jolt: 1, ms: 120, flecks: [8, 10], rise: [5, 14], spread: [6, 18] },
		anticipated: { jolt: 2, ms: 180, flecks: [14, 18], rise: [8, 22], spread: [10, 26] },
	};
	// life of a fleck in ms; it fades only over the last part of it
	const LIFE = [290, 370];
	const FADE_FROM = 0.7;
	// the frame's stone greys; the darkest are lost on the floor, so the dust is the lit ones
	const STONE = [0xb4b4b4, 0xb4b4b4, 0x858585, 0x858585];
	// how far a fleck can start from the middle of its column (about the width of a symbol's foot,
	// so the dust is seen to come out from under it) and how far above the cell's foot, in art pixels
	const SOURCE = { reach: 16, lift: 2 };
	// a column's symbols land within this long of each other; only the first landing counts
	const COLUMN_SETTLE = 300;

	const context = getContext();
	const pixel = $derived(
		(context.stateApp.loadedAssets.pixel ?? PIXI.Texture.EMPTY) as PIXI.Texture,
	);

	type Fleck = {
		x: number;
		y: number;
		from: number;
		life: number;
		rise: number;
		spread: number;
		tint: number;
	};
	let flecks = $state<Fleck[]>([]);
	let now = $state(0);
	let request = 0;

	const between = ([low, high]: number[]) => low + Math.random() * (high - low);
	const snap = (value: number) => Math.round(value / ART_PIXEL) * ART_PIXEL;

	const tick = (time: number) => {
		now = time;
		flecks = flecks.filter((fleck) => time < fleck.from + fleck.life);
		request = flecks.length ? requestAnimationFrame(tick) : 0;
	};

	const land = (reelIndex: number, row: number, anticipated: boolean) => {
		if (prefersReducedMotion.current) return;
		const hit = anticipated ? LAND.anticipated : LAND.normal;
		knock(hit.jolt, hit.ms);
		const start = performance.now();
		const timeScale = stateBetDerived.timeScale();
		const middle = getSymbolX(reelIndex);
		const foot = (row + 1) * SYMBOL_SIZE - SOURCE.lift * ART_PIXEL;
		const count = Math.round(between(hit.flecks));
		flecks = [
			...flecks,
			...Array.from({ length: count }, () => {
				const offset = (Math.random() * 2 - 1) * SOURCE.reach;

				return {
					x: middle + offset * ART_PIXEL,
					y: foot,
					from: start,
					life: between(LIFE) / timeScale,
					rise: between(hit.rise) * ART_PIXEL,
					// outward from the middle of the column, as if knocked out from under the symbol
					spread: Math.sign(offset || 1) * between(hit.spread) * ART_PIXEL,
					tint: STONE[Math.floor(Math.random() * STONE.length)],
				};
			}),
		];
		if (!request) request = requestAnimationFrame(tick);
	};

	// Landings arrive from the reels (stateGame's reel stop: a spinning column is at rest when its
	// bottom cell lands, and it is still marked anticipated then) and from a tumble's refill, one
	// for each symbol that falls into place. A column's symbols land within a moment of each other:
	// only its first landing knocks dust off, from the lowest cell that landed in that frame.
	const waiting = new Map<number, { row: number; anticipated: boolean }>();
	const settledAt: number[] = [];
	let collecting = 0;
	const collect = () => {
		collecting = 0;
		const time = performance.now();
		for (const [reelIndex, { row, anticipated }] of waiting) {
			if (time - (settledAt[reelIndex] ?? -Infinity) < COLUMN_SETTLE) continue;
			settledAt[reelIndex] = time;
			land(reelIndex, row, anticipated);
		}
		waiting.clear();
	};

	context.eventEmitter.subscribeOnMount({
		reelLand: ({ reelIndex, row, anticipated }) => {
			const known = waiting.get(reelIndex);
			waiting.set(reelIndex, {
				row: Math.max(row, known?.row ?? -1),
				anticipated: anticipated || !!known?.anticipated,
			});
			if (!collecting) collecting = requestAnimationFrame(collect);
		},
	});

	$effect(() => () => cancelAnimationFrame(collecting));
	$effect(() => () => cancelAnimationFrame(request));
</script>

{#each flecks as fleck}
	{@const age = (now - fleck.from) / fleck.life}
	{#if age >= 0 && age < 1}
		<BaseSprite
			texture={pixel}
			tint={fleck.tint}
			alpha={age < FADE_FROM ? 1 : (1 - age) / (1 - FADE_FROM)}
			x={snap(fleck.x + fleck.spread * age)}
			y={snap(fleck.y - 4 * fleck.rise * age * (1 - age))}
			width={ART_PIXEL}
			height={ART_PIXEL}
		/>
	{/if}
{/each}
