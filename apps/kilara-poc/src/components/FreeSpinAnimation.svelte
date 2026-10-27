<script lang="ts">
	import { ResponsiveText } from 'components-pixi';
	import { MainContainer } from 'components-layout';

	import Panel from './Panel.svelte';
	import PopIn from './PopIn.svelte';
	import { getContext } from '../game/context';
	import { BOARD_SIZES } from '../game/constants';
	import { panelContentWidth, panelTextStyle } from '../game/panels';

	// the free spins panel over the board: a label, the count or amount, and a caption
	type Props = {
		key: 'panelFreeSpinsIntro' | 'panelFreeSpinsOutro';
		label: string;
		value: string;
		caption: string;
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
				<ResponsiveText
					anchor={0.5}
					x={face.x}
					y={face.y - face.height * 0.35}
					text={props.label}
					style={panelTextStyle({ fontSize: face.height * 0.13, tone: 'label' })}
					maxWidth={face.width}
				/>
				<ResponsiveText
					anchor={0.5}
					x={face.x}
					y={face.y}
					text={props.value}
					style={panelTextStyle({ fontSize: face.height * 0.42, tone: 'value' })}
					maxWidth={face.width}
				/>
				<ResponsiveText
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
