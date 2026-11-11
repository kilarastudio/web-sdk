<script lang="ts" module>
	export type RawWin = {
		win: number;
		mult: number;
		result: number;
		reel: number; // 0 | 1 | 2 | 3 | 4 | 5;
		row: number; // 1 | 2 | 3 | 4 | 5; // excluding the off top row and the off bottom row
	};
	export type Win = RawWin & { oncomplete: () => void };
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { prefersReducedMotion, Tween } from 'svelte/motion';
	import { backOut, cubicInOut, cubicOut } from 'svelte/easing';

	import { Container } from 'pixi-svelte';
	import { stateBetDerived } from 'state-shared';
	import GameText from './GameText.svelte';
	import { waitForTimeout } from 'utils-shared/wait';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';

	import { SYMBOL_SIZE } from '../game/constants';
	import { getContext } from '../game/context';
	import { gameTextStyle } from '../game/typography';

	type Props = { win: Win };

	const props: Props = $props();
	const context = getContext();

	// The amount a group of symbols pays: it grows in over the group, stays long enough to read,
	// then drifts up, slowing as it goes, and fades out on the way. With a Glint multiplier it
	// first shows "win × multiplier", then swells and turns into the result.
	// the multiplier's flight from its Glint Spot (GlintEffects) takes 500 ms and lands on the swell
	const TIMING = {
		appear: 200,
		read: 200,
		multiplier: 500,
		swell: 110,
		settle: 230,
		rise: 1000,
		fade: 320,
	};
	const RISE = SYMBOL_SIZE * 0.7;

	const still = prefersReducedMotion.current;
	const y = new Tween(0);
	const scale = new Tween(still ? 1 : 0.5);
	const alpha = new Tween(1);
	let showMultiplier = $state(props.win.mult > 1);

	onMount(async () => {
		const timeScale = stateBetDerived.timeScale();
		const time = (duration: number) => duration / timeScale;

		scale.set(1, { duration: time(TIMING.appear), easing: backOut });
		if (showMultiplier) {
			await waitForTimeout(time(TIMING.multiplier));
			context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_glint_apply' });
			if (!still) await scale.set(1.35, { duration: time(TIMING.swell), easing: cubicOut });
			showMultiplier = false;
			await scale.set(1, { duration: time(TIMING.settle), easing: cubicInOut });
		} else {
			await waitForTimeout(time(TIMING.read));
		}

		alpha.set(0, { delay: time(TIMING.rise - TIMING.fade), duration: time(TIMING.fade) });
		await y.set(-RISE, { duration: time(TIMING.rise), easing: cubicOut });
		props.win.oncomplete();
	});
</script>

<Container
	x={SYMBOL_SIZE * (props.win.reel + 0.5)}
	y={SYMBOL_SIZE * (props.win.row - 0.5) + y.current}
	scale={scale.current}
	alpha={alpha.current}
>
	<GameText
		text={showMultiplier
			? `${bookEventAmountToCurrencyString(props.win.win)} × ${props.win.mult}`
			: bookEventAmountToCurrencyString(props.win.result)}
		anchor={0.5}
		maxWidth={SYMBOL_SIZE * 1.8}
		style={gameTextStyle({ fontSize: SYMBOL_SIZE * 0.5, tone: 'value', onArt: true })}
	/>
</Container>
