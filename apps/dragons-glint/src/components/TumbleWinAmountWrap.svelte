<script lang="ts" module>
	import { PANELS_BOTTOM, BOARD_SIZES } from '../game/constants';
	import { TUMBLE_PANEL_SIZES } from './TumbleWinAmountFrame.svelte';

	// where the tumble win panel stands, in the board's own units: on the frame over the board's
	// middle, in the base game and in free spins alike; in the stacked layout it is bigger
	export const tumblePanelPlace = ({ stacked }: { stacked: boolean }) => {
		const scale = stacked ? 1.28 : 1;

		return {
			scale,
			x: BOARD_SIZES.width * 0.5,
			y: -PANELS_BOTTOM - TUMBLE_PANEL_SIZES.height * 0.5 * scale,
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
