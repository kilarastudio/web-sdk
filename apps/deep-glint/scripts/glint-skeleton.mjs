// Source of the Glint skeleton (kilara-skeleton v1) and the frame sheet for
// glint.png. Run directly to rewrite both runtime files; build-glint-sample.mjs
// also writes them after it composes glint.png.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Regions of glint.png, composed by build-glint-sample.mjs.
export const GLINT_REGIONS = {
	'glint-tile-t1': [2, 2, 512, 512],
	'glint-tile-t2': [518, 2, 512, 512],
	'glint-tile-t3': [2, 518, 512, 512],
	'glint-tile-t4': [518, 518, 512, 512],
	'glint-shine': [1034, 2, 64, 64],
	'glint-primed': [1034, 70, 64, 64],
};
export const GLINT_SHEET_SIZE = [1104, 1032];

export const glintSheet = () => ({
	frames: Object.fromEntries(
		Object.entries(GLINT_REGIONS).map(([name, [x, y, w, h]]) => [
			name,
			{
				frame: { x, y, w, h },
				rotated: false,
				trimmed: false,
				spriteSourceSize: { x: 0, y: 0, w, h },
				sourceSize: { w, h },
			},
		]),
	),
	meta: {
		image: 'glint.png',
		format: 'RGBA8888',
		size: { w: GLINT_SHEET_SIZE[0], h: GLINT_SHEET_SIZE[1] },
		scale: '1',
	},
});

const attachmentsFor = (tier) => ({
	tile: { tile: { texture: `glint-tile-t${tier}`, width: 100, height: 100 } },
	light: { tile: { texture: `glint-tile-t${tier}`, width: 100, height: 100 } },
});
const scale = (...keys) => ({ scale: keys });
const alpha = (...keys) => ({ alpha: keys });

// One cell, origin at its centre, y down. The perimeter loop runs clockwise
// on screen from the top-left corner.
const perimeter = [
	[-38, -38],
	[38, -38],
	[38, 38],
	[-38, 38],
	[-38, -38],
];

export const glintSkeleton = {
	format: 'kilara-skeleton',
	version: 1,
	name: 'glint',
	bounds: { x: -50, y: -50, width: 100, height: 100 },
	bones: [
		{ name: 'root' },
		{ name: 'tile', parent: 'root' },
		{ name: 'light', parent: 'root' },
		{ name: 'shineA', parent: 'root' },
		{ name: 'shineB', parent: 'root' },
		{ name: 'primed', parent: 'root', x: 38, y: -38 },
	],
	slots: [
		{ name: 'tile', bone: 'tile', attachment: 'tile' },
		{ name: 'light', bone: 'light', attachment: 'tile', alpha: 0, blend: 'add' },
		{ name: 'shineA', bone: 'shineA', attachment: 'shine', alpha: 0, blend: 'add' },
		{ name: 'shineB', bone: 'shineB', attachment: 'shine', alpha: 0, blend: 'add' },
		{ name: 'primed', bone: 'primed', attachment: 'primed', alpha: 0 },
	],
	skins: {
		default: {
			...attachmentsFor(1),
			shineA: { shine: { texture: 'glint-shine', width: 13, height: 13 } },
			shineB: { shine: { texture: 'glint-shine', width: 9, height: 9 } },
			primed: { primed: { texture: 'glint-primed', width: 22, height: 22 } },
		},
		t1: attachmentsFor(1),
		t2: attachmentsFor(2),
		t3: attachmentsFor(3),
		t4: attachmentsFor(4),
	},
	animations: {
		// primed → lit at 2×
		light: {
			duration: 0.4,
			bones: {
				tile: scale([0, 0.7], [0.16, 0.96], [0.26, 1.025], [0.4, 1]),
				light: scale([0, 0.12], [0.12, 0.55], [0.28, 1], [0.4, 1]),
			},
			slots: {
				tile: alpha([0, 0], [0.12, 0.65], [0.28, 1], [0.4, 1]),
				light: alpha([0, 0], [0.08, 0.7], [0.2, 0.45], [0.4, 0]),
			},
		},
		// empty → primed
		prime: {
			duration: 0.3,
			bones: {
				primed: scale([0, 0.45], [0.12, 1.18], [0.3, 1]),
				shineA: {
					x: [
						[0, 38],
						[0.3, 42],
					],
					y: [
						[0, -38],
						[0.3, -42],
					],
					scale: [
						[0, 0.3],
						[0.1, 1.3],
						[0.3, 0.5],
					],
				},
			},
			slots: {
				tile: alpha([0, 0], [0.3, 0]),
				primed: alpha([0, 0], [0.1, 1], [0.3, 1]),
				shineA: alpha([0, 0], [0.08, 0.95], [0.3, 0]),
			},
		},
		// doubling inside a tier
		double: {
			duration: 0.35,
			bones: {
				tile: scale([0, 1], [0.12, 1.055], [0.35, 1]),
				light: scale([0, 1], [0.14, 1.035], [0.35, 1]),
			},
			slots: { light: alpha([0, 0], [0.1, 0.5], [0.35, 0]) },
		},
		// the spot pays into a win
		apply: {
			duration: 0.5,
			bones: { tile: scale([0, 1], [0.14, 1.035], [0.5, 1]) },
			slots: { light: alpha([0, 0], [0.1, 0.85], [0.24, 0.15], [0.34, 0.65], [0.5, 0]) },
		},
		reset: {
			duration: 0.25,
			slots: { tile: alpha([0, 1], [0.25, 0]) },
		},
		// 4→8, 16→32, 64→128; the caller cross-fades the old tier underneath
		tier_up: {
			duration: 0.5,
			bones: {
				tile: scale([0, 0.94], [0.18, 1.055], [0.5, 1]),
				light: scale([0, 0.92], [0.16, 1.04], [0.5, 1]),
			},
			slots: {
				tile: alpha([0, 0], [0.16, 1], [0.5, 1]),
				light: alpha([0, 0], [0.12, 0.8], [0.5, 0]),
			},
		},
		// ×256, looping
		max_loop: {
			duration: 1.2,
			bones: {
				shineA: {
					x: perimeter.map(([x], i) => [i * 0.3, x]),
					y: perimeter.map(([, y], i) => [i * 0.3, y]),
				},
				shineB: {
					x: perimeter.map(([x], i) => [i * 0.3, -x]),
					y: perimeter.map(([, y], i) => [i * 0.3, -y]),
				},
			},
			slots: {
				light: alpha([0, 0.04], [0.6, 0.25], [1.2, 0.04]),
				shineA: alpha([0, 0.55], [0.3, 1], [0.6, 0.55], [0.9, 1], [1.2, 0.55]),
				shineB: alpha([0, 0.8], [0.3, 0.4], [0.6, 0.8], [0.9, 0.4], [1.2, 0.8]),
			},
		},
	},
};

export const writeGlintSkeleton = async (runtime) => {
	await fs.writeFile(
		path.join(runtime, 'glint.skeleton.json'),
		JSON.stringify(glintSkeleton, null, '\t') + '\n',
	);
	await fs.writeFile(
		path.join(runtime, 'glint.sheet.json'),
		JSON.stringify(glintSheet(), null, '\t') + '\n',
	);
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
	await writeGlintSkeleton(path.join(app, 'static/assets/deep-glint/glint'));
	console.log('wrote glint.skeleton.json and glint.sheet.json');
}
