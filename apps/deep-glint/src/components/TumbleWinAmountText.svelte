<script lang="ts">
	import { prefersReducedMotion, Tween } from 'svelte/motion';
	import { cubicInOut, cubicOut } from 'svelte/easing';

	import { Container } from 'pixi-svelte';
	import GameText from './GameText.svelte';
	import { bookEventAmountToCountUpCurrencyString } from 'utils-shared/amount';

	import { panelTextStyle, type PanelFace } from '../game/panels';
	import { countUpEasing } from '../game/constants';

	type Props = {
		face: PanelFace;
		amount: number;
		animate: boolean;
		oncomplete: () => void;
	};

	const props: Props = $props();
	// the tumble's total swells while it counts up to the new amount, then settles; before the
	// first coins of a spin land the panel stands empty
	const COUNT_DURATION = 450;
	const amount = new Tween(0);
	const pop = new Tween(1);

	const update = async ({ target, animate }: { target: number; animate: boolean }) => {
		if (!animate) {
			await amount.set(target, { duration: 0 });
			props.oncomplete();
			return;
		}
		const popping = !prefersReducedMotion.current;
		if (popping) pop.set(1.16, { duration: 140, easing: cubicOut });
		await amount.set(target, { duration: COUNT_DURATION, easing: countUpEasing });
		if (popping) await pop.set(1, { duration: 220, easing: cubicInOut });
		props.oncomplete();
	};

	$effect(() => {
		update({ target: props.amount, animate: props.animate });
	});
</script>

<Container x={props.face.x} y={props.face.y} scale={pop.current}>
	<GameText
		anchor={0.5}
		text={props.amount === 0 && amount.current === 0
			? ''
			: bookEventAmountToCountUpCurrencyString(amount.current, props.amount)}
		style={panelTextStyle({ fontSize: props.face.height * 0.9, tone: 'value' })}
		maxWidth={props.face.width}
	/>
</Container>
