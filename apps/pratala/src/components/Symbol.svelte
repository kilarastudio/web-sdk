<script lang="ts">
	import GameText from './GameText.svelte';

	import SymbolSprite from './SymbolSprite.svelte';
	import SymbolExplosion from './SymbolExplosion.svelte';
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
</script>

{#if symbolInfo.type === 'sprite'}
	<SymbolSprite {symbolInfo} x={props.x} y={props.y} oncomplete={props.oncomplete}>
		<!-- the art leaves the scatter's name to the game -->
		{#if props.rawSymbol.name === 'S'}
			<GameText
				anchor={0.5}
				y={SYMBOL_SIZE * 0.36}
				text={context.i18nDerived.scatter()}
				style={panelTextStyle({ fontSize: SYMBOL_SIZE * 0.22, tone: 'label' })}
				maxWidth={SYMBOL_SIZE * 0.92}
			/>
		{/if}
	</SymbolSprite>
{:else}
	<SymbolExplosion
		assetKey={symbolInfo.assetKey}
		x={props.x}
		y={props.y}
		oncomplete={props.oncomplete}
	/>
{/if}
