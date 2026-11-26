<script lang="ts" module>
	export type EmitterEventWinLines =
		| { type: 'winLineShow'; lineIndex: number; kind: number; label: string }
		| { type: 'winLineHide' };
</script>

<script lang="ts">
	import { Container, Graphics, Rectangle, Text } from 'pixi-svelte';

	import BoardContainer from './BoardContainer.svelte';
	import { getContext } from '../game/context';
	import config from '../game/config';
	import { SYMBOL_SIZE, BOARD_SIZES, FONT, GREY } from '../game/constants';

	// Grey box: the line being paid is drawn through the board, solid over the symbols that pay
	// and thin over the rest, with what it pays on a tab under the board.
	const context = getContext();
	const LINES = config.paylines as Record<string, number[]>;

	let line = $state<{ rows: number[]; kind: number; label: string; lineIndex: number }>();

	context.eventEmitter.subscribeOnMount({
		winLineShow: ({ lineIndex, kind, label }) => {
			line = { rows: LINES[String(lineIndex)] ?? [], kind, label, lineIndex };
		},
		winLineHide: () => (line = undefined),
	});

	const point = (reel: number, row: number) => ({
		x: (reel + 0.5) * SYMBOL_SIZE,
		y: (row + 0.5) * SYMBOL_SIZE,
	});
</script>

{#if line}
	{@const shown = line}
	<BoardContainer>
		<Graphics
			draw={(graphics) => {
				const points = shown.rows.map((row, reel) => point(reel, row));
				graphics.moveTo(points[0].x, points[0].y);
				points.slice(1).forEach((p, index) => {
					graphics.lineTo(p.x, p.y);
					graphics.stroke({ color: GREY.text, width: index + 1 < shown.kind ? 8 : 3, alpha: 0.9 });
					graphics.moveTo(p.x, p.y);
				});
				points.slice(0, shown.kind).forEach((p) => graphics.circle(p.x, p.y, 9).fill(GREY.text));
			}}
		/>
		<Container x={BOARD_SIZES.width / 2} y={BOARD_SIZES.height + 14}>
			<Rectangle
				anchor={{ x: 0.5, y: 0 }}
				width={BOARD_SIZES.width * 0.9}
				height={46}
				backgroundColor={GREY.text}
			/>
			<Text
				anchor={{ x: 0.5, y: 0.5 }}
				y={23}
				text={shown.label}
				style={{ fontFamily: FONT, fontSize: 26, fontWeight: '700', fill: GREY.textDark }}
			/>
		</Container>
	</BoardContainer>
{/if}
