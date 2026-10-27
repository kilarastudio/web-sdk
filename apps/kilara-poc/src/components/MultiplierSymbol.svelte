<script lang="ts">
	import { onMount } from 'svelte';
	import { Tween } from 'svelte/motion';

	import { Container } from 'pixi-svelte';

	import MultiplierValue from './MultiplierValue.svelte';
	import { winPulse } from '../game/symbolMotion';
	import type { MultiplierSymbol } from '../game/stateGame.svelte';

	type Props = {
		reelIndex: number;
		multiplierSymbol: MultiplierSymbol;
	};

	const props: Props = $props();
	const scale = new Tween(1);

	// the value beats on its token, then the multiplier board moves it off to the board's middle
	onMount(async () => {
		await winPulse(scale);
		props.multiplierSymbol.oncomplete();
	});
</script>

<Container
	x={props.multiplierSymbol.symbolX.current}
	y={props.multiplierSymbol.symbolY.current}
	scale={scale.current}
>
	<MultiplierValue multiplier={props.multiplierSymbol.rawSymbol.multiplier ?? 1} />
</Container>
