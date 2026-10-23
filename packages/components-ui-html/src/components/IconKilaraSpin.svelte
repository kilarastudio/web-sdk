<!--
	Kilara spin icon ("Inti Kilau"): one spin arrow, even stroke with straight cuts and a sharp
	head, turning round the Kilau dot at the button's centre. The arrow follows currentColor; the
	dot uses the accent (--ui-icon-dot overrides it, e.g. to grey it out while disabled).
	Source and construction: brand/spin in the stake-engine workspace.
-->
<script lang="ts">
	// Takes the props UiIcon passes to its Phosphor icons; there is only one weight, so it is ignored.
	type Props = {
		size?: string | number;
		weight?: string;
		'aria-hidden'?: boolean | 'true' | 'false';
		focusable?: boolean | 'true' | 'false';
	};

	const { size = '1em', 'aria-hidden': ariaHidden, focusable }: Props = $props();
</script>

<svg
	class="icon-kilara-spin"
	viewBox="0 0 96 96"
	width={size}
	height={size}
	aria-hidden={ariaHidden}
	{focusable}
>
	<path
		fill="currentColor"
		d="M58.61 85.01C52.7 86.7 46.47 86.96 40.43 85.75C34.4 84.54 28.75 81.9 23.95 78.06C19.14 74.22 15.33 69.28 12.83 63.66C10.33 58.04 9.21 51.9 9.57 45.76C9.92 39.62 11.75 33.65 14.88 28.36C18.02 23.07 22.38 18.61 27.6 15.35C32.81 12.09 38.74 10.13 44.87 9.63C51 9.13 57.16 10.1 62.84 12.47C68.51 14.84 73.54 18.54 77.49 23.25L67.53 31.61C64.76 28.31 61.2 25.76 57.18 24.21C53.17 22.66 48.82 22.15 44.55 22.73C40.28 23.32 36.23 24.97 32.77 27.55C29.32 30.12 26.57 33.53 24.79 37.45C23 41.37 22.24 45.68 22.58 49.98C22.91 54.27 24.33 58.41 26.7 62.01C29.06 65.61 32.3 68.55 36.12 70.56C39.93 72.57 44.19 73.58 48.49 73.5C52.8 73.41 57.02 72.24 60.75 70.08Z M85.46 16.57L80 47.76L59.57 38.29Z"
	/>
	<circle class="dot" cx="48" cy="48" r="9.75" />
</svg>

<style lang="scss">
	.dot {
		fill: var(--ui-icon-dot, var(--ui-accent));
	}
</style>
