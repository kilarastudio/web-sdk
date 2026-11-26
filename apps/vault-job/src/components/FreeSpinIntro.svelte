<script lang="ts" module>
	export type EmitterEventFreeSpinIntro =
		| { type: 'freeSpinIntroShow' }
		| { type: 'freeSpinIntroHide' }
		| { type: 'freeSpinIntroUpdate'; totalFreeSpins: number; crew: string };
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

	// Grey box: The Job is announced with its free spins and the crew it starts with, and waits
	// for a press.
	const context = getContext();
	const t = stateI18nDerived.translate;

	let show = $state(false);
	let freeSpins = $state(0);
	let crew = $state('');
	let oncomplete = $state(() => {});

	context.eventEmitter.subscribeOnMount({
		freeSpinIntroShow: () => (show = true),
		freeSpinIntroHide: () => (show = false),
		freeSpinIntroUpdate: async (emitterEvent) => {
			freeSpins = emitterEvent.totalFreeSpins;
			crew = emitterEvent.crew;
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
				text="THE JOB"
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
				text={crew}
				style={{ fontFamily: FONT, fontSize: 44, fontWeight: '600', fill: GREY.muted }}
			/>
		</Container>
	</MainContainer>

	<PressToContinue onpress={() => oncomplete()} />
</FadeContainer>
