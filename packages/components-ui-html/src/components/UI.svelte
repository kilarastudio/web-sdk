<script lang="ts">
	import type { Snippet } from 'svelte';

	import { stateUi } from 'state-shared';
	import { zIndex } from 'constants-shared/zIndex';

	import UIDefault from './UIDefault.svelte';
	import UIReplay from './UIReplay.svelte';

	type Props = {
		gameName: Snippet;
		logo?: Snippet;
	};

	const props: Props = $props();

	const UI_COMPONENT_MAP = {
		default: UIDefault,
		replay: UIReplay,
	};

	const UIComponent = $derived(UI_COMPONENT_MAP[stateUi.config.mode]);
</script>

<!-- HUD rendered in HTML on top of the Pixi canvas, below the modals -->
<div class="ui" style:z-index={zIndex.ui}>
	<UIComponent gameName={props.gameName} logo={props.logo} />
</div>

<style lang="scss">
	.ui {
		position: fixed;
		inset: 0;
		overflow: hidden;
		pointer-events: none;
		-webkit-tap-highlight-color: transparent;
	}
</style>
