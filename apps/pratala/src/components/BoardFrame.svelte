<script lang="ts" module>
	export type EmitterEventBoardFrame =
		{ type: 'boardFrameGlowShow' } | { type: 'boardFrameGlowHide' };
</script>

<script lang="ts">

	import { prefersReducedMotion, Tween } from 'svelte/motion';
	import { Sprite } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';

	import { getContext } from '../game/context';
	import { BOARD_FRAME } from '../game/constants';
	import { impact } from '../game/impact.svelte';

	const context = getContext();

	const board = $derived(context.stateGameDerived.boardLayout());
	// the flagstones the symbols land on, and the stone frame round them, both drawn by code
	// the floor and the frame shake with the board
	const floor = $derived({
		x: board.x - board.width * 0.5 + impact.x,
		y: board.y - board.height * 0.5 + impact.y,
		width: board.width,
		height: board.height,
	});
	const frame = $derived({
		x: floor.x - BOARD_FRAME.border,
		y: floor.y - BOARD_FRAME.border,
		width: floor.width + BOARD_FRAME.border * 2,
		height: floor.height + BOARD_FRAME.border * 2,
	});

	// During free spins fires burn on the hall's floor (FloorFires), and the frame takes the heat: it
	// glows, slowly brighter and dimmer, and does not burn itself.
	// the stone and gold darken toward red, as the tint, and a glow is added over them
	const HEAT = { tint: [1, 0.62, 0.5], glow: 0xc64524, alpha: 0.26, swing: 0.1, period: 2600 };
	let burning = $state(false);
	const hot = new Tween(0);
	const tint = $derived(
		HEAT.tint.reduce(
			(colour, to) => colour * 256 + Math.round(255 * (1 + (to - 1) * hot.current)),
			0,
		),
	);

	let heat = $state(HEAT.alpha);

	context.eventEmitter.subscribeOnMount({
		boardFrameGlowShow: () => {
			burning = true;
			hot.set(1, { duration: 900 });
		},
		boardFrameGlowHide: () => {
			burning = false;
			hot.set(0, { duration: 400 });
		},
	});

	$effect(() => {
		if (!burning || prefersReducedMotion.current) return;
		let request = 0;
		const update = (now: number) => {
			request = requestAnimationFrame(update);
			heat = HEAT.alpha + HEAT.swing * Math.sin((now / HEAT.period) * Math.PI * 2);
		};
		request = requestAnimationFrame(update);

		return () => cancelAnimationFrame(request);
	});
</script>

<Sprite key="boardFloor" {...floor} />
<Sprite key="boardFrame" {...frame} {tint} />

<FadeContainer show={burning} duration={900}>
	<Sprite key="boardFrame" {...frame} tint={HEAT.glow} alpha={heat} blendMode="add" />
</FadeContainer>
