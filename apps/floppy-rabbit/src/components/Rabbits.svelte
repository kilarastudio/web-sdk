<script lang="ts" module>
	import type { Position } from '../game/types';

	export type EmitterEventRabbits =
		| { type: 'rabbitsEnter'; cells: Position[] }
		| { type: 'rabbitHop'; rabbit: number; to: Position }
		| { type: 'rabbitFlop'; rabbit: number }
		| { type: 'rabbitFlopHold' };
</script>

<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicIn, cubicOut, cubicInOut } from 'svelte/easing';
	import { Container, Rectangle, Text } from 'pixi-svelte';
	import { stateBetDerived } from 'state-shared';
	import { waitForTimeout } from 'utils-shared/wait';

	import BoardContainer from './BoardContainer.svelte';
	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, HOME_CELL, FONT, GREY } from '../game/constants';

	// Grey box: a rabbit is a white square marked R. A hop is a short arc to its new cell; a flop
	// is the square falling onto its side and lying there while every footprint doubles.
	const context = getContext();
	const SIZE = SYMBOL_SIZE * 0.38;
	// a rabbit stands in the top left corner of its cell, so the symbol's name under it and the
	// footprint's value at the bottom stay readable
	const center = (cell: Position) => ({
		x: (cell.reel + 0.26) * SYMBOL_SIZE,
		y: (cell.row + 0.26) * SYMBOL_SIZE,
	});

	const createRabbit = (cell: Position) => {
		const at = center(cell);
		return {
			x: new Tween(at.x),
			y: new Tween(at.y),
			lift: new Tween(0),
			tilt: new Tween(0),
			size: new Tween(1),
		};
	};

	let rabbits = $state.raw([createRabbit(HOME_CELL)]);
	const flopped = new Set<number>();
	const speed = () => stateBetDerived.timeScale();

	const standUp = async (index: number) => {
		if (!flopped.has(index)) return;
		flopped.delete(index);
		await rabbits[index]?.tilt.set(0, { duration: 140 / speed(), easing: cubicOut });
	};

	context.eventEmitter.subscribeOnMount({
		rabbitsEnter: async ({ cells }) => {
			flopped.clear();
			rabbits = cells.map(createRabbit);
			await Promise.all(
				rabbits.map(async (rabbit) => {
					rabbit.size.set(0, { duration: 0 });
					await rabbit.size.set(1, { duration: 220 / speed(), easing: cubicOut });
				}),
			);
		},
		rabbitHop: async ({ rabbit: index, to }) => {
			const rabbit = rabbits[index];
			if (!rabbit) return;
			await standUp(index);
			const target = center(to);
			const duration = 260 / speed();
			const arc = async () => {
				await rabbit.lift.set(-SYMBOL_SIZE * 0.6, { duration: duration / 2, easing: cubicOut });
				await rabbit.lift.set(0, { duration: duration / 2, easing: cubicIn });
			};
			await Promise.all([
				rabbit.x.set(target.x, { duration, easing: cubicInOut }),
				rabbit.y.set(target.y, { duration, easing: cubicInOut }),
				arc(),
			]);
		},
		rabbitFlop: async ({ rabbit: index }) => {
			const rabbit = rabbits[index];
			if (!rabbit) return;
			flopped.add(index);
			await rabbit.tilt.set(Math.PI / 2, { duration: 170 / speed(), easing: cubicIn });
		},
		// the rabbit lies there long enough for the doubled values to be read
		rabbitFlopHold: async () => {
			await waitForTimeout(420 / speed());
			await Promise.all([...flopped].map(standUp));
		},
	});
</script>

<BoardContainer>
	{#each rabbits as rabbit, index}
		<Container
			x={rabbit.x.current}
			y={rabbit.y.current + rabbit.lift.current}
			rotation={rabbit.tilt.current}
			scale={rabbit.size.current}
		>
			<Rectangle
				anchor={0.5}
				width={SIZE}
				height={SIZE}
				backgroundColor={GREY.rabbit}
				borderColor={GREY.textDark}
				borderWidth={4}
			/>
			<Text
				anchor={0.5}
				text={rabbits.length > 1 ? `R${index + 1}` : 'R'}
				style={{ fontFamily: FONT, fontSize: SIZE * 0.5, fontWeight: '800', fill: GREY.textDark }}
			/>
		</Container>
	{/each}
</BoardContainer>
