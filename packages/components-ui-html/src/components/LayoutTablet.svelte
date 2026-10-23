<script lang="ts">
	import HudBar from './HudBar.svelte';
</script>

<!-- stage: 1920 × 1920 -->
<div class="layout">
	<HudBar />
</div>

<style lang="scss">
	.layout {
		--ui-font-size: 36px;
		--ui-button-size: 88px;
		--ui-button-size-large: 172px;
		--ui-feature-width: 216px;
		--ui-feature-height: 100px;
		--ui-feature-font-size: 26px;
		--bar-width: 1440px;
		--bar-height: 118px;
		--bar-bottom: 52px;
		--bar-padding: 20px;
		--stepper-height: 88px;
		/* the menu opens over the menu button, the first item in the dock */
		--menu-x: calc(50% - var(--bar-width) / 2 + var(--bar-padding) + var(--ui-button-size) / 2);
		--menu-bottom: calc(var(--bar-bottom) + (var(--bar-height) - var(--ui-button-size)) / 2);
		--menu-gap: 14px;

		position: absolute;
		inset: 0;
	}
</style>
