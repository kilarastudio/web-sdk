<script lang="ts" module>
	import type { Position } from '../game/types';

	export type EmitterEventFootprints =
		| { type: 'footprintsUpdate'; grid: number[][]; changed: Position[] | 'all' }
		| { type: 'footprintsClear' };
</script>

<script lang="ts">
	import _ from 'lodash';
	import { Tween } from 'svelte/motion';
	import { Container, Rectangle, Text } from 'pixi-svelte';

	import BoardContainer from './BoardContainer.svelte';
	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BOARD_DIMENSIONS, FONT, GREY } from '../game/constants';

	// Grey box: a footprint is a white edge round its cell with its value on a dark tab at the
	// bottom, so the symbol's name stays readable. A footprint that just changed swells once.
	const context = getContext();
	const EMPTY = () =>
		_.range(BOARD_DIMENSIONS.x).map(() => _.range(BOARD_DIMENSIONS.y).map(() => 0));
	const pulse = new Tween(0);

	let grid = $state(EMPTY());
	let changed = $state<Set<string> | 'all'>(new Set());

	const swells = (reel: number, row: number) => changed === 'all' || changed.has(`${reel}:${row}`);

	context.eventEmitter.subscribeOnMount({
		footprintsUpdate: (emitterEvent) => {
			grid = emitterEvent.grid;
			changed =
				emitterEvent.changed === 'all'
					? 'all'
					: new Set(emitterEvent.changed.map((cell) => `${cell.reel}:${cell.row}`));
			pulse.set(1, { duration: 0 });
			pulse.set(0, { duration: 300 });
		},
		footprintsClear: () => {
			grid = EMPTY();
			changed = new Set();
		},
	});
</script>

<BoardContainer>
	{#each grid as reel, reelIndex}
		{#each reel as value, rowIndex}
			{#if value > 0}
				<Container
					x={(reelIndex + 0.5) * SYMBOL_SIZE}
					y={(rowIndex + 0.5) * SYMBOL_SIZE}
					scale={swells(reelIndex, rowIndex) ? 1 + 0.22 * pulse.current : 1}
				>
					<Rectangle
						anchor={0.5}
						width={SYMBOL_SIZE - 6}
						height={SYMBOL_SIZE - 6}
						backgroundAlpha={0}
						borderColor={GREY.text}
						borderWidth={4}
					/>
					<Rectangle
						anchor={{ x: 0.5, y: 1 }}
						y={SYMBOL_SIZE * 0.5 - 3}
						width={SYMBOL_SIZE - 6}
						height={SYMBOL_SIZE * 0.3}
						backgroundColor={GREY.text}
					/>
					<Text
						anchor={{ x: 0.5, y: 0.5 }}
						y={SYMBOL_SIZE * 0.35 - 3}
						text={`${value}×`}
						style={{
							fontFamily: FONT,
							fontSize: SYMBOL_SIZE * (value >= 1000 ? 0.22 : 0.26),
							fontWeight: '800',
							fill: GREY.textDark,
						}}
					/>
				</Container>
			{/if}
		{/each}
	{/each}
</BoardContainer>
