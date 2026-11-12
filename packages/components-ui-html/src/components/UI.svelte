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
			without borders, one shadow level, and Kilau reserved for the Kilau dot (logo, spin icon,
			buy bonus), wins and active toggles; the spin button itself stays neutral. Palette: Kilau
			#ffc53d, Malam #0e1014, Arang #1a1d24, Kertas #f3f4f6, Kabut #8a92a0, Langit #7ab8ff; the
			other values are derived from them. The HUD's own surfaces are Malam, a near black without
			Arang's blue cast, so they sit on warm and cool game art alike: see-through on the small
			buttons, nearly solid under the spin, buy bonus and dock.
		*/
		--ui-accent: #ffc53d;
		--ui-accent-contrast: #0e1014;
		--ui-activate: #7ab8ff;
		--ui-activate-contrast: #0e1014;
		--ui-text: #f3f4f6;
		--ui-text-muted: #8a92a0;
		--ui-text-disabled: rgba(138, 146, 160, 0.5);
		--ui-surface: rgba(14, 16, 20, 0.84);
		--ui-surface-raised: rgba(30, 32, 37, 0.97);
		--ui-field: rgba(243, 244, 246, 0.07);
		--ui-button-bg: var(--ui-surface);
		--ui-disabled-bg: rgba(243, 244, 246, 0.12);
		--ui-scrim: rgba(14, 16, 20, 0.5);
		--ui-shadow: 0 12px 32px rgba(14, 16, 20, 0.4);
		--ui-text-shadow: 0 2px 8px rgba(14, 16, 20, 0.65);
		/*
			Text that sits straight on the game's art (the header, and the labels of the layouts
			without a dock) has to read on any picture, bright or dark: it is lighter than Kabut, has
			a tight dark edge under the soft shadow, and stands on a scrim, a fade to Malam from the
			screen's edge.
		*/
		--ui-text-on-art: #cdd2da;
		--ui-text-shadow-on-art: 0 1px 2px rgba(14, 16, 20, 0.9), 0 2px 10px rgba(14, 16, 20, 0.7);
		--ui-scrim-edge: rgba(14, 16, 20, 0.8);
		--ui-scrim-mid: rgba(14, 16, 20, 0.5);

		position: fixed;
		inset: 0;
		overflow: hidden;
		color: var(--ui-text);
		font-family: var(--font-family);
		pointer-events: none;
		-webkit-tap-highlight-color: transparent;
	}
</style>
