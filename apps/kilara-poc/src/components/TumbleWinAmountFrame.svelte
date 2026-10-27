<script lang="ts" module>
	import { panelContentWidth, panelLayout } from '../game/panels';
	import { SYMBOL_SIZE } from '../game/constants';

	// The label uses a readable game-unit size rather than the thin source nameplate's face.
	const PANEL_SCALE = (SYMBOL_SIZE * 3) / panelContentWidth('panelTumble');

	export const TUMBLE_PANEL_SIZES = panelLayout({ key: 'panelTumble', scale: PANEL_SCALE }).sizes;
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';

	import { ResponsiveText } from 'components-pixi';

	import Panel from './Panel.svelte';
	import { getContext } from '../game/context';
	import { panelTextStyle, type PanelFace } from '../game/panels';

	type Props = {
		children: Snippet<[{ face: PanelFace }]>;
	};

	const props: Props = $props();
	const context = getContext();
</script>

<Panel key="panelTumble" scale={PANEL_SCALE}>
	{#snippet children({ face })}
		{@render props.children({ face })}
	{/snippet}
</Panel>

<ResponsiveText
	anchor={0.5}
	y={-TUMBLE_PANEL_SIZES.height / 2 - 20}
	text={context.i18nDerived.tumbleWin()}
	style={{
		...panelTextStyle({ fontSize: 24, tone: 'label' }),
		stroke: { color: 0x10171d, width: 4 },
	}}
	maxWidth={TUMBLE_PANEL_SIZES.width}
/>
