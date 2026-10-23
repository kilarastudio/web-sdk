<script lang="ts">
	type Props = {
		label: string;
		value: string;
		stacked?: boolean;
	};

	const props: Props = $props();
</script>

<div class="ui-label" class:stacked={props.stacked}>
	<span>{props.label}</span>
	<span>{props.value}</span>
</div>

<style lang="scss">
	.ui-label {
		box-sizing: border-box;
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: calc(var(--ui-font-size) * 13.4);
		height: calc(var(--ui-font-size) * 3);
		padding: 0 2em;
		border-radius: calc(var(--ui-font-size) * 0.8);
		background-color: #000000;
		color: #ffffff;
		font-family: 'proxima-nova', sans-serif;
		font-size: var(--ui-font-size);
		line-height: 1.1;
		white-space: nowrap;

		&.stacked {
			flex-direction: column;
			justify-content: center;
			padding: 0;
		}
	}
</style>
