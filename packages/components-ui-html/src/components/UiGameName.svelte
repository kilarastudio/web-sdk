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
		gap: 5px;
	}
</style>
