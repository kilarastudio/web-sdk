<script lang="ts">
	import type { Snippet } from 'svelte';
	import { untrack } from 'svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import * as PIXI from 'pixi.js';

	import { BaseSprite, Container } from 'pixi-svelte';
	import { stateBetDerived } from 'state-shared';
	import { waitForTimeout } from 'utils-shared/wait';

	import { getContext } from '../game/context';
	import { getSymbolInfo } from '../game/utils';
	import { ART_PIXEL, SYMBOL_SIZE } from '../game/constants';
	import { animate, frameAt, lerp } from '../game/motion';
	import { pixelClock } from '../game/pixelClock.svelte';
	import { anticipation, anticipationDim } from '../game/anticipation.svelte';
	import {
		ACT_DURATION,
		IDLE_ACTS,
		LAND_FRAME,
		LAND_MOVES,
		SYMBOL_ACTS,
		SYMBOL_RESTS,
		type Move,
		type SymbolEffect,
		type SymbolPose,
	} from '../game/symbolActs';
	import {
		WIN_SCALE,
		flashGlow,
		landPuff,
		spotlight,
		symbolFx,
		winBeat,
	} from '../game/symbolFx.svelte';
	import { joinIdle } from '../game/idle';
	import { OVER_STILL } from '../pixel/textures';

	type Props = {
		x?: number;
		y?: number;
		symbolInfo: ReturnType<typeof getSymbolInfo>;
		oncomplete?: () => void;
		// drawn on the symbol, and moved with it
		children?: Snippet;
		// how many times it has touched down in its place (game/contact.svelte.ts)
		contact?: number;
		// its place on the board, where the dust of its landing and its light are drawn
		place?: { x: number; y: number };
	};

	const props: Props = $props();
	const context = getContext();

	// Symbols are solid objects, never bent. Detail is drawn into their frame runs
	// (pixel/symbolRuns.ts) by whole art pixels; weight comes from moving the whole sprite: it moves,
	// turns and grows uniformly, big enough to read on a phone (a cell is about 60 CSS px).
	// - Landing: the reel brings a symbol into place on one smooth curve. At the touch (before the
	//   curve's last ease) it brightens for a moment, throws up dust (embers too if it is heavy),
	//   plays its Land run and reacts with its whole body (symbolActs.ts LAND_MOVES): a heavy symbol
	//   sinks into its foot and comes back up, a bottle or the hat rocks on its base, the dragon's eye
	//   swells open over a short flare of light. Nothing waits for it.
	// - A win: the symbol turns white and pulls in (the hit), bursts out past its size with a twist
	//   and settles grown by WIN_SCALE, breathing with the light behind it (SymbolFx), while it does
	//   its own act (game/symbolActs.ts) and a band of light crosses it. It stays grown, breathing,
	//   until the tumble takes it; the rest of the board dims a little meanwhile.
	// - At rest it joins the board's idle cues (game/idle.ts), now and then playing one of its bigger
	//   rest acts with a move of its whole body.
	// - While a column waits on a scatter, every other symbol darkens and the scatters throb, their
	//   slits narrowed and their seams glowing with the beat.
	const WIN = {
		hold: { duration: 80, squeeze: 0.1 },
		// out past its held size, then it settles into it
		flash: { duration: 110, peak: 1.42 },
		settle: { duration: 240 },
		// a quick turn each way as it bursts out, dying away
		twist: { duration: 460, degrees: 7 },
		shine: { duration: 380 },
	};
	const WIN_DURATION = WIN.hold.duration + WIN.flash.duration + ACT_DURATION;
	// the touch of a landing: the symbol's white silhouette over it, this strong, this long
	const TOUCH = { brighten: 0.35, duration: 60 };
	// the dragon's eye landing: a short flare of light behind it
	const SCATTER_LAND_GLOW = 1100;
	// the board turned to its winners: the others step back this far
	const WIN_DIMMED = { red: 0x8a, green: 0x90, blue: 0xaa };
	const DIMMED = { red: 0x70, green: 0x78, blue: 0x96 };
	const DIMMED_DEEP = { red: 0x34, green: 0x36, blue: 0x4a };
	// the scatters under the free spins intro's words: dimmer than awake, far brighter than the rest
	const HUSHED = 0x86;

	let pop = $state(1);
	let pose = $state<SymbolPose>({});
	let effects = $state<SymbolEffect[]>([]);
	let overlay = $state<PIXI.Texture>();
	// a frame standing in for the symbol's art
	let stand = $state<PIXI.Texture>();
	// the frame of its landing, which outlives the land state: the reel calls a symbol landed at
	// once, and the run plays on over it at rest
	let landing = $state<PIXI.Texture>();
	let run = 0;
	let landRun = 0;
	let resting = false;
	// the sprite-level move of a landing or an idle act, about its pivot (ART_PIXEL below the middle)
	let move = $state<Move>({});
	let movePivot = $state(0);
	let moveRun = 0;
	// the win's twist, about the middle
	let turn = $state(0);
	// the white of a touch, 0 to 1
	let brighten = $state(0);
	let touchedAt = -Infinity;

	const reduced = $derived(prefersReducedMotion.current);
	const assetKey = $derived(props.symbolInfo.assetKey);
	const act = $derived(SYMBOL_ACTS[assetKey]);
	const motion = $derived('motion' in props.symbolInfo ? props.symbolInfo.motion : undefined);
	const atRest = $derived(motion === 'rest');
	const scatter = $derived(assetKey === 'symbolScatter');

	const texture = (key: string) =>
		(context.stateApp.loadedAssets[key] ?? PIXI.Texture.EMPTY) as PIXI.Texture;
	const frames = (key: string) => (context.stateApp.loadedAssets[key] ?? []) as PIXI.Texture[];

	// after its win a symbol stays as the win left it, until it goes
	const hurt = $derived(
		'motion' in props.symbolInfo && props.symbolInfo.motion === 'hurt'
			? frames(`${assetKey}Hurt`).at(-1)
			: undefined,
	);

	const land = (key: string) => {
		// the touch already started it
		if (performance.now() - touchedAt < 400) return;
		const id = ++landRun;
		const settle = frames(`${key}Land`);
		if (!settle.length || prefersReducedMotion.current) return;
		animate(settle.length * LAND_FRAME, (progress) => {
			if (id === landRun) landing = settle[frameAt(progress, settle.length)];
		}).then(() => {
			if (id === landRun) landing = undefined;
		});
	};

	const win = async (id: number, key: string) => {
		if (prefersReducedMotion.current) {
			await waitForTimeout(WIN_DURATION / stateBetDerived.timeScale());
			return;
		}
		const shine = frames(`${key}Shine`);
		const own = SYMBOL_ACTS[key];
		const ownFrames = own?.frames ? frames(`${key}${own.frames.suffix}`) : [];

		await animate(WIN.hold.duration, (progress) => {
			if (id !== run) return;
			overlay = texture(`${key}Flash`);
			pop = 1 - WIN.hold.squeeze * cubicOut(progress);
		});
		await animate(WIN.flash.duration, (progress) => {
			if (id !== run) return;
			pop = lerp(1 - WIN.hold.squeeze, WIN.flash.peak, cubicOut(progress));
		});
		const twists = key !== 'symbolScatter';
		await animate(ACT_DURATION, (progress) => {
			if (id !== run) return;
			const elapsed = progress * ACT_DURATION;
			const shining = elapsed / WIN.shine.duration;
			overlay = shining < 1 ? shine[frameAt(shining, shine.length)] : undefined;
			// settles into its held size and takes up the breath of the winners' light
			const settling = cubicOut(Math.min(1, elapsed / WIN.settle.duration));
			pop = lerp(WIN.flash.peak, WIN_SCALE * winBeat.scale, settling);
			const twisting = Math.min(1, elapsed / WIN.twist.duration);
			turn = twists
				? ((WIN.twist.degrees * Math.PI) / 180) *
					Math.sin(Math.PI * 3 * twisting) *
					(1 - twisting) ** 2
				: 0;
			if (!own) return;
			pose = own.pose(progress);
			effects = own.effects?.(progress) ?? [];
			if (own.frames && ownFrames.length && progress >= own.frames.from)
				stand =
					ownFrames[
						frameAt((progress - own.frames.from) / (1 - own.frames.from), ownFrames.length)
					];
		});
	};

	const clear = () => {
		pop = 1;
		turn = 0;
		pose = {};
		effects = [];
		overlay = undefined;
		stand = undefined;
	};

	// plays a sprite-level move over `duration` ms; a new one (or a fall or a win) ends it
	const moveFor = (duration: number, pivot: number, at: (t: number) => Move) => {
		const id = ++moveRun;
		movePivot = pivot;
		return animate(
			duration,
			(progress) => {
				if (id === moveRun) move = progress < 1 ? at(progress) : {};
			},
			{ timeScaled: false },
		);
	};
	const stopMove = () => {
		moveRun++;
		move = {};
		brighten = 0;
	};

	// The touch of a landing: it brightens, throws up dust from its foot, plays its Land run and
	// reacts with its whole body. The dragon's eye flares the light behind it.
	const touch = () => {
		if (prefersReducedMotion.current) return;
		const key = assetKey;
		if (props.place) {
			landPuff(props.place.x, props.place.y, key);
			if (scatter) flashGlow(props.place.x, props.place.y, key, SCATTER_LAND_GLOW);
		}
		land(key);
		touchedAt = performance.now();
		const reaction = LAND_MOVES[key];
		const side = Math.random() < 0.5 ? -1 : 1;
		if (reaction) moveFor(reaction.duration, reaction.pivot, (t) => reaction.move(t, side));
		brighten = TOUCH.brighten;
		const id = moveRun;
		animate(TOUCH.duration, () => {}, { timeScaled: false }).then(() => {
			if (id === moveRun) brighten = 0;
		});
	};
	// each new touch, not the count it was made with
	let touches = untrack(() => props.contact ?? 0);
	$effect(() => {
		const count = props.contact ?? 0;
		untrack(() => {
			if (count <= touches) return;
			touches = count;
			touch();
		});
	});

	// completes at once, or after the motion; a new oncomplete (a new state to finish) reruns it
	$effect(() => {
		const { symbolInfo, oncomplete } = props;
		untrack(async () => {
			const id = ++run;
			resting = false;
			clear();
			if ('motion' in symbolInfo) {
				// a fall or a win takes over the whole sprite
				if (symbolInfo.motion === 'fall' || symbolInfo.motion === 'win') stopMove();
				if (symbolInfo.motion === 'land') land(symbolInfo.assetKey);
				// a win, a fall or a new symbol in the cell ends a landing still playing
				else if (symbolInfo.motion !== 'rest') {
					landRun++;
					landing = undefined;
				}
				if (symbolInfo.motion === 'win') await win(id, symbolInfo.assetKey);
			}
			// a winner stays as its win left it (grown) until its next state takes over, with no frame
			// back at its own size in between
			if (id === run && !('motion' in symbolInfo && symbolInfo.motion === 'win')) clear();
			oncomplete?.();
		});
	});

	// a frame run played once over the art (an idle act or the eye's blink); resolves when done
	const stir = (played: PIXI.Texture[], frame: number) => {
		const id = run;
		resting = true;

		return animate(
			played.length * frame,
			(progress) => {
				if (id === run) stand = played[frameAt(progress, played.length)];
			},
			{ timeScaled: false },
		).then(() => {
			if (id !== run) return;
			stand = undefined;
			resting = false;
		});
	};
	const busy = () =>
		!atRest ||
		resting ||
		!!landing ||
		reduced ||
		anticipationDim.current > 0 ||
		spotlight.current > 0 ||
		Object.keys(move).length > 0;

	// the dragon's eye blinks or glances by itself now and then, on a tick of the pixel clock
	$effect(() => {
		void pixelClock.frame;
		untrack(() => {
			const rest = SYMBOL_RESTS[assetKey];
			if (!rest || busy()) return;
			if (Math.random() >= rest.chance) return;
			const act = rest.acts[Math.floor(Math.random() * rest.acts.length)];
			const blink = frames(`${assetKey}${act.suffix}`);
			if (blink.length) stir(blink, act.frame);
		});
	});

	// cued by the board (game/idle.ts): one of its bigger rest acts, its frames (repeated as the act
	// asks) with a move of its whole body over the same time
	const idleAct = () => {
		const acts = IDLE_ACTS[assetKey];
		if (!acts || busy()) return false;
		const act = acts[Math.floor(Math.random() * acts.length)];
		const once = frames(`${assetKey}${act.suffix}`);
		if (!once.length) return false;
		const played = Array.from({ length: act.times ?? 1 }, () => once).flat();
		stir(played, act.frame);
		const duration = played.length * act.frame;
		moveFor(duration, act.motion.pivot, (t) => act.motion.move(t, 1));

		return true;
	};
	$effect(() => {
		if (!atRest || reduced) return;
		const key = assetKey;

		return joinIdle(() => idleAct(), key === 'symbolScatter' ? 2 : 1);
	});

	// waiting on a scatter: the scatters down on the board are wide awake and throb, the rest darken
	const dim = $derived(anticipationDim.current);
	const dimmed = $derived(anticipation.deep ? DIMMED_DEEP : DIMMED);
	const awake = $derived(scatter && (atRest || anticipation.deep) && dim > 0.5);
	const throb = $derived(scatter && atRest && !reduced ? 1 + 0.09 * anticipation.pulse * dim : 1);
	// turned to its winners, the board dims the symbols that did not win
	const losing = $derived(
		symbolFx.dimOthers && (motion === 'rest' || motion === 'land' || motion === undefined)
			? spotlight.current
			: 0,
	);
	const shade = (to: { red: number; green: number; blue: number }, by: number) =>
		(Math.round(lerp(255, to.red, by)) << 16) |
		(Math.round(lerp(255, to.green, by)) << 8) |
		Math.round(lerp(255, to.blue, by));
	const tint = $derived(
		!scatter && dim > 0
			? shade(dimmed, dim)
			: losing > 0 && !reduced
				? shade(WIN_DIMMED, losing)
				: losing > 0
					? shade(WIN_DIMMED, 1)
					: 0xffffff,
	);
	// a winner waiting for the tumble stays grown, breathing with its light
	const held = $derived(
		motion === 'hurt' && !reduced ? lerp(1, WIN_SCALE * winBeat.scale, spotlight.current) : 1,
	);
	const hushed = $derived(
		scatter && anticipation.hush > 0
			? Math.round(lerp(255, HUSHED, anticipation.hush)) * 0x010101
			: 0xffffff,
	);
	// awake, the eye beats with the waiting: its frames run from cool to hot and back (held at
	// the middle one for reduced motion)
	const wary = $derived(frames(`${assetKey}Wary`));
	const still = $derived(texture(assetKey));
	const art = $derived(
		stand ??
			landing ??
			hurt ??
			(awake && wary.length
				? wary[reduced ? Math.floor(wary.length / 2) : frameAt(anticipation.pulse, wary.length)]
				: undefined) ??
			(motion === 'fall' ? frames(`${assetKey}Narrow`)[0] : undefined) ??
			still,
	);
	// a frame that only changes the art in places is drawn over the still art (pixel/textures.ts)
	const overStill = $derived(art !== still && OVER_STILL.has(art));

	const pivot = $derived({
		x: (act?.pivot.x ?? 0) * ART_PIXEL,
		y: (act?.pivot.y ?? 0) * ART_PIXEL,
	});
	const spriteProps = $derived({
		anchor: 0.5,
		width: SYMBOL_SIZE * props.symbolInfo.sizeRatios.width,
		height: SYMBOL_SIZE * props.symbolInfo.sizeRatios.height,
	});
	// a frame drawn on a bigger canvas than the art (smoke and fumes rise past its edge) is drawn
	// at the art's own scale
	const artProps = $derived({
		...spriteProps,
		width: (spriteProps.width * art.width) / (still.width || 1),
		height: (spriteProps.height * art.height) / (still.height || 1),
	});

	const effectTexture = (effect: SymbolEffect) => {
		const loaded = context.stateApp.loadedAssets[effect.key] as PIXI.Texture | PIXI.Texture[];
		if (!Array.isArray(loaded)) return loaded ?? PIXI.Texture.EMPTY;

		return loaded[frameAt(effect.at ?? 0, loaded.length)] ?? PIXI.Texture.EMPTY;
	};
</script>

<Container x={props.x} y={props.y} scale={pop * throb * held} rotation={turn} tint={hushed}>
	<!-- a landing or an idle act moves the whole symbol about its pivot -->
	<Container
		x={(move.x ?? 0) * ART_PIXEL}
		y={(movePivot + (move.y ?? 0)) * ART_PIXEL}
		pivot={{ x: 0, y: movePivot * ART_PIXEL }}
		rotation={move.rotation ?? 0}
		scale={move.scale ?? 1}
	>
		<!-- the symbol turns and grows about its act's pivot -->
		<Container
			x={pivot.x + (pose.x ?? 0) * ART_PIXEL}
			y={pivot.y + (pose.y ?? 0) * ART_PIXEL}
			{pivot}
			rotation={pose.rotation ?? 0}
			scale={pose.scale ?? 1}
		>
			{#if overStill}
				<BaseSprite texture={still} {...spriteProps} {tint} />
			{/if}
			<BaseSprite texture={art} {...artProps} {tint} />
			{#if overlay}
				<BaseSprite texture={overlay} {...spriteProps} />
			{:else if brighten > 0}
				<BaseSprite texture={texture(`${assetKey}Flash`)} {...spriteProps} alpha={brighten} />
			{/if}
			{@render props.children?.()}
		</Container>
	</Container>
	{#each effects as effect}
		<BaseSprite
			texture={effectTexture(effect)}
			anchor={0.5}
			x={effect.x * ART_PIXEL}
			y={effect.y * ART_PIXEL}
			width={effect.size * ART_PIXEL}
			height={effect.size * ART_PIXEL}
			alpha={effect.alpha ?? 1}
			tint={effect.tint ?? 0xffffff}
		/>
	{/each}
</Container>
