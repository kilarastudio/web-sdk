<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { type Snippet } from 'svelte';

	import { createInterruptible } from 'utils-shared/interruptible';
	import { bookEventAmountToCountUpCurrencyString, countUpEasing } from 'utils-shared/amount';

	type Props = {
		amount: number;
		duration: number;
		// how the amount climbs over the duration; the studio's countUpEasing when not given
		easing?: (t: number) => number;
		oncomplete: () => void;
		children: Snippet<
			[
				{
					countUpAmount: number;
					// the amount to show: whole currency units (cents) while it climbs, never above the
					// win, and the exact win once it has arrived. Show this, not countUpAmount.
					countUpText: string;
					startCountUp: () => Promise<void>;
					finishCountUp: () => void;
					countUpCompleted: boolean;
				},
			]
		>;
	};

	const props: Props = $props();
	const countUpAmount = new Tween(0);
	const interruptible = createInterruptible();

	let countUpCompleted = $state(false);

	const countUp = () =>
		countUpAmount.set(props.amount, {
			duration: props.duration,
			easing: props.easing ?? countUpEasing,
		});
	const resetCountUp = () => countUpAmount.set(props.amount, { duration: 0 });
	const finishCountUp = () => interruptible.interrupt();
	const startCountUp = async () => {
		await interruptible.add(countUp);
		resetCountUp();
		countUpCompleted = true;
		props.oncomplete();
		interruptible.clear();
	};
</script>

{@render props.children({
	countUpAmount: countUpAmount.current,
	countUpText: bookEventAmountToCountUpCurrencyString(countUpAmount.current, props.amount),
	startCountUp,
	finishCountUp,
	countUpCompleted,
})}
