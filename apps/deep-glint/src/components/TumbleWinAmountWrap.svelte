<script lang="ts">
	import type { Snippet } from 'svelte';

	import { Container } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';

	import { getContext } from '../game/context';
	import { PANELS_BOTTOM } from '../game/constants';
	import BoardContainer from './BoardContainer.svelte';
	import { TUMBLE_PANEL_SIZES } from './TumbleWinAmountFrame.svelte';

	type Props = {
		show: boolean;
		children: Snippet;
	};

	const props: Props = $props();
	const context = getContext();
	const scale = $derived(context.stateLayoutDerived.isStacked() ? 1.28 : 1);

	const desktopPosition = $derived({
		x: context.stateGameDerived.boardLayout().width * 0.5,
		y: -PANELS_BOTTOM - TUMBLE_PANEL_SIZES.height * 0.5,
	});

	const portraitPosition = $derived({
		x:
			context.stateGameDerived.boardLayout().width *
			(context.stateGame.gameType === 'basegame' ? 0.5 : 0.37),
		y: -PANELS_BOTTOM - TUMBLE_PANEL_SIZES.height * 0.5 * scale,
	});

	const position = $derived(
		context.stateLayoutDerived.isStacked() ? portraitPosition : desktopPosition,
	);
</script>

<FadeContainer show={props.show}>
	<BoardContainer>
		<Container {...position} {scale}>
			{@render props.children()}
		</Container>
	</BoardContainer>
</FadeContainer>
