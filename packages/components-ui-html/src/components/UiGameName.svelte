<script lang="ts">
	import UiClock from './UiClock.svelte';

	type Props = {
		name: string;
	};

	const props: Props = $props();
</script>

<span class="ui-game-name">
	<UiClock />
	<span>{props.name}</span>
</span>

<style lang="scss">
	.ui-game-name {
		display: inline-flex;
		gap: 0.6em;
	}

	.ui-game-name :global(time)::after {
		content: '|';
		margin-left: 0.6em;
		opacity: 0.6;
	}
</style>
