<script lang="ts" module>
	export type EmitterEventFreeSpinIntro =
		| { type: 'freeSpinIntroShow' }
		| { type: 'freeSpinIntroHide' }
		| {
				type: 'freeSpinIntroUpdate';
				totalFreeSpins: number;
				clashCells: number;
				clashValue: number;
		  };
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

	// Grey box: the Duel is announced with its free spins and how its territory starts, and waits
	// for a press.
	const context = getContext();
	const t = stateI18nDerived.translate;

	let show = $state(false);
	let freeSpins = $state(0);
	let clashCells = $state(0);
	let clashValue = $state(0);
	let oncomplete = $state(() => {});

	const territoryLine = $derived(
		clashCells > 0
			? t('STARTS WITH\n{count} CLASH CELLS AT ×{value}', { count: clashCells, value: clashValue })
			: t('THE TERRITORY STAYS\nFOR THE WHOLE DUEL'),
	);

	context.eventEmitter.subscribeOnMount({
		freeSpinIntroShow: () => (show = true),
		freeSpinIntroHide: () => (show = false),
		freeSpinIntroUpdate: async (emitterEvent) => {
			freeSpins = emitterEvent.totalFreeSpins;
			clashCells = emitterEvent.clashCells;
			clashValue = emitterEvent.clashValue;
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
				text="DUEL"
				style={{ fontFamily: FONT, fontSize: 110, fontWeight: '800', fill: GREY.text }}
			/>
			<Text
				anchor={0.5}
				y={10}
				text={t('{count} FREE SPINS', { count: freeSpins })}
				style={{ fontFamily: FONT, fontSize: 56, fontWeight: '700', fill: GREY.text }}
			/>
			<!-- wraps to the board's width so it fits a phone -->
			<Text
				anchor={{ x: 0.5, y: 0 }}
				y={62}
				text={territoryLine}
				style={{
					fontFamily: FONT,
					fontSize: 40,
					fontWeight: '600',
					fill: GREY.muted,
					align: 'center',
					wordWrap: true,
					wordWrapWidth: context.stateGameDerived.boardLayout().width * 0.92,
				}}
			/>
		</Container>
	</MainContainer>

	<PressToContinue onpress={() => oncomplete()} />
</FadeContainer>
