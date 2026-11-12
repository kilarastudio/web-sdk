<script lang="ts" module>
	export type EmitterEventBoardFrame =
		{ type: 'boardFrameGlowShow' } | { type: 'boardFrameGlowHide' };
</script>

<script lang="ts">
	import * as PIXI from 'pixi.js';

	import { Sprite } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';

	import { getContext } from '../game/context';
	import { BOARD_FRAME } from '../game/constants';
	import { impact } from '../game/impact.svelte';
	import FireAround from './FireAround.svelte';

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

	// during free spins the frame burns
	const frames = (key: string) => (context.stateApp.loadedAssets[key] ?? []) as PIXI.Texture[];
	const fire = $derived({
		top: frames('boardFireTop'),
		left: frames('boardFireLeft'),
		right: frames('boardFireRight'),
	});

	let burning = $state(false);

	context.eventEmitter.subscribeOnMount({
		boardFrameGlowShow: () => (burning = true),
		boardFrameGlowHide: () => (burning = false),
	});
</script>

<FadeContainer show={burning} duration={400}>
	<FireAround {...frame} frames={fire} />
</FadeContainer>

<Sprite key="boardFloor" {...floor} />
<Sprite key="boardFrame" {...frame} />
