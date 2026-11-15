<script lang="ts">
	// Compatibility preview for the approved tier 1 sample.
	import GlintTile from './GlintTile.svelte';
	const props: { layer: 'under' | 'over'; value: number; oncomplete?: () => void } = $props();
</script>

<GlintTile {...props} animation={props.oncomplete ? 'light' : undefined} />
