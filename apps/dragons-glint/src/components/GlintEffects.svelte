<script lang="ts">
	import { Tween, prefersReducedMotion } from 'svelte/motion';
	import { cubicInOut } from 'svelte/easing';
	import { Container } from 'pixi-svelte';
	import { stateBetDerived } from 'state-shared';
	import { getContext } from '../game/context';
	import { SYMBOL_SIZE } from '../game/constants';
	import { glintMultiplierLayout } from '../game/glint';
	import { gameTextStyle } from '../game/typography';
	import type { GlintApplySpot } from './GlintSpots.svelte';
	import BoardContainer from './BoardContainer.svelte';
	import GameText from './GameText.svelte';

	const context = getContext();
	let flights: GlintApplySpot[] = $state([]);
	const flightProgress = new Tween(0);
	const reduced = $derived(prefersReducedMotion.current);
	context.eventEmitter.subscribeOnMount({
		glintApplyFly: async ({ spots }) => {
			flights = spots;
			flightProgress.set(0, { duration: 0 });
			await flightProgress.set(1, {
				duration: 500 / stateBetDerived.timeScale(),
				easing: cubicInOut,
			});
			flights = [];
		},
	});
</script>

<BoardContainer>
	{#each flights as spot}
		{@const layout = glintMultiplierLayout(spot.value)}
		{@const p = reduced ? 0 : flightProgress.current}
		<Container
			x={(spot.reel + 0.5) * SYMBOL_SIZE +
				layout.x +
				((spot.targetReel + 0.5) * SYMBOL_SIZE - ((spot.reel + 0.5) * SYMBOL_SIZE + layout.x)) * p}
			y={(spot.row + 0.5) * SYMBOL_SIZE +
				layout.y +
				((spot.targetRow + 0.5) * SYMBOL_SIZE - ((spot.row + 0.5) * SYMBOL_SIZE + layout.y)) * p}
			alpha={Math.sin(Math.PI * flightProgress.current)}
		>
			<GameText
				text={`×${spot.value}`}
				anchor={0.5}
				maxWidth={layout.maxWidth}
				style={gameTextStyle({ fontSize: 30, tone: 'value', onArt: true })}
			/>
		</Container>
	{/each}
</BoardContainer>
