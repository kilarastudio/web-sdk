<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount, untrack } from 'svelte';
	import { prefersReducedMotion, Tween } from 'svelte/motion';
	import { backOut, cubicOut } from 'svelte/easing';

	import { BaseSprite, Container } from 'pixi-svelte';

	import CoinBurst from './CoinBurst.svelte';
	import FireAround from './FireAround.svelte';
	import { panelLayout, type PanelFace } from '../game/panels';
	import { impact, shake } from '../game/impact.svelte';
	import { winLevelSoundsLand } from '../game/winSounds';
	import type { BigWinLevelData } from '../game/winLevelMap';
	import { fireAround, winPanelTexture } from '../pixel/textures';

	// The panel of a big win, in the frame of the level the count has reached. Each level lands as
	// an event: the frame turns to the new material with a punch, the screen jolts harder than the
	// last time, coins burst from behind the panel, more for each level, and the level's sound and
	// music come in. MAX WIN's frame burns. Without a level (a free spins total too small to
	// celebrate) it is the stone frame, standing still.
	type Props = {
		level?: BigWinLevelData;
		// the levels the count will land on, in order (winClimb)
		levels?: BigWinLevelData[];
		panel: 'celebration' | 'panelFreeSpinsOutro';
		// 1 keeps the game's pixel density
		scale: number;
		children: Snippet<[{ face: PanelFace }]>;
	};

	const props: Props = $props();
	const layout = $derived(panelLayout({ key: props.panel, scale: props.scale }));
	const tier = $derived(props.level?.tier ?? { art: 1 as const, coins: 0, shake: 0 });
	const texture = $derived(winPanelTexture(tier.art, layout.pixels.width, layout.pixels.height));
	const fire = $derived(
		tier.art === 5 ? fireAround(layout.pixels.width, layout.pixels.height) : undefined,
	);

	const still = prefersReducedMotion.current;
	const punch = new Tween(still ? 1 : 0.9);

	onMount(() => {
		punch.set(1, { duration: 320, easing: backOut });
	});

	// the frame of the next level is drawn while this one stands, so its landing never waits on it
	const prepare = (level: BigWinLevelData | undefined) => {
		if (!level) return;
		const { width, height } = layout.pixels;
		winPanelTexture(level.tier.art, width, height);
		if (level.tier.art === 5) fireAround(width, height);
	};

	let landed = 0;
	$effect(() => {
		const level = props.level;
		if (!level || level.level === landed) return;
		const first = landed === 0;
		landed = level.level;
		untrack(() => {
			const upcoming = props.levels?.find((next) => next.level > level.level);
			setTimeout(() => prepare(upcoming), 600);
			winLevelSoundsLand(level);
			shake(level.tier.shake, 260 + level.tier.shake * 60);
			if (first || still) return;
			punch
				.set(1.18, { duration: 90, easing: cubicOut })
				.then(() => punch.set(1, { duration: 300, easing: backOut }));
		});
	});
</script>

<Container x={impact.x} y={impact.y}>
	{#if props.level}
		<CoinBurst level={props.level.level} count={tier.coins} width={layout.sizes.width} />
	{/if}
	<Container scale={punch.current}>
		{#if fire}
			<FireAround
				x={-layout.sizes.width / 2}
				y={-layout.sizes.height / 2}
				width={layout.sizes.width}
				height={layout.sizes.height}
				frames={fire}
			/>
		{/if}
		<BaseSprite {texture} anchor={0.5} width={layout.sizes.width} height={layout.sizes.height} />
		{@render props.children({ face: layout.face })}
	</Container>
</Container>
