<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	const { Story } = defineMeta({ title: 'COMPONENTS/<StudioIntro>' });
</script>

<script lang="ts">
	import { StudioIntro } from 'components-ui-html';

	let take = $state(0);
	let ended = $state(false);
</script>

<!-- held: ready stays false, so the intro stays up after its motion; Replay mounts it again -->
<Story name="held">
	{#key take}
		<StudioIntro ready={false} />
	{/key}
	<button class="replay" onclick={() => (take += 1)}>Replay</button>
</Story>

<!-- as in a game whose assets are in at once: it ends after its minimum time and fades out -->
<Story name="ready">
	{#key take}
		<StudioIntro ready onend={() => (ended = true)} />
	{/key}
	<button
		class="replay"
		onclick={() => {
			ended = false;
			take += 1;
		}}>Replay {ended ? '(ended)' : ''}</button
	>
</Story>

<style>
	.replay {
		position: fixed;
		right: 16px;
		bottom: 16px;
		z-index: 1000;
		padding: 8px 14px;
		border: none;
		background: #1a1d24;
		color: #f3f4f6;
		font: 600 12px sans-serif;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		cursor: pointer;
	}
</style>
