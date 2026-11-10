<script lang="ts" module>
	export type EmitterEventBoardFrame =
		{ type: 'boardFrameGlowShow' } | { type: 'boardFrameGlowHide' };
</script>

<script lang="ts">
	import { NineSliceSprite, Rectangle } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';

	import { getContext } from '../game/context';
	import { BOARD_FRAME } from '../game/constants';

	const context = getContext();
	// the symbols sit on a dark enamel backing, which runs a little under the frame
	const BACKING = { color: 0x10171d, alpha: 0.92, overlap: 4 };

	const board = $derived(context.stateGameDerived.boardLayout());
	// the opening round the symbols, its top left corner and sizes
	const opening = $derived({
		x: board.x - board.width * 0.5 - BOARD_FRAME.padding,
		y: board.y - board.height * 0.5 - BOARD_FRAME.padding,
		width: board.width + BOARD_FRAME.padding * 2,
		height: board.height + BOARD_FRAME.padding * 2,
	});
	// the nine-slice is laid out in source pixels and scaled down as a whole, so its corners keep
	// their proportions
	const frame = $derived.by(() => {
		const { slices, scale } = BOARD_FRAME;

		return {
			x: opening.x - slices.left * scale,
			y: opening.y - slices.top * scale,
			width: opening.width / scale + slices.left + slices.right,
			height: opening.height / scale + slices.top + slices.bottom,
			scale,
			leftWidth: slices.left,
			topHeight: slices.top,
			rightWidth: slices.right,
			bottomHeight: slices.bottom,
		};
	});

	let showGlow = $state(false);

	context.eventEmitter.subscribeOnMount({
		boardFrameGlowShow: () => (showGlow = true),
		boardFrameGlowHide: () => (showGlow = false),
	});
</script>

<FadeContainer show={showGlow} duration={400}>
	{#each [{ width: 24, alpha: 0.06 }, { width: 14, alpha: 0.14 }, { width: 4, alpha: 0.65 }] as band}
		<Rectangle
			x={board.x}
			y={board.y}
			anchor={0.5}
			width={board.width +
				BOARD_FRAME.padding * 2 +
				(BOARD_FRAME.border.left + BOARD_FRAME.border.right) * BOARD_FRAME.scale}
			height={board.height +
				BOARD_FRAME.padding * 2 +
				(BOARD_FRAME.border.top + BOARD_FRAME.border.bottom) * BOARD_FRAME.scale}
			borderRadius={8}
			backgroundAlpha={0}
			borderColor={0xffbf43}
			borderWidth={band.width}
			borderAlpha={band.alpha}
		/>
	{/each}
</FadeContainer>

<Rectangle
	x={opening.x - BACKING.overlap}
	y={opening.y - BACKING.overlap}
	width={opening.width + BACKING.overlap * 2}
	height={opening.height + BACKING.overlap * 2}
	backgroundColor={BACKING.color}
	backgroundAlpha={BACKING.alpha}
/>

<NineSliceSprite key="boardFrame" {...frame} />
