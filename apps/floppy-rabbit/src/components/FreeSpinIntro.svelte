<script lang="ts" module>
	export type EmitterEventFreeSpinIntro =
		| { type: 'freeSpinIntroShow' }
		| { type: 'freeSpinIntroHide' }
		| { type: 'freeSpinIntroUpdate'; totalFreeSpins: number; rabbits: number };
</script>

<script lang="ts">
	import { CanvasSizeRectangle, MainContainer } from 'components-layout';
	import { FadeContainer } from 'components-pixi';
	import { stateI18nDerived } from 'state-shared';
	import { waitForResolve } from 'utils-shared/wait';
	import { Container, Text } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { FONT, GREY } from '../game/constants';
	import PressToContinue from './PressToContinue.svelte';

	// Grey box: Flop Time is announced with its free spins and its rabbits, and waits for a press.
	const context = getContext();
	const t = stateI18nDerived.translate;
	const RABBITS: Record<number, string> = {
		1: 'ONE RABBIT',
		2: 'TWO RABBITS',
		3: 'FLUFFLE: THREE RABBITS',
	};

	let show = $state(false);
	let freeSpins = $state(0);
	let rabbits = $state(1);
	let oncomplete = $state(() => {});

	context.eventEmitter.subscribeOnMount({
		freeSpinIntroShow: () => (show = true),
		freeSpinIntroHide: () => (show = false),
		freeSpinIntroUpdate: async (emitterEvent) => {
			freeSpins = emitterEvent.totalFreeSpins;
			rabbits = emitterEvent.rabbits;
			await waitForResolve((resolve) => (oncomplete = resolve));
		},
	});
</script>

<FadeContainer {show}>
	<CanvasSizeRectangle backgroundColor={0x000000} backgroundAlpha={0.75} />

	<MainContainer>
		<Container
			x={context.stateGameDerived.boardLayout().x}
			y={context.stateGameDerived.boardLayout().y}
		>
			<Text
				anchor={0.5}
				y={-110}
				text="FLOP TIME"
				style={{ fontFamily: FONT, fontSize: 110, fontWeight: '800', fill: GREY.text }}
			/>
			<Text
				anchor={0.5}
				y={10}
				text={t('{count} FREE SPINS', { count: freeSpins })}
				style={{ fontFamily: FONT, fontSize: 56, fontWeight: '700', fill: GREY.text }}
			/>
			<Text
				anchor={0.5}
				y={90}
				text={t(RABBITS[rabbits] ?? RABBITS[1])}
				style={{ fontFamily: FONT, fontSize: 44, fontWeight: '600', fill: GREY.muted }}
			/>
		</Container>
	</MainContainer>

	<PressToContinue onpress={() => oncomplete()} />
</FadeContainer>
