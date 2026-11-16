// Bakes the four hall pictures into static/assets/backgrounds (art pixels ×4, as the game ships
// them) and prints where the floor lands, for the fires. node scripts/bake-hall.ts [--only landscape]
import { writeFileSync } from 'node:fs';

import { png, upscale } from '../src/pixel/png.ts';
import { render } from '../src/pixel/render/raymarch.ts';
import { quantize } from '../src/pixel/render/quantize.ts';
import { CAMERA, HALL, HALL_SIZES, hallScene } from '../src/pixel/render/hall.ts';
import { project } from '../src/pixel/render/project.ts';

export const HALL_RENDER = { maxSteps: 200, far: 40, ao: 0.5, exposure: 1.3 } as const;
export const HALL_QUANTIZE = { dither: 0.035, outlineDarken: 1 } as const;

const only = process.argv.find((a) => a.startsWith('--only='))?.slice(7);
for (const shape of ['Landscape', 'Portrait'] as const) {
	if (only && only.toLowerCase() !== shape.toLowerCase()) continue;
	const size = HALL_SIZES[shape];
	for (const hot of [false, true]) {
		const scene = hallScene({ hot });
		scene.camera = { ...CAMERA[shape] };
		const started = Date.now();
		const canvas = quantize(render(scene, { ...size, ...HALL_RENDER }), HALL_QUANTIZE);
		const { width, height, data } = canvas.toRGBA(1);
		const big = upscale(width, height, data, 4);
		const file = `static/assets/backgrounds/${hot ? 'bonus' : 'base'}-${shape.toLowerCase()}.png`;
		writeFileSync(file, png(big.width, big.height, big.data));
		console.log(`${file} ${big.width}x${big.height} in ${Date.now() - started} ms`);
	}
	// floor anchors for the fires: world x along the hall at a few depths
	const camera = CAMERA[shape];
	const p = (x: number, z: number) => {
		const r = project(camera, size.width, size.height, x, 0, z);
		return `(${x},${z})→${Math.round(r.x)},${Math.round(r.y)}`;
	};
	console.log(shape, 'floor:', [[-3, 6], [3, 6], [-1.5, 4], [2, 3], [-3.5, 1], [3.5, 0], [0, -1], [-2, -2.5], [2.5, -3], [0, -4]].map(([x, z]) => p(x, z)).join(' '));
	console.log(shape, 'back wall foot y', Math.round(project(camera, size.width, size.height, 0, 0, HALL.back).y));
}
