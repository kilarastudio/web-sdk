<script lang="ts" module>
	// What comes out of the dragon's mouth when it reacts: a puff of smoke that drifts up and
	// thins out, or a spray of embers that arc and fall. Square pixels as big as the dragon's own,
	// moved on its pixel grid.
	const KINDS = {
		smoke: {
			colors: [0xc0cbdc, 0x8b9bb4, 0x5a6988],
			speed: { x: [-70, -20], y: [-150, -70] },
			gravity: -40,
			drag: 1.6,
			life: [520, 820],
			size: [2, 4],
		},
		embers: {
			colors: [0xfee761, 0xfeae34, 0xf77622, 0xe43b44],
			speed: { x: [-420, -120], y: [-300, 60] },
			gravity: 700,
			drag: 0.6,
			life: [380, 700],
			size: [1, 3],
		},
	};

	export type ParticleKind = keyof typeof KINDS;

	// count particles from (x, y) in layout units; pixel is one of the dragon's art pixels there,
	// and scale its size against a 400-unit-tall dragon
	export type ParticleBurst = {
		kind: ParticleKind;
		count: number;
		x: number;
		y: number;
		pixel: number;
		scale: number;
	};
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import * as PIXI from 'pixi.js';

	import { getContextParent } from 'pixi-svelte';

	type Particle = {
		sprite: PIXI.Sprite;
		kind: ParticleKind;
		x: number;
		y: number;
		velocityX: number;
		velocityY: number;
		size: number;
		born: number;
		life: number;
	};

	const container = new PIXI.Container();
	getContextParent().addToParent(container);

	let particles: Particle[] = [];
	let request = 0;
	let last = 0;
	// one of the dragon's art pixels, in layout units
	let grid = 1;

	const between = ([low, high]: number[]) => low + Math.random() * (high - low);

	const tick = (now: number) => {
		const seconds = Math.min(0.05, (now - last) / 1000);
		last = now;
		particles = particles.filter((particle) => {
			const age = (now - particle.born) / particle.life;
			if (age >= 1) {
				particle.sprite.destroy();

				return false;
			}
			const { gravity, drag } = KINDS[particle.kind];
			particle.velocityX *= 1 - Math.min(1, drag * seconds);
			particle.velocityY += gravity * seconds;
			particle.x += particle.velocityX * seconds;
			particle.y += particle.velocityY * seconds;
			particle.sprite.position.set(
				Math.round(particle.x / grid) * grid,
				Math.round(particle.y / grid) * grid,
			);
			// it goes out in steps: a pixel smaller, then half gone
			particle.sprite.setSize(Math.max(1, particle.size - (age > 0.6 ? 1 : 0)) * grid);
			particle.sprite.alpha = age > 0.8 ? 0.5 : 1;

			return true;
		});
		request = particles.length ? requestAnimationFrame(tick) : 0;
	};

	export const emit = ({ kind, count, x, y, pixel, scale }: ParticleBurst) => {
		const { colors, speed, life, size } = KINDS[kind];
		const now = performance.now();
		grid = pixel;
		for (let index = 0; index < count; index++) {
			const sprite = new PIXI.Sprite({ texture: PIXI.Texture.WHITE, anchor: 0.5 });
			sprite.tint = colors[Math.floor(Math.random() * colors.length)];
			container.addChild(sprite);
			particles.push({
				sprite,
				kind,
				x,
				y,
				velocityX: between(speed.x) * scale,
				velocityY: between(speed.y) * scale,
				size: Math.round(between(size)),
				// the first ones leave at once, the rest in a short stream
				born: now + index * 14,
				life: between(life),
			});
		}
		if (!request) {
			last = now;
			request = requestAnimationFrame(tick);
		}
	};

	onMount(() => () => {
		cancelAnimationFrame(request);
		container.removeChildren().forEach((child) => child.destroy());
	});
</script>
