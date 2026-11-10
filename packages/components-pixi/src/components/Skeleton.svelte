<script lang="ts" module>
	import * as PIXI from 'pixi.js';
	import { findAttachment, type AnimationState, type SkeletonData } from '../skeleton/skeleton';

	// The display object, with read-only handles for QA scripts that walk the stage.
	export class SkeletonContainer extends PIXI.Container {
		skeletonData: SkeletonData;
		animationState: AnimationState;
		skin = 'default';
		// seconds played since mount, scaled by timeScale; unlike the track time it never wraps
		elapsed = 0;

		constructor(skeletonData: SkeletonData, animationState: AnimationState) {
			super({ label: `skeleton:${skeletonData.name}` });
			this.skeletonData = skeletonData;
			this.animationState = animationState;
		}

		// texture key drawn in a slot at the current pose, or null when hidden
		textureOf(slot: string) {
			const index = this.skeletonData.slots.findIndex((item) => item.name === slot);
			const name = this.animationState.pose().slots[index]?.attachment;
			return name
				? (findAttachment(this.skeletonData, this.skin, slot, name)?.texture ?? null)
				: null;
		}
	}

	export type Props = {
		// read once; mount a new component for a different skeleton
		data: SkeletonData;
		skin?: string;
		animation?: string;
		loop?: boolean;
		// seconds to cross-fade from the previous animation
		mix?: number;
		timeScale?: number;
		// scale the skeleton bounds to this size, like SpineProvider
		width?: number;
		height?: number;
		x?: number;
		y?: number;
		alpha?: number;
		oncomplete?: (animation: string) => void;
		onevent?: (name: string, animation: string) => void;
	};
</script>

<script lang="ts">
	import { onDestroy, untrack } from 'svelte';
	import { getContextApp, getContextParent } from 'pixi-svelte';

	import { AnimationState, localMatrix, multiply, worldMatrices } from '../skeleton/skeleton';

	const props: Props = $props();
	const app = getContextApp();
	const parent = getContextParent();
	const data = untrack(() => props.data);
	const slotBones = data.slots.map((slot) =>
		data.bones.findIndex((bone) => bone.name === slot.bone),
	);
	const missing = new Set<string>();

	const state = new AnimationState(data, {
		event: (name, animation) => props.onevent?.(name, animation),
		complete: (animation) => props.oncomplete?.(animation),
	});
	const root = new SkeletonContainer(data, state);
	const sprites = data.slots.map((slot) => {
		const sprite = new PIXI.Sprite();
		sprite.blendMode = slot.blend === 'add' ? 'add' : 'normal';
		root.addChild(sprite);
		return sprite;
	});
	const matrix = new PIXI.Matrix();

	const render = () => {
		if (root.destroyed) return;
		const pose = state.pose();
		const bones = worldMatrices(data, pose);
		const skin = root.skin;
		data.slots.forEach((slot, i) => {
			const sprite = sprites[i];
			const { alpha, attachment: name } = pose.slots[i];
			const attachment = name ? findAttachment(data, skin, slot.name, name) : undefined;
			const texture = attachment
				? (app.stateApp.loadedAssets?.[attachment.texture] as PIXI.Texture | undefined)
				: undefined;
			if (attachment && !texture && !missing.has(attachment.texture)) {
				missing.add(attachment.texture);
				console.error(`Skeleton ${data.name}: texture "${attachment.texture}" is not loaded`);
			}
			sprite.visible = Boolean(texture) && alpha > 0;
			if (!attachment || !texture || !sprite.visible) return;
			sprite.texture = texture;
			sprite.alpha = alpha;
			sprite.anchor.set(...(attachment.anchor ?? [0.5, 0.5]));
			const local = localMatrix(
				attachment.x ?? 0,
				attachment.y ?? 0,
				attachment.rotation ?? 0,
				attachment.width / texture.width,
				attachment.height / texture.height,
			);
			sprite.setFromMatrix(matrix.set(...multiply(bones[slotBones[i]], local)));
		});
	};

	$effect(() => {
		const name = props.animation;
		const loop = props.loop ?? false;
		const mix = props.mix ?? 0;
		untrack(() => {
			if (name && data.animations[name]) {
				state.play(name, { loop, mix });
			} else {
				state.clear();
				// a missing one-shot animation completes at once, so flows waiting on it go on
				if (name && !loop) {
					console.warn(`Skeleton ${data.name}: no animation "${name}", completing at once`);
					setTimeout(() => props.oncomplete?.(name));
				}
			}
			render();
		});
	});

	$effect(() => {
		state.timeScale = props.timeScale ?? 1;
	});

	$effect(() => {
		root.skin = props.skin ?? 'default';
		untrack(render);
	});

	$effect(() => {
		const { bounds } = data;
		const scale = props.width
			? props.width / bounds.width
			: props.height
				? props.height / bounds.height
				: 1;
		root.scale.set(scale);
		root.position.set(props.x ?? 0, props.y ?? 0);
		root.alpha = props.alpha ?? 1;
	});

	const tick = (ticker: PIXI.Ticker) => {
		if (root.destroyed) return;
		root.elapsed += (ticker.deltaMS / 1000) * state.timeScale;
		state.update(ticker.deltaMS / 1000);
		render();
	};
	const ticker = app.stateApp.pixiApplication?.ticker;
	ticker?.add(tick);
	onDestroy(() => ticker?.remove(tick));

	parent.addToParent(root);
</script>
