<script lang="ts">
	import { PUBLIC_SITE_MODE } from 'envs';

	type Props = {
		version: string; // "major.feature.patch"
	};

	const props: Props = $props();
</script>

<!-- the build's mode and version, small at the foot of the paytable and the rules, for support -->
<p class="game-version">{PUBLIC_SITE_MODE} {props.version}</p>

<style lang="scss">
	.game-version {
		margin: 0;
		color: var(--ui-text-muted, #8a92a0);
		font-size: 0.75em;
		font-weight: 600;
		letter-spacing: 0.1em;
		opacity: 0.7;
		text-transform: uppercase;
		user-select: text;
	}
</style>
