<script lang="ts" module>
	import type { Position } from '../game/types';
	import type { CrewMember } from '../game/typesBookEvent';

	// Cells are in the book's own terms: rows count the padding row above the board.
	export type EmitterEventCrew =
		| { type: 'crewSet'; crew: CrewMember[] }
		| { type: 'crewArrive'; crew: CrewMember[] }
		| { type: 'crewKeepSticky' }
		| { type: 'crewClear' }
		| { type: 'crewUnstick' }
		| { type: 'crewDrive'; moves: { from: Position; to: Position | null }[] }
		| { type: 'crewExpand'; reels: number[] }
		| { type: 'crewMultiply'; changes: { cell: Position; multiplier: number }[] }
		| { type: 'crewMark'; positions: Position[] };
</script>

<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicInOut } from 'svelte/easing';
	import { Container } from 'pixi-svelte';
	import { stateBetDerived } from 'state-shared';
	import { waitForTimeout } from 'utils-shared/wait';

	import BoardContainer from './BoardContainer.svelte';
	import GreySquare from './GreySquare.svelte';
	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BOARD_DIMENSIONS, isCrew, type CrewName } from '../game/constants';

	// Grey box: the crew stand in a layer over the reels, so sticky crew stay put while the reels
	// spin under them, Drivers can drive, Muscles fill their reel and multipliers can change in
	// place. What the layer holds as lines are paid is exactly the math's crewBoard.
	const context = getContext();
	const speed = () => stateBetDerived.timeScale();
	const toX = (reel: number) => (reel + 0.5) * SYMBOL_SIZE;
	const toY = (row: number) => (row - 1 + 0.5) * SYMBOL_SIZE;
	const key = (cell: Position) => `${cell.reel}:${cell.row}`;

	class Member {
		crew: CrewName;
		cell: Position;
		multiplier = $state(1);
		sticky = $state(false);
		marked = $state(false);
		x: Tween<number>;
		y: Tween<number>;
		scale = new Tween(1);

		constructor(member: CrewMember, scale = 1) {
			this.crew = member.crew;
			this.cell = member.cell;
			this.multiplier = member.multiplier;
			this.sticky = member.sticky;
			this.x = new Tween(toX(member.cell.reel));
			this.y = new Tween(toY(member.cell.row));
			this.scale = new Tween(scale);
		}

		pulse = async () => {
			await this.scale.set(1.22, { duration: 140 / speed() });
			await this.scale.set(1, { duration: 200 / speed() });
		};
	}

	let members = $state<Member[]>([]);
	const find = (cell: Position) => members.find((member) => key(member.cell) === key(cell));

	context.eventEmitter.subscribeOnMount({
		crewSet: ({ crew }) => {
			members = crew.map((member) => new Member(member));
		},
		crewArrive: async ({ crew }) => {
			const arriving = crew.map((member) => new Member(member, 0));
			members = [...members.filter((member) => !arriving.some((a) => key(a.cell) === key(member.cell))), ...arriving]; // prettier-ignore
			for (const member of arriving) {
				await member.scale.set(1, { duration: 260 / speed() });
				await waitForTimeout(120 / speed());
			}
		},
		crewKeepSticky: () => {
			members = members.filter((member) => member.sticky);
			members.forEach((member) => (member.marked = false));
		},
		crewClear: () => {
			members = [];
		},
		// The Job is over: the last board keeps its crew and their multipliers, nobody is sticky
		crewUnstick: () => {
			members.forEach((member) => (member.sticky = false));
		},
		crewDrive: async ({ moves }) => {
			await Promise.all(
				moves.map(async (move) => {
					const member = find(move.from);
					if (!member) return;
					// a Driver on reel 1 drives off the board
					const to = move.to ?? { reel: move.from.reel - 1, row: move.from.row };
					member.cell = to;
					await member.x.set(toX(to.reel), { duration: 420 / speed(), easing: cubicInOut });
					if (!move.to) members = members.filter((other) => other !== member);
				}),
			);
		},
		crewExpand: async ({ reels }) => {
			for (const reel of reels) {
				const symbols = context.stateGame.board[reel].reelState.symbols;
				for (let row = 1; row <= BOARD_DIMENSIONS.y; row++) {
					const cell = { reel, row };
					const name = symbols[row]?.rawSymbol.name;
					// cells holding a scatter or another crew member keep them
					if (find(cell) || name === 'S' || (name && isCrew(name) && name !== 'WM')) continue;
					const member = new Member({ cell, crew: 'WM', multiplier: 1, sticky: false }, 0);
					members = [...members, member];
					member.scale.set(1, { duration: 200 / speed() });
					await waitForTimeout(90 / speed());
				}
			}
			await waitForTimeout(200 / speed());
		},
		crewMultiply: async ({ changes }) => {
			await Promise.all(
				changes.map(async (change) => {
					const member = find(change.cell);
					if (!member) return;
					member.multiplier = change.multiplier;
					await member.pulse();
				}),
			);
		},
		crewMark: ({ positions }) => {
			positions.forEach((position) => {
				const member = find(position);
				if (!member) return;
				member.marked = true;
				member.pulse();
			});
		},
	});
</script>

<BoardContainer>
	{#each members as member}
		<Container x={member.x.current} y={member.y.current} scale={member.scale.current}>
			<GreySquare
				name={member.crew}
				multiplier={member.multiplier}
				sticky={member.sticky}
				marked={member.marked}
			/>
		</Container>
	{/each}
</BoardContainer>
