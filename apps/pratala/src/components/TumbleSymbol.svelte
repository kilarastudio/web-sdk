<script lang="ts">
	import Symbol from './Symbol.svelte';
	import SymbolWrap from './SymbolWrap.svelte';
	import { getSymbolX, getSymbolInfo } from '../game/utils';
	import { watchContact } from '../game/contact.svelte';
	import type { TumbleSymbol } from '../game/stateGame.svelte';

	type Props = {
		reelIndex: number;
		tumbleSymbol: TumbleSymbol;
	};

	const props: Props = $props();
	const symbolInfo = $derived(
		getSymbolInfo({
			rawSymbol: props.tumbleSymbol.rawSymbol,
			state: props.tumbleSymbol.symbolState,
		}),
	);

	let contact = $state(0);
	watchContact(
		() => props.tumbleSymbol.symbolY,
		() => contact++,
	);
</script>

<SymbolWrap
	x={getSymbolX(props.reelIndex)}
	y={props.tumbleSymbol.symbolY.current}
	animating={symbolInfo.type === 'explosion'}
>
	<Symbol
		state={props.tumbleSymbol.symbolState}
		rawSymbol={props.tumbleSymbol.rawSymbol}
		{contact}
		place={{ x: getSymbolX(props.reelIndex), y: props.tumbleSymbol.symbolY.target }}
		oncomplete={props.tumbleSymbol.oncomplete}
	/>
</SymbolWrap>
