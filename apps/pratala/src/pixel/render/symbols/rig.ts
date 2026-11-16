// The stage every reel symbol is rendered on: one camera a little above and to the front, one
// warm key light from the upper left (the hall's torches), a cool fill from the right, a rim from
// behind, so all symbols share one light. A symbol is an SDF model in a cell about 1 unit across,
// standing on y = 0, and renders to a 40 × 40 pixel canvas (34 to 36 of them used).
import { PixelCanvas } from '../../canvas.ts';
import { INK } from '../../palette.ts';
import { hit, render, type Light, type Material, type Scene } from '../raymarch.ts';
import { quantize, type QuantizeOptions } from '../quantize.ts';

export const SYMBOL_PIXELS = 40;

export type SymbolModel = {
	// the distance field, writing hit.m for materials; p already in the model's own frame
	sdf: (x: number, y: number, z: number) => number;
	material: (m: number, x: number, y: number, z: number, nx: number, ny: number, nz: number) => Material;
	// extra lights the model carries (a lantern's flame), in model space
	lights?: Light[];
	// how far above y = 0 the model's middle sits; the camera looks there
	centreY?: number;
	// the view's half height in world units; the model should fit 0.9 of it
	reach?: number;
	// quantize overrides (dither, outline)
	quantize?: QuantizeOptions;
	// overall light multiplier for bright or dark materials
	exposure?: number;
};

export type View = {
	// turn about the vertical axis, radians (0 faces the camera)
	yaw?: number;
	// the camera's pitch down onto the model, radians
	pitch?: number;
	// roll of the model about the view axis, radians
	roll?: number;
	// a shift of the model in the cell, in world units
	dx?: number;
	dy?: number;
	// scale of the model
	scale?: number;
};

export const DEFAULT_VIEW: Required<View> = { yaw: -0.42, pitch: 0.34, roll: 0, dx: 0, dy: 0, scale: 1 };

// the symbol scene: the model turned by the view, on the shared stage
export const symbolScene = (model: SymbolModel, view: View = {}): Scene => {
	const v = { ...DEFAULT_VIEW, ...view };
	const cy = model.centreY ?? 0.5;
	const reach = model.reach ?? 0.62;
	const cosY = Math.cos(-v.yaw);
	const sinY = Math.sin(-v.yaw);
	const cosR = Math.cos(-v.roll);
	const sinR = Math.sin(-v.roll);
	const s = 1 / v.scale;
	// world → model: undo the shift, the roll (about the camera's axis, z), then the yaw
	const toModel = (x: number, y: number, z: number, out: number[]) => {
		let mx = (x - v.dx) * s;
		let my = (y - cy - v.dy) * s;
		const mz = z * s;
		const rx = mx * cosR - my * sinR;
		const ry = mx * sinR + my * cosR;
		mx = rx;
		my = ry + cy;
		out[0] = mx * cosY - mz * sinY;
		out[1] = my;
		out[2] = mx * sinY + mz * cosY;
		return out;
	};
	const q = [0, 0, 0];
	const sdf = (x: number, y: number, z: number) => {
		toModel(x, y, z, q);
		return model.sdf(q[0], q[1], q[2]) * v.scale;
	};
	// normals turn with the model: the same roll and yaw, no shift or scale
	const n = [0, 0, 0];
	const material: Scene['material'] = (m, x, y, z, nx, ny, nz) => {
		toModel(x, y, z, q);
		const rx = nx * cosR - ny * sinR;
		const ry = nx * sinR + ny * cosR;
		n[0] = rx * cosY - nz * sinY;
		n[1] = ry;
		n[2] = rx * sinY + nz * cosY;
		return model.material(m, q[0], q[1], q[2], n[0], n[1], n[2]);
	};
	// lights ride with the stage, not the model, except the model's own
	const own = (model.lights ?? []).map((light) => {
		// model → world for a light position: yaw then roll then shift
		const lx = light.x * cosY + light.z * sinY;
		const lz = -light.x * sinY + light.z * cosY;
		const ly = light.y;
		const rx = lx * cosR + (ly - cy) * sinR;
		const ry = -lx * sinR + (ly - cy) * cosR + cy;
		return { ...light, x: rx * v.scale + v.dx, y: (ry - cy) * v.scale + cy + v.dy, z: lz * v.scale };
	});
	const dist = 6;
	const pitch = v.pitch;
	return {
		sdf,
		material,
		lights: [
			// key: warm, upper left, in front
			{ x: -2.6, y: cy + 3.2, z: -3.4, color: [2.6, 1.9, 1.3], radius: 7, soft: 14 },
			// fill: cool, right, lower
			{ x: 3.0, y: cy + 0.8, z: -2.6, color: [0.5, 0.6, 0.95], radius: 7, soft: 10, shadows: false },
			// rim from behind above
			{ x: 0.8, y: cy + 3.0, z: 3.2, color: [0.9, 0.7, 0.5], radius: 7, soft: 10, shadows: false },
			...own,
		],
		camera: {
			eye: [0, cy + Math.sin(pitch) * dist, -Math.cos(pitch) * dist],
			at: [0, cy, 0],
			fov: 10,
			ortho: reach,
		},
		sky: [0.22, 0.23, 0.3],
		ground: [0.05, 0.045, 0.05],
		background: [0, 0, 0],
	};
};

export const renderSymbol = (
	model: SymbolModel,
	view: View = {},
	size = SYMBOL_PIXELS,
	// how much wider than the cell the view is (the model keeps its pixel size)
	spread = 1,
): PixelCanvas => {
	const scene = symbolScene(model, view);
	if (spread !== 1 && scene.camera.ortho) scene.camera.ortho *= spread;
	const result = render(scene, {
		width: size,
		height: size,
		maxSteps: 180,
		far: 20,
		epsilon: 0.004,
		ao: 0.5,
		exposure: model.exposure ?? 1.1,
	});
	const canvas = quantize(result, {
		dither: 0.03,
		outlineDarken: 1,
		clearBackground: true,
		...model.quantize,
	});
	// one dark line round the silhouette, as every Kilara symbol has
	return canvas.outline(INK);
};

// the material index the model is writing, for models that pick nearest surfaces
export { hit };
