<script lang="ts">
	import { getContext } from '../game/context';
	import { BOARD_DIMENSIONS } from '../game/constants';
	import { generateArt } from '../pixel/textures';
	import { FLAME_SIZES } from '../game/torches';

	// The art drawn by code joins the loaded assets under its own keys, before anything renders.
	const context = getContext();

	if (!context.stateApp.loadedAssets.boardFrame)
		context.stateApp.loadedAssets = {
			...context.stateApp.loadedAssets,
			...generateArt({
				columns: BOARD_DIMENSIONS.x,
				rows: BOARD_DIMENSIONS.y,
				flames: FLAME_SIZES,
			}),
		};
</script>
