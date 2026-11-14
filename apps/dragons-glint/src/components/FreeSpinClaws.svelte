<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';
	import { prefersReducedMotion, Tween } from 'svelte/motion';
	import { backOut, cubicOut, quadIn } from 'svelte/easing';
	import * as PIXI from 'pixi.js';

	import { BaseSprite, Container } from 'pixi-svelte';

	import FireAround from './FireAround.svelte';
	import { getContext } from '../game/context';
	import { ART_PIXEL } from '../game/constants';
	import { impact, shake } from '../game/impact.svelte';
	import { panelLayout, type PanelFace } from '../game/panels';
	import { fireAround, introPanelTexture } from '../pixel/textures';
	import { CELL } from '../pixel/ui';

	// The free spins intro lands like a door slammed shut: it drops in from above, hits with a jolt
	// and a thud, the fire round it catches, the dragon's eye on its crest snaps open, and the
	// dragon behind it rears. Then it waits, burning, and the eye blinks now and then.
	type Props = {
		// 1 keeps the game's pixel density
		scale: number;
		children: Snippet<[{ face: PanelFace }]>;
	};

	const props: Props = $props();
	const context = getContext();
	const layout = $derived(panelLayout({ key: 'panelFreeSpinsIntro', scale: props.scale }));
	const texture = $derived(introPanelTexture(layout.pixels.width, layout.pixels.height));
	const fire = $derived(fireAround(layout.pixels.width, layout.pixels.height));
	const crest = $derived(CELL * ART_PIXEL * props.scale);

	const FALL = 300;
	const BLINK = { every: 3400, frame: 80 };

	const still = prefersReducedMotion.current;
	const drop = new Tween(still ? 0 : -1);
	const punch = new Tween(1);
	let landed = $state(still);
	// shut, half, open, alert: the crest's eye
	let eye = $state<'shut' | 'half' | 'open' | 'alert'>(still ? 'open' : 'shut');

	const eyeTexture = $derived.by(() => {
		const art = context.stateApp.loadedAssets;
		const blink = (art.symbolScatterBlink ?? []) as PIXI.Texture[];
		if (eye === 'shut') return blink[1];
		if (eye === 'half') return blink[0];
		if (eye === 'alert') return (art.symbolScatterAlert as PIXI.Texture[] | undefined)?.[0];
		return art.symbolScatter as PIXI.Texture | undefined;
	});

	const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

	onMount(() => {
		let alive = true;
		let blinking = 0;
		const land = async () => {
			await drop.set(0, { duration: FALL, easing: quadIn });
			if (!alive) return;
			landed = true;
			shake(3, 360);
			context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_fireball_hit' });
			context.eventEmitter.broadcast({ type: 'characterReact', reaction: 'bonus' });
			punch
				.set(1.08, { duration: 70, easing: cubicOut })
				.then(() => punch.set(1, { duration: 280, easing: backOut }));
			eye = 'half';
			await wait(70);
			eye = 'alert';
			await wait(420);
			if (alive) eye = 'open';
		};
		if (!still) void land();
		const blink = async () => {
			if (eye !== 'open') return;
			for (const lid of ['half', 'shut', 'half', 'open'] as const) {
				if (!alive) return;
				eye = lid;
				await wait(BLINK.frame);
			}
		};
		if (!still) blinking = window.setInterval(blink, BLINK.every);

		return () => {
			alive = false;
			clearInterval(blinking);
		};
	});
</script>

<Container
	x={impact.x}
	y={impact.y + drop.current * context.stateLayoutDerived.canvasSizes().height}
>
	<Container scale={punch.current}>
		<!-- mounted from the start, under the frame, and shown as the panel lands -->
		<Container alpha={landed ? 1 : 0}>
			<FireAround
				x={-layout.sizes.width / 2}
				y={-layout.sizes.height / 2}
				width={layout.sizes.width}
				height={layout.sizes.height}
				frames={fire}
			/>
		</Container>
		<BaseSprite {texture} anchor={0.5} width={layout.sizes.width} height={layout.sizes.height} />
		{#if eyeTexture}
			<BaseSprite
				texture={eyeTexture}
				anchor={0.5}
				y={-layout.sizes.height / 2}
				width={crest}
				height={crest}
			/>
		{/if}
		{@render props.children({ face: layout.face })}
	</Container>
</Container>
