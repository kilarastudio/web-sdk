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
	Opens on top of the menu button: the layout sets --menu-x (centre of the menu button) and
	--menu-bottom (its bottom edge) in stage pixels, plus --menu-gap between the items.
-->
{#if stateUi.menuOpen}
	<div
		class="ui-menu-backdrop"
		role="presentation"
		onclick={() => (stateUi.menuOpen = false)}
	></div>

	<UiStage>
		<nav class="ui-menu">
			<ButtonPayTable />
			<ButtonGameRules />
			<ButtonSettings />
			<ButtonSoundSwitch />
			<ButtonMenuClose />
		</nav>
	</UiStage>
{/if}

<style lang="scss">
	.ui-menu-backdrop {
		position: absolute;
		inset: 0;
		background-color: rgba(0, 0, 0, 0.5);
		cursor: pointer;
		pointer-events: auto;
	}

	.ui-menu {
		position: absolute;
		left: var(--menu-x);
		bottom: var(--menu-bottom);
		transform: translateX(-50%);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--menu-gap);
	}
</style>
