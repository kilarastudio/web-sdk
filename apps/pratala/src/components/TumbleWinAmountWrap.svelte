<script lang="ts" module>
	import { ART_PIXEL, BOARD_FRAME, BOARD_SIZES } from '../game/constants';

	// Stacked (phones) the dragon's eye stands over the frame, so there the fire burns on the floor
	// under the board, its foot on the controls' edge (`floor`, the free area's bottom, in board
	// units): its label may stand on the frame's bottom band, never on the symbols. It is as big as
	// that room allows, up to the stacked size, and back over the frame only on a phone too short
	// for it at the least size.
	const STACKED_SCALE = 1.28;
	const LEAST_SCALE = 0.85;
	const FOOT_LIFT = 10;
	// from the fire's foot to the top of its label, at scale 1
	const TUMBLE_TALL = 82;

	// where the foot of the tumble win's fire stands, in the board's own units: on the frame's top
	// edge over the board's middle, in the base game and in free spins alike
	export const tumblePanelPlace = ({ stacked, floor }: { stacked: boolean; floor?: number }) => {
		if (stacked && floor !== undefined) {
			const foot = floor - FOOT_LIFT;
			const fits = (foot - BOARD_SIZES.height - ART_PIXEL * 3) / TUMBLE_TALL;
			if (fits >= LEAST_SCALE)
				return { scale: Math.min(STACKED_SCALE, fits), x: BOARD_SIZES.width * 0.5, y: foot };
		}
		const scale = stacked ? STACKED_SCALE : 1;

		return {
			scale,
			x: BOARD_SIZES.width * 0.5,
			y: -BOARD_FRAME.border + ART_PIXEL * 2,
		};
	};
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';

	import { Container } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';

	import { getContext } from '../game/context';
	import BoardContainer from './BoardContainer.svelte';

	type Props = {
		show: boolean;
		children: Snippet;
	};

	const props: Props = $props();
	const context = getContext();
	const place = $derived(
		tumblePanelPlace({
			stacked: context.stateLayoutDerived.isStacked(),
			floor:
				context.stateGameDerived.freeArea().bottom -
				(context.stateGameDerived.boardLayout().y - BOARD_SIZES.height / 2),
		}),
	);
</script>

<FadeContainer show={props.show}>
	<BoardContainer>
		<Container x={place.x} y={place.y} scale={place.scale}>
			{@render props.children()}
		</Container>
	</BoardContainer>
</FadeContainer>
