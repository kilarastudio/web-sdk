<script lang="ts" module>
	export type EmitterEventGlobalMultiplier =
		| { type: 'globalMultiplierShow' }
		| { type: 'globalMultiplierHide' }
		| { type: 'globalMultiplierUpdate'; multiplier: number };
</script>

<script lang="ts">
	import { prefersReducedMotion, Tween } from 'svelte/motion';
	import { cubicIn, cubicOut } from 'svelte/easing';

	import { Container } from 'pixi-svelte';
	import { FadeContainer, ResponsiveText } from 'components-pixi';
	import { stateBetDerived } from 'state-shared';

	import Panel from './Panel.svelte';
	import BoardContainer from './BoardContainer.svelte';
	import { getContext } from '../game/context';
	import { PANELS_BOTTOM, SYMBOL_SIZE } from '../game/constants';
	import { panelContentWidth, panelLayout, panelTextStyle } from '../game/panels';

	const PANEL_SCALE = (SYMBOL_SIZE * 0.85) / panelContentWidth('panelGlobalMultiplier');
	const PANEL_SIZES = panelLayout({ key: 'panelGlobalMultiplier', scale: PANEL_SCALE }).sizes;
	// how long a new value takes to swap in, in ms at normal speed
	const SWAP_DURATION = 360;

	const context = getContext();
	const scale = $derived(context.stateLayoutDerived.isStacked() ? 1.28 : 1);
	// right-aligned with the board, clear of the tumble win panel
	const position = $derived({
		x: context.stateGameDerived.boardLayout().width - PANEL_SIZES.width * 0.5 * scale,
		y: -PANELS_BOTTOM - PANEL_SIZES.height * 0.5 * scale,
	});

	let show = $state(false);
	let multiplier = $state(1);
	const pop = new Tween(1);

	// swells (or shrinks, on a reset), swaps the value at its furthest and settles back
	const swap = async (next: number) => {
		if (prefersReducedMotion.current) {
			multiplier = next;
			return;
		}

		const duration = SWAP_DURATION / stateBetDerived.timeScale();
		await pop.set(next > multiplier ? 1.18 : 0.84, { duration: duration * 0.4, easing: cubicOut });
		multiplier = next;
		await pop.set(1, { duration: duration * 0.6, easing: cubicIn });
	};

	context.eventEmitter.subscribeOnMount({
		globalMultiplierShow: () => (show = true),
		globalMultiplierHide: () => (show = false),
		globalMultiplierUpdate: async (emitterEvent) => {
			if (emitterEvent.multiplier === 1 && multiplier !== 1) {
				context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_reset' });
				await swap(1);
			}

			if (emitterEvent.multiplier > multiplier) {
				context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_update' });
				await swap(emitterEvent.multiplier);
			}
		},
	});
</script>

<FadeContainer {show}>
	<BoardContainer>
		<Container {...position} scale={scale * pop.current}>
			<Panel key="panelGlobalMultiplier" scale={PANEL_SCALE}>
				{#snippet children({ face })}
					<ResponsiveText
						anchor={0.5}
						x={face.x}
						y={face.y}
						text={`${multiplier}×`}
						style={panelTextStyle({ fontSize: face.height * 0.8, tone: 'value' })}
						maxWidth={face.width}
					/>
				{/snippet}
			</Panel>
		</Container>
	</BoardContainer>
</FadeContainer>
