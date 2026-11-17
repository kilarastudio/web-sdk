<script lang="ts">
	import SymbolSprite from './SymbolSprite.svelte';
	import SymbolExplosion from './SymbolExplosion.svelte';
	import { getSymbolInfo } from '../game/utils';
	import type { SymbolState, RawSymbol } from '../game/types';

	type Props = {
		x?: number;
		y?: number;
		state: SymbolState;
		rawSymbol: RawSymbol;
		oncomplete?: () => void;
		loop?: boolean;
	};

	const props: Props = $props();
	const symbolInfo = $derived(getSymbolInfo({ rawSymbol: props.rawSymbol, state: props.state }));
</script>

{#if symbolInfo.type === 'sprite'}
	<!-- the scatter's art carries its own SCATTER lettering -->
	<SymbolSprite {symbolInfo} x={props.x} y={props.y} oncomplete={props.oncomplete} />
{:else}
	<SymbolExplosion
		assetKey={symbolInfo.assetKey}
		x={props.x}
		y={props.y}
		oncomplete={props.oncomplete}
	/>
{/if}
