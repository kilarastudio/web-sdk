<script lang="ts">
	import { ResponsiveText } from 'components-pixi';

	import { SYMBOL_SIZE } from '../game/constants';
	import { panelTextStyle } from '../game/panels';

	type Props = {
		multiplier: number;
	};

	const props: Props = $props();
</script>

<!-- the value on the multiplier token's face -->
<ResponsiveText
	anchor={0.5}
	text={`${props.multiplier}×`}
	style={panelTextStyle({ fontSize: SYMBOL_SIZE * 0.34, tone: 'value' })}
	maxWidth={SYMBOL_SIZE * 0.5}
/>
