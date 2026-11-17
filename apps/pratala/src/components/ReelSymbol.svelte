<script lang="ts">
	import Symbol from './Symbol.svelte';
	import SymbolWrap from './SymbolWrap.svelte';
	import { getSymbolInfo, getSymbolX } from '../game/utils';
	import { watchContact } from '../game/contact.svelte';
	import type { ReelSymbol } from '../game/stateGame.svelte';

	type Props = {
		reelIndex: number;
		reelSymbol: ReelSymbol;
	};

	const props: Props = $props();
	const symbolInfo = $derived(
		getSymbolInfo({ rawSymbol: props.reelSymbol.rawSymbol, state: props.reelSymbol.symbolState }),
	);

	let contact = $state(0);
	watchContact(
		() => props.reelSymbol.symbolY,
		() => contact++,
	);
</script>

<!-- a winner is drawn over the rest and outside the board's mask while it is grown, until it goes -->
<SymbolWrap
	x={getSymbolX(props.reelIndex)}
	y={props.reelSymbol.symbolY.current}
	animating={props.reelSymbol.symbolState === 'win' ||
		props.reelSymbol.symbolState === 'postWinStatic' ||
		(symbolInfo.type === 'explosion' && props.reelSymbol.symbolState === 'land')}
>
	<Symbol
		state={props.reelSymbol.symbolState}
		rawSymbol={props.reelSymbol.rawSymbol}
		{contact}
		place={{ x: getSymbolX(props.reelIndex), y: props.reelSymbol.symbolY.target }}
		oncomplete={() => {
			if (props.reelSymbol.symbolState === 'win') props.reelSymbol.oncomplete();
			if (props.reelSymbol.symbolState === 'land') props.reelSymbol.symbolState = 'static';
		}}
	/>
</SymbolWrap>
