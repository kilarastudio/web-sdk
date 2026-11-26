<script lang="ts" module>
	export type EmitterEventBanner = { type: 'bannerShow'; text: string; hold?: number };
</script>

<script lang="ts">
	import { Text } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';
	import { stateBetDerived } from 'state-shared';
	import { waitForTimeout } from 'utils-shared/wait';

	import { getContext } from '../game/context';
	import { FONT, GREY } from '../game/constants';

	// Grey box: what the crew just did, in words, above the board's right corner.
	const context = getContext();
	let text = $state('');
	let show = $state(false);

	const position = $derived({
		x: context.stateGameDerived.boardLayout().x + context.stateGameDerived.boardLayout().width / 2,
		y:
			context.stateGameDerived.boardLayout().y -
			context.stateGameDerived.boardLayout().height / 2 -
			18,
	});

	context.eventEmitter.subscribeOnMount({
		bannerShow: async (emitterEvent) => {
			text = emitterEvent.text;
			show = true;
			await waitForTimeout((emitterEvent.hold ?? 700) / stateBetDerived.timeScale());
			show = false;
		},
	});
</script>

<FadeContainer {show} {...position}>
	<Text
		anchor={{ x: 1, y: 1 }}
		{text}
		style={{ fontFamily: FONT, fontSize: 28, fontWeight: '800', fill: GREY.text }}
	/>
</FadeContainer>
