<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount, untrack } from 'svelte';
	import { prefersReducedMotion, Tween } from 'svelte/motion';
	import { backOut, cubicOut } from 'svelte/easing';

	import { Container } from 'pixi-svelte';

	import CoinBurst from './CoinBurst.svelte';
	import FireBed from './FireBed.svelte';
	import { panelLayout, type PanelFace } from '../game/panels';
	import { impact, shake } from '../game/impact.svelte';
	import { clearHallMood, landHallMood } from '../game/hallMood.svelte';
	import { winLevelSoundsLand } from '../game/winSounds';
	import type { BigWinLevelData } from '../game/winLevelMap';

	// A big win, with no panel: the level and the amount stand in a bed of fire. Each level lands
	// as an event: the fire leaps and from then on burns wider and higher than the last, the
	// screen jolts harder, coins burst out of the fire, more for each level, and the level's sound
	// and music come in. Without a level (a free spins total too small to celebrate) the fire
	// burns low.
	type Props = {
		level?: BigWinLevelData;
		// the levels the count will land on, in order (winClimb)
		levels?: BigWinLevelData[];
		// whose place the words are laid out in
		panel: 'celebration' | 'panelFreeSpinsOutro';
		// 1 keeps the game's pixel density
		scale: number;
		children: Snippet<[{ face: PanelFace }]>;
	};

	const props: Props = $props();
	const layout = $derived(panelLayout({ key: props.panel, scale: props.scale }));
	const tier = $derived(props.level?.tier ?? { art: 0, coins: 0, shake: 0 });
	// the bed is drawn once, in art pixels; each level burns it bigger
	const BED = { length: 340, depth: 80, under: 14 };
	const grow = $derived(((0.7 + 0.13 * tier.art) * layout.sizes.width) / (BED.length * 0.62 * 2.5));

	const still = prefersReducedMotion.current;
	const punch = new Tween(still ? 1 : 0.9);

	onMount(() => {
		punch.set(1, { duration: 320, easing: backOut });

		// the hall settles when the win leaves
		return clearHallMood;
	});

	let landed = 0;
	$effect(() => {
		const level = props.level;
		if (!level || level.level === landed) return;
		const first = landed === 0;
		landed = level.level;
		untrack(() => {
			winLevelSoundsLand(level);
			// the hall answers each level in its own way (game/hallMood.svelte.ts)
			landHallMood(level.tier.art);
			shake(level.tier.shake, 260 + level.tier.shake * 60);
			if (first || still) return;
			punch
				.set(1.18, { duration: 90, easing: cubicOut })
				.then(() => punch.set(1, { duration: 300, easing: backOut }));
		});
	});
</script>

<Container x={impact.x} y={impact.y}>
	<Container y={layout.sizes.height * 0.42}>
		<FireBed {...BED} flare={props.level?.level ?? 0} {grow} />
	</Container>
	{#if props.level}
		<CoinBurst level={props.level.level} count={tier.coins} width={layout.sizes.width} />
	{/if}
	<Container scale={punch.current}>
		{@render props.children({ face: layout.face })}
	</Container>
</Container>
