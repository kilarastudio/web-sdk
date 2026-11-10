<!--
	Kilara wordmark ("Tegas"): hand-built geometric letters with the round Kilau dot over the i.
	The letters follow currentColor; the dot uses the accent, like the spin button.
-->
<script lang="ts">
	import { WORDMARK_VIEWBOX, KILARA_PATH, KILAU_DOT } from './kilaraLogo';
</script>

<svg class="ui-logo" viewBox={WORDMARK_VIEWBOX} role="img" aria-label="Kilara Studio">
	<path fill="currentColor" d={KILARA_PATH} />
	<circle class="dot" cx={KILAU_DOT.cx} cy={KILAU_DOT.cy} r={KILAU_DOT.r} />
</svg>

<style lang="scss">
	.ui-logo {
		display: block;
		/*
			the height includes the dot, which rises above the letters; 1.75em keeps the x-height
			where the previous wordmark had it, and below 17px the dot stops reading as a light
		*/
		height: max(17px, 1.75em);
		width: auto;
		filter: drop-shadow(var(--ui-text-shadow));
	}

	.dot {
		fill: var(--ui-accent);
	}
</style>
