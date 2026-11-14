<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	import { backOut, cubicOut, quadOut } from 'svelte/easing';

	import { BaseSprite, Container, Rectangle } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { anticipation } from '../game/anticipation.svelte';
	import { ART_PIXEL } from '../game/constants';
	import { impact, shake } from '../game/impact.svelte';
	import { animate } from '../game/motion';
	import { panelLayout, type PanelFace } from '../game/panels';
	import { clawMarks } from '../pixel/textures';

	// The free spins intro is the dragon's own mark, and nothing like a win: three claws rake
	// across the board, one after another, each with a jolt, and leave it scarred and glowing.
	// Then the words land in the marks white-hot and cool to gold, as the marks cool to embers
	// that go on breathing while the intro waits. No panel, no bed of fire.
	// (0, 0) is the board's middle; `face` is the room the words are laid out in.
	type Props = {
		// 1 keeps the game's pixel density
		scale: number;
		children: Snippet<[{ face: PanelFace }]>;
	};

	const props: Props = $props();
	const context = getContext();
	const layout = $derived(panelLayout({ key: 'panelFreeSpinsIntro', scale: props.scale }));
	const marks = clawMarks();

	const RAKE = 130; // one claw crossing the board
	const BETWEEN = 150; // from one claw to the next
	const WORDS = 260; // the words landing
	const COOL = 1500; // white-hot to gold, molten to embers
	const EMBERS = { low: 0.34, swing: 0.12, period: 2400 };

	const still = prefersReducedMotion.current;
	// how far each claw has raked, how hot its mark is, and the words: there, their size, their heat
	const raked = $state(marks.map(() => (still ? 1 : 0)));
	let molten = $state(still ? EMBERS.low : 1);
	let words = $state(still ? 1 : 0);
	let size = $state(1);
	let hot = $state(0);

	const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

	onMount(() => {
		if (still) {
			anticipation.hush = 1;

			return () => (anticipation.hush = 0);
		}
		let alive = true;
		let request = 0;
		const run = async () => {
			for (const index of marks.keys()) {
				if (!alive) return;
				context.eventEmitter.broadcast({
					type: 'soundOnce',
					name: 'sfx_claw_rake',
					forcePlay: true,
				});
				shake(index === 1 ? 3 : 2, 180);
				void animate(RAKE, (progress) => (raked[index] = quadOut(progress)), {
					timeScaled: false,
				});
				await wait(BETWEEN);
			}
			await wait(120);
			if (!alive) return;
			context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_brand_land' });
			shake(3, 320);
			void animate(
				WORDS,
				(progress) => {
					words = Math.min(1, progress * 3);
					// the scatters step back as the words land over them
					anticipation.hush = progress;
					size = 1.16 - 0.16 * backOut(progress);
				},
				{ timeScaled: false },
			);
			hot = 1;
			await animate(
				COOL,
				(progress) => {
					hot = 1 - cubicOut(progress);
					molten = 1 - (1 - EMBERS.low) * cubicOut(progress);
				},
				{ timeScaled: false },
			);
			// the embers breathe
			const start = performance.now();
			const breathe = (now: number) => {
				if (!alive) return;
				request = requestAnimationFrame(breathe);
				molten =
					EMBERS.low +
					EMBERS.swing * 0.5 * (1 - Math.cos(((now - start) / EMBERS.period) * Math.PI * 2));
			};
			request = requestAnimationFrame(breathe);
		};
		void run();

		return () => {
			alive = false;
			anticipation.hush = 0;
			cancelAnimationFrame(request);
		};
	});
</script>

<Container x={impact.x} y={impact.y}>
	{#each marks as mark, index}
		{@const width = mark.width * ART_PIXEL}
		{@const height = mark.height * ART_PIXEL}
		<Container x={mark.x * ART_PIXEL - width / 2} y={mark.y * ART_PIXEL - height / 2}>
			<!-- shown from the right, where the claw lands, to the left -->
			<Rectangle isMask x={width * (1 - raked[index])} width={width * raked[index]} {height} />
			<BaseSprite texture={mark.scar} {width} {height} />
			<BaseSprite texture={mark.glow} {width} {height} alpha={molten} />
		</Container>
	{/each}

	<Container scale={size} alpha={words}>
		{@render props.children({ face: layout.face })}
		{#if hot > 0}
			<Container blendMode="add" alpha={hot}>
				{@render props.children({ face: layout.face })}
			</Container>
		{/if}
	</Container>
</Container>
