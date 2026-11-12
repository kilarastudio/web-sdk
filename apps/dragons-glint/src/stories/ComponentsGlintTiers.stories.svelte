<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	const { Story } = defineMeta({ title: 'COMPONENTS/<GlintTiers>' });
</script>

<script lang="ts">
	import { StoryPixiApp } from 'components-storybook';
	import { Container, Rectangle } from 'pixi-svelte';
	import GlintTile from '../components/GlintTile.svelte';
	import GameText from '../components/GameText.svelte';
	import { gameTextStyle } from '../game/typography';
	import assets from '../game/assets';
</script>

<Story name="allOnDark">
	<StoryPixiApp
		assets={{
			glintSheet: assets.glintSheet,
			glintTile1: assets.glintTile1,
			glintTile2: assets.glintTile2,
			glintTile3: assets.glintTile3,
			glintTile4: assets.glintTile4,
			gameFontGold: assets.gameFontGold,
			gameFontInk: assets.gameFontInk,
		}}
	>
		<Rectangle width={1000} height={600} backgroundColor={0x07131e} />
		<GameText
			x={50}
			y={30}
			text="DRAGON'S GLINT"
			style={gameTextStyle({ fontSize: 38, tone: 'value' })}
		/>
		{#each [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096] as value, index}
			<Container x={110 + (index % 6) * 156} y={200 + Math.floor(index / 6) * 230} scale={1.4}>
				<GlintTile layer="under" {value} />
				<GlintTile layer="over" {value} />
			</Container>
		{/each}
	</StoryPixiApp>
</Story>
