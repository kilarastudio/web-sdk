<script lang="ts">
	import { untrack } from 'svelte';
	import { Tween } from 'svelte/motion';

	import { Container } from 'pixi-svelte';
	import { stateBetDerived } from 'state-shared';

	import GreySquare from './GreySquare.svelte';
	import type { SymbolState, RawSymbol } from '../game/types';

	// Grey box: a symbol is a square in its own shade of grey with its math name on it. A win is
	// a short swell with a white edge.
	type Props = {
		x?: number;
		y?: number;
		state: SymbolState;
		rawSymbol: RawSymbol;
		oncomplete?: () => void;
	};

	const props: Props = $props();
	const marked = $derived(['win', 'postWinStatic'].includes(props.state));
	const scale = new Tween(1);

	const play = async (state: SymbolState) => {
		const speed = stateBetDerived.timeScale();
		if (state === 'win') {
			await scale.set(1.12, { duration: 130 / speed });
			await scale.set(1, { duration: 170 / speed });
			props.oncomplete?.();
		} else {
			scale.set(1, { duration: 0 });
			if (state === 'land') props.oncomplete?.();
		}
	};

	$effect(() => {
		const state = props.state;
		untrack(() => play(state));
	});
</script>

<Container x={props.x} y={props.y} scale={scale.current}>
	<GreySquare name={props.rawSymbol.name} prize={props.rawSymbol.prize} {marked} />
</Container>
