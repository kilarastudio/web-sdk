<script lang="ts">
	import GameText from './GameText.svelte';
	import { MainContainer } from 'components-layout';

	import { Container } from 'pixi-svelte';

	import IntroPanel from './IntroPanel.svelte';
	import PopIn from './PopIn.svelte';
	import WinAnimation from './WinAnimation.svelte';
	import WinPunch from './WinPunch.svelte';
	import { getContext } from '../game/context';
	import { BOARD_SIZES } from '../game/constants';
	import { panelContentWidth, panelTextStyle, type PanelFace } from '../game/panels';
	import type { BigWinLevelData } from '../game/winLevelMap';

	// the free spins panel over the board: a label, the count or amount, and a caption. The intro
	// slams in with its own burning frame; the total at the end stands in the frame of the level
	// its count has reached, like a big win.
	type Props = {
		key: 'panelFreeSpinsIntro' | 'panelFreeSpinsOutro';
		label: string;
		value: string;
		caption: string;
		// the value is a count that has reached its full amount
		completed?: boolean;
		// the big win level the total has reached, and the ones it will land on (winClimb)
		level?: BigWinLevelData;
		levels?: BigWinLevelData[];
	};

	const props: Props = $props();
	const context = getContext();
	// as wide as the board
	const scale = $derived(BOARD_SIZES.width / panelContentWidth(props.key));
</script>

{#snippet body({ face }: { face: PanelFace })}
	<GameText
		anchor={0.5}
		x={face.x}
		y={face.y - face.height * 0.35}
		text={props.label}
		style={panelTextStyle({ fontSize: face.height * 0.13, tone: 'label' })}
		maxWidth={face.width}
	/>
	<WinPunch x={face.x} y={face.y} completed={props.completed ?? false}>
		<GameText
			anchor={0.5}
			text={props.value}
			style={panelTextStyle({ fontSize: face.height * 0.42, tone: 'value' })}
			maxWidth={face.width}
		/>
	</WinPunch>
	<GameText
		anchor={0.5}
		x={face.x}
		y={face.y + face.height * 0.36}
		text={props.caption}
		style={panelTextStyle({ fontSize: face.height * 0.16, tone: 'label' })}
		maxWidth={face.width}
	/>
{/snippet}

<MainContainer>
	{#if props.key === 'panelFreeSpinsOutro'}
		<PopIn
			x={context.stateGameDerived.boardLayout().x}
			y={context.stateGameDerived.boardLayout().y}
		>
			<WinAnimation level={props.level} levels={props.levels} panel={props.key} {scale}>
				{#snippet children({ face })}
					{@render body({ face })}
				{/snippet}
			</WinAnimation>
		</PopIn>
	{:else}
		<Container
			x={context.stateGameDerived.boardLayout().x}
			y={context.stateGameDerived.boardLayout().y}
		>
			<IntroPanel {scale}>
				{#snippet children({ face })}
					{@render body({ face })}
				{/snippet}
			</IntroPanel>
		</Container>
	{/if}
</MainContainer>
