// Builds the character skeleton (kilara-skeleton v1) from the eight Kilap Jernih pose drawings in
// output/ai-game-assets/deep-glint-p0/character/poses/final. Each pose is one full drawing; the
// skeleton swaps them and adds small motion on top: breathing, a lean, a pop and a flash on every
// change of pose, the swing trail of the power strike and the helmet lamp glow.
// Writes character.skeleton.json, character.sheet.json and character.webp into
// static/assets/deep-glint/character. Needs sharp (KILARA_SHARP_PATH or a local install).
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_DIR = path.resolve(
	app,
	'../../../output/ai-game-assets/deep-glint-p0/character/poses/final',
);
const RUNTIME_DIR = path.join(app, 'static/assets/deep-glint/character');
// Skeleton units are idle.png pixels. Textures are stored at 0.47 of that, the most that keeps the
// sheet within 2048 × 2048 (the safe texture size on phones): the idle figure is ~710 px tall, and
// the character is never taller than 400 layout units.
const TEXTURE_SCALE = 0.47;
const SHEET_WIDTH = 2048;
const GUTTER = 2;
const ALPHA_MIN = 8;

// Measured on the drawings (source pixels). `helmet` is the width of the helmet brim, which sets
// the scale (idle = 297); the brim was read off a ruler, then corrected by lining all eight poses
// up on one ground line and comparing helmets and boots; `ground` is the lowest boot sole and `feet` the middle between both
// boots, which together become the skeleton origin; `lamp` is the centre of the helmet lamp.
const POSES = {
	idle: { helmet: 297, ground: 1528, feet: 622, lamp: [442, 68] },
	anticipation: { helmet: 313, ground: 1478, feet: 546, lamp: [252, 145] },
	'power-1-windup': { helmet: 309, ground: 1508, feet: 547, lamp: [356, 175] },
	'power-2-strike': { helmet: 306, ground: 1435, feet: 574, lamp: [351, 125], strike: [167, 1233] },
	'power-3-follow': { helmet: 286, ground: 1498, feet: 640, lamp: [443, 64] },
	win: { helmet: 294, ground: 1473, feet: 620, lamp: [415, 70] },
	bigwin: { helmet: 267, ground: 1504, feet: 522, lamp: [482, 295] },
	bonus: { helmet: 286, ground: 1506, feet: 612, lamp: [511, 67] },
};
const HELMET = POSES.idle.helmet;

const LAMP_GLOW_SIZE = 230;
const LAMP_GLOW_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><defs><radialGradient id="g"><stop offset=".08" stop-color="#fff2b8"/><stop offset=".35" stop-color="#ffd25e" stop-opacity=".55"/><stop offset="1" stop-color="#ffb31a" stop-opacity="0"/></radialGradient></defs><circle cx="64" cy="64" r="64" fill="url(#g)"/></svg>`;
// A crescent that sweeps from above the head down to the lower left, the path of the pickaxe head
// from the wind-up to the strike. Centred on the hands of the strike pose.
const TRAIL = { size: 1400, hands: [778, 789] };
const TRAIL_SVG = (() => {
	const r = 640;
	const inner = 560;
	const point = (radius, degrees) => {
		const a = (degrees * Math.PI) / 180;
		return `${(700 + radius * Math.cos(a)).toFixed(1)} ${(700 + radius * Math.sin(a)).toFixed(1)}`;
	};
	return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 1400 1400"><defs><linearGradient id="t" x1="1" y1="0" x2="0" y2="1"><stop stop-color="#fff6d0" stop-opacity="0"/><stop offset=".55" stop-color="#ffe08a" stop-opacity=".55"/><stop offset="1" stop-color="#fffbe8" stop-opacity=".95"/></linearGradient></defs><path d="M${point(r, 280)} A${r} ${r} 0 0 0 ${point(r, 140)} L${point(inner, 140)} A${inner} ${inner} 0 0 1 ${point(inner, 280)} Z" fill="url(#t)"/></svg>`;
})();

const texture = (name) => `character-${name}`;
const round = (value) => Math.round(value * 1000) / 1000;
const scaleOf = (pose) => HELMET / POSES[pose].helmet;
// a point of a drawing in skeleton units
const place = (pose, [x, y]) => {
	const { feet, ground } = POSES[pose];
	const s = scaleOf(pose);
	return [round((x - feet) * s), round((y - ground) * s)];
};

// Each drawing cropped to its pixels, with the attachment that puts it on the origin.
const loadPoses = async (sharp) => {
	const images = {};
	for (const pose of Object.keys(POSES)) {
		const file = path.join(SOURCE_DIR, `${pose}.png`);
		const { data, info } = await sharp(file)
			.ensureAlpha()
			.raw()
			.toBuffer({ resolveWithObject: true });
		let [left, top, right, bottom] = [info.width, info.height, 0, 0];
		for (let y = 0; y < info.height; y++)
			for (let x = 0; x < info.width; x++)
				if (data[(y * info.width + x) * 4 + 3] > ALPHA_MIN) {
					left = Math.min(left, x);
					top = Math.min(top, y);
					right = Math.max(right, x + 1);
					bottom = Math.max(bottom, y + 1);
				}
		const s = scaleOf(pose);
		const [x, y] = place(pose, [left, top]);
		images[pose] = {
			input: sharp(file)
				.extract({ left, top, width: right - left, height: bottom - top })
				.resize({ width: Math.round((right - left) * s * TEXTURE_SCALE) }),
			attachment: {
				texture: texture(pose),
				width: round((right - left) * s),
				height: round((bottom - top) * s),
				x,
				y,
				anchor: [0, 0],
			},
		};
	}
	return images;
};

// keys helpers: [time, value, ease]
const keys = (...list) => list.map(([t, v, ease]) => (ease ? [t, v, ease] : [t, v]));
const smooth = (...list) =>
	list.map(([t, v], i) => (i < list.length - 1 ? [t, v, 'smooth'] : [t, v]));
// the drawing shown in the body, its flash and the lamp glow from `time`
const showPose = (slots, time, pose) => {
	for (const slot of ['body', 'flash', 'lamp-glow'])
		((slots[slot] ??= {}).attachment ??= []).push([
			time,
			slot === 'lamp-glow' ? `lamp-${pose}` : pose,
		]);
};
// a new drawing pops in: a quick squash and stretch from the feet and a bright flash
const pop = (bones, slots, time, strength = 1) => {
	const body = (bones.body ??= {});
	(body.scaleX ??= []).push(
		[time, 1 + 0.04 * strength, 'out'],
		[time + 0.09, 1 - 0.015 * strength, 'smooth'],
		[time + 0.2, 1, 'smooth'],
	);
	(body.scaleY ??= []).push(
		[time, 1 - 0.05 * strength, 'out'],
		[time + 0.09, 1 + 0.02 * strength, 'smooth'],
		[time + 0.2, 1, 'smooth'],
	);
	(slots.flash.alpha ??= []).push([time, 0.42 * strength, 'out'], [time + 0.16, 0, 'linear']);
};
// key lists must be in time order; the helpers above append, so sort and drop empty channels
const finish = (animation) => {
	for (const channels of [
		...Object.values(animation.bones ?? {}),
		...Object.values(animation.slots ?? {}),
	])
		for (const [name, list] of Object.entries(channels)) {
			list.sort((a, b) => a[0] - b[0]);
			if (!list.length) delete channels[name];
		}
	return animation;
};

const buildAnimations = () => {
	const animations = {};

	// idle: slow breath from the feet and a faint sway; the lamp glows softly
	{
		const bones = {
			body: {
				scaleY: smooth([0, 1], [1.8, 1.014], [3.6, 1]),
				scaleX: smooth([0, 1], [1.8, 0.996], [3.6, 1]),
				rotation: smooth([0, 0], [1.8, -0.5], [3.6, 0]),
			},
		};
		const slots = { 'lamp-glow': { alpha: smooth([0, 0.3], [1.8, 0.5], [3.6, 0.3]) } };
		showPose(slots, 0, 'idle');
		slots.flash.alpha = [[0, 0]];
		animations.idle = finish({ duration: 3.6, bones, slots });
	}

	// anticipation: crouched and leaning to the board, a tense pulse; the lamp burns bright
	{
		const bones = {
			body: {
				scaleY: smooth([0, 1], [0.5, 0.985], [1, 1]),
				rotation: smooth([0, 0], [0.5, -1.2], [1, 0]),
			},
		};
		const slots = { 'lamp-glow': { alpha: smooth([0, 0.7], [0.5, 1], [1, 0.7]) } };
		showPose(slots, 0, 'anticipation');
		slots.flash.alpha = [[0, 0]];
		animations.anticipation = finish({ duration: 1, bones, slots });
	}

	// power: wind-up, strike at 0.46 s (the beam leaves at 0.5 s), follow-through
	{
		const bones = {
			body: { rotation: smooth([0, 0], [0.4, 2.5], [0.46, -2], [0.62, -1], [0.9, 0]) },
		};
		const slots = {
			trail: { alpha: keys([0, 0], [0.44, 0], [0.47, 0.9, 'out'], [0.62, 0]) },
			'lamp-glow': { alpha: smooth([0, 0.5], [0.46, 1], [0.7, 0.6], [0.9, 0.5]) },
		};
		showPose(slots, 0, 'power-1-windup');
		showPose(slots, 0.46, 'power-2-strike');
		showPose(slots, 0.68, 'power-3-follow');
		pop(bones, slots, 0, 0.6);
		pop(bones, slots, 0.46, 1.4);
		pop(bones, slots, 0.68, 0.4);
		animations.power = finish({ duration: 0.9, bones, slots, events: [[0.5, 'glint-strike']] });
	}

	// win: pops in and hops once
	{
		const bones = { body: { y: smooth([0, 0], [0.2, 0], [0.38, -28], [0.56, 0], [1.25, 0]) } };
		const slots = { 'lamp-glow': { alpha: smooth([0, 0.9], [0.6, 0.6], [1.25, 0.4]) } };
		showPose(slots, 0, 'win');
		pop(bones, slots, 0);
		animations.win = finish({ duration: 1.25, bones, slots });
	}

	// bigWin: two hops a loop, landing in a squash
	{
		const hop = (t) => [
			[t, 0],
			[t + 0.22, -38],
			[t + 0.4, 0],
		];
		const bones = {
			body: {
				y: smooth(...hop(0), ...hop(0.8), [1.6, 0]),
				scaleY: smooth([0, 1], [0.4, 0.96], [0.52, 1], [1.2, 0.96], [1.32, 1], [1.6, 1]),
			},
		};
		const slots = {
			'lamp-glow': { alpha: smooth([0, 0.7], [0.4, 1], [0.8, 0.7], [1.2, 1], [1.6, 0.7]) },
		};
		showPose(slots, 0, 'bigwin');
		slots.flash.alpha = [[0, 0]];
		animations.bigWin = finish({ duration: 1.6, bones, slots });
	}

	// bonus: pops in with a big jump of surprise
	{
		const bones = { body: { y: smooth([0, 0], [0.18, 0], [0.4, -34], [0.62, 0], [1.5, 0]) } };
		const slots = { 'lamp-glow': { alpha: smooth([0, 1], [0.8, 0.7], [1.5, 0.5]) } };
		showPose(slots, 0, 'bonus');
		pop(bones, slots, 0, 1.2);
		animations.bonus = finish({ duration: 1.5, bones, slots });
	}

	return animations;
};

export const buildSkeleton = (images) => {
	const body = {};
	const lamps = {};
	for (const [pose, { attachment }] of Object.entries(images)) {
		body[pose] = attachment;
		const [x, y] = place(pose, POSES[pose].lamp);
		lamps[`lamp-${pose}`] = {
			texture: texture('lamp-glow'),
			width: LAMP_GLOW_SIZE,
			height: LAMP_GLOW_SIZE,
			x,
			y,
		};
	}
	const strikePose = 'power-2-strike';
	const [strikeX, strikeY] = place(strikePose, POSES[strikePose].strike);
	const [handsX, handsY] = place(strikePose, TRAIL.hands);
	const trailSize = TRAIL.size * scaleOf(strikePose);

	// head to boots and hand to hand in the idle drawing
	const idle = images.idle.attachment;
	return {
		format: 'kilara-skeleton',
		version: 1,
		name: 'character',
		bounds: { x: idle.x, y: idle.y, width: idle.width, height: idle.height },
		bones: [
			{ name: 'root' },
			// breath, lean and hops all pivot on the feet
			{ name: 'body', parent: 'root' },
			// the beam of Glint Strike leaves from the pickaxe head of the strike drawing
			{ name: 'strike_origin', parent: 'body', x: strikeX, y: strikeY },
		],
		slots: [
			{ name: 'trail', bone: 'body', attachment: 'trail', alpha: 0, blend: 'add' },
			{ name: 'body', bone: 'body', attachment: 'idle' },
			{ name: 'flash', bone: 'body', attachment: 'idle', alpha: 0, blend: 'add' },
			{ name: 'lamp-glow', bone: 'body', attachment: 'lamp-idle', alpha: 0.3, blend: 'add' },
		],
		skins: {
			default: {
				trail: {
					trail: {
						texture: texture('trail'),
						width: round(trailSize),
						height: round(trailSize),
						x: handsX,
						y: handsY,
					},
				},
				body,
				flash: body,
				'lamp-glow': lamps,
			},
		},
		animations: buildAnimations(),
	};
};

// Shelf-packs the drawings, the lamp glow and the trail into one sheet.
const packSheet = async (sharp, images) => {
	const inputs = [
		...Object.entries(images).map(([pose, { input }]) => [texture(pose), input]),
		[texture('lamp-glow'), sharp(Buffer.from(LAMP_GLOW_SVG))],
		[texture('trail'), sharp(Buffer.from(TRAIL_SVG))],
	];
	const packed = [];
	for (const [name, input] of inputs) {
		const { data, info } = await input.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
		packed.push({ name, data, width: info.width, height: info.height });
	}
	packed.sort((a, b) => b.height - a.height);
	let x = GUTTER;
	let y = GUTTER;
	let shelf = 0;
	const frames = {};
	for (const image of packed) {
		if (x + image.width + GUTTER > SHEET_WIDTH) {
			x = GUTTER;
			y += shelf + GUTTER;
			shelf = 0;
		}
		Object.assign(image, { x, y });
		frames[image.name] = {
			frame: { x, y, w: image.width, h: image.height },
			rotated: false,
			trimmed: false,
			spriteSourceSize: { x: 0, y: 0, w: image.width, h: image.height },
			sourceSize: { w: image.width, h: image.height },
		};
		x += image.width + GUTTER;
		shelf = Math.max(shelf, image.height);
	}
	const height = y + shelf + GUTTER;
	const sheet = await sharp({
		create: { width: SHEET_WIDTH, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
	})
		.composite(
			packed.map((image) => ({
				input: image.data,
				raw: { width: image.width, height: image.height, channels: 4 },
				left: image.x,
				top: image.y,
			})),
		)
		.webp({ quality: 90, alphaQuality: 100, effort: 6 })
		.toBuffer();
	return {
		image: sheet,
		json: {
			frames,
			meta: {
				image: 'character.webp',
				format: 'RGBA8888',
				size: { w: SHEET_WIDTH, h: height },
				scale: '1',
			},
		},
	};
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const require = createRequire(import.meta.url);
	const sharp = require(process.env.KILARA_SHARP_PATH || 'sharp');
	const { validateSkeleton } =
		await import('../../../packages/components-pixi/src/skeleton/skeleton.ts');
	const images = await loadPoses(sharp);
	const skeleton = buildSkeleton(images);
	const errors = validateSkeleton(skeleton);
	if (errors.length) throw new Error(errors.join('\n'));
	const sheet = await packSheet(sharp, images);
	await fs.mkdir(RUNTIME_DIR, { recursive: true });
	await fs.writeFile(
		path.join(RUNTIME_DIR, 'character.skeleton.json'),
		JSON.stringify(skeleton, null, '\t') + '\n',
	);
	await fs.writeFile(
		path.join(RUNTIME_DIR, 'character.sheet.json'),
		JSON.stringify(sheet.json, null, '\t') + '\n',
	);
	await fs.writeFile(path.join(RUNTIME_DIR, 'character.webp'), sheet.image);
	console.log(
		JSON.stringify({
			sheet: `${sheet.json.meta.size.w}×${sheet.json.meta.size.h}, ${sheet.image.length} bytes`,
			bounds: skeleton.bounds,
			scales: Object.fromEntries(Object.keys(POSES).map((pose) => [pose, round(scaleOf(pose))])),
		}),
	);
}
