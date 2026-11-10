<script lang="ts">
	import type { Snippet } from 'svelte';
	import { untrack } from 'svelte';
	import { Tween } from 'svelte/motion';

	import { Container, Rectangle, Sprite } from 'pixi-svelte';

	import { getSymbolInfo } from '../game/utils';
	import { SYMBOL_SIZE } from '../game/constants';
	import { winPulse } from '../game/symbolMotion';

	type Props = {
		x?: number;
		y?: number;
		symbolInfo: ReturnType<typeof getSymbolInfo>;
		oncomplete?: () => void;
		// drawn on the symbol, and scaled with it
		children?: Snippet;
	};

	const props: Props = $props();
	const scale = new Tween(1);
	const multiplierTier = $derived(
		props.symbolInfo.assetKey === 'symbolMultiplierHigh'
			? 3
			: props.symbolInfo.assetKey === 'symbolMultiplierMid'
				? 2
				: props.symbolInfo.assetKey === 'symbolMultiplierLow'
					? 1
					: 0,
	);

	// completes at once, or after the win beats; a new oncomplete (a new state to finish) reruns it
	$effect(() => {
		const { symbolInfo, oncomplete } = props;

		untrack(async () => {
			if ('pulse' in symbolInfo && symbolInfo.pulse) await winPulse(scale);
			oncomplete?.();
		});
	});
</script>

<Container x={props.x} y={props.y} scale={scale.current}>
	<Sprite
		anchor={0.5}
		key={props.symbolInfo.assetKey}
		width={SYMBOL_SIZE * props.symbolInfo.sizeRatios.width}
		height={SYMBOL_SIZE * props.symbolInfo.sizeRatios.height}
	/>
	<!-- Large tier marks stay legible at board size and remain on collected tokens. -->
	{#each Array(multiplierTier) as _, index}
		<Rectangle
			anchor={0.5}
			x={(index - (multiplierTier - 1) / 2) * SYMBOL_SIZE * 0.125}
			y={SYMBOL_SIZE * 0.26}
			width={SYMBOL_SIZE * 0.075}
			height={SYMBOL_SIZE * 0.09}
			borderRadius={SYMBOL_SIZE * 0.012}
			backgroundColor={0xffefbe}
			borderColor={0x17202e}
			borderWidth={SYMBOL_SIZE * 0.012}
		/>
	{/each}
	{@render props.children?.()}
</Container>
