<script lang="ts">
	import { Container, Rectangle, Text } from 'pixi-svelte';

	import type { SymbolName } from '../game/types';
	import { SYMBOL_SIZE, SYMBOL_LOOK, FONT, GREY, isCrew } from '../game/constants';

	// Grey box: one cell's square, drawn the same on the reels and in the crew layer. A crew
	// member shows its letter and its multiplier ("S ×12"); a sticky one carries a dark STICKY tab.
	type Props = {
		name: SymbolName;
		multiplier?: number;
		sticky?: boolean;
		marked?: boolean;
	};

	const props: Props = $props();
	const look = $derived(SYMBOL_LOOK[props.name]);
	const crew = $derived(isCrew(props.name));
	const BOX = SYMBOL_SIZE * 0.88;
	const label = $derived(
		crew && props.multiplier ? `${look.label} ×${props.multiplier}` : look.label,
	);
	const fontSize = $derived(
		SYMBOL_SIZE *
			(label.length > 6 ? 0.17 : label.length > 4 ? 0.22 : label.length > 2 ? 0.28 : 0.34),
	);
</script>

<Container>
	<Rectangle
		anchor={0.5}
		width={BOX}
		height={BOX}
		backgroundColor={look.fill}
		borderColor={props.marked ? GREY.text : (look.edge ?? GREY.board)}
		borderWidth={props.marked ? 7 : look.edge ? 3 : 1}
	/>
	{#if props.marked && look.fill === GREY.crew}
		<!-- a white square cannot show a white edge: a win on a crew member is marked dark -->
		<Rectangle
			anchor={0.5}
			width={BOX - 14}
			height={BOX - 14}
			backgroundAlpha={0}
			borderColor={GREY.textDark}
			borderWidth={4}
		/>
	{/if}
	<Text
		anchor={0.5}
		y={props.sticky ? SYMBOL_SIZE * 0.08 : 0}
		text={label}
		style={{ fontFamily: FONT, fontSize, fontWeight: '800', fill: look.text }}
	/>
	{#if props.sticky}
		<Rectangle
			anchor={{ x: 0.5, y: 0 }}
			y={-BOX / 2}
			width={BOX}
			height={SYMBOL_SIZE * 0.22}
			backgroundColor={GREY.textDark}
		/>
		<Text
			anchor={0.5}
			y={-BOX / 2 + SYMBOL_SIZE * 0.11}
			text="STICKY"
			style={{ fontFamily: FONT, fontSize: SYMBOL_SIZE * 0.13, fontWeight: '700', fill: GREY.text }}
		/>
	{/if}
</Container>
