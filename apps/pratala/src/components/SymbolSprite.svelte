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
		SYMBOL_ACTS,
		SYMBOL_RESTS,
		type SymbolEffect,
		type SymbolPose,
	} from '../game/symbolActs';

	type Props = {
		x?: number;
		y?: number;
		symbolInfo: ReturnType<typeof getSymbolInfo>;
		oncomplete?: () => void;
		// drawn on the symbol, and moved with it
		children?: Snippet;
	};

	const props: Props = $props();
	const context = getContext();

	// Symbols are solid objects, moved by code on every frame and never bent. Landing is the
	// reel's own doing (one smooth curve into place); nothing is added here. A win: the symbol turns white and pulls in
	// for a moment (the hit), bursts out, and then does its own act (game/symbolActs.ts) while a
	// band of light crosses it. At rest a gem's light turns now and then and the dragon's eye
	// blinks. While a column waits on a scatter, every other symbol darkens and the scatters throb.
	const WIN = {
		hold: { duration: 80, squeeze: 0.1 },
		flash: { duration: 110, pop: 0.22 },
		shine: { duration: 380 },
		// a symbol with no act of its own beats once more at the end
		beat: { from: 0.58, pop: 0.1 },
	};
	const WIN_DURATION = WIN.hold.duration + WIN.flash.duration + ACT_DURATION;
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
	let run = 0;
	let resting = false;

	const reduced = $derived(prefersReducedMotion.current);
	const assetKey = $derived(props.symbolInfo.assetKey);
	const act = $derived(SYMBOL_ACTS[assetKey]);
	const atRest = $derived('motion' in props.symbolInfo && props.symbolInfo.motion === 'rest');
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
			pop = lerp(1 - WIN.hold.squeeze, 1 + WIN.flash.pop, cubicOut(progress));
		});
		await animate(ACT_DURATION, (progress) => {
			if (id !== run) return;
			const shining = (progress * ACT_DURATION) / WIN.shine.duration;
			overlay = shining < 1 ? shine[frameAt(shining, shine.length)] : undefined;
			pop = 1 + WIN.flash.pop * (1 - cubicOut(Math.min(1, shining)));
			if (!own) {
				const beat = (progress - WIN.beat.from) / (1 - WIN.beat.from);
				if (beat > 0) pop = 1 + WIN.beat.pop * Math.sin(Math.PI * beat);

				return;
			}
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
		pose = {};
		effects = [];
		overlay = undefined;
		stand = undefined;
	};

	// completes at once, or after the motion; a new oncomplete (a new state to finish) reruns it
	$effect(() => {
		const { symbolInfo, oncomplete } = props;
		untrack(async () => {
			const id = ++run;
			resting = false;
			clear();
			if ('motion' in symbolInfo) {
				if (symbolInfo.motion === 'win') await win(id, symbolInfo.assetKey);
			}
			if (id === run) clear();
			oncomplete?.();
		});
	});

	// at rest, on a tick of the pixel clock now and then, the symbol stirs
	$effect(() => {
		void pixelClock.frame;
		untrack(() => {
			const rest = SYMBOL_RESTS[assetKey];
			if (!rest || !atRest || resting || reduced || anticipationDim.current > 0) return;
			if (Math.random() >= rest.chance) return;
			const stir = frames(`${assetKey}${rest.suffix}`);
			if (!stir.length) return;
			const id = run;
			resting = true;
			animate(
				rest.duration,
				(progress) => {
					if (id === run) stand = stir[frameAt(progress, stir.length)];
				},
				{ timeScaled: false },
			).then(() => {
				if (id !== run) return;
				stand = undefined;
				resting = false;
			});
		});
	});

	// waiting on a scatter: the scatters down on the board are wide awake and throb, the rest darken
	const dim = $derived(anticipationDim.current);
	const dimmed = $derived(anticipation.deep ? DIMMED_DEEP : DIMMED);
	const awake = $derived(scatter && (atRest || anticipation.deep) && dim > 0.5);
	const throb = $derived(scatter && atRest && !reduced ? 1 + 0.09 * anticipation.pulse * dim : 1);
	const tint = $derived(
		scatter || dim === 0
			? 0xffffff
			: (Math.round(lerp(255, dimmed.red, dim)) << 16) |
					(Math.round(lerp(255, dimmed.green, dim)) << 8) |
					Math.round(lerp(255, dimmed.blue, dim)),
	);
	const hushed = $derived(
		scatter && anticipation.hush > 0
			? Math.round(lerp(255, HUSHED, anticipation.hush)) * 0x010101
			: 0xffffff,
	);
	const art = $derived(
		stand ??
			hurt ??
			(awake ? (frames(`${assetKey}Alert`)[0] ?? texture(assetKey)) : texture(assetKey)),
	);

	const pivot = $derived({
		x: (act?.pivot.x ?? 0) * ART_PIXEL,
		y: (act?.pivot.y ?? 0) * ART_PIXEL,
	});
	const spriteProps = $derived({
		anchor: 0.5,
		width: SYMBOL_SIZE * props.symbolInfo.sizeRatios.width,
		height: SYMBOL_SIZE * props.symbolInfo.sizeRatios.height,
	});

	const effectTexture = (effect: SymbolEffect) => {
		const loaded = context.stateApp.loadedAssets[effect.key] as PIXI.Texture | PIXI.Texture[];
		if (!Array.isArray(loaded)) return loaded ?? PIXI.Texture.EMPTY;

		return loaded[frameAt(effect.at ?? 0, loaded.length)] ?? PIXI.Texture.EMPTY;
	};
</script>

<Container x={props.x} y={props.y} scale={pop * throb} tint={hushed}>
	<!-- the symbol turns and grows about its act's pivot -->
	<Container
		x={pivot.x + (pose.x ?? 0) * ART_PIXEL}
		y={pivot.y + (pose.y ?? 0) * ART_PIXEL}
		{pivot}
		rotation={pose.rotation ?? 0}
		scale={pose.scale ?? 1}
	>
		<BaseSprite texture={art} {...spriteProps} {tint} />
		{#if overlay}
			<BaseSprite texture={overlay} {...spriteProps} />
		{/if}
		{@render props.children?.()}
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
