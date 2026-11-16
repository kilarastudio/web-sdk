// Prints where the hall's torches, eye and floor land on each picture, in art pixels.
import { CAMERA, HALL, eyeBox } from '../src/pixel/render/hall.ts';
import { project } from '../src/pixel/render/project.ts';

const H = HALL;
for (const shape of ['Landscape', 'Portrait'] as const) {
	const size = shape === 'Landscape' ? { width: 576, height: 324 } : { width: 324, height: 576 };
	const camera = CAMERA[shape];
	const p = (x: number, y: number, z: number) => {
		const r = project(camera, size.width, size.height, x, y, z);
		return { x: Math.round(r.x * 10) / 10, y: Math.round(r.y * 10) / 10 };
	};
	console.log(shape);
	for (const tz of H.pillarZ)
		for (const side of [-1, 1]) {
			const cupTop = p(side * (H.pillarX - H.torch.inset), H.torch.y + 0.12, tz);
			const cupW = Math.abs(p(side * (H.pillarX - H.torch.inset) + 0.14, H.torch.y, tz).x - p(side * (H.pillarX - H.torch.inset) - 0.14, H.torch.y, tz).x);
			console.log('  torch z', tz, 'side', side, cupTop, 'cup width px', Math.round(cupW));
		}
	console.log('  eye box', eyeBox(shape));
	console.log('  floor at back wall y', p(0, 0, H.back).y, '; floor at z=0 y', p(0, 0, 0).y, '; floor at z=-4 y', p(0, 0, -4).y);
	console.log('  pillar base front-left', p(-H.pillarX, 0, H.pillarZ[0]), 'back-left', p(-H.pillarX, 0, H.pillarZ[1]));
}
