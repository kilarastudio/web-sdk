<script lang="ts">
	import { prefersReducedMotion, Tween } from 'svelte/motion';
	import { cubicIn, cubicOut } from 'svelte/easing';

	import { Container } from 'pixi-svelte';
	import { ResponsiveText } from 'components-pixi';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';

	import { panelTextStyle, type PanelFace } from '../game/panels';

	type Props = {
		face: PanelFace;
		amount: number;
		animate: boolean;
		oncomplete: () => void;
	};

	const props: Props = $props();
	const amount = new Tween(0);
	// the round's total lands with a pop while it counts up
	const pop = new Tween(1);

	const update = async ({ target, animate }: { target: number; animate: boolean }) => {
		const popping = animate && !prefersReducedMotion.current;
		if (popping) pop.set(1.14, { duration: 140, easing: cubicOut });
		await amount.set(target);
		if (popping) await pop.set(1, { duration: 200, easing: cubicIn });
		props.oncomplete();
	};

	$effect(() => {
		update({ target: props.amount, animate: props.animate });
	});
</script>

<Container x={props.face.x} y={props.face.y} scale={pop.current}>
	<ResponsiveText
		anchor={0.5}
		text={bookEventAmountToCurrencyString(amount.current)}
		style={panelTextStyle({ fontSize: props.face.height * 0.9, tone: 'value' })}
		maxWidth={props.face.width}
	/>
</Container>
