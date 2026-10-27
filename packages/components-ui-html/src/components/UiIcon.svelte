<script lang="ts" module>
	// Kilara's own icon set, bundled with the game: never load icons from a CDN. The buttons only
	// know the names; the drawings live in kilaraIcons.ts.
	import { KILARA_ICONS, type KilaraIconName } from './kilaraIcons';

	export type UiIconName = KilaraIconName;
</script>

<script lang="ts">
	type Props = {
		name: UiIconName;
		rotation?: number;
	};

	const { name, rotation = 0 }: Props = $props();
	const icon = $derived(KILARA_ICONS[name]);
</script>

<!-- decorative: the button around it carries the (translated) label -->
<span class="ui-icon" style:transform={rotation ? `rotate(${rotation}deg)` : undefined}>
	<svg viewBox="0 0 96 96" aria-hidden="true" focusable="false">
		<path fill="currentColor" d={icon.d} />
		{#if icon.dot}
			<path class="dot" d={icon.dot} />
		{/if}
	</svg>
</span>

<style lang="scss">
	.ui-icon {
		display: block;
		width: 1em;
		height: 1em;
		flex-shrink: 0;

		svg {
			display: block;
			width: 100%;
			height: 100%;
		}
	}

	/* the Kilau dot (spin): the accent unless the button greys it out through --ui-icon-dot */
	.dot {
		fill: var(--ui-icon-dot, var(--ui-accent));
	}
</style>
