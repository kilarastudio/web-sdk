<script lang="ts">
	import { ResponsiveText } from 'components-pixi';

	import Panel from './Panel.svelte';
	import PopIn from './PopIn.svelte';
	import { BOARD_SIZES, BOARD_FIT } from '../game/constants';
	import { panelContentWidth, panelTextStyle } from '../game/panels';
	import { getContext } from '../game/context';

	type Props = {
		panel:
			| 'celebrationBig'
			| 'celebrationSuper'
			| 'celebrationMega'
			| 'celebrationEpic'
			| 'celebrationMax';
		title: string;
		amount: string;
	};

	const props: Props = $props();
	const context = getContext();
	// every tier at one scale, so a higher tier only adds to the same frame; a little wider than
	// the board, unless the board already fills the screen's width (portrait)
	const scale = $derived.by(() => {
		const { scale } = context.stateLayoutDerived.mainLayout();
		const screenWidth =
			(context.stateLayoutDerived.canvasSizes().width - BOARD_FIT.edge * 2) / scale;

		return Math.min(BOARD_SIZES.width * 1.25, screenWidth) / panelContentWidth('celebrationBig');
	});
</script>

<PopIn>
	<Panel key={props.panel} {scale}>
		{#snippet children({ face })}
			<ResponsiveText
				anchor={0.5}
				x={face.x}
				y={face.y - face.height * 0.24}
				text={props.title}
				style={panelTextStyle({ fontSize: face.height * 0.26, tone: 'label' })}
				maxWidth={face.width}
			/>
			<ResponsiveText
				anchor={0.5}
				x={face.x}
				y={face.y + face.height * 0.16}
				text={props.amount}
				style={panelTextStyle({ fontSize: face.height * 0.46, tone: 'value' })}
				maxWidth={face.width}
			/>
		{/snippet}
	</Panel>
</PopIn>
