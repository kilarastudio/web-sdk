<script lang="ts" module>
	export type EmitterEventTumbleWinAmount =
		| { type: 'tumbleWinAmountShow' }
		| { type: 'tumbleWinAmountHide' }
		| { type: 'tumbleWinAmountReset' }
		| { type: 'tumbleWinAmountUpdate'; amount: number };
</script>

<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { Text } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';
	import { stateI18nDerived } from 'state-shared';
	import { bookEventAmountToCountUpCurrencyString, countUpEasing } from 'utils-shared/amount';

	import { getContext } from '../game/context';
	import { FONT, GREY } from '../game/constants';

	// Grey box: what the current spin has won so far, above the board's right corner.
	const context = getContext();
	const amount = new Tween(0, { duration: 450, easing: countUpEasing });
	let show = $state(false);

	const position = $derived({
		x: context.stateGameDerived.boardLayout().x + context.stateGameDerived.boardLayout().width / 2,
		y:
			context.stateGameDerived.boardLayout().y -
			context.stateGameDerived.boardLayout().height / 2 -
			18,
	});

	context.eventEmitter.subscribeOnMount({
		tumbleWinAmountShow: () => (show = true),
		tumbleWinAmountHide: () => (show = false),
		// a new board starts from nothing: the amount is only shown once the board has won
		tumbleWinAmountReset: () => {
			show = false;
			amount.set(0, { duration: 0 });
		},
		tumbleWinAmountUpdate: (emitterEvent) => amount.set(emitterEvent.amount),
	});
</script>

<FadeContainer {show} {...position}>
	<Text
		anchor={{ x: 1, y: 1 }}
		text={`${stateI18nDerived.translate('WIN')} ${bookEventAmountToCountUpCurrencyString(amount.current, amount.target)}`}
		style={{ fontFamily: FONT, fontSize: 38, fontWeight: '700', fill: GREY.text }}
	/>
</FadeContainer>
