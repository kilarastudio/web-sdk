<script lang="ts" module>
	export type EmitterEventTerritory =
		| { type: 'territoryUpdate'; marks: number[][]; clash: number[][]; animate: boolean }
		| { type: 'territoryClear' };
</script>

<script lang="ts">
	import _ from 'lodash';
	import { Tween } from 'svelte/motion';
	import { Container, Rectangle, Text } from 'pixi-svelte';
	import { stateBetDerived } from 'state-shared';

	import BoardContainer from './BoardContainer.svelte';
	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BOARD_DIMENSIONS, FONT, GREY, MARK } from '../game/constants';

	// Grey box: the territory lies over the symbols and belongs to the positions, not to the
	// symbols that fall through them. Phoenix territory is a thin light edge with a light "P" tab
	// in the cell's bottom right corner, dragon territory a thin grey edge with a black "D" tab. A
	// Clash cell is a thick white edge with its value on a white tab along the bottom. A cell that
	// just changed swells once.
	const context = getContext();
	const EMPTY = () =>
		_.range(BOARD_DIMENSIONS.x).map(() => _.range(BOARD_DIMENSIONS.y).map(() => 0));
	const TAB = SYMBOL_SIZE * 0.3;
	const HALF = SYMBOL_SIZE / 2;
	const pulse = new Tween(0);

	let marks = $state.raw(EMPTY());
	let clash = $state.raw(EMPTY());
	let changed = $state.raw(new Set<string>());

	const key = (reel: number, row: number) => `${reel}:${row}`;

	context.eventEmitter.subscribeOnMount({
		territoryUpdate: async (emitterEvent) => {
			const next = new Set<string>();
			emitterEvent.marks.forEach((reel, reelIndex) =>
				reel.forEach((mark, rowIndex) => {
					const value = emitterEvent.clash[reelIndex]?.[rowIndex] ?? 0;
					if (mark !== marks[reelIndex]?.[rowIndex] || value !== clash[reelIndex]?.[rowIndex])
						next.add(key(reelIndex, rowIndex));
				}),
			);
			marks = emitterEvent.marks;
			clash = emitterEvent.clash;
			changed = next;
			if (!emitterEvent.animate || next.size === 0) return;
			const speed = stateBetDerived.timeScale();
			pulse.set(1, { duration: 0 });
			await pulse.set(0, { duration: 360 / speed });
		},
		territoryClear: () => {
			marks = EMPTY();
			clash = EMPTY();
			changed = new Set();
		},
	});
</script>

<BoardContainer>
	{#each marks as reel, reelIndex}
		{#each reel as mark, rowIndex}
			{#if mark !== MARK.none}
				{@const value = clash[reelIndex]?.[rowIndex] ?? 0}
				<Container
					x={(reelIndex + 0.5) * SYMBOL_SIZE}
					y={(rowIndex + 0.5) * SYMBOL_SIZE}
					scale={changed.has(key(reelIndex, rowIndex)) ? 1 + 0.22 * pulse.current : 1}
				>
					{#if mark === MARK.clash}
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
							y={HALF - 3}
							width={SYMBOL_SIZE - 6}
							height={TAB}
							backgroundColor={GREY.text}
						/>
						<Text
							anchor={0.5}
							y={HALF - 3 - TAB / 2}
							text={`×${value}`}
							style={{
								fontFamily: FONT,
								fontSize: SYMBOL_SIZE * (value >= 1000 ? 0.22 : 0.26),
								fontWeight: '800',
								fill: GREY.textDark,
							}}
						/>
					{:else}
						{@const phoenix = mark === MARK.phoenix}
						<Rectangle
							anchor={0.5}
							width={SYMBOL_SIZE - 3}
							height={SYMBOL_SIZE - 3}
							backgroundAlpha={0}
							borderColor={phoenix ? GREY.phoenixMark : GREY.muted}
							borderWidth={2}
						/>
						<Rectangle
							anchor={1}
							x={HALF - 2}
							y={HALF - 2}
							width={TAB}
							height={TAB}
							backgroundColor={phoenix ? GREY.phoenixMark : GREY.dragonMark}
							borderColor={phoenix ? GREY.textDark : GREY.muted}
							borderWidth={1}
						/>
						<Text
							anchor={0.5}
							x={HALF - 2 - TAB / 2}
							y={HALF - 2 - TAB / 2}
							text={phoenix ? 'P' : 'D'}
							style={{
								fontFamily: FONT,
								fontSize: SYMBOL_SIZE * 0.22,
								fontWeight: '800',
								fill: phoenix ? GREY.textDark : GREY.text,
							}}
						/>
					{/if}
				</Container>
			{/if}
		{/each}
	{/each}
</BoardContainer>
