<script lang="ts">
	import * as PIXI from 'pixi.js';

	import { BaseSprite } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { getSymbolInfo, getSymbolX } from '../game/utils';
	import { spinStream } from '../game/spin.svelte';
	import { STREAM_TINT, SYMBOL_SIZE } from '../game/constants';

	// The symbols that stream down the columns while a spin waits on its answer
	// (game/spin.svelte.ts): the still art, a step darker than the board's own, so nobody reads
	// them as the result. Drawn under the board's mask.
	const context = getContext();

	const texture = (key: string) =>
		(context.stateApp.loadedAssets[key] ?? PIXI.Texture.EMPTY) as PIXI.Texture;
</script>

{#each spinStream.symbols as symbol (symbol.id)}
	<BaseSprite
		texture={texture(getSymbolInfo({ rawSymbol: symbol.rawSymbol, state: 'static' }).assetKey)}
		anchor={0.5}
		x={getSymbolX(symbol.reelIndex)}
		y={symbol.y}
		width={SYMBOL_SIZE}
		height={SYMBOL_SIZE}
		tint={STREAM_TINT}
	/>
{/each}
