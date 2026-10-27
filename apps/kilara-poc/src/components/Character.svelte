<script lang="ts" module>
	// one-off reactions that book events trigger; anticipation follows the reels themselves
	export type CharacterReaction = 'power' | 'win' | 'bigWin' | 'bonus';

	export type EmitterEventCharacter = { type: 'characterReact'; reaction: CharacterReaction };
</script>

<script lang="ts">
	import { prefersReducedMotion, Tween } from 'svelte/motion';
	import { cubicIn, cubicOut, sineInOut } from 'svelte/easing';

	import { Container, Graphics, Sprite } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { CHARACTER_ART } from '../game/art.generated';

	// Each pose is an animation the character art provides under the same name (idle and
	// anticipation loop, the others play once). Until the art has them, the still idle art
	// (kilara-mine-v3/runtime/character-idle.webp) leans and jumps for them in code.
	type Pose = 'idle' | 'anticipation' | CharacterReaction;

	// how long each reaction holds before the character settles back, in ms
	const REACTION_DURATION = { power: 900, win: 1400, bigWin: 3000, bonus: 2000 };
	const REACTION_JUMPS = { power: 0, win: 1, bigWin: 3, bonus: 2 };
	// the art's canvas and the figure in it, head to boots, in source pixels
	const ART = CHARACTER_ART;

	const context = getContext();
	const layout = $derived(context.stateGameDerived.characterLayout());
	const artScale = $derived(layout.height / (ART.figure.bottom - ART.figure.top));
	const anticipating = $derived(
		context.stateGame.board.some((reel) => reel.reelState.anticipating),
	);

	let reaction = $state<CharacterReaction>();
	let reactionId = 0;
	const pose = $derived<Pose>(reaction ?? (anticipating ? 'anticipation' : 'idle'));

	const lift = new Tween(0);
	const lean = new Tween(1);
	const breath = new Tween(1, { duration: 1600, easing: sineInOut });

	const react = async (next: CharacterReaction) => {
		const id = ++reactionId;
		reaction = next;
		setTimeout(() => {
			if (id === reactionId) reaction = undefined;
		}, REACTION_DURATION[next]);

		if (prefersReducedMotion.current) return;
		for (let jump = 0; jump < REACTION_JUMPS[next] && id === reactionId; jump++) {
			await lift.set(-layout.height * 0.06, { duration: 180, easing: cubicOut });
			await lift.set(0, { duration: 220, easing: cubicIn });
		}
	};

	// leans in while waiting on a reel or powering the multipliers
	$effect(() => {
		const target = pose === 'anticipation' || pose === 'power' ? 1.04 : 1;
		lean.set(target, { duration: prefersReducedMotion.current ? 0 : 250, easing: cubicOut });
	});

	// breathes while nothing else moves it
	$effect(() => {
		if (prefersReducedMotion.current) return;

		let inhale = true;
		const interval = setInterval(() => {
			breath.target = inhale ? 1.015 : 1;
			inhale = !inhale;
		}, 1600);

		return () => clearInterval(interval);
	});

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
	<!-- drawn from the middle of its feet up, so scaling grows it upward -->
	<Container
		x={layout.x}
		y={layout.y + lift.current}
		scale={{ x: lean.current, y: lean.current * breath.current }}
	>
		<!-- anchored at the middle of its boots -->
		<Sprite
			key="characterIdle"
			anchor={{
				x: (ART.figure.left + ART.figure.right) / 2 / ART.width,
				y: ART.figure.bottom / ART.height,
			}}
			width={ART.width * artScale}
			height={ART.height * artScale}
		/>
	</Container>
{/if}
