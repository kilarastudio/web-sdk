import { HALL } from '../src/pixel/render/hall.ts';
import { project } from '../src/pixel/render/project.ts';
const apex = HALL.vaultCentreY + HALL.vaultRadius;
for (const [eyeY, atY, fov] of [[2.9, 3.9, 46], [2.9, 4.6, 46], [3.2, 5.0, 48], [3.2, 5.4, 50], [2.9, 4.6, 52]]) {
	for (const shape of ['Landscape', 'Portrait'] as const) {
		const size = shape === 'Landscape' ? { width: 576, height: 324 } : { width: 324, height: 576 };
		const c = { eye: [0, eyeY, -11] as [number, number, number], at: [0, atY, 6] as [number, number, number], fov: shape === 'Landscape' ? fov : fov + 24 };
		const p = (x: number, y: number, z: number) => { const r = project(c, size.width, size.height, x, y, z); return `${Math.round(r.y)}`; };
		console.log(`eye ${eyeY} at ${atY} fov ${fov} ${shape}: apex y at z=2,3,4,5,6:`, [2, 3, 4, 5, 6].map((z) => p(0, apex, z)).join(' '), '| floor y at z=0,-2:', p(0, 0, 0), p(0, 0, -2), '| back wall foot', p(0, 0, HALL.back));
	}
}
