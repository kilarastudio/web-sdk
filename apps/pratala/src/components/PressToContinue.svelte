<script lang="ts">
	import { MainContainer, OnPressFullScreen } from 'components-layout';
	import { OnHotkey } from 'components-shared';
	import { stateUi } from 'state-shared';
	import GameText from './GameText.svelte';

	import { getContext } from '../game/context';
	import { gameTextStyle } from '../game/typography';
	import { BOARD_FRAME_REACH } from '../game/constants';

	type Props = {
		// what the prompt says; "press anywhere to continue" unless given
		text?: string;
		// the HUD is hidden, so the prompt stands on the floor under the board, never on the board
		underBoard?: boolean;
		onpress: () => void;
	};

	const props: Props = $props();
	const context = getContext();
	const layout = $derived(context.stateLayoutDerived.mainLayout());
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());
	const maxWidth = $derived(Math.min(canvas.width - 32, 560) / layout.scale);
	// Use screen pixels for the instruction so portrait layouts keep a readable minimum size.
	// never under 22 units: below that GameText gives up the game's pixel font for the fallback, and
	// the prompt would change font between screen sizes
	const fontSize = $derived(
		Math.max(22, Math.max(14, Math.min(18, canvas.width * 0.013)) / layout.scale),
	);
	// Short landscape screens need the prompt closer to the HUD to clear the panel.
	const bottomGap = $derived(canvas.height < 360 ? 4 : 32);
	const board = $derived(context.stateGameDerived.boardLayout());
	// under the board's frame, and never past the screen's bottom edge
	const underBoardY = $derived(
		Math.min(
			board.y + board.height * 0.5 + BOARD_FRAME_REACH.bottom + 16 / layout.scale,
			layout.height * 0.5 + (canvas.height * 0.5 - 8) / layout.scale - fontSize * 1.35,
		),
	);
</script>

{#snippet prompt(y: number, anchorY: number)}
	<GameText
		text={props.text ?? context.i18nDerived.pressToContinue()}
		{maxWidth}
		anchor={{ x: 0.5, y: anchorY }}
		x={layout.width * 0.5}
		{y}
		style={{
			...gameTextStyle({ fontSize, tone: 'hint', onArt: true }),
			wordWrap: true,
			wordWrapWidth: maxWidth,
			lineHeight: fontSize * 1.35,
		}}
	/>
{/snippet}

{#if props.underBoard}
	<MainContainer>
		{@render prompt(underBoardY, 0)}
	</MainContainer>
{:else}
	<!-- sits on top of the HUD's controls, so they never cover it -->
	<MainContainer alignVertical="bottom">
		{@render prompt(layout.height - (stateUi.hudInset.bottom + bottomGap) / layout.scale, 1)}
	</MainContainer>
{/if}
<OnHotkey hotkey="Space" onpress={() => props.onpress()} />
<OnPressFullScreen onpress={() => props.onpress()} />
