<script lang="ts">
	// The Dragon's Gaze. Nothing is thrown at the board, as in a Glint Strike: a slit of light the
	// shape of the dragon's pupil comes down each reel it looks along, one row at a time, and stays
	// on the reel until its last spot has doubled. Then it thins out and is gone.
	import * as PIXI from 'pixi.js';

	import { BaseSprite } from 'pixi-svelte';

	import BoardContainer from './BoardContainer.svelte';
	import { getContext } from '../game/context';
	import { BOARD_DIMENSIONS, SYMBOL_SIZE } from '../game/constants';
	import { GAZE_FADE_MS, GAZE_ROW_MS } from '../game/glint';
	import { animate, frameAt } from '../game/motion';
	import { pixelClock } from '../game/pixelClock.svelte';

	const context = getContext();
	const ROWS = BOARD_DIMENSIONS.y;
	// how solid the gaze is as it leaves, in held poses
	const LEAVE = [1, 0.7, 0.45, 0.2, 0];

	let reels: number[] = $state([]);
	// the row the front of the gaze is on; ROWS once it has reached the floor
	let front = $state(0);
	let alpha = $state(1);

	const frames = (key: string) => (context.stateApp.loadedAssets[key] ?? []) as PIXI.Texture[];
	const body = $derived(frames('gazeBeam'));
	const head = $derived(frames('gazeBeamHead'));
	const shimmer = $derived(pixelClock.frame % 2);

	context.eventEmitter.subscribeOnMount({
		glintGazeShow: async ({ reels: gazed }) => {
			reels = gazed;
			alpha = 1;
			front = 0;
			await animate(GAZE_ROW_MS * ROWS, (progress) => (front = Math.floor(progress * ROWS)));
			front = ROWS;
			await animate(GAZE_FADE_MS, (progress) => (alpha = LEAVE[frameAt(progress, LEAVE.length)]));
			reels = [];
		},
	});
</script>

<BoardContainer>
	{#each reels as reel (reel)}
		{#each Array(ROWS) as _, row}
			{#if row <= front}
				<BaseSprite
					texture={(row === front ? head : body)[shimmer]}
					x={reel * SYMBOL_SIZE}
					y={row * SYMBOL_SIZE}
					width={SYMBOL_SIZE}
					height={SYMBOL_SIZE}
					{alpha}
				/>
			{/if}
		{/each}
	{/each}
</BoardContainer>
