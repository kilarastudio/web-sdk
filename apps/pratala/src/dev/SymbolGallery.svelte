<script lang="ts">
	import { onMount } from 'svelte';
	import { innerWidth, innerHeight } from 'svelte/reactivity/window';
	import * as PIXI from 'pixi.js';

	import { App, BaseSprite, Container, Rectangle, Text } from 'pixi-svelte';
	import { GameLoader } from 'components-ui-html';

	import GeneratedArt from '../components/GeneratedArt.svelte';
	import Symbol from '../components/Symbol.svelte';
	import { getContext } from '../game/context';
	import { loaderHtml } from '../game/loader';
	import { SYMBOL_SIZE } from '../game/constants';
	import { IDLE_ACTS } from '../game/symbolActs';
	import { closeWinLights, endWin, showWin, symbolFx } from '../game/symbolFx.svelte';
	import SymbolFx from '../components/SymbolFx.svelte';
	import { frameAt } from '../game/motion';
	import { OVER_STILL } from '../pixel/textures';
	import { STILL_SURFACE, isPotion } from '../pixel/potionLiquid';
	import PotionLiquid from '../components/PotionLiquid.svelte';
	import type { RawSymbol, SymbolState } from '../game/types';

	// A page for looking at the symbols, not part of the game (dev server only, ?symbols): every
	// symbol plays its life over and over: at rest, what it does at rest, its win, how the win
	// leaves it, and how it goes.
	const context = getContext();

	const SYMBOLS: { rawSymbol: RawSymbol; key: string }[] = [
		{ rawSymbol: { name: 'H1' }, key: 'symbolH1' },
		{ rawSymbol: { name: 'H2' }, key: 'symbolH2' },
		{ rawSymbol: { name: 'H3' }, key: 'symbolH3' },
		{ rawSymbol: { name: 'H4' }, key: 'symbolH4' },
		{ rawSymbol: { name: 'L1' }, key: 'symbolL1' },
		{ rawSymbol: { name: 'L2' }, key: 'symbolL2' },
		{ rawSymbol: { name: 'L3' }, key: 'symbolL3' },
		{ rawSymbol: { name: 'L4' }, key: 'symbolL4' },
		{ rawSymbol: { name: 'S', scatter: true }, key: 'symbolScatter' },
	];
	// every symbol takes its turn to win here: none is a loser to dim
	symbolFx.dimOthers = false;
	const COLUMNS = 3;
	const ROWS = Math.ceil(SYMBOLS.length / COLUMNS);
	const HOLD = { still: 700, hurt: 1200, gone: 500 };
	const LABELS = {
		still: 'diam',
		rest: 'diam',
		win: 'menang',
		hurt: 'rusak',
		explosion: 'hilang',
		gone: '',
	};

	type Phase = keyof typeof LABELS;
	const STATES: Partial<Record<Phase, SymbolState>> = {
		still: 'static',
		win: 'win',
		hurt: 'postWinStatic',
		explosion: 'explosion',
	};

	let ready = $state(false);
	const phases = $state<Phase[]>(SYMBOLS.map(() => 'still'));
	const restFrames = $state<(PIXI.Texture | undefined)[]>(SYMBOLS.map(() => undefined));
	const done: (() => void)[] = SYMBOLS.map(() => () => {});

	const wait = (duration: number) => new Promise((resolve) => setTimeout(resolve, duration));
	const finished = (index: number) => new Promise<void>((resolve) => (done[index] = resolve));

	// what the symbol does at rest, one of its acts in turn, played once (its frames only: in the
	// game the whole symbol also moves, and the board cues these acts by itself, game/idle.ts)
	const restsPlayed = SYMBOLS.map(() => 0);
	const rest = async (index: number) => {
		const acts = IDLE_ACTS[SYMBOLS[index].key];
		const act = acts?.[restsPlayed[index]++ % acts.length];
		const frames = act
			? ((context.stateApp.loadedAssets[`${SYMBOLS[index].key}${act.suffix}`] ??
					[]) as PIXI.Texture[])
			: [];
		if (!act || !frames.length) return;
		const duration = frames.length * act.frame;
		const start = performance.now();
		phases[index] = 'rest';
		for (;;) {
			const progress = (performance.now() - start) / duration;
			if (progress >= 1) break;
			restFrames[index] = frames[frameAt(progress, frames.length)];
			await new Promise(requestAnimationFrame);
		}
		restFrames[index] = undefined;
	};

	onMount(() => {
		let alive = true;
		SYMBOLS.forEach(async (symbol, index) => {
			while (!ready && alive) await wait(100);
			await wait(index * 180);
			while (alive) {
				phases[index] = 'still';
				await wait(HOLD.still);
				await rest(index);
				phases[index] = 'still';
				await wait(HOLD.still);
				// its light behind it, as on the board (SymbolFx)
				showWin([{ x: 0, y: 0, key: symbol.key }], symbol.key);
				phases[index] = 'win';
				await finished(index);
				phases[index] = 'hurt';
				await wait(HOLD.hurt);
				// the scatter never leaves the board
				if (symbol.rawSymbol.name !== 'S') {
					closeWinLights(160, symbol.key);
					phases[index] = 'explosion';
					await finished(index);
					endWin(symbol.key);
					phases[index] = 'gone';
					await wait(HOLD.gone);
				} else endWin(symbol.key);
			}
		});

		return () => (alive = false);
	});

	const width = $derived(innerWidth.current ?? 1);
	const height = $derived(innerHeight.current ?? 1);
	const cell = $derived(Math.min(width / COLUMNS, height / ROWS));
	const scale = $derived((cell * 0.5) / SYMBOL_SIZE);
</script>

<App antialias={false}>
	<GeneratedArt />
	<GameLoader
		html={loaderHtml()}
		progress={context.stateApp.loadingProgress}
		loaded={context.stateApp.loaded}
		onend={() => (ready = true)}
	/>
	<Rectangle {width} {height} backgroundColor={0x272727} />
	{#if ready}
		{#each SYMBOLS as symbol, index}
			{@const x = (width - cell * COLUMNS) / 2 + cell * ((index % COLUMNS) + 0.5)}
			{@const y = (height - cell * ROWS) / 2 + cell * (Math.floor(index / COLUMNS) + 0.45)}
			{@const phase = phases[index]}
			{@const state = STATES[phase]}
			<Container {x} {y} {scale}>
				<SymbolFx layer="under" scope={symbol.key} />
				{#if phase === 'rest'}
					{@const frame = restFrames[index] ?? PIXI.Texture.EMPTY}
					{@const potion = isPotion(symbol.key) ? symbol.key : undefined}
					<!-- a potion's frames light its full liquid: what is over its surface is masked off -->
					{@const still = context.stateApp.loadedAssets[
						potion ? `${symbol.key}Full` : symbol.key
					] as PIXI.Texture}
					<Container>
						{#if OVER_STILL.has(frame)}
							<BaseSprite texture={still} anchor={0.5} width={SYMBOL_SIZE} height={SYMBOL_SIZE} />
						{/if}
						<BaseSprite
							texture={frame}
							anchor={0.5}
							width={(SYMBOL_SIZE * frame.width) / still.width}
							height={(SYMBOL_SIZE * frame.height) / still.height}
						/>
						{#if potion}
							<PotionLiquid
								key={potion}
								surface={STILL_SURFACE}
								width={SYMBOL_SIZE}
								height={SYMBOL_SIZE}
							/>
						{/if}
					</Container>
				{:else if state}
					{#key state}
						<Symbol rawSymbol={symbol.rawSymbol} {state} oncomplete={() => done[index]()} />
					{/key}
				{/if}
			</Container>
			<Text
				{x}
				y={y + cell * 0.36}
				anchor={0.5}
				text={`${symbol.rawSymbol.name}  ${LABELS[phase]}`}
				style={{ fill: 0xffffff, fontSize: Math.max(11, cell * 0.075), fontFamily: 'sans-serif' }}
			/>
		{/each}
	{/if}
</App>
