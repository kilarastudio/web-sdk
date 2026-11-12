<script lang="ts" module>
	export type EmitterEventBoardFrame =
		{ type: 'boardFrameGlowShow' } | { type: 'boardFrameGlowHide' };
</script>

<script lang="ts">
	import { Rectangle, Sprite } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';

	import { getContext } from '../game/context';
	import { ART_PIXEL, BOARD_FRAME } from '../game/constants';
	import { pixelClock } from '../game/pixelClock.svelte';
	import { impact } from '../game/impact.svelte';

	const context = getContext();

	const board = $derived(context.stateGameDerived.boardLayout());
	// the flagstones the symbols land on, and the stone frame round them, both drawn by code
	// the floor and the frame shake with the board
	const floor = $derived({
		x: board.x - board.width * 0.5 + impact.x,
		y: board.y - board.height * 0.5 + impact.y,
		width: board.width,
		height: board.height,
	});
	const frame = $derived({
		x: floor.x - BOARD_FRAME.border,
		y: floor.y - BOARD_FRAME.border,
		width: floor.width + BOARD_FRAME.border * 2,
		height: floor.height + BOARD_FRAME.border * 2,
	});

	let showGlow = $state(false);
	// during free spins the frame burns: three bands of fire that breathe on the pixel clock
	const breath = $derived([0.7, 0.8, 0.9, 1, 0.9, 0.8][pixelClock.frame % 6]);

	context.eventEmitter.subscribeOnMount({
		boardFrameGlowShow: () => (showGlow = true),
		boardFrameGlowHide: () => (showGlow = false),
	});
</script>

<FadeContainer show={showGlow} duration={400}>
	{#each [{ reach: 5, color: 0x8e251d, alpha: 0.5 }, { reach: 3, color: 0xff5000, alpha: 0.75 }, { reach: 1, color: 0xffa214, alpha: 1 }] as band}
		<Rectangle
			x={frame.x - band.reach * ART_PIXEL}
			y={frame.y - band.reach * ART_PIXEL}
			width={frame.width + band.reach * ART_PIXEL * 2}
			height={frame.height + band.reach * ART_PIXEL * 2}
			backgroundColor={band.color}
			backgroundAlpha={band.alpha * breath}
		/>
	{/each}
</FadeContainer>

<Sprite key="boardFloor" {...floor} />
<Sprite key="boardFrame" {...frame} />
