<script lang="ts" module>
	// one-off reactions that book events trigger; anticipation follows the reels themselves
	export type CharacterReaction = 'power' | 'win' | 'bigWin' | 'bonus';

	export type EmitterEventCharacter = { type: 'characterReact'; reaction: CharacterReaction };
</script>

<script lang="ts">
	import { tick } from 'svelte';
	import { prefersReducedMotion } from 'svelte/motion';

	import { Graphics } from 'pixi-svelte';
	import { Skeleton } from 'components-pixi';

	import { getContext } from '../game/context';
	import { CHARACTER_LOOPS, CHARACTER_MIX, characterSkeleton } from '../game/character';

	// Each pose is an animation of the character skeleton under the same name. Reduced
	// motion shows the bind pose and skips the reactions.
	type Pose = 'idle' | 'anticipation' | CharacterReaction;

	// bigWin loops until the celebration is over, in ms
	const BIG_WIN_HOLD = 3000;
	const { bounds } = characterSkeleton;

	const context = getContext();
	const layout = $derived(context.stateGameDerived.characterLayout());
	const scale = $derived(layout.height / bounds.height);
	const anticipating = $derived(
		context.stateGame.board.some((reel) => reel.reelState.anticipating),
	);

	let reaction = $state<CharacterReaction>();
	let reactionId = 0;
	const pose = $derived<Pose>(reaction ?? (anticipating ? 'anticipation' : 'idle'));

	const react = async (next: CharacterReaction) => {
		if (prefersReducedMotion.current) return;
		const id = ++reactionId;
		// the same pose again starts over
		if (reaction === next) {
			reaction = undefined;
			await tick();
			if (id !== reactionId) return;
		}
		reaction = next;
		if (CHARACTER_LOOPS[next])
			setTimeout(() => {
				if (id === reactionId) reaction = undefined;
			}, BIG_WIN_HOLD);
	};

	// one-shot reactions settle back once they have played
	const finish = (animation: string) => {
		if (reaction && animation === reaction && !CHARACTER_LOOPS[reaction]) reaction = undefined;
	};

	context.eventEmitter.subscribeOnMount({
		characterReact: ({ reaction }) => react(reaction),
	});
</script>

<!-- left out where the screen has no room for it -->
{#if layout.placement !== 'hidden'}
	<Graphics
		draw={(graphics) => {
			graphics
				.ellipse(layout.x, layout.y + 2, layout.width * 0.42, layout.height * 0.025)
				.fill({ color: 0x03070b, alpha: 0.45 });
			graphics
				.ellipse(layout.x, layout.y + 2, layout.width * 0.32, layout.height * 0.012)
				.fill({ color: 0x03070b, alpha: 0.35 });
		}}
	/>
	<!-- the bounds centred on the layout box, boots on its feet line -->
	<Skeleton
		data={characterSkeleton}
		animation={prefersReducedMotion.current ? undefined : pose}
		loop={CHARACTER_LOOPS[pose]}
		mix={CHARACTER_MIX}
		height={layout.height}
		x={layout.x - (bounds.x + bounds.width / 2) * scale}
		y={layout.y - (bounds.y + bounds.height) * scale}
		oncomplete={finish}
	/>
{/if}
