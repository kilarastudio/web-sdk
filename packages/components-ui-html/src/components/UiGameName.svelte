<script lang="ts">
	import { SvelteDate } from 'svelte/reactivity';

	type Props = {
		name: string;
	};

	const props: Props = $props();
	const reactiveDate = new SvelteDate();
	const clock = $derived(
		reactiveDate.toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: 'numeric',
			hour12: false,
		}),
	);

	$effect(() => {
		const interval = setInterval(() => {
			reactiveDate.setTime(Date.now());
		}, 1000);

		return () => {
			clearInterval(interval);
		};
	});
</script>

<span class="ui-game-name">
	<time>{clock}</time>
	<span>{props.name}</span>
</span>

<style lang="scss">
	.ui-game-name {
		display: inline-flex;
		gap: 0.6em;
	}

	time {
		font-variant-numeric: tabular-nums;

		&::after {
			content: '|';
			margin-left: 0.6em;
			opacity: 0.6;
		}
	}
</style>
