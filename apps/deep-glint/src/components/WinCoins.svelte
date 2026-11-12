<script lang="ts" module>
	import type { Position } from '../game/types';

	// resolves when the first coin reaches the tumble win panel
	export type EmitterEventWinCoins = { type: 'winCoinsFly'; positions: Position[]; step: number };
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	import * as PIXI from 'pixi.js';

	import { getContextParent } from 'pixi-svelte';
	import { stateBetDerived } from 'state-shared';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE } from '../game/constants';
	import { tumblePanelPlace } from './TumbleWinAmountWrap.svelte';
	import { TUMBLE_PANEL_SIZES } from './TumbleWinAmountFrame.svelte';

	// A win pays out where the player can see it: every winning symbol throws a coin, which hops
	// up, then flies faster and faster into the tumble win panel, where the amount counts up as the
	// coins land. Later wins of the same spin throw more coins. Drawn in the board's own units, so
	// this sits inside a BoardContainer.
	const COINS = { delay: 260, spread: 320, flight: 520, size: SYMBOL_SIZE * 0.42, most: 30 };
	const SPIN = 14;
	const PING = { gap: 28, notes: 8 };

	type Coin = {
		sprite: PIXI.Sprite;
		start: number;
		duration: number;
		from: { x: number; y: number };
		over: { x: number; y: number };
		to: { x: number; y: number };
		phase: number;
		land?: () => void;
	};

	const context = getContext();
	const container = new PIXI.Container();
	getContextParent().addToParent(container);

	let coins: Coin[] = [];
	let request = 0;
	let note = 0;
	let lastPing = 0;

	const frames = (key: string) => (context.stateApp.loadedAssets[key] ?? []) as PIXI.Texture[];

	// each coin that lands rings, a note higher than the last, up a scale and held at its top;
	// coins landing together share one note
	const ping = (now: number) => {
		if (now - lastPing < PING.gap) return;
		lastPing = now;
		note = Math.min(PING.notes, note + 1);
		context.eventEmitter.broadcast({
			type: 'soundOnce',
			name: `sfx_coin_${note as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`,
			forcePlay: true,
		});
	};

	const tick = (now: number) => {
		const coinFrames = frames('coin');
		coins = coins.filter((coin) => {
			const progress = (now - coin.start) / coin.duration;
			if (progress < 0) return true;
			if (progress >= 1) {
				coin.sprite.destroy();
				coin.land?.();
				ping(now);

				return false;
			}
			// slow off the symbol, fastest into the panel
			const travel = progress ** 1.9;
			const rest = 1 - travel;
			coin.sprite.visible = true;
			coin.sprite.position.set(
				rest * rest * coin.from.x + 2 * rest * travel * coin.over.x + travel * travel * coin.to.x,
				rest * rest * coin.from.y + 2 * rest * travel * coin.over.y + travel * travel * coin.to.y,
			);
			// it pops out of the symbol, and is a little smaller by the time it goes in
			const grow = Math.min(1, progress / 0.16);
			coin.sprite.setSize(COINS.size * (grow * (1.25 - 0.25 * grow)) * (1 - 0.3 * travel));
			coin.sprite.texture =
				coinFrames[Math.floor(coin.phase + (now / 1000) * SPIN) % coinFrames.length];

			return true;
		});
		request = coins.length ? requestAnimationFrame(tick) : 0;
	};

	const fly = ({ positions, step }: { positions: Position[]; step: number }) =>
		new Promise<void>((resolve) => {
			const coinFrames = frames('coin');
			if (prefersReducedMotion.current || !coinFrames.length || !positions.length) return resolve();

			const timeScale = stateBetDerived.timeScale();
			const place = tumblePanelPlace({
				stacked: context.stateLayoutDerived.isStacked(),
			});
			// one coin a symbol, two from the third win of a spin on, up to the most the screen takes
			const perSymbol = step >= 3 ? 2 : 1;
			const every = Math.max(1, Math.ceil((positions.length * perSymbol) / COINS.most));
			const sources = positions
				.flatMap((position) => Array.from({ length: perSymbol }, () => position))
				.filter((_, index) => index % every === 0);
			const now = performance.now();
			let first = true;
			note = 0;

			sources.forEach((position, index) => {
				const from = {
					x: SYMBOL_SIZE * (position.reel + 0.5),
					y: SYMBOL_SIZE * (position.row - 0.5),
				};
				// the panel takes the coins along its bottom edge, clear of the amount
				const to = {
					x: place.x + (Math.random() - 0.5) * TUMBLE_PANEL_SIZES.width * place.scale * 0.8,
					y: place.y + TUMBLE_PANEL_SIZES.height * place.scale * 0.5,
				};
				const sprite = new PIXI.Sprite({ texture: coinFrames[0], anchor: 0.5 });
				sprite.visible = false;
				container.addChild(sprite);
				coins.push({
					sprite,
					start:
						now + (COINS.delay + (COINS.spread * index) / Math.max(1, sources.length)) / timeScale,
					duration: (COINS.flight + Math.random() * 80) / timeScale,
					from,
					// the hop: out to one side and up, before the pull toward the panel takes over
					over: {
						x: from.x + (Math.random() - 0.5) * SYMBOL_SIZE * 1.6,
						y: from.y - SYMBOL_SIZE * (0.5 + Math.random() * 0.7),
					},
					to,
					phase: Math.random() * coinFrames.length,
					land: () => {
						if (first) resolve();
						first = false;
					},
				});
			});
			if (!request) request = requestAnimationFrame(tick);
		});

	context.eventEmitter.subscribeOnMount({ winCoinsFly: fly });

	onMount(() => () => {
		cancelAnimationFrame(request);
		container.removeChildren().forEach((child) => child.destroy());
	});
</script>
