// Kilara skeleton: a small cutout-animation runtime of our own. Bones carry
// transforms, slots draw one textured attachment each, and animations key bone
// and slot channels over time. It needs no editor and no third-party runtime.
//
// Conventions: y points down, rotation is in degrees clockwise, times are in
// seconds. Bone x/y/rotation keys are offsets from the setup pose, scale keys
// multiply it, and slot alpha keys are absolute. This file stays free of Pixi
// and Svelte so scripts can run it under plain Node.

export type Ease = 'linear' | 'stepped' | 'smooth' | 'in' | 'out';
export type Key<T> = [time: number, value: T, ease?: Ease];
export type BoneChannel = 'x' | 'y' | 'rotation' | 'scale' | 'scaleX' | 'scaleY';

export type BoneData = {
	name: string;
	parent?: string;
	x?: number;
	y?: number;
	rotation?: number;
	scaleX?: number;
	scaleY?: number;
};
export type SlotData = {
	name: string;
	bone: string;
	attachment?: string | null;
	alpha?: number;
	blend?: 'normal' | 'add';
};
// Attachments are centred on their anchor unless told otherwise; width and
// height are the drawn size in skeleton units, whatever the texture size is.
export type AttachmentData = {
	texture: string;
	width: number;
	height: number;
	x?: number;
	y?: number;
	rotation?: number;
	anchor?: [number, number];
};
export type SkinData = Record<string, Record<string, AttachmentData>>;
// Two-bone IK: turns bones[0] and bones[1] so the origin of `end`, a child of bones[1], lands
// on the origin of `target`. `bend` picks the side the middle joint points to (1 clockwise
// from the line to the target, -1 counter-clockwise). With `orient`, `end` also takes the
// target's world rotation, like a foot that stays flat.
export type IkData = {
	name: string;
	bones: [string, string];
	end: string;
	target: string;
	bend: 1 | -1;
	orient?: boolean;
};
export type AnimationData = {
	duration: number;
	bones?: Record<string, Partial<Record<BoneChannel, Key<number>[]>>>;
	slots?: Record<string, { alpha?: Key<number>[]; attachment?: Key<string | null>[] }>;
	events?: [time: number, name: string][];
};
export type SkeletonData = {
	format: 'kilara-skeleton';
	version: 1;
	name: string;
	bounds: { x: number; y: number; width: number; height: number };
	bones: BoneData[];
	// solved in order, after the animation
	ik?: IkData[];
	slots: SlotData[];
	skins: Record<string, SkinData> & { default: SkinData };
	animations: Record<string, AnimationData>;
};

export type BonePose = { x: number; y: number; rotation: number; scaleX: number; scaleY: number };
export type SlotPose = { alpha: number; attachment: string | null };
export type Pose = { bones: BonePose[]; slots: SlotPose[] };
// [a, b, c, d, tx, ty]: x' = a·x + c·y + tx, y' = b·x + d·y + ty
export type Matrix = [number, number, number, number, number, number];

const EASE: Record<Ease, (t: number) => number> = {
	linear: (t) => t,
	stepped: () => 0,
	smooth: (t) => t * t * (3 - 2 * t),
	in: (t) => t * t,
	out: (t) => 1 - (1 - t) * (1 - t),
};

// Before the first key and after the last, the nearest key holds.
export const sampleNumber = (keys: Key<number>[], time: number) => {
	if (time <= keys[0][0]) return keys[0][1];
	for (let i = 1; i < keys.length; i++) {
		const [end, to] = keys[i];
		if (time > end) continue;
		const [start, from, ease = 'linear'] = keys[i - 1];
		const t = end > start ? (time - start) / (end - start) : 1;
		return from + (to - from) * EASE[ease](t);
	}
	return keys[keys.length - 1][1];
};

export const sampleStepped = <T>(keys: Key<T>[], time: number) => {
	let value = keys[0][1];
	for (const [start, next] of keys) if (time >= start) value = next;
	return value;
};

export const setupPose = (data: SkeletonData): Pose => ({
	bones: data.bones.map((bone) => ({
		x: bone.x ?? 0,
		y: bone.y ?? 0,
		rotation: bone.rotation ?? 0,
		scaleX: bone.scaleX ?? 1,
		scaleY: bone.scaleY ?? 1,
	})),
	slots: data.slots.map((slot) => ({
		alpha: slot.alpha ?? 1,
		attachment: slot.attachment ?? null,
	})),
});

const indexOf = (list: { name: string }[], name: string) =>
	list.findIndex((item) => item.name === name);

// Writes the animation at `time` over a pose that starts from setup.
export const applyAnimation = (
	data: SkeletonData,
	animation: AnimationData,
	time: number,
	pose: Pose,
) => {
	for (const [name, channels] of Object.entries(animation.bones ?? {})) {
		const setup = data.bones[indexOf(data.bones, name)];
		const bone = pose.bones[indexOf(data.bones, name)];
		if (channels.x) bone.x = (setup.x ?? 0) + sampleNumber(channels.x, time);
		if (channels.y) bone.y = (setup.y ?? 0) + sampleNumber(channels.y, time);
		if (channels.rotation)
			bone.rotation = (setup.rotation ?? 0) + sampleNumber(channels.rotation, time);
		if (channels.scale) {
			const scale = sampleNumber(channels.scale, time);
			bone.scaleX = (setup.scaleX ?? 1) * scale;
			bone.scaleY = (setup.scaleY ?? 1) * scale;
		}
		if (channels.scaleX) bone.scaleX = (setup.scaleX ?? 1) * sampleNumber(channels.scaleX, time);
		if (channels.scaleY) bone.scaleY = (setup.scaleY ?? 1) * sampleNumber(channels.scaleY, time);
	}
	for (const [name, channels] of Object.entries(animation.slots ?? {})) {
		const slot = pose.slots[indexOf(data.slots, name)];
		if (channels.alpha) slot.alpha = sampleNumber(channels.alpha, time);
		if (channels.attachment) slot.attachment = sampleStepped(channels.attachment, time);
	}
	return pose;
};

// Numbers cross-fade; attachments switch to `to` straight away.
export const blendPose = (from: Pose, to: Pose, alpha: number): Pose => {
	const mix = (a: number, b: number) => a + (b - a) * alpha;
	return {
		bones: to.bones.map((bone, i) => ({
			x: mix(from.bones[i].x, bone.x),
			y: mix(from.bones[i].y, bone.y),
			rotation: mix(from.bones[i].rotation, bone.rotation),
			scaleX: mix(from.bones[i].scaleX, bone.scaleX),
			scaleY: mix(from.bones[i].scaleY, bone.scaleY),
		})),
		slots: to.slots.map((slot, i) => ({
			alpha: mix(from.slots[i].alpha, slot.alpha),
			attachment: slot.attachment,
		})),
	};
};

export const multiply = (p: Matrix, q: Matrix): Matrix => [
	p[0] * q[0] + p[2] * q[1],
	p[1] * q[0] + p[3] * q[1],
	p[0] * q[2] + p[2] * q[3],
	p[1] * q[2] + p[3] * q[3],
	p[0] * q[4] + p[2] * q[5] + p[4],
	p[1] * q[4] + p[3] * q[5] + p[5],
];

// Translate, then rotate, then scale.
export const localMatrix = (
	x: number,
	y: number,
	degrees: number,
	scaleX: number,
	scaleY: number,
): Matrix => {
	const angle = (degrees * Math.PI) / 180;
	const cos = Math.cos(angle);
	const sin = Math.sin(angle);
	return [cos * scaleX, sin * scaleX, -sin * scaleY, cos * scaleY, x, y];
};

// Bones are listed parents first, so one pass resolves the hierarchy.
const composeMatrices = (data: SkeletonData, pose: Pose) => {
	const matrices: Matrix[] = [];
	data.bones.forEach((bone, i) => {
		const { x, y, rotation, scaleX, scaleY } = pose.bones[i];
		const local = localMatrix(x, y, rotation, scaleX, scaleY);
		matrices.push(
			bone.parent ? multiply(matrices[indexOf(data.bones, bone.parent)], local) : local,
		);
	});
	return matrices;
};

const degrees = (radians: number) => (radians * 180) / Math.PI;
const rotationOf = (m: Matrix) => degrees(Math.atan2(m[1], m[0]));
const directionOf = (from: Matrix, to: Matrix) =>
	degrees(Math.atan2(to[5] - from[5], to[4] - from[4]));
const distance = (from: Matrix, to: Matrix) => Math.hypot(to[4] - from[4], to[5] - from[5]);
// the same angle within ±180°
const wrap = (angle: number) => angle - 360 * Math.round(angle / 360);

// Turns the IK bones of `pose` in place, by the law of cosines.
const solveIk = (data: SkeletonData, pose: Pose, ik: IkData) => {
	const upper = indexOf(data.bones, ik.bones[0]);
	const lower = indexOf(data.bones, ik.bones[1]);
	const end = indexOf(data.bones, ik.end);
	const target = indexOf(data.bones, ik.target);

	let world = composeMatrices(data, pose);
	const a = distance(world[upper], world[lower]);
	const b = distance(world[lower], world[end]);
	if (a === 0 || b === 0) return;
	// out of reach, the limb points straight at the target
	const d = Math.min(Math.max(distance(world[upper], world[target]), Math.abs(a - b)), a + b);
	const inner = degrees(
		Math.acos(Math.min(1, Math.max(-1, (a * a + d * d - b * b) / (2 * a * d)))),
	);
	const aim = directionOf(world[upper], world[target]) + ik.bend * inner;
	pose.bones[upper].rotation += wrap(aim - directionOf(world[upper], world[lower]));

	world = composeMatrices(data, pose);
	pose.bones[lower].rotation += wrap(
		directionOf(world[lower], world[target]) - directionOf(world[lower], world[end]),
	);

	if (!ik.orient) return;
	world = composeMatrices(data, pose);
	pose.bones[end].rotation += wrap(rotationOf(world[target]) - rotationOf(world[end]));
};

// World matrices of every bone, after IK.
export const worldMatrices = (data: SkeletonData, pose: Pose) => {
	if (!data.ik?.length) return composeMatrices(data, pose);
	const solved = { ...pose, bones: pose.bones.map((bone) => ({ ...bone })) };
	for (const ik of data.ik) solveIk(data, solved, ik);
	return composeMatrices(data, solved);
};

// A named skin overrides the default skin slot by slot.
export const findAttachment = (data: SkeletonData, skin: string, slot: string, name: string) =>
	data.skins[skin]?.[slot]?.[name] ?? data.skins.default[slot]?.[name];

export const validateSkeleton = (data: SkeletonData) => {
	const errors: string[] = [];
	if (data.format !== 'kilara-skeleton' || data.version !== 1)
		errors.push('not a kilara-skeleton v1 file');
	const seen = new Set<string>();
	for (const bone of data.bones) {
		if (bone.parent && !seen.has(bone.parent))
			errors.push(`bone ${bone.name}: parent ${bone.parent} must come first`);
		seen.add(bone.name);
	}
	for (const ik of data.ik ?? []) {
		const [upper, lower] = ik.bones;
		const parentOf = (name: string) => data.bones[indexOf(data.bones, name)]?.parent;
		if (![upper, lower, ik.end, ik.target].every((name) => seen.has(name)))
			errors.push(`ik ${ik.name}: unknown bone`);
		else if (parentOf(lower) !== upper || parentOf(ik.end) !== lower)
			errors.push(`ik ${ik.name}: ${ik.end} must be a child of ${lower}, a child of ${upper}`);
	}
	for (const slot of data.slots) {
		if (!seen.has(slot.bone)) errors.push(`slot ${slot.name}: unknown bone ${slot.bone}`);
		for (const skin of Object.keys(data.skins))
			if (slot.attachment && !findAttachment(data, skin, slot.name, slot.attachment))
				errors.push(`slot ${slot.name}: skin ${skin} lacks attachment ${slot.attachment}`);
	}
	for (const [name, animation] of Object.entries(data.animations)) {
		const keyLists: Key<unknown>[][] = [
			...Object.values(animation.bones ?? {}).flatMap((channels) => Object.values(channels)),
			...Object.values(animation.slots ?? {}).flatMap((channels) => Object.values(channels)),
		];
		for (const bone of Object.keys(animation.bones ?? {}))
			if (!seen.has(bone)) errors.push(`animation ${name}: unknown bone ${bone}`);
		for (const slot of Object.keys(animation.slots ?? {}))
			if (indexOf(data.slots, slot) < 0) errors.push(`animation ${name}: unknown slot ${slot}`);
		for (const keys of keyLists) {
			if (keys.length === 0) errors.push(`animation ${name}: empty timeline`);
			keys.forEach(([time], i) => {
				if (time < 0 || time > animation.duration + 1e-9)
					errors.push(`animation ${name}: key at ${time}s is outside 0–${animation.duration}s`);
				if (i > 0 && time < keys[i - 1][0])
					errors.push(`animation ${name}: keys out of order at ${time}s`);
			});
		}
	}
	return errors;
};

type Track = { name: string; animation: AnimationData; time: number; loop: boolean };
export type PlayOptions = { loop?: boolean; mix?: number };
export type StateListener = {
	event?: (name: string, animation: string) => void;
	// Once at the end of a one-shot, and at the end of every cycle of a loop.
	complete?: (animation: string) => void;
};

// Plays one animation at a time and cross-fades from the previous one.
// A finished one-shot holds its last frame until something else plays.
export class AnimationState {
	data: SkeletonData;
	listener: StateListener;
	timeScale = 1;
	current: Track | null = null;
	private previous: Track | null = null;
	private mixTime = 0;
	private mixDuration = 0;
	private finished = false;

	constructor(data: SkeletonData, listener: StateListener = {}) {
		this.data = data;
		this.listener = listener;
	}

	play(name: string, { loop = false, mix = 0 }: PlayOptions = {}) {
		const animation = this.data.animations[name];
		if (!animation) throw new Error(`Skeleton ${this.data.name}: no animation "${name}"`);
		this.previous = mix > 0 ? this.current : null;
		this.current = { name, animation, time: 0, loop };
		this.mixTime = 0;
		this.mixDuration = mix;
		this.finished = false;
	}

	clear() {
		this.current = null;
		this.previous = null;
	}

	update(seconds: number) {
		const delta = seconds * this.timeScale;
		if (!(delta > 0)) return;
		if (this.previous) {
			this.previous.time = Math.min(this.previous.time + delta, this.previous.animation.duration);
			this.mixTime += delta;
			if (this.mixTime >= this.mixDuration) this.previous = null;
		}
		const track = this.current;
		if (!track || this.finished) return;
		const { duration, events = [] } = track.animation;
		let remaining = delta;
		while (remaining > 0 && track === this.current) {
			const before = track.time;
			const step = Math.min(remaining, duration - before);
			track.time += step;
			remaining -= step;
			// An event fires once per pass, including one keyed at 0.
			for (const [time, name] of events)
				if ((time > before || (before === 0 && time === 0)) && time <= track.time)
					this.listener.event?.(name, track.name);
			if (track.time < duration - 1e-9) break;
			this.listener.complete?.(track.name);
			// The listener may have started another animation.
			if (track !== this.current) break;
			if (!track.loop || duration <= 0) {
				this.finished = true;
				break;
			}
			track.time = 0;
		}
	}

	pose() {
		const pose = setupPose(this.data);
		if (!this.current) return pose;
		applyAnimation(this.data, this.current.animation, this.current.time, pose);
		if (!this.previous || this.mixDuration <= 0) return pose;
		const from = applyAnimation(
			this.data,
			this.previous.animation,
			this.previous.time,
			setupPose(this.data),
		);
		return blendPose(from, pose, Math.min(1, this.mixTime / this.mixDuration));
	}
}
