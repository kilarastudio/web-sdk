<script lang="ts">
	import { ResponsiveText } from 'components-pixi';

	import SymbolSprite from './SymbolSprite.svelte';
	import SymbolSpineMain from './SymbolSpineMain.svelte';
	import MultiplierValue from './MultiplierValue.svelte';
	import { getSymbolInfo } from '../game/utils';
	import { SYMBOL_SIZE } from '../game/constants';
	import { panelTextStyle } from '../game/panels';
	import type { SymbolState, RawSymbol } from '../game/types';
	import { getContext } from '../game/context';

	type Props = {
		x?: number;
		y?: number;
		state: SymbolState;
		rawSymbol: RawSymbol;
		oncomplete?: () => void;
		loop?: boolean;
	};

	const props: Props = $props();
	const context = getContext();
	const symbolInfo = $derived(getSymbolInfo({ rawSymbol: props.rawSymbol, state: props.state }));
	const isSprite = $derived(symbolInfo.type === 'sprite');
</script>

{#if isSprite}
	<SymbolSprite {symbolInfo} x={props.x} y={props.y} oncomplete={props.oncomplete}>
		<!-- the art leaves the multiplier's value and the scatter's name to the game -->
		{#if props.rawSymbol.name === 'M' && props.rawSymbol.multiplier}
			<MultiplierValue multiplier={props.rawSymbol.multiplier} />
		{:else if props.rawSymbol.name === 'S'}
			<ResponsiveText
				anchor={0.5}
				y={SYMBOL_SIZE * 0.33}
				text={context.i18nDerived.scatter()}
				style={panelTextStyle({ fontSize: SYMBOL_SIZE * 0.13, tone: 'label' })}
				maxWidth={SYMBOL_SIZE * 0.9}
			/>
		{/if}
	</SymbolSprite>
{:else}
	<!-- the explosion -->
	<SymbolSpineMain
		loop={props.loop}
		{symbolInfo}
		x={props.x}
		y={props.y}
		listener={{ complete: props.oncomplete }}
	/>
{/if}
