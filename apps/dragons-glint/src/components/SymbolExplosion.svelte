<script lang="ts">
	import { onMount } from 'svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	import * as PIXI from 'pixi.js';

	import { getContextParent } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { ART_PIXEL, SYMBOL_SIZE } from '../game/constants';
	import { animate, frameAt } from '../game/motion';
	import { impact } from '../game/impact.svelte';

	type Props = {
		x?: number;
		y?: number;
		assetKey: string;
		oncomplete?: () => void;
	};

	const props: Props = $props();
	const context = getContext();

	// A winning symbol breaks into its own pixels: it flashes white, then its 5 × 5 blocks fly
	// out from the middle and fall, each held on the art-pixel grid, while a burst ring opens.
	const CHUNKS = 5;
	const DURATION = 460;
	const FLASH = 0.14;
	const GRAVITY = 1500;
	const chunkCache = new Map<string, PIXI.Texture[]>();

	const container = new PIXI.Container();
	getContextParent().addToParent(container);
	$effect(() => {
		container.position.set(props.x ?? 0, props.y ?? 0);
	});

	const texture = (key: string) => context.stateApp.loadedAssets[key] as PIXI.Texture | undefined;

	const chunksOf = (key: string, source: PIXI.Texture) => {
		const cached = chunkCache.get(key);
		if (cached && cached[0]?.source === source.source) return cached;
		const size = source.width / CHUNKS;
		const chunks = Array.from({ length: CHUNKS * CHUNKS }, (_, index) => {
			const frame = new PIXI.Rectangle(
				(index % CHUNKS) * size,
				Math.floor(index / CHUNKS) * size,
				size,
				size,
			);

			return new PIXI.Texture({ source: source.source, frame });
		});
		chunkCache.set(key, chunks);

		return chunks;
	};

	const snap = (value: number) => Math.round(value / ART_PIXEL) * ART_PIXEL;

	onMount(() => {
		let alive = true;

		(async () => {
			const symbol = texture(props.assetKey);
			if (!symbol) return props.oncomplete?.();

			if (prefersReducedMotion.current) {
				const still = new PIXI.Sprite({ texture: symbol, anchor: 0.5 });
				still.setSize(SYMBOL_SIZE);
				container.addChild(still);
				await animate(200, (progress) => alive && (still.alpha = 1 - progress));

				return props.oncomplete?.();
			}

			// each win of a spin's tumbles throws its pieces a little further
			const power = 1 + 0.16 * Math.min(4, Math.max(0, impact.step - 1));
			const white = texture(`${props.assetKey}Flash`);
			const burst = (context.stateApp.loadedAssets.burst ?? []) as PIXI.Texture[];
			const flash = new PIXI.Sprite({ texture: white ?? symbol, anchor: 0.5 });
			const ring = new PIXI.Sprite({ texture: burst[0] ?? PIXI.Texture.EMPTY, anchor: 0.5 });
			ring.setSize(SYMBOL_SIZE * 1.3 * (0.9 + power * 0.1));
			ring.visible = false;

			const chunkSize = SYMBOL_SIZE / CHUNKS;
			const shards = chunksOf(props.assetKey, symbol).map((chunk, index) => {
				const sprite = new PIXI.Sprite({ texture: chunk, anchor: 0.5 });
				sprite.setSize(chunkSize);
				const homeX = ((index % CHUNKS) + 0.5 - CHUNKS / 2) * chunkSize;
				const homeY = (Math.floor(index / CHUNKS) + 0.5 - CHUNKS / 2) * chunkSize;
				const angle = Math.atan2(homeY, homeX) + (Math.random() - 0.5) * 0.9;
				const speed = (140 + Math.random() * 260) * power;
				sprite.visible = false;

				return {
					sprite,
					homeX,
					homeY,
					velocityX: Math.cos(angle) * speed,
					velocityY: Math.sin(angle) * speed - 220,
					life: 0.7 + Math.random() * 0.3,
				};
			});
			container.addChild(ring, ...shards.map(({ sprite }) => sprite), flash);

			await animate(DURATION, (progress) => {
				if (!alive) return;
				if (progress < FLASH) {
					// the white pop, held on two poses
					flash.setSize(SYMBOL_SIZE * (progress < FLASH / 2 ? 1.18 : 1.1));

					return;
				}
				flash.visible = false;
				const flight = (progress - FLASH) / (1 - FLASH);
				const seconds = (flight * DURATION * (1 - FLASH)) / 1000;
				ring.visible = burst.length > 0;
				if (burst.length) ring.texture = burst[frameAt(flight, burst.length)];
				for (const shard of shards) {
					shard.sprite.visible = flight < shard.life;
					shard.sprite.position.set(
						snap(shard.homeX + shard.velocityX * seconds),
						snap(shard.homeY + shard.velocityY * seconds + 0.5 * GRAVITY * seconds * seconds),
					);
					// each block shrinks by art pixels as it goes
					const size = chunkSize * (flight < 0.45 ? 1 : flight < 0.7 ? 0.75 : 0.5);
					shard.sprite.setSize(size);
				}
			});
			ring.visible = false;
			props.oncomplete?.();
		})();

		return () => {
			alive = false;
			container.removeChildren().forEach((child) => child.destroy());
		};
	});
</script>
