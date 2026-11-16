// Renders the hall backgrounds. node scripts/render-hall.ts [landscape|portrait] [hot] [scale]
import { writeFileSync } from 'node:fs';

import { canvasPng } from '../src/pixel/png.ts';
import { render } from '../src/pixel/render/raymarch.ts';
import { quantize } from '../src/pixel/render/quantize.ts';
import { CAMERA, hallScene } from '../src/pixel/render/hall.ts';

const out = '../../../output/pratala/art-v2';
const shape = (process.argv[2] ?? 'landscape') === 'portrait' ? 'Portrait' : 'Landscape';
const hot = process.argv.includes('hot');
const down = Number(process.argv.find((a) => a.startsWith('down='))?.slice(5) ?? 1);
const size = shape === 'Landscape' ? { width: 576, height: 324 } : { width: 324, height: 576 };
const width = Math.round(size.width / down);
const height = Math.round(size.height / down);

const scene = hallScene({ hot });
scene.camera = { ...CAMERA[shape] };
const started = Date.now();
const result = render(scene, { width, height, maxSteps: 200, far: 40, ao: 0.5, exposure: 1.3 });
console.log(`rendered ${width}x${height} in ${Date.now() - started} ms`);
const name = `hall-${shape.toLowerCase()}${hot ? '-hot' : ''}${down > 1 ? `-down${down}` : ''}`;
const canvas = quantize(result, { dither: 0.035, outlineDarken: 1 });
writeFileSync(`${out}/${name}.png`, canvasPng(canvas, 1));
writeFileSync(`${out}/${name}-x2.png`, canvasPng(canvas, 2));
console.log(`wrote ${name}.png`);
