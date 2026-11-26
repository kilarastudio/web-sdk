<script lang="ts">
	import { Text } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';

	import { getContext } from '../game/context';
	import { FONT, GREY } from '../game/constants';
	import PressToContinue from './PressToContinue.svelte';

	// Grey box: the name of the game and what this build is. Nothing to load yet.
	type Props = {
		onloaded: () => void;
	};

	const props: Props = $props();
	const context = getContext();
	const center = $derived({
		x: context.stateLayoutDerived.mainLayout().width * 0.5,
		y: context.stateLayoutDerived.mainLayout().height * 0.5,
	});
</script>

<MainContainer>
	<Text
		anchor={0.5}
		x={center.x}
		y={center.y - 40}
		text="DWANDA"
		style={{ fontFamily: FONT, fontSize: 84, fontWeight: '800', fill: GREY.text }}
	/>
	<Text
		anchor={0.5}
		x={center.x}
		y={center.y + 40}
		text="grey box"
		style={{ fontFamily: FONT, fontSize: 34, fontWeight: '500', fill: GREY.muted }}
	/>
</MainContainer>

{#if context.stateApp.loaded}
	<PressToContinue onpress={() => props.onloaded()} />
{/if}
