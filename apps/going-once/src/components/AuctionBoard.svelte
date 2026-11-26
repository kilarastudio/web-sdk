<script lang="ts" module>
	import type { Position } from '../game/types';
	import type { Lot } from '../game/typesBookEvent';

	// Cells are in the book's own terms: rows count the padding row above the board.
	export type AuctionItem = { cell: Position; kind: 'P' | 'G' | 'B'; value: number };

	export type EmitterEventAuctionBoard =
		| { type: 'auctionShow'; lots: Lot[]; respinsLeft: number }
		| { type: 'auctionHide' }
		| { type: 'auctionRespin'; landed: AuctionItem[]; respinsLeft: number }
		| { type: 'auctionBuyer'; cell: Position; value: number }
		| { type: 'auctionGavel'; cell: Position | null; lots: Lot[] }
		| { type: 'auctionLots'; lots: Lot[] }
		| { type: 'auctionCall'; title: string; line?: string; hold: number };
</script>

<script lang="ts">
	import _ from 'lodash';
	import { Tween } from 'svelte/motion';
	import { Container, Rectangle, Text } from 'pixi-svelte';
	import { stateBetDerived, stateI18nDerived } from 'state-shared';
	import { waitForTimeout } from 'utils-shared/wait';

	import BoardContainer from './BoardContainer.svelte';
	import GreySquare from './GreySquare.svelte';
	import { getContext } from '../game/context';
	import {
		SYMBOL_SIZE,
		BOARD_SIZES,
		BOARD_DIMENSIONS,
		FONT,
		GREY,
		lotLabel,
	} from '../game/constants';

	// Grey box: the Auction is played on its own board over the reels. Lots keep their cells and
	// show their value; empty cells flash while a respin turns; what lands pops in. Respins left
	// are above the board, the lots' total under it, and the hammer's calls across it.
	const context = getContext();
	const t = stateI18nDerived.translate;
	const speed = () => stateBetDerived.timeScale();

	class Cell {
		reel: number;
		row: number;
		kind = $state<'P' | 'G' | 'B' | null>(null);
		value = $state(0);
		scale = new Tween(1);

		constructor(reel: number, row: number) {
			this.reel = reel;
			this.row = row;
		}

		pulse = async () => {
			await this.scale.set(1.2, { duration: 130 / speed() });
			await this.scale.set(1, { duration: 190 / speed() });
		};
	}

	const cells = _.range(BOARD_DIMENSIONS.x).flatMap((reel) =>
		_.range(1, BOARD_DIMENSIONS.y + 1).map((row) => new Cell(reel, row)),
	);
	const at = (cell: Position) =>
		cells.find((each) => each.reel === cell.reel && each.row === cell.row);

	let show = $state(false);
	let spinning = $state(false);
	let respinsLeft = $state(3);
	let call = $state<{ title: string; line?: string }>();
	const total = $derived(_.sumBy(cells, (cell) => (cell.kind === 'P' ? cell.value : 0)));

	const setLots = (lots: Lot[]) => {
		for (const lot of lots) {
			const cell = at(lot.cell);
			if (!cell) continue;
			cell.kind = 'P';
			cell.value = lot.value;
		}
	};

	context.eventEmitter.subscribeOnMount({
		auctionShow: (emitterEvent) => {
			cells.forEach((cell) => (cell.kind = null));
			setLots(emitterEvent.lots);
			respinsLeft = emitterEvent.respinsLeft;
			call = undefined;
			show = true;
		},
		auctionHide: () => (show = false),
		auctionRespin: async (emitterEvent) => {
			spinning = true;
			await waitForTimeout(320 / speed());
			spinning = false;
			await Promise.all(
				emitterEvent.landed.map((item) => {
					const cell = at(item.cell);
					if (!cell) return;
					cell.kind = item.kind;
					cell.value = item.value;
					cell.scale.set(0.3, { duration: 0 });
					return cell.pulse();
				}),
			);
			respinsLeft = emitterEvent.respinsLeft;
		},
		auctionBuyer: async (emitterEvent) => {
			const cell = at(emitterEvent.cell);
			if (!cell) return;
			await cell.pulse();
			cell.kind = 'P';
			cell.value = emitterEvent.value;
			await cell.pulse();
		},
		auctionGavel: async (emitterEvent) => {
			const gavel = emitterEvent.cell ? at(emitterEvent.cell) : undefined;
			if (gavel) {
				await gavel.pulse();
				// the gavel leaves; its cell stays empty
				gavel.kind = null;
			}
			setLots(emitterEvent.lots);
			await Promise.all(cells.filter((cell) => cell.kind === 'P').map((cell) => cell.pulse()));
		},
		auctionLots: (emitterEvent) => setLots(emitterEvent.lots),
		auctionCall: async (emitterEvent) => {
			call = { title: emitterEvent.title, line: emitterEvent.line };
			await waitForTimeout(emitterEvent.hold / speed());
			call = undefined;
		},
	});
</script>

{#if show}
	<BoardContainer>
		<Rectangle width={BOARD_SIZES.width} height={BOARD_SIZES.height} backgroundColor={GREY.board} />
		{#each cells as cell}
			<Container
				x={(cell.reel + 0.5) * SYMBOL_SIZE}
				y={(cell.row - 1 + 0.5) * SYMBOL_SIZE}
				scale={cell.scale.current}
			>
				{#if cell.kind}
					<GreySquare name={cell.kind} prize={cell.kind === 'P' ? cell.value : undefined} />
				{:else}
					<Rectangle
						anchor={0.5}
						width={SYMBOL_SIZE - 4}
						height={SYMBOL_SIZE - 4}
						backgroundColor={spinning ? GREY.line : GREY.cell}
					/>
				{/if}
			</Container>
		{/each}

		<Text
			anchor={{ x: 0, y: 1 }}
			y={-16}
			text={`${t('RESPINS LEFT')} ${respinsLeft}`}
			style={{ fontFamily: FONT, fontSize: 30, fontWeight: '700', fill: GREY.text }}
		/>
		<Text
			anchor={{ x: 0.5, y: 0 }}
			x={BOARD_SIZES.width / 2}
			y={BOARD_SIZES.height + 16}
			text={`${t('LOTS')} ${lotLabel(total)}`}
			style={{ fontFamily: FONT, fontSize: 30, fontWeight: '700', fill: GREY.text }}
		/>

		{#if call}
			<Rectangle
				anchor={0.5}
				x={BOARD_SIZES.width / 2}
				y={BOARD_SIZES.height / 2}
				width={BOARD_SIZES.width}
				height={call.line ? 190 : 120}
				backgroundColor={GREY.textDark}
				backgroundAlpha={0.88}
			/>
			<Text
				anchor={0.5}
				x={BOARD_SIZES.width / 2}
				y={BOARD_SIZES.height / 2 - (call.line ? 32 : 0)}
				text={call.title}
				style={{
					fontFamily: FONT,
					fontSize: call.title.length > 14 ? 46 : 64,
					fontWeight: '800',
					fill: GREY.text,
				}}
			/>
			{#if call.line}
				<Text
					anchor={0.5}
					x={BOARD_SIZES.width / 2}
					y={BOARD_SIZES.height / 2 + 46}
					text={call.line}
					style={{ fontFamily: FONT, fontSize: 34, fontWeight: '600', fill: GREY.muted }}
				/>
			{/if}
		{/if}
	</BoardContainer>
{/if}
