<script lang="ts">
	import { Tween } from 'svelte/motion';

	import { stateBet } from 'state-shared';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';

	import UiLabel from './UiLabel.svelte';
	import { i18nDerived } from '../i18n/i18nDerived';

	type Props = {
		stacked?: boolean;
		// fade out while there is no win, so the spot stays empty between wins
		hideZero?: boolean;
	};

	const props: Props = $props();
	const winBookEventAmountTween = new Tween(stateBet.winBookEventAmount);
	const label = $derived(i18nDerived.win());
	const value = $derived(bookEventAmountToCurrencyString(winBookEventAmountTween.current));
	const hasWin = $derived(stateBet.winBookEventAmount > 0);
	const hidden = $derived(props.hideZero && !hasWin);

	$effect(() => {
		winBookEventAmountTween.set(stateBet.winBookEventAmount);
	});
</script>

<div class="label-win" class:hidden class:has-win={hasWin} aria-hidden={hidden || undefined}>
	<UiLabel {label} {value} stacked={props.stacked} />
</div>

<style lang="scss">
	.label-win {
		transition: opacity 0.2s;

		&.hidden {
			opacity: 0;
		}

		&.has-win {
			--ui-label-value-color: var(--ui-accent);
		}
	}
</style>
