import { stateBetDerived } from 'state-shared';

// Code-driven animation: one time-based loop per animation, so it runs the same at 30, 60 or
// 120 frames a second, and twice as fast in turbo.
export const animate = (
	duration: number,
	update: (progress: number) => void,
	{ timeScaled = true }: { timeScaled?: boolean } = {},
) =>
	new Promise<void>((resolve) => {
		const total = Math.max(1, duration / (timeScaled ? stateBetDerived.timeScale() : 1));
		const start = performance.now();
		const tick = (now: number) => {
			const progress = Math.min(1, Math.max(0, (now - start) / total));
			update(progress);
			if (progress < 1) requestAnimationFrame(tick);
			else resolve();
		};

		update(0);
		requestAnimationFrame(tick);
	});

// progress held on a few poses, the way pixel art is animated by hand ("on twos")
export const stepped = (progress: number, poses: number) =>
	Math.min(poses - 1, Math.floor(progress * poses)) / Math.max(1, poses - 1);

// the pose index for a frame sequence
export const frameAt = (progress: number, frames: number) =>
	Math.min(frames - 1, Math.floor(progress * frames));

export const lerp = (from: number, to: number, progress: number) => from + (to - from) * progress;
