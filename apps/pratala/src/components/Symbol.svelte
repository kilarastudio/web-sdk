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
		// how many times the symbol has touched down in its place (game/contact.svelte.ts)
		contact?: number;
		// its place on the board, in board units, where what it throws up is drawn
		place?: { x: number; y: number };
	};

	const props: Props = $props();
	const symbolInfo = $derived(getSymbolInfo({ rawSymbol: props.rawSymbol, state: props.state }));
</script>

{#if symbolInfo.type === 'sprite'}
	<!-- the scatter's art carries its own SCATTER lettering -->
	<SymbolSprite
		{symbolInfo}
		x={props.x}
		y={props.y}
		contact={props.contact}
		place={props.place}
		oncomplete={props.oncomplete}
	/>
{:else}
	<SymbolExplosion
		assetKey={symbolInfo.assetKey}
		x={props.x}
		y={props.y}
		oncomplete={props.oncomplete}
	/>
{/if}
