<script lang="ts">
	import type { LoadedAudio } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { sound, type SoundName } from '../game/sound';

	const context = getContext();

	// the audio is not preloaded, so it may arrive after this mounts
	const audio = $derived(context.stateApp.loadedAssets['sound']);

	$effect(() => {
		if (!audio) return;
		const { destroy } = sound.load($state.snapshot(audio) as LoadedAudio<SoundName>);

		// Equivalent to onDestroy(); Leave this comment for searching.
		return () => destroy();
	});

	sound.enableEffect();
	sound.volumeEffect();
</script>
