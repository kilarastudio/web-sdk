<script lang="ts">
	import { Container, Rectangle, Text } from 'pixi-svelte';

	import type { SymbolName } from '../game/types';
	import { SYMBOL_SIZE, SYMBOL_LOOK, FONT, GREY, lotLabel } from '../game/constants';

	// Grey box: one cell's square, drawn the same on the reels and on the auction board. A lot
	// shows its value ("5×").
	type Props = {
		name: SymbolName;
		prize?: number;
		marked?: boolean;
	};

	const props: Props = $props();
	const look = $derived(SYMBOL_LOOK[props.name]);
	const BOX = SYMBOL_SIZE * 0.88;
	const label = $derived(props.name === 'P' && props.prize ? lotLabel(props.prize) : look.label);
	const fontSize = $derived(
		SYMBOL_SIZE *
			(label.length > 5 ? 0.2 : label.length > 3 ? 0.25 : label.length > 2 ? 0.3 : 0.36),
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
	{#if props.marked && look.fill === 0xffffff}
		<!-- a white square cannot show a white edge: a win on the wild is marked dark -->
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
		text={label}
		style={{ fontFamily: FONT, fontSize, fontWeight: '800', fill: look.text }}
	/>
</Container>
