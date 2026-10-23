<script lang="ts">
	import HudBar from './HudBar.svelte';
</script>

<!-- stage: 1920 × 1080 -->
<div class="layout">
	<HudBar />
</div>

<style lang="scss">
	.layout {
		--ui-font-size: 34px;
		--ui-button-size: 84px;
		--ui-button-size-large: 164px;
		--ui-feature-size: 136px;
		--bar-width: 1400px;
		--bar-height: 112px;
		--bar-bottom: 44px;
		--bar-padding: 20px;
		--stepper-height: 84px;
		/* the menu opens over the menu button, the first item in the dock */
		--menu-x: calc(50% - var(--bar-width) / 2 + var(--bar-padding) + var(--ui-button-size) / 2);
		--menu-bottom: calc(var(--bar-bottom) + (var(--bar-height) - var(--ui-button-size)) / 2);
		--menu-gap: 14px;

		position: absolute;
		inset: 0;
	}
</style>
