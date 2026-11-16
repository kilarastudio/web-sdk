// Renders only the eye's box of the hall picture, big, to judge the eye.
import { writeFileSync } from 'node:fs';
import { PixelCanvas } from '../src/pixel/canvas.ts';
import { canvasPng } from '../src/pixel/png.ts';
import { render } from '../src/pixel/render/raymarch.ts';
import { quantize } from '../src/pixel/render/quantize.ts';
import { CAMERA, HALL_SIZES, eyeBox, hallScene } from '../src/pixel/render/hall.ts';
const out = '../../../output/pratala/art-v2';
const shape = (process.argv[2] ?? 'landscape') === 'portrait' ? 'Portrait' : 'Landscape';
const box = eyeBox(shape);
const scene = hallScene({ hot: process.argv.includes('hot') });
scene.camera = { ...CAMERA[shape] };
const size = HALL_SIZES[shape];
const result = render(scene, { ...size, maxSteps: 200, far: 40, ao: 0.5, exposure: 1.3, region: { x0: box.x, y0: box.y, x1: box.x + box.width, y1: box.y + box.height } });
const full = quantize(result, { dither: 0.035, outlineDarken: 1 });
const crop = new PixelCanvas(box.width, box.height);
for (let y = 0; y < box.height; y++) for (let x = 0; x < box.width; x++) crop.set(x, y, full.get(box.x + x, box.y + y));
writeFileSync(`${out}/eye-region-${shape.toLowerCase()}.png`, canvasPng(crop, 4));
console.log('box', box);
