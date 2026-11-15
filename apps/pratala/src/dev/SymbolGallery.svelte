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
	import { SYMBOL_RESTS } from '../game/symbolActs';
	import { frameAt } from '../game/motion';
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
	const COLUMNS = 3;
	const ROWS = Math.ceil(SYMBOLS.length / COLUMNS);
	const HOLD = { still: 700, hurt: 600, gone: 500 };
	const LABELS = { still: 'diam', rest: 'diam', win: 'menang', hurt: 'rusak', explosion: 'hilang', gone: '' };

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

	// what the symbol does at rest, played once
	const rest = async (index: number) => {
		const stir = SYMBOL_RESTS[SYMBOLS[index].key];
		const frames = stir
			? ((context.stateApp.loadedAssets[`${SYMBOLS[index].key}${stir.suffix}`] ?? []) as PIXI.Texture[])
			: [];
		if (!stir || !frames.length) return;
		const start = performance.now();
		phases[index] = 'rest';
		for (;;) {
			const progress = (performance.now() - start) / stir.duration;
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
				phases[index] = 'win';
				await finished(index);
				phases[index] = 'hurt';
				await wait(HOLD.hurt);
				// the scatter never leaves the board
				if (symbol.rawSymbol.name !== 'S') {
					phases[index] = 'explosion';
					await finished(index);
					phases[index] = 'gone';
					await wait(HOLD.gone);
				}
			}
		});

		return () => (alive = false);
	});

	const width = $derived(innerWidth.current ?? 1);
	const height = $derived(innerHeight.current ?? 1);
	const cell = $derived(Math.min(width / COLUMNS, height / ROWS));
	const scale = $derived((cell * 0.5) / SYMBOL_SIZE);
</script>

<App>
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
				{#if phase === 'rest'}
					<BaseSprite
						texture={restFrames[index] ?? PIXI.Texture.EMPTY}
						anchor={0.5}
						width={SYMBOL_SIZE}
						height={SYMBOL_SIZE}
					/>
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
