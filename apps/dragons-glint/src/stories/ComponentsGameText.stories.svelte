<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	const { Story } = defineMeta({ title: 'COMPONENTS/<GameText>' });
</script>

<script lang="ts">
	import { StoryPixiApp } from 'components-storybook';
	import { Container, Rectangle } from 'pixi-svelte';
	import GameText from '../components/GameText.svelte';
	import assets from '../game/assets';
	import { gameTextStyle } from '../game/typography';
	let sample = $state('$1,234.56');
	const samples = ['$1,234.56', 'Rp 999.999.999,99', '€ 1\u202f234,50', '免费旋转 12', '$0.00'];
</script>

<Story name="specimen">
	<StoryPixiApp assets={{ gameFontGold: assets.gameFontGold, gameFontInk: assets.gameFontInk }}>
		<Rectangle width={1200} height={675} backgroundColor={0x071c24} />
		<GameText
			x={600}
			y={100}
			anchor={0.5}
			text="DRAGON'S HOARD"
			maxWidth={1100}
			style={gameTextStyle({ fontSize: 94, tone: 'label' })}
		/>
		<GameText
			x={600}
			y={215}
			anchor={0.5}
			text="BIG WIN"
			maxWidth={1000}
			style={gameTextStyle({ fontSize: 110, tone: 'label' })}
		/>
		<GameText
			x={600}
			y={335}
			anchor={0.5}
			text={sample}
			maxWidth={1000}
			style={gameTextStyle({ fontSize: 120, tone: 'value' })}
		/>
		<GameText
			x={600}
			y={440}
			anchor={0.5}
			text="FREE SPINS  0123456789"
			maxWidth={1050}
			style={gameTextStyle({ fontSize: 54, tone: 'label' })}
		/>
		{#each [2, 4, 8, 16, 32, 64, 128, 256] as value, index}
			<Container x={340 + index * 74} y={525}>
				<Rectangle
					anchor={0.5}
					width={56}
					height={30}
					backgroundColor={0x4fd1c5}
				/>
				<GameText
					anchor={0.5}
					text={`×${value}`}
					maxWidth={48}
					style={gameTextStyle({ fontSize: 21.6, tone: 'badge' })}
				/>
			</Container>
		{/each}
		<GameText
			x={600}
			y={610}
			anchor={0.5}
			text="Press anywhere to continue"
			maxWidth={1000}
			style={gameTextStyle({ fontSize: 22, tone: 'hint' })}
		/>
	</StoryPixiApp>
	<div class="font-controls">
		{#each samples as value}
			<button onclick={() => (sample = value)}>{value}</button>
		{/each}
	</div>
</Story>

<style>
	.font-controls {
		position: absolute;
		top: 0;
		left: 0;
		z-index: 999;
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
</style>
