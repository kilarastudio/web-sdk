<script lang="ts" module>
	export type EmitterEventFreeSpinCounter =
		| { type: 'freeSpinCounterShow' }
		| { type: 'freeSpinCounterHide' }
		| { type: 'freeSpinCounterUpdate'; current?: number; total?: number }
		| { type: 'freeSpinCounterRetrigger'; added: number };
</script>

<script lang="ts">
	import { Text } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';
	import { stateBetDerived, stateI18nDerived } from 'state-shared';
	import { waitForTimeout } from 'utils-shared/wait';

	import { getContext } from '../game/context';
	import { FONT, GREY } from '../game/constants';

	// Grey box: which free spin this is, above the board's left corner. A retrigger shows what
	// it added for a moment.
	const context = getContext();
	let show = $state(false);
	let current = $state(0);
	let total = $state(0);
	let added = $state(0);

	const position = $derived({
		x: context.stateGameDerived.boardLayout().x - context.stateGameDerived.boardLayout().width / 2,
		y:
			context.stateGameDerived.boardLayout().y -
			context.stateGameDerived.boardLayout().height / 2 -
			18,
	});

	context.eventEmitter.subscribeOnMount({
		freeSpinCounterShow: () => (show = true),
		freeSpinCounterHide: () => (show = false),
		freeSpinCounterUpdate: (emitterEvent) => {
			if (emitterEvent.current !== undefined) current = emitterEvent.current;
			if (emitterEvent.total !== undefined) total = emitterEvent.total;
		},
		freeSpinCounterRetrigger: async (emitterEvent) => {
			added = emitterEvent.added;
			await waitForTimeout(900 / stateBetDerived.timeScale());
			added = 0;
		},
	});
</script>

<FadeContainer {show} {...position}>
	<Text
		anchor={{ x: 0, y: 1 }}
		text={`${stateI18nDerived.translate('FREE SPIN')} ${current} / ${total}${added ? `  +${added}` : ''}`}
		style={{ fontFamily: FONT, fontSize: 38, fontWeight: '700', fill: GREY.text }}
	/>
</FadeContainer>
