<script lang="ts">
	import { SvelteDate } from 'svelte/reactivity';

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

<time class="ui-clock">{clock}</time>

<style lang="scss">
	.ui-clock {
		font-variant-numeric: tabular-nums;
	}
</style>
