<script lang="ts">
	import { untrack } from 'svelte';
	import { Tween } from 'svelte/motion';

	import { Container, Rectangle, Text } from 'pixi-svelte';
	import { stateBetDerived } from 'state-shared';

	import type { SymbolState, RawSymbol } from '../game/types';
	import { SYMBOL_SIZE, SYMBOL_LOOK, SIDE_GLYPH, FONT, GREY } from '../game/constants';

	// Grey box: a symbol is a square in its own shade of grey with its math name on it, and its
	// side's mark (▲ phoenix, ▼ dragon) in the top left corner. A win is a short swell with a
	// white edge; leaving the board is a quick shrink.
	type Props = {
		x?: number;
		y?: number;
		state: SymbolState;
		rawSymbol: RawSymbol;
		oncomplete?: () => void;
	};

	const props: Props = $props();
	const look = $derived(SYMBOL_LOOK[props.rawSymbol.name]);
	const marked = $derived(['win', 'postWinStatic', 'explosion'].includes(props.state));
	const BOX = SYMBOL_SIZE * 0.88;
	const scale = new Tween(1);
	const alpha = new Tween(1);

	const play = async (state: SymbolState) => {
		const speed = stateBetDerived.timeScale();
		if (state === 'win') {
			await scale.set(1.14, { duration: 140 / speed });
			await scale.set(1, { duration: 180 / speed });
			props.oncomplete?.();
		} else if (state === 'explosion') {
			await Promise.all([
				scale.set(0.2, { duration: 170 / speed }),
				alpha.set(0, { duration: 170 / speed }),
			]);
			props.oncomplete?.();
		} else {
			scale.set(1, { duration: 0 });
			alpha.set(1, { duration: 0 });
			if (state === 'land') props.oncomplete?.();
		}
	};

	$effect(() => {
		const state = props.state;
		untrack(() => play(state));
	});
</script>

<Container x={props.x} y={props.y} scale={scale.current} alpha={alpha.current}>
	<Rectangle
		anchor={0.5}
		width={BOX}
		height={BOX}
		backgroundColor={look.fill}
		borderColor={marked ? GREY.text : GREY.board}
		borderWidth={marked ? 5 : 1}
	/>
	<Text
		anchor={0.5}
		text={look.label}
		style={{ fontFamily: FONT, fontSize: SYMBOL_SIZE * 0.34, fontWeight: '700', fill: look.text }}
	/>
	{#if look.side}
		<Text
			anchor={0}
			x={-BOX / 2 + SYMBOL_SIZE * 0.06}
			y={-BOX / 2 + SYMBOL_SIZE * 0.03}
			text={SIDE_GLYPH[look.side]}
			style={{ fontFamily: FONT, fontSize: SYMBOL_SIZE * 0.2, fontWeight: '700', fill: look.text }}
		/>
	{/if}
</Container>
