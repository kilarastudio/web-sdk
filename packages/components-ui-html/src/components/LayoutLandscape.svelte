<script lang="ts">
	import HudBar from './HudBar.svelte';
</script>

<!-- stage: 1920 × 1080 -->
<div class="layout">
	<HudBar />
</div>

<style lang="scss">
	.layout {
		--ui-font-size: 38px;
		--ui-button-size: 100px;
		--ui-button-size-large: 184px;
		--ui-feature-size: 144px;
		--bar-width: 1540px;
		--bar-height: 128px;
		--bar-bottom: 36px;
		--bar-padding: 20px;
		--stepper-height: 96px;
		/* the menu opens over the menu button, the first item in the dock */
		--menu-x: calc(50% - var(--bar-width) / 2 + var(--bar-padding) + var(--ui-button-size) / 2);
		--menu-bottom: calc(var(--bar-bottom) + (var(--bar-height) - var(--ui-button-size)) / 2);
		--menu-gap: 14px;

		position: absolute;
		inset: 0;
	}
</style>
