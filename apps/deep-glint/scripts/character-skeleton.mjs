// Builds the cutout rig skeleton (kilara-skeleton v1) from the character rig v1
// (static/assets/ai/deep-glint-character-rig-v1) and packs its parts into one frame sheet.
// Writes character-rig.skeleton.json, character-rig.sheet.json and character-rig.webp into
// static/assets/deep-glint/character-rig, and a rig overlay into the verification folder.
// Needs sharp (KILARA_SHARP_PATH or a local install).
//
// On top of rig v1 it
// - moves each joint pivot to the middle of the cut between its two parts,
// - draws the parts in an order that suits each joint (a sleeve over the arm it ends in),
// - extends the lower part of every joint under the part above it, so a turned joint shows
//   more of the same part instead of a gap; the bind pose stays identical pixel for pixel,
// - adds two-bone IK to the legs, so the hips can drop and shift with the feet planted,
// - adds a range_of_motion animation to check all of the above.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const RIG_DIR = path.join(app, 'static/assets/ai/deep-glint-character-rig-v1');
// Superseded in the game by the pose drawings (character-poses.mjs); kept for the rig preview.
const RUNTIME_DIR = path.join(app, 'static/assets/deep-glint/character-rig');
const VERIFICATION_DIR = path.resolve(
	app,
	'../../../output/ai-game-assets/deep-glint-p0/character/verification',
);
// Parts are drawn at source size in skeleton units but stored at half resolution: the
// character is never taller than 400 layout units, which is ~800 px on a 2× screen.
const TEXTURE_SCALE = 0.5;
const SHEET_WIDTH = 1024;
const GUTTER = 2;
// preview runtime: glow alpha = 0.10 + intensity × 0.75, radius 72
const LAMP_GLOW = { base: 0.1, gain: 0.75, size: 144 };
const LAMP_GLOW_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72"><defs><radialGradient id="g"><stop offset=".07" stop-color="#ffe38c"/><stop offset="1" stop-color="#ffc14b" stop-opacity="0"/></radialGradient></defs><circle cx="36" cy="36" r="36" fill="url(#g)"/></svg>`;

// Back to front. Each limb segment sits under the one whose end covers it: thighs under the
// belt, shins under the thighs and into the boots, forearms into the rolled sleeves and the
// glove cuffs. Upper arms sit over the jacket so a raised arm keeps its shoulder.
const DRAW_ORDER = [
	'shin-r',
	'shin-l',
	'thigh-r',
	'thigh-l',
	'boot-r',
	'boot-l',
	'head',
	'torso',
	'pelvis',
	'forearm-r',
	'upper-arm-r',
	'pickaxe',
	'hand-r',
	'forearm-l',
	'upper-arm-l',
	'hand-l',
];
// Joints between two parts (slot names). `bone` gets its pivot moved to the middle of the cut,
// or of its top `pivotTop` share for a cut that runs down the side of a limb. `reach` is how
// far, in source pixels, the lower part is extended under the upper one.
const JOINTS = [
	{ parts: ['head', 'torso'], bone: 'head', reach: 40 },
	{ parts: ['upper-arm-r', 'torso'], bone: 'upper-arm-r', pivotTop: 0.3, reach: 70 },
	{ parts: ['forearm-r', 'upper-arm-r'], bone: 'forearm-r', reach: 45 },
	{ parts: ['hand-r', 'forearm-r'], bone: 'hand-r', reach: 35 },
	{ parts: ['upper-arm-l', 'torso'], bone: 'upper-arm-l', pivotTop: 0.3, reach: 70 },
	{ parts: ['forearm-l', 'upper-arm-l'], bone: 'forearm-l', reach: 45 },
	{ parts: ['hand-l', 'forearm-l'], bone: 'hand-l', reach: 35 },
	{ parts: ['torso', 'pelvis'], reach: 35 },
	{ parts: ['thigh-r', 'pelvis'], bone: 'thigh-r', reach: 45 },
	{ parts: ['shin-r', 'thigh-r'], bone: 'shin-r', reach: 45 },
	{ parts: ['boot-r', 'shin-r'], bone: 'boot-r', reach: 35 },
	{ parts: ['thigh-l', 'pelvis'], bone: 'thigh-l', reach: 45 },
	{ parts: ['shin-l', 'thigh-l'], bone: 'shin-l', reach: 45 },
	{ parts: ['boot-l', 'shin-l'], bone: 'boot-l', reach: 35 },
	{ parts: ['thigh-r', 'thigh-l'], reach: 25 },
];
// two-bone IK per leg; the targets are children of the root, at the ankles
const LEGS = [
	{ name: 'leg-r', bones: ['thigh-r', 'shin-r'], end: 'boot-r', target: 'foot-r-target' },
	{ name: 'leg-l', bones: ['thigh-l', 'shin-l'], end: 'boot-l', target: 'foot-l-target' },
];
// range_of_motion: each channel goes to its first value, then its second, then back, in turn.
// The ranges are what the game's poses may use, not the anatomical limits.
const RANGE_OF_MOTION = [
	['head', 'rotation', -12, 12],
	['torso', 'rotation', -10, 10],
	['upper-arm-r', 'rotation', -20, 110],
	['forearm-r', 'rotation', -90, 50],
	['hand-r', 'rotation', -35, 35],
	['upper-arm-l', 'rotation', -110, 20],
	['forearm-l', 'rotation', -50, 90],
	['hand-l', 'rotation', -35, 35],
	['pelvis', 'y', 40, 0],
	['pelvis', 'x', -30, 30],
	['foot-r-target', 'y', -60, 0],
	['foot-l-target', 'y', -60, 0],
];
const RANGE_STEP = 1.2;
// alpha from here up counts as solid
const OPAQUE = 250;
// joint extensions fade out over their last pixels
const FEATHER = 6;

const readJson = async (file) => JSON.parse(await fs.readFile(path.join(RIG_DIR, file), 'utf8'));
const texture = (part) => `character-rig-${part}`;
const round = (value) => Math.round(value * 1000) / 1000;
const degrees = (radians) => (radians * 180) / Math.PI;
const wrap = (angle) => angle - 360 * Math.round(angle / 360);

// Every neutral part as straight RGBA on the reference canvas.
const loadParts = async (sharp, rig, manifest) => {
	const [width, height] = [rig.bindCanvas.width, rig.bindCanvas.height];
	const parts = {};
	for (const item of rig.attachments.filter((a) => a.sourceOffset)) {
		const { data, info } = await sharp(path.join(RIG_DIR, manifest.parts[item.part].file))
			.ensureAlpha()
			.raw()
			.toBuffer({ resolveWithObject: true });
		const rgba = new Uint8ClampedArray(width * height * 4);
		const [ox, oy] = item.sourceOffset;
		for (let y = 0; y < info.height; y++)
			for (let x = 0; x < info.width; x++) {
				const X = x + ox;
				const Y = y + oy;
				if (X < 0 || Y < 0 || X >= width || Y >= height) continue;
				const i = (Y * width + X) * 4;
				rgba.set(data.subarray((y * info.width + x) * 4, (y * info.width + x) * 4 + 4), i);
				// the generated art is opaque at 253, which lets ~1 % of the background through
				if (rgba[i + 3] >= OPAQUE) rgba[i + 3] = 255;
			}
		parts[item.name] = { part: item.part, rgba };
	}
	return { width, height, parts };
};

// Straight-alpha "over", back to front, in floats.
const composite = ({ width, height, parts }, order) => {
	const out = new Float32Array(width * height * 4);
	for (const name of order) {
		const rgba = parts[name]?.rgba;
		if (!rgba) continue;
		for (let i = 0; i < out.length; i += 4) {
			const a = rgba[i + 3] / 255;
			if (a === 0) continue;
			const below = out[i + 3] * (1 - a);
			const alpha = a + below;
			for (let c = 0; c < 3; c++) out[i + c] = (rgba[i + c] * a + out[i + c] * below) / alpha;
			out[i + 3] = alpha;
		}
	}
	return out;
};

const neighbours4 = [
	[1, 0],
	[-1, 0],
	[0, 1],
	[0, -1],
];
const neighbours8 = [...neighbours4, [1, 1], [1, -1], [-1, 1], [-1, -1]];

// Pixels of `a` that touch `b` side by side: the cut between them.
const seamOf = ({ width, height, parts }, a, b) => {
	const A = parts[a].rgba;
	const B = parts[b].rgba;
	const seam = [];
	for (let y = 1; y < height - 1; y++)
		for (let x = 1; x < width - 1; x++) {
			if (A[(y * width + x) * 4 + 3] <= 16) continue;
			if (neighbours4.some(([dx, dy]) => B[((y + dy) * width + x + dx) * 4 + 3] > 16))
				seam.push([x, y]);
		}
	return seam;
};

const centroid = (points) => [
	points.reduce((sum, [x]) => sum + x, 0) / points.length,
	points.reduce((sum, [, y]) => sum + y, 0) / points.length,
];

// Grows the lower part of a joint under the opaque pixels of the upper one, up to `reach`
// pixels (straight-line distance) from the cut, fading out over the last FEATHER pixels so the
// edge stays soft when the joint turns. Each ring takes the alpha-weighted mean colour of the
// pixels already filled next to it.
const extendJoint = ({ width, parts }, joint, order) => {
	const [lower, upper] = [...joint.parts].sort((a, b) => order.indexOf(a) - order.indexOf(b));
	const L = parts[lower].rgba;
	const U = parts[upper].rgba;
	const size = L.length / 4;
	const hidden = (i) => U[i * 4 + 3] === 255 && L[i * 4 + 3] === 0;
	// the cut pixel each queued pixel grew from, for its distance
	const seedX = new Int32Array(size);
	const seedY = new Int32Array(size);
	const queued = new Uint8Array(size);
	const filled = new Uint8Array(size);
	const queue = (i, x, y, ring) => {
		if (i < 0 || i >= size || queued[i] || !hidden(i)) return;
		const dx = (i % width) - x;
		const dy = Math.floor(i / width) - y;
		if (Math.hypot(dx, dy) > joint.reach) return;
		queued[i] = 1;
		seedX[i] = x;
		seedY[i] = y;
		ring.push(i);
	};
	let ring = [];
	for (const [x, y] of seamOf({ width, height: size / width, parts }, lower, upper))
		for (const [dx, dy] of neighbours8) queue((y + dy) * width + x + dx, x, y, ring);

	const added = [];
	while (ring.length) {
		const colours = ring.map((i) => {
			const sum = [0, 0, 0, 0];
			for (const [dx, dy] of neighbours8) {
				const j = i + dy * width + dx;
				if (j < 0 || j >= size) continue;
				const a = L[j * 4 + 3];
				if (a < 128 && !filled[j]) continue;
				for (let c = 0; c < 3; c++) sum[c] += L[j * 4 + c] * a;
				sum[3] += a;
			}
			return sum;
		});
		const next = [];
		ring.forEach((i, k) => {
			const sum = colours[k];
			if (sum[3] === 0) return;
			const distance = Math.hypot((i % width) - seedX[i], Math.floor(i / width) - seedY[i]);
			for (let c = 0; c < 3; c++) L[i * 4 + c] = sum[c] / sum[3];
			L[i * 4 + 3] = Math.round(255 * Math.min(1, (joint.reach - distance) / FEATHER));
			filled[i] = 1;
			added.push(i);
			for (const [dx, dy] of neighbours8) queue(i + dy * width + dx, seedX[i], seedY[i], next);
		});
		ring = next;
	}
	return { lower, upper, added };
};

// Rig v1 cut some pixels into the wrong part: small islands cut off from the rest of their part,
// like a piece of sleeve cuff left on the torso. Each one moves to the part it touches most.
// The parts never overlap, so the bind pose stays the same.
const ISLAND_MAX = 4000;
const reassignIslands = ({ width, height, parts }) => {
	const size = width * height;
	const owner = new Int16Array(size).fill(-1);
	const names = Object.keys(parts);
	names.forEach((name, n) => {
		const rgba = parts[name].rgba;
		for (let i = 0; i < size; i++) if (rgba[i * 4 + 3]) owner[i] = n;
	});
	const moved = [];
	const seen = new Uint8Array(size);
	const islands = names.map(() => []);
	for (let start = 0; start < size; start++) {
		if (owner[start] < 0 || seen[start]) continue;
		const n = owner[start];
		const pixels = [start];
		seen[start] = 1;
		for (let k = 0; k < pixels.length; k++) {
			const i = pixels[k];
			const [x, y] = [i % width, Math.floor(i / width)];
			for (const [dx, dy] of neighbours8) {
				if (x + dx < 0 || y + dy < 0 || x + dx >= width || y + dy >= height) continue;
				const j = i + dy * width + dx;
				if (!seen[j] && owner[j] === n) {
					seen[j] = 1;
					pixels.push(j);
				}
			}
		}
		islands[n].push(pixels);
	}
	islands.forEach((list, n) => {
		const largest = Math.max(...list.map((pixels) => pixels.length));
		for (const pixels of list) {
			if (pixels.length === largest || pixels.length > ISLAND_MAX) continue;
			const touching = new Map();
			for (const i of pixels)
				for (const [dx, dy] of neighbours8) {
					const other = owner[i + dy * width + dx];
					if (other >= 0 && other !== n) touching.set(other, (touching.get(other) ?? 0) + 1);
				}
			if (!touching.size) continue;
			const to = [...touching].sort((a, b) => b[1] - a[1])[0][0];
			const from = parts[names[n]].rgba;
			const into = parts[names[to]].rgba;
			for (const i of pixels) {
				into.set(from.subarray(i * 4, i * 4 + 4), i * 4);
				from.fill(0, i * 4, i * 4 + 4);
				owner[i] = to;
			}
			moved.push({ from: names[n], to: names[to], pixels: pixels.length });
		}
	});
	return moved;
};

// Joint pivots from the cuts and the extended parts, checked against the bind pose.
export const rigParts = async (sharp, rig, manifest) => {
	const canvas = await loadParts(sharp, rig, manifest);
	const before = composite(
		canvas,
		[...rig.attachments].sort((a, b) => a.order - b.order).map((a) => a.name),
	);

	const islands = reassignIslands(canvas);

	const pivots = {};
	for (const joint of JOINTS.filter((j) => j.bone)) {
		let seam = seamOf(canvas, ...joint.parts);
		if (joint.pivotTop) {
			const top = Math.min(...seam.map(([, y]) => y));
			const bottom = Math.max(...seam.map(([, y]) => y));
			seam = seam.filter(([, y]) => y <= top + (bottom - top) * joint.pivotTop);
		}
		pivots[joint.bone] = centroid(seam).map(Math.round);
	}

	const extensions = JOINTS.map((joint) => extendJoint(canvas, joint, DRAW_ORDER));
	const after = composite(canvas, DRAW_ORDER);
	let difference = 0;
	for (let i = 0; i < before.length; i++)
		difference = Math.max(difference, Math.abs(before[i] - after[i]) * (i % 4 === 3 ? 255 : 1));
	assert(difference < 0.5, `extended parts change the bind pose by ${difference}`);

	// each extended part, cropped to what it now covers
	const images = {};
	for (const { part, rgba } of Object.values(canvas.parts)) {
		let [left, top, right, bottom] = [canvas.width, canvas.height, 0, 0];
		for (let y = 0; y < canvas.height; y++)
			for (let x = 0; x < canvas.width; x++)
				if (rgba[(y * canvas.width + x) * 4 + 3]) {
					left = Math.min(left, x);
					top = Math.min(top, y);
					right = Math.max(right, x + 1);
					bottom = Math.max(bottom, y + 1);
				}
		[left, top] = [Math.max(0, left - GUTTER), Math.max(0, top - GUTTER)];
		[right, bottom] = [
			Math.min(canvas.width, right + GUTTER),
			Math.min(canvas.height, bottom + GUTTER),
		];
		const data = Buffer.alloc((right - left) * (bottom - top) * 4);
		for (let y = top; y < bottom; y++)
			data.set(
				rgba.subarray((y * canvas.width + left) * 4, (y * canvas.width + right) * 4),
				(y - top) * (right - left) * 4,
			);
		images[part] = { data, width: right - left, height: bottom - top, offset: [left, top] };
	}

	return {
		pivots,
		islands,
		images,
		difference,
		canvas,
		extensions: extensions.map(({ lower, upper, added }) => ({ lower, upper, added })),
	};
};

export const convertRig = (rig, animations, manifest, { pivots, images }) => {
	const bindWorld = Object.fromEntries(
		rig.bones.map((bone) => [bone.name, pivots[bone.name] ?? bone.bindWorld]),
	);
	const [rootX, rootY] = bindWorld.root;
	const local = (name, parent) => [
		bindWorld[name][0] - bindWorld[parent][0],
		bindWorld[name][1] - bindWorld[parent][1],
	];

	// The origin sits on the ground between the feet (the rig's root), so the game places
	// the character by the middle of its feet.
	const bones = rig.bones.map(({ name, parent }) => {
		if (!parent) return { name };
		const [x, y] = local(name, parent);
		return { name, parent, x, y };
	});

	const attachments = {};
	const byName = Object.fromEntries(rig.attachments.map((item) => [item.name, item]));
	const slots = DRAW_ORDER.map((name) => {
		const item = byName[name];
		const own = {};
		if (item.sourceOffset) {
			const image = images[item.part];
			own[item.part] = {
				texture: texture(item.part),
				width: image.width,
				height: image.height,
				x: image.offset[0] - bindWorld[item.bone][0],
				y: image.offset[1] - bindWorld[item.bone][1],
				anchor: [0, 0],
			};
		} else {
			const [width, height] = manifest.parts[item.part].size;
			const scale = item.width ? item.width / width : item.height / height;
			own[item.part] = {
				texture: texture(item.part),
				width: round(width * scale),
				height: round(height * scale),
				anchor: item.anchor,
			};
		}
		if (item.alternate) {
			const [w, h] = manifest.parts[item.alternate].size;
			const { anchor, width: altWidth } = item.alternateTransform;
			own[item.alternate] = {
				texture: texture(item.alternate),
				width: altWidth,
				height: round((altWidth * h) / w),
				anchor,
			};
		}
		attachments[name] = own;
		return { name, bone: item.bone, attachment: item.visibleWhen ? null : item.part };
	});

	// The lamp glow is drawn last, over every part.
	slots.push({
		name: 'lamp-glow',
		bone: 'lamp',
		attachment: 'lamp-glow',
		alpha: LAMP_GLOW.base,
		blend: 'add',
	});
	attachments['lamp-glow'] = {
		'lamp-glow': {
			texture: texture('lamp-glow'),
			width: LAMP_GLOW.size,
			height: LAMP_GLOW.size,
		},
	};

	// The strike beam leaves from the pickaxe's tip (rig socket "strike").
	const strike = rig.sockets.strike;
	const pickaxe = attachments[strike.bone][strike.bone];
	bones.push({
		name: 'strike_origin',
		parent: strike.bone,
		x: round((strike.imagePoint[0] - pickaxe.anchor[0]) * pickaxe.width),
		y: round((strike.imagePoint[1] - pickaxe.anchor[1]) * pickaxe.height),
	});

	// Leg IK. The knee bends to the side it already leans to in the bind pose.
	const direction = (from, to) =>
		degrees(
			Math.atan2(bindWorld[to][1] - bindWorld[from][1], bindWorld[to][0] - bindWorld[from][0]),
		);
	const ik = LEGS.map(({ name, bones: [upper, lower], end, target }) => {
		bindWorld[target] = bindWorld[end];
		const [x, y] = local(target, 'root');
		bones.push({ name: target, parent: 'root', x, y });
		const bend = wrap(direction(upper, lower) - direction(upper, end)) < 0 ? -1 : 1;
		return { name, bones: [upper, lower], end, target, bend, orient: true };
	});

	// Every clip keyframe holds every channel the clip animates (a missing value is the bind
	// pose), eased with smoothstep up to the next keyframe, like the preview runtime.
	const converted = {};
	for (const [name, clip] of Object.entries(animations.clips)) {
		const channels = [...new Set(clip.keyframes.flatMap((frame) => Object.keys(frame.values)))];
		const keysOf = (channel, map = (value) => value) =>
			clip.keyframes.map((frame, i) => {
				const key = [frame.time, round(map(frame.values[channel] ?? 0))];
				if (i < clip.keyframes.length - 1) key.push('smooth');
				return key;
			});
		const animation = { duration: clip.duration, bones: {}, slots: {} };
		for (const channel of channels) {
			const [bone, property] = channel.split('.');
			if (bone === 'lamp' && property === 'intensity') {
				animation.slots['lamp-glow'] = {
					alpha: keysOf(channel, (value) => LAMP_GLOW.base + value * LAMP_GLOW.gain),
				};
			} else {
				animation.bones[bone] ??= {};
				animation.bones[bone][property] = keysOf(channel);
			}
		}
		// the pose that swings the pickaxe holds it in a gripping hand
		if (name === 'power') {
			animation.slots['hand-r'] = { attachment: [[0, 'hand-grip-r']] };
			animation.slots.pickaxe = { attachment: [[0, 'pickaxe']] };
		}
		if (clip.events.length) animation.events = clip.events.map((event) => [event.time, event.name]);
		converted[name] = animation;
	}

	const range = { duration: RANGE_OF_MOTION.length * RANGE_STEP, bones: {} };
	RANGE_OF_MOTION.forEach(([bone, channel, first, second], i) => {
		const start = i * RANGE_STEP;
		range.bones[bone] ??= {};
		range.bones[bone][channel] = [
			[start, 0, 'smooth'],
			[start + RANGE_STEP * 0.25, first, 'smooth'],
			[start + RANGE_STEP * 0.75, second, 'smooth'],
			[start + RANGE_STEP, 0],
		];
	});
	converted.range_of_motion = range;

	// head to boots and hand to hand in the bind pose, without the pickaxe or the glow
	const neutral = Object.values(manifest.parts).filter(
		(part) => part.source === 'neutral-reference',
	);
	const left = Math.min(...neutral.map((part) => part.sourceBounds[0]));
	const top = Math.min(...neutral.map((part) => part.sourceBounds[1]));
	const right = Math.max(...neutral.map((part) => part.sourceBounds[2]));
	const bottom = Math.max(...neutral.map((part) => part.sourceBounds[3]));

	return {
		format: 'kilara-skeleton',
		version: 1,
		name: 'character-rig',
		bounds: { x: left - rootX, y: top - rootY, width: right - left, height: bottom - top },
		bones,
		ik,
		slots,
		skins: { default: attachments },
		animations: converted,
	};
};

// Shelf-packs the parts (half size) and the lamp glow into one sheet.
const packSheet = async (sharp, skeleton, images) => {
	const packed = [];
	for (const [slot, own] of Object.entries(skeleton.skins.default))
		for (const attachment of Object.values(own)) {
			const part = attachment.texture.slice('character-rig-'.length);
			let input;
			if (slot === 'lamp-glow') input = sharp(Buffer.from(LAMP_GLOW_SVG));
			else if (images[part])
				input = sharp(images[part].data, {
					raw: { width: images[part].width, height: images[part].height, channels: 4 },
				}).resize({ width: Math.round(images[part].width * TEXTURE_SCALE) });
			else {
				const file = path.join(RIG_DIR, 'parts', `${part}.png`);
				const { width } = await sharp(file).metadata();
				input = sharp(file).resize({ width: Math.round(width * TEXTURE_SCALE) });
			}
			const { data, info } = await input.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
			packed.push({ name: attachment.texture, data, width: info.width, height: info.height });
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
		image.x = x;
		image.y = y;
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
		create: {
			width: SHEET_WIDTH,
			height,
			channels: 4,
			background: { r: 0, g: 0, b: 0, alpha: 0 },
		},
	})
		.composite(
			packed.map((image) => ({
				input: image.data,
				raw: { width: image.width, height: image.height, channels: 4 },
				left: image.x,
				top: image.y,
			})),
		)
		.webp({ quality: 92, alphaQuality: 100, effort: 6 })
		.toBuffer();

	return {
		image: sheet,
		json: {
			frames,
			meta: {
				image: 'character-rig.webp',
				format: 'RGBA8888',
				size: { w: SHEET_WIDTH, h: height },
				scale: '1',
			},
		},
	};
};

// The reference, dimmed, with the hidden extensions in magenta and the bones on top.
const drawOverlay = async (sharp, rig, rigged, skeleton, file) => {
	const { width, height } = rigged.canvas;
	const tint = Buffer.alloc(width * height * 4);
	for (const { added } of rigged.extensions)
		for (const i of added) tint.set([255, 61, 154, 150], i * 4);
	const world = {};
	for (const bone of skeleton.bones) {
		const [px, py] = bone.parent ? world[bone.parent] : rig.bones[0].bindWorld;
		world[bone.name] = [px + (bone.x ?? 0), py + (bone.y ?? 0)];
	}
	let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">`;
	// the pickaxe only shows in the power pose
	for (const bone of skeleton.bones.filter((b) => b.name !== 'strike_origin')) {
		const [x, y] = world[bone.name];
		const ik = bone.name.endsWith('-target');
		if (bone.parent && !ik) {
			const [px, py] = world[bone.parent];
			svg += `<line x1="${px}" y1="${py}" x2="${x}" y2="${y}" stroke="#00ffd0" stroke-width="4"/>`;
		}
		svg += ik
			? `<rect x="${x - 12}" y="${y - 12}" width="24" height="24" fill="none" stroke="#ffd23d" stroke-width="4"/>`
			: `<circle cx="${x}" cy="${y}" r="8" fill="#ffffff"/>`;
	}
	svg += '</svg>';
	await sharp(path.join(RIG_DIR, 'source/neutral-reference.png'))
		.flatten({ background: '#1b2733' })
		.linear(0.55, 0)
		.composite([{ input: tint, raw: { width, height, channels: 4 } }, { input: Buffer.from(svg) }])
		.png()
		.toFile(file);
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const require = createRequire(import.meta.url);
	const sharp = require(process.env.KILARA_SHARP_PATH || 'sharp');
	const { validateSkeleton, worldMatrices, setupPose } =
		await import('../../../packages/components-pixi/src/skeleton/skeleton.ts');
	const rig = await readJson('rig.json');
	const manifest = await readJson('manifest.json');
	const rigged = await rigParts(sharp, rig, manifest);
	const skeleton = convertRig(rig, await readJson('animations.json'), manifest, rigged);

	assert.deepEqual(validateSkeleton(skeleton), []);
	// IK leaves the bind pose where it is
	const plain = worldMatrices({ ...skeleton, ik: [] }, setupPose(skeleton));
	const solved = worldMatrices(skeleton, setupPose(skeleton));
	const drift = Math.max(...plain.flatMap((m, i) => m.map((v, j) => Math.abs(v - solved[i][j]))));
	assert(drift < 1e-6, `IK moves the bind pose by ${drift}`);

	const sheet = await packSheet(sharp, skeleton, rigged.images);
	await fs.mkdir(RUNTIME_DIR, { recursive: true });
	await fs.mkdir(VERIFICATION_DIR, { recursive: true });
	await fs.writeFile(
		path.join(RUNTIME_DIR, 'character-rig.skeleton.json'),
		JSON.stringify(skeleton, null, '\t') + '\n',
	);
	await fs.writeFile(
		path.join(RUNTIME_DIR, 'character-rig.sheet.json'),
		JSON.stringify(sheet.json, null, '\t') + '\n',
	);
	await fs.writeFile(path.join(RUNTIME_DIR, 'character-rig.webp'), sheet.image);
	await drawOverlay(sharp, rig, rigged, skeleton, path.join(VERIFICATION_DIR, 'rig-overlay.png'));
	console.log(
		JSON.stringify(
			{
				sheet: `${sheet.json.meta.size.w}×${sheet.json.meta.size.h}, ${sheet.image.length} bytes`,
				bindDifference: rigged.difference,
				islands: rigged.islands.filter(({ pixels }) => pixels > 20),
				ikDrift: drift,
				pivots: rigged.pivots,
				extended: rigged.extensions.map(
					({ lower, upper, added }) => `${lower}<${upper}: ${added.length}`,
				),
			},
			null,
			1,
		),
	);
}
