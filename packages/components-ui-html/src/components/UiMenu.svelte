<script lang="ts">
	import { stateUi } from 'state-shared';

	import UiStage from './UiStage.svelte';
	import ButtonPayTable from './ButtonPayTable.svelte';
	import ButtonGameRules from './ButtonGameRules.svelte';
	import ButtonSettings from './ButtonSettings.svelte';
	import ButtonSoundSwitch from './ButtonSoundSwitch.svelte';
	import ButtonMenuClose from './ButtonMenuClose.svelte';
</script>

<!--
	App-style popover: a card of labelled rows above the menu button, with the close button taking
	the menu button's place. The layout sets --menu-x (centre of the menu button), --menu-bottom
	(its bottom edge) and --menu-gap, in stage pixels.
-->
{#if stateUi.menuOpen}
	<div
		class="ui-menu-backdrop"
		role="presentation"
		onclick={() => (stateUi.menuOpen = false)}
	></div>

	<UiStage>
		<div class="ui-menu">
			<nav class="ui-menu-card">
				<ButtonPayTable />
				<ButtonGameRules />
				<ButtonSettings />
				<ButtonSoundSwitch />
			</nav>
			<ButtonMenuClose />
		</div>
	</UiStage>
{/if}

<style lang="scss">
	.ui-menu-backdrop {
		position: absolute;
		inset: 0;
		background-color: var(--ui-scrim);
		cursor: pointer;
		pointer-events: auto;
	}

	.ui-menu {
		--ui-button-bg: var(--ui-surface-raised);

		position: absolute;
		left: calc(var(--menu-x) - var(--ui-button-size) / 2);
		bottom: var(--menu-bottom);
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--menu-gap);
	}

	.ui-menu-card {
		--ui-row-height: calc(var(--ui-button-size) * 0.92);
		--ui-button-hover-bg: var(--ui-field);

		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: calc(var(--ui-font-size) * 9.5);
		padding: 10px;
		border-radius: calc(var(--ui-row-height) * 0.42);
		background-color: var(--ui-surface-raised);
		box-shadow: var(--ui-shadow);
	}
</style>
