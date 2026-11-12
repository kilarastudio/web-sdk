<script lang="ts">
	import GameText from './GameText.svelte';
	import { MainContainer } from 'components-layout';

	import Panel from './Panel.svelte';
	import PopIn from './PopIn.svelte';
	import WinPunch from './WinPunch.svelte';
	import { getContext } from '../game/context';
	import { BOARD_SIZES } from '../game/constants';
	import { panelContentWidth, panelTextStyle } from '../game/panels';

	// the free spins panel over the board: a label, the count or amount, and a caption
	type Props = {
		key: 'panelFreeSpinsIntro' | 'panelFreeSpinsOutro';
		label: string;
		value: string;
		caption: string;
		// the value is a count that has reached its full amount
		completed?: boolean;
	};

	const props: Props = $props();
	const context = getContext();
	// as wide as the board
	const scale = $derived(BOARD_SIZES.width / panelContentWidth(props.key));
</script>

<MainContainer>
	<PopIn x={context.stateGameDerived.boardLayout().x} y={context.stateGameDerived.boardLayout().y}>
		<Panel key={props.key} {scale}>
			{#snippet children({ face })}
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
		</Panel>
	</PopIn>
</MainContainer>
