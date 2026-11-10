<script lang="ts" module>
	import * as SPINE_PIXI from '@esotericsoftware/spine-pixi-v8';

	type SpineState = SPINE_PIXI.Spine['state'];
	type TrackEntry = SPINE_PIXI.TrackEntry;

	export type Props = Partial<TrackEntry> & {
		trackIndex: Parameters<SpineState['setAnimation']>[0];
		animationName: Parameters<SpineState['setAnimation']>[1];
	};
</script>

<script lang="ts">
	import { onDestroy } from 'svelte';

	import { propsSyncEffect } from '../utils.svelte';
	import { getContextSpine } from '../context.svelte';

	const props: Props = $props();
	const spine = getContextSpine();

	let track = $state(spine.state.tracks[props.trackIndex]);
	let missing = $state(false);

	$effect(() => {
		if (props.trackIndex !== track?.trackIndex || props.animationName !== track?.animation?.name) {
			if (track) spine.state.setEmptyAnimation(track.trackIndex, 0);
			const animations = spine.state.data.skeletonData.animations;
			if (spine.state.data.skeletonData.findAnimation(props.animationName)) {
				missing = false;
				track = spine.state.setAnimation(props.trackIndex, props.animationName, props.loop);
			} else {
				// a missing animation plays as an empty one that completes on the next update,
				// so listeners waiting for "complete" still fire
				if (animations.length > 0) {
					console.warn(
						`SpineTrack: animation "${props.animationName}" not found. Available:`,
						animations.map((animation) => animation.name),
					);
				}
				missing = true;
				track = spine.state.setEmptyAnimation(props.trackIndex, 0);
			}
		}
	});

	propsSyncEffect({ props, target: () => track, ignore: ['trackIndex', 'animationName'] });

	// a looping empty animation would report "complete" every frame
	$effect(() => {
		props.loop;
		if (missing && track) track.loop = false;
	});

	onDestroy(() => {
		spine.state.setEmptyAnimation(props.trackIndex, 0);
	});
</script>
