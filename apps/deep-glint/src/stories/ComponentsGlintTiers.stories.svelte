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
			text="DEEP GLINT"
			style={gameTextStyle({ fontSize: 38, tone: 'value' })}
		/>
		{#each [2, 4, 8, 16, 32, 64, 128, 256] as value, index}
			<Container x={135 + (index % 4) * 220} y={190 + Math.floor(index / 4) * 240} scale={1.8}>
				<GlintTile layer="under" {value} />
				<GlintTile layer="over" {value} />
			</Container>
		{/each}
	</StoryPixiApp>
</Story>
