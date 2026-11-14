<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	const { Story } = defineMeta({ title: 'COMPONENTS/<GlintTierOne>' });
</script>

<script lang="ts">
	import { StoryPixiApp } from 'components-storybook';
	import { Container, Rectangle } from 'pixi-svelte';
	import GlintTierOne from '../components/GlintTierOne.svelte';
	import assets from '../game/assets';
	let playing = $state(false);
	let message = $state('Click action to start');
	let completedLayers = 0;
	const complete = () => {
		if (++completedLayers === 2) {
			message = 'Action is resolved ✅';
			playing = false;
		}
	};
</script>

<Story name="lightOnDark">
	<StoryPixiApp
		assets={{
			glintSheet: assets.glintSheet,
			glintTile1: assets.glintTile1,
			fontGold: assets.fontGold,
			fontInk: assets.fontInk,
		}}
	>
		<Rectangle width={1200} height={675} backgroundColor={0x07131e} />
		<Container x={200} y={125} scale={1.6}>
			{#key playing}
				<GlintTierOne layer="under" value={2} oncomplete={playing ? complete : undefined} />
				<GlintTierOne layer="over" value={2} oncomplete={playing ? complete : undefined} />
			{/key}
		</Container>
	</StoryPixiApp>
	<div class="sample-controls">
		<button
			disabled={playing}
			onclick={() => {
				completedLayers = 0;
				message = 'Running…';
				playing = true;
			}}>Action</button
		>
		<span class="message">{message}</span>
	</div>
</Story>

<style>
	.sample-controls {
		position: absolute;
		top: 0;
		left: 0;
		z-index: 999;
		display: flex;
		gap: 12px;
		color: white;
	}
</style>
