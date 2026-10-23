<script lang="ts">
	import type { Snippet } from 'svelte';

	import { stateUi } from 'state-shared';
	import { zIndex } from 'constants-shared/zIndex';

	import './font.css';
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
		/*
			Kilara HUD tokens (direction A), the same in every game. Clean, app-like: flat surfaces
			without borders, one shadow level, and Kilau reserved for the primary action (spin), wins
			and active toggles. Palette: Kilau #ffc53d, Malam #0e1014, Arang #1a1d24, Kertas #f3f4f6,
			Kabut #8a92a0, Langit #7ab8ff; the other values are derived from them.
		*/
		--ui-accent: #ffc53d;
		--ui-accent-contrast: #0e1014;
		--ui-activate: #7ab8ff;
		--ui-activate-contrast: #0e1014;
		--ui-text: #f3f4f6;
		--ui-text-muted: #8a92a0;
		--ui-text-disabled: rgba(138, 146, 160, 0.5);
		--ui-surface: rgba(26, 29, 36, 0.9);
		--ui-surface-raised: rgba(35, 39, 48, 0.98);
		--ui-field: rgba(243, 244, 246, 0.07);
		--ui-button-bg: rgba(26, 29, 36, 0.72);
		--ui-disabled-bg: rgba(243, 244, 246, 0.12);
		--ui-scrim: rgba(14, 16, 20, 0.5);
		--ui-shadow: 0 12px 32px rgba(14, 16, 20, 0.4);
		--ui-squircle: 32%;
		--ui-text-shadow: 0 2px 8px rgba(14, 16, 20, 0.65);

		position: fixed;
		inset: 0;
		overflow: hidden;
		color: var(--ui-text);
		font-family: var(--font-family);
		pointer-events: none;
		-webkit-tap-highlight-color: transparent;
	}
</style>
